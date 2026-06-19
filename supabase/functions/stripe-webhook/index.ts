import Stripe from 'https://esm.sh/stripe@14.21.0?target=deno&no-check'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

async function envoyerEmail(to: string, subject: string, html: string) {
  const resendKey = Deno.env.get('RESEND_API_KEY')
  if (!resendKey) return
  const fromEmail = Deno.env.get('FROM_EMAIL') || 'onboarding@resend.dev'
  try {
    await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${resendKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ from: `Le Fumoir <${fromEmail}>`, to, subject, html }),
    })
  } catch (e) {
    console.error('Erreur envoi email:', e)
  }
}

function htmlConfirmationCommande(lignes: any[], total: number, adresse: string | null): string {
  const rows = (lignes || []).map((l: any) =>
    `<tr><td style="padding:6px 12px;border-bottom:1px solid #eee">${l.nom}</td>
     <td style="padding:6px 12px;border-bottom:1px solid #eee;text-align:center">×${l.quantite ?? 1}</td>
     <td style="padding:6px 12px;border-bottom:1px solid #eee;text-align:right">${parseFloat(l.prix_unitaire ?? 0).toFixed(2)} €</td></tr>`
  ).join('')

  return `
  <div style="font-family:sans-serif;max-width:560px;margin:0 auto;padding:32px 24px;background:#fff">
    <h2 style="color:#4A3820;margin-bottom:4px">Votre commande est confirmée ✅</h2>
    <p style="color:#666;margin-top:0">Merci pour votre achat sur Le Fumoir Artisan.</p>
    <table style="width:100%;border-collapse:collapse;margin:20px 0">
      <thead><tr style="background:#f5f0e8">
        <th style="padding:8px 12px;text-align:left;color:#4A3820">Produit</th>
        <th style="padding:8px 12px;text-align:center;color:#4A3820">Qté</th>
        <th style="padding:8px 12px;text-align:right;color:#4A3820">Prix</th>
      </tr></thead>
      <tbody>${rows}</tbody>
      <tfoot><tr>
        <td colspan="2" style="padding:10px 12px;font-weight:bold;color:#4A3820">Total</td>
        <td style="padding:10px 12px;font-weight:bold;text-align:right;color:#4A3820">${parseFloat(String(total)).toFixed(2)} €</td>
      </tr></tfoot>
    </table>
    ${adresse ? `<p style="color:#666;font-size:0.9em">📦 Livraison : ${adresse}</p>` : ''}
    <p style="color:#666;font-size:0.85em;margin-top:24px">Vous recevrez un email dès que votre commande est expédiée.<br>Pour toute question : <a href="mailto:contact@lefumoir.fr" style="color:#4A3820">contact@lefumoir.fr</a></p>
  </div>`
}

function htmlConfirmationTutoriel(nomProduit: string, type: string): string {
  return `
  <div style="font-family:sans-serif;max-width:560px;margin:0 auto;padding:32px 24px;background:#fff">
    <h2 style="color:#4A3820;margin-bottom:4px">Accès débloqué 🎉</h2>
    <p style="color:#666;margin-top:0">Merci pour votre achat ! Vous avez maintenant accès à :</p>
    <div style="background:#f5f0e8;padding:16px 20px;border-radius:8px;margin:20px 0">
      <strong style="color:#4A3820">${nomProduit}</strong>
    </div>
    <p style="color:#666">Connectez-vous sur le site et rendez-vous dans la section <strong>Tutoriels</strong> pour accéder à votre contenu.</p>
    <p style="color:#666;font-size:0.85em;margin-top:24px">Pour toute question : <a href="mailto:contact@lefumoir.fr" style="color:#4A3820">contact@lefumoir.fr</a></p>
  </div>`
}

