import Stripe from 'https://esm.sh/stripe@14.21.0?target=deno&no-check'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    )

    const authHeader = req.headers.get('Authorization')
    const token = authHeader?.replace('Bearer ', '')
    if (!token) return new Response('Non autorisé', { status: 401, headers: corsHeaders })

    const { data: { user } } = await supabase.auth.getUser(token)
    if (!user) return new Response('Non autorisé', { status: 401, headers: corsHeaders })

    const { data: profil } = await supabase.from('profils').select('role').eq('id', user.id).single()
    if (profil?.role !== 'admin') return new Response('Accès refusé', { status: 403, headers: corsHeaders })

    const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY')!, {
      apiVersion: '2024-06-20',
      httpClient: Stripe.createFetchHttpClient(),
    })

    const { commandeId } = await req.json()

    const { data: commande } = await supabase
      .from('commandes')
      .select('profil_id, statut, stripe_payment_intent_id, total')
      .eq('id', commandeId)
      .single()

    if (!commande?.stripe_payment_intent_id) {
      // Pas de paiement Stripe → juste annuler la commande
      await supabase.from('commandes').update({ statut: 'annulee' }).eq('id', commandeId)
      return new Response(JSON.stringify({ success: true, mode: 'sans_paiement' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    if (commande.statut === 'autorisee') {
      // Paiement autorisé mais pas encore capturé → annuler l'autorisation (aucun débit)
      await stripe.paymentIntents.cancel(commande.stripe_payment_intent_id)
    } else {
      // Paiement déjà encaissé → remboursement Stripe
      await stripe.refunds.create({ payment_intent: commande.stripe_payment_intent_id })
    }

    await supabase.from('commandes').update({ statut: 'annulee' }).eq('id', commandeId)

    // Email au client
    if (commande.profil_id) {
      const { data: { user: client } } = await supabase.auth.admin.getUserById(commande.profil_id)
      const email = client?.email
      const resendKey = Deno.env.get('RESEND_API_KEY')
      const fromEmail = Deno.env.get('FROM_EMAIL') || 'onboarding@resend.dev'

      if (email && resendKey) {
        const estRemboursement = commande.statut !== 'autorisee'
        await fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${resendKey}`, 'Content-Type': 'application/json' },
          body: JSON.stringify({
            from: `Le Fumoir <${fromEmail}>`,
            to: email,
            subject: estRemboursement ? 'Remboursement de votre commande Le Fumoir' : 'Votre commande Le Fumoir a été annulée',
            html: `
              <div style="font-family:sans-serif;max-width:560px;margin:0 auto;padding:32px 24px;background:#fff">
                <h2 style="color:#4A3820;margin-bottom:4px">${estRemboursement ? 'Remboursement en cours 💳' : 'Commande annulée'}</h2>
                <p style="color:#666;margin-top:0">
                  ${estRemboursement
                    ? `Nous ne pouvons pas honorer votre commande. Un remboursement de <strong>${parseFloat(String(commande.total)).toFixed(2)} €</strong> a été initié et apparaîtra sur votre compte sous 5 à 10 jours ouvrés.`
                    : `Votre commande a été annulée. Votre carte n'a pas été débitée.`
                  }
                </p>
                <p style="color:#666;font-size:0.85em;margin-top:24px">Pour toute question : <a href="mailto:contact@lefumoir.fr" style="color:#4A3820">contact@lefumoir.fr</a></p>
              </div>`,
          }),
        })
      }
    }

    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })

  } catch (error: any) {
    console.error('Erreur rembourser-commande:', error)
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
