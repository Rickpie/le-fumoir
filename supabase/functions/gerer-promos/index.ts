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
    const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY')!, {
      apiVersion: '2024-06-20',
      httpClient: Stripe.createFetchHttpClient(),
    })

    // Vérifier que l'utilisateur est admin
    const authHeader = req.headers.get('Authorization')
    const token = authHeader?.replace('Bearer ', '')
    if (!token) return new Response(JSON.stringify({ error: 'Non authentifié' }), { status: 401, headers: corsHeaders })

    const { data: { user } } = await supabase.auth.getUser(token)
    if (!user) return new Response(JSON.stringify({ error: 'Non authentifié' }), { status: 401, headers: corsHeaders })

    const { data: profil } = await supabase.from('profils').select('role').eq('id', user.id).single()
    if (profil?.role !== 'admin') return new Response(JSON.stringify({ error: 'Accès refusé' }), { status: 403, headers: corsHeaders })

    const body = await req.json()
    const { action } = body

    if (action === 'lister') {
      const promoCodes = await stripe.promotionCodes.list({ limit: 100, active: undefined })
      return new Response(
        JSON.stringify({ promos: promoCodes.data }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    if (action === 'creer') {
      const { code, type, valeur, description, max_utilisations } = body

      const couponData: any = {
        duration: 'once',
        name: description || code,
      }
      if (type === 'percent') {
        couponData.percent_off = valeur
      } else {
        couponData.amount_off = Math.round(valeur * 100)
        couponData.currency = 'eur'
      }

      const coupon = await stripe.coupons.create(couponData)

      const promoData: any = { coupon: coupon.id, code }
      if (max_utilisations) promoData.max_redemptions = max_utilisations

      const promoCode = await stripe.promotionCodes.create(promoData)

      return new Response(
        JSON.stringify({ promo: promoCode }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    if (action === 'desactiver') {
      const { promoId } = body
      await stripe.promotionCodes.update(promoId, { active: false })
      return new Response(
        JSON.stringify({ ok: true }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    return new Response(JSON.stringify({ error: 'Action inconnue' }), { status: 400, headers: corsHeaders })

  } catch (error: any) {
    console.error('Erreur gerer-promos:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
