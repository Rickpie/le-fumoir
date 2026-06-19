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
      .select('profil_id, stripe_payment_intent_id, lignes, total, adresse_livraison')
      .eq('id', commandeId)
      .single()

    if (!commande?.stripe_payment_intent_id) {
      return new Response(JSON.stringify({ error: 'Aucun paiement autorisé trouvé' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    await stripe.paymentIntents.capture(commande.stripe_payment_intent_id)
    await supabase.from('commandes').update({ statut: 'confirmee' }).eq('id', commandeId)

    // Email de confirmation au client
    if (commande.profil_id) {
      const { data: { user: client } } = await supabase.auth.admin.getUserById(commande.profil_id)
      const email = client?.email
      const resendKey = Deno.env.get('RESEND_API_KEY')
      const fromEmail = Deno.env.get('FROM_EMAIL') || 'onboarding@resend.dev'

      if (email && resendKey) {
        const rows = (commande.lignes || []).map((l: any) =>
          `<tr><td style="padding:6px 12px;border-bottom:1px solid #eee">${l.nom}</td>
           <td style="padding:6px 12px;border-bottom:1px solid #eee;text-align:center">×${l.quantite ?? 1}</td>
           <td style="padding:6px 12px;border-bottom:1px solid #eee;text-align:right">${parseFloat(l.prix_unitaire ?? 0).toFixed(2)} €</td></tr>`
        ).join('')

        await fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${resendKey}`, 'Content-Type': 'application/json' },
          body: JSON.stringify({
            from: `Le Fumoir <${fromEmail}>`,
            to: email,
            subject: 'Votre commande Le Fumoir est confirmée ✅',
            html: `
              <div style="font-family:sans-serif;max-width:560px;margin:0 auto;padding:32px 24px;background:#fff">
                <h2 style="color:#4A3820;margin-bottom:4px">Commande confirmée ✅</h2>
                <p style="color:#666;margin-top:0">Votre paiement a été encaissé. Nous préparons votre commande avec soin.</p>
                <table style="width:100%;border-collapse:collapse;margin:20px 0">
                  <thead><tr style="background:#f5f0e8">
                    <th style="padding:8px 12px;text-align:left;color:#4A3820">Produit</th>
                    <th style="padding:8px 12px;text-align:center;color:#4A3820">Qté</th>
                    <th style="padding:8px 12px;text-align:right;color:#4A3820">Prix</th>
                  </tr></thead>
                  <tbody>${rows}</tbody>
                  <tfoot><tr>
                    <td colspan="2" style="padding:10px 12px;font-weight:bold;color:#4A3820">Total</td>
                    <td style="padding:10px 12px;font-weight:bold;text-align:right;color:#4A3820">${parseFloat(String(commande.total)).toFixed(2)} €</td>
                  </tr></tfoot>
                </table>
                ${commande.adresse_livraison ? `<p style="color:#666;font-size:0.9em">📦 Livraison : ${commande.adresse_livraison}</p>` : ''}
                <p style="color:#666;font-size:0.85em;margin-top:24px">Vous recevrez un email dès que votre commande est expédiée.</p>
              </div>`,
          }),
        })
      }
    }

    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })

  } catch (error: any) {
    console.error('Erreur capturer-paiement:', error)
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
