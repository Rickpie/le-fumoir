import Stripe from 'https://esm.sh/stripe@14.21.0?target=deno&no-check'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY')!, {
      apiVersion: '2024-06-20',
      httpClient: Stripe.createFetchHttpClient(),
    })

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    )

    // Récupérer l'utilisateur connecté
    const authHeader = req.headers.get('Authorization')
    const token = authHeader?.replace('Bearer ', '')
    let userId: string | null = null
    let userEmail: string | null = null

    if (token) {
      const { data: { user } } = await supabase.auth.getUser(token)
      userId = user?.id ?? null
      userEmail = user?.email ?? null
    }

    const { items, frais = [], modeRetrait = 'livraison', siteUrl } = await req.json()

    // Récupérer l'adresse de livraison du profil (sauf si récupération sur place)
    let adresseLivraison: string | null = null
    if (modeRetrait === 'sur_place') {
      adresseLivraison = 'Récupération sur place'
    } else if (userId) {
      const { data: profil } = await supabase
        .from('profils')
        .select('prenom, nom, adresse, code_postal')
        .eq('id', userId)
        .single()
      if (profil?.adresse) {
        const nomComplet = [profil.prenom, profil.nom].filter(Boolean).join(' ')
        adresseLivraison = [nomComplet, profil.adresse, profil.code_postal].filter(Boolean).join(' — ')
      }
    }

    // Construire les lignes Stripe (produits)
    const lineItems = items.map((item: any) => ({
      price_data: {
        currency: 'eur',
        product_data: {
          name: item.nom,
          ...(item.photo_url ? { images: [item.photo_url] } : {}),
        },
        unit_amount: Math.round((item.prix_unitaire ?? 0) * 100),
      },
      quantity: item.quantite ?? 1,
    }))

    // Ajouter les frais commande comme lignes Stripe séparées
    for (const f of frais) {
      if ((f.valeur ?? 0) > 0) {
        lineItems.push({
          price_data: {
            currency: 'eur',
            product_data: { name: f.label },
            unit_amount: Math.round(f.valeur * 100),
          },
          quantity: 1,
        })
      }
    }

    const totalProduits = items.reduce(
      (sum: number, item: any) => sum + (item.prix_unitaire ?? 0) * (item.quantite ?? 1),
      0
    )
    const totalFrais = frais.reduce((sum: number, f: any) => sum + (f.valeur ?? 0), 0)
    const total = totalProduits + totalFrais

    // Créer la commande en base (statut en_attente)
    const lignesAvecFrais = [
      ...items,
      ...frais.map((f: any) => ({ type: 'frais', nom: f.label, prix_unitaire: f.valeur, quantite: 1 })),
    ]
    const { data: commande, error: commandeError } = await supabase
      .from('commandes')
      .insert({
        profil_id: userId,
        lignes: lignesAvecFrais,
        total: parseFloat(total.toFixed(2)),
        statut: 'en_attente',
        adresse_livraison: adresseLivraison,
      })
      .select()
      .single()

    if (commandeError || !commande) {
      throw new Error('Impossible de créer la commande en base : ' + (commandeError?.message ?? 'données nulles'))
    }

    // Créer la session Stripe Checkout (capture manuelle : l'admin encaisse après validation)
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: lineItems,
      mode: 'payment',
      payment_intent_data: { capture_method: 'manual' },
      success_url: `${siteUrl}/paiement-succes?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${siteUrl}/paiement-annule`,
      customer_email: userEmail ?? undefined,
      locale: 'fr',
      metadata: {
        commande_id: commande?.id ?? '',
        user_id: userId ?? '',
      },
    })

    // Enregistrer le session_id sur la commande
    if (commande?.id) {
      await supabase
        .from('commandes')
        .update({ stripe_session_id: session.id })
        .eq('id', commande.id)
    }

    return new Response(
      JSON.stringify({ url: session.url }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error: any) {
    console.error('Erreur creer-session-paiement:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
