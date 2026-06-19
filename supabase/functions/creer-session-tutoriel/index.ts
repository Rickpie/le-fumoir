import Stripe from 'https://esm.sh/stripe@14.21.0?target=deno&no-check'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  try {
    const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY')!, {
      apiVersion: '2024-06-20',
      httpClient: Stripe.createFetchHttpClient(),
    })

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    )

    const authHeader = req.headers.get('Authorization')
    const token = authHeader?.replace('Bearer ', '')
    if (!token) {
      return new Response(JSON.stringify({ error: 'Non authentifié' }), { status: 401, headers: corsHeaders })
    }

    const { data: { user } } = await supabase.auth.getUser(token)
    if (!user) {
      return new Response(JSON.stringify({ error: 'Non authentifié' }), { status: 401, headers: corsHeaders })
    }

    const { tutorielId, packId, siteUrl } = await req.json()

    let nom = ''
    let prix = 0
    let type = ''
    let photoUrl: string | null = null

    if (tutorielId) {
      type = 'tutoriel'
      const { data: tuto } = await supabase.from('tutoriels').select('titre, prix, photo_url').eq('id', tutorielId).single()
      if (!tuto) throw new Error('Tutoriel introuvable')
      nom = tuto.titre
      prix = parseFloat(tuto.prix)
      photoUrl = tuto.photo_url
    } else if (packId) {
      type = 'pack'
      const { data: pack } = await supabase.from('packs').select('titre, prix, photo_url').eq('id', packId).single()
      if (!pack) throw new Error('Pack introuvable')
      nom = pack.titre
      prix = parseFloat(pack.prix)
      photoUrl = pack.photo_url
    } else {
      throw new Error('tutorielId ou packId requis')
    }

    // Créer l'enregistrement d'achat en attente
    const { data: achat } = await supabase
      .from('tutoriel_achats')
      .insert({
        profil_id: user.id,
        tutoriel_id: tutorielId ?? null,
        pack_id: packId ?? null,
        statut: 'en_attente',
      })
      .select()
      .single()

    // Créer la session Stripe
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [{
        price_data: {
          currency: 'eur',
          product_data: {
            name: nom,
            ...(photoUrl ? { images: [photoUrl] } : {}),
          },
          unit_amount: Math.round(prix * 100),
        },
        quantity: 1,
      }],
      mode: 'payment',
      allow_promotion_codes: true,
      success_url: `${siteUrl}/tutoriels?achat=succes&type=${type}`,
      cancel_url: `${siteUrl}/tutoriels`,
      customer_email: user.email,
      locale: 'fr',
      metadata: {
        type,
        achat_id: achat?.id ?? '',
        profil_id: user.id,
        tutoriel_id: tutorielId ?? '',
        pack_id: packId ?? '',
        email: user.email ?? '',
        nom_produit: nom,
      },
    })

    if (achat?.id) {
      await supabase.from('tutoriel_achats')
        .update({ stripe_session_id: session.id })
        .eq('id', achat.id)
    }

    return new Response(
      JSON.stringify({ url: session.url }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error: any) {
    console.error('Erreur creer-session-tutoriel:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