Deno.serve(async (req) => {
  const signature = req.headers.get('stripe-signature')
  const body = await req.text()

  if (!signature) return new Response('Signature manquante', { status: 400 })

  const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY')!, {
    apiVersion: '2024-06-20',
    httpClient: Stripe.createFetchHttpClient(),
  })

  let event: Stripe.Event
  try {
    event = await stripe.webhooks.constructEventAsync(body, signature, Deno.env.get('STRIPE_WEBHOOK_SECRET')!)
  } catch (err: any) {
    console.error('Webhook signature invalide:', err.message)
    return new Response(`Webhook Error: ${err.message}`, { status: 400 })
  }

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  )

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object as Stripe.Checkout.Session
    const type = session.metadata?.type
    const email = session.customer_email ?? session.metadata?.email ?? ''

    // — Achat tutoriel ou pack —
    if (type === 'tutoriel' || type === 'pack') {
      const achatId = session.metadata?.achat_id
      if (achatId) {
        await supabase.from('tutoriel_achats')
          .update({ statut: 'active', stripe_session_id: session.id })
          .eq('id', achatId)

        // Pour un pack : débloquer aussi chaque tutoriel individuellement
        if (type === 'pack') {
          const packId = session.metadata?.pack_id
          const profilId = session.metadata?.profil_id
          if (packId && profilId) {
            const { data: packTutos } = await supabase
              .from('pack_tutoriels').select('tutoriel_id').eq('pack_id', packId)
            if (packTutos && packTutos.length > 0) {
              await supabase.from('tutoriel_achats').insert(
                packTutos.map((pt: any) => ({
                  profil_id: profilId,
                  tutoriel_id: pt.tutoriel_id,
                  pack_id: packId,
                  statut: 'active',
                  stripe_session_id: session.id,
                }))
              )
            }
          }
        }

        console.log(`Achat ${type} ${achatId} activé`)

        if (email) {
          await envoyerEmail(
            email,
            `Votre accès à "${session.metadata?.nom_produit}" est activé`,
            htmlConfirmationTutoriel(session.metadata?.nom_produit ?? '', type)
          )
        }
      }

    // — Commande produit —
    } else {
      const commandeId = session.metadata?.commande_id
      if (commandeId) {
        const paymentIntentId = typeof session.payment_intent === 'string'
          ? session.payment_intent
          : session.payment_intent?.id ?? null

        await supabase.from('commandes')
          .update({
            statut: 'autorisee',
            stripe_session_id: session.id,
            stripe_payment_intent_id: paymentIntentId,
          })
          .eq('id', commandeId)

        console.log(`Commande ${commandeId} autorisée (paiement non encore encaissé)`)

        if (email) {
          await envoyerEmail(
            email,
            'Votre commande Le Fumoir est bien reçue',
            `<div style="font-family:sans-serif;max-width:560px;margin:0 auto;padding:32px 24px;background:#fff">
              <h2 style="color:#4A3820;margin-bottom:4px">Commande reçue ✅</h2>
              <p style="color:#666;margin-top:0">Merci ! Votre commande a bien été reçue et votre paiement est pré-autorisé.</p>
              <p style="color:#666">Votre carte <strong>ne sera débitée qu'à la validation</strong> de votre commande par notre équipe (sous 48h).</p>
              <p style="color:#666;font-size:0.85em;margin-top:24px">Pour toute question : <a href="mailto:contact@lefumoir.fr" style="color:#4A3820">contact@lefumoir.fr</a></p>
            </div>`
          )
        }
      }
    }
  }

  // Session expirée → annuler
  if (event.type === 'checkout.session.expired') {
    const session = event.data.object as Stripe.Checkout.Session
    const type = session.metadata?.type
    if (type === 'tutoriel' || type === 'pack') {
      const achatId = session.metadata?.achat_id
      if (achatId) {
        await supabase.from('tutoriel_achats').update({ statut: 'annule' }).eq('id', achatId)
      }
    } else {
      const commandeId = session.metadata?.commande_id
      if (commandeId) {
        await supabase.from('commandes').update({ statut: 'annulee' }).eq('id', commandeId)
      }
    }
  }

  return new Response(JSON.stringify({ received: true }), {
    headers: { 'Content-Type': 'application/json' },
  })
})
