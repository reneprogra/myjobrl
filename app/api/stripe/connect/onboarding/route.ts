import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { createClient } from '@/lib/supabase/server'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2026-04-22.dahlia',
})

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

    const { stripe_account_id } = await req.json()
    if (!stripe_account_id) {
      return NextResponse.json({ error: 'Falta stripe_account_id' }, { status: 400 })
    }

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://myjob-gold.vercel.app'

    const accountLink = await stripe.accountLinks.create({
      account: stripe_account_id,
      refresh_url: `${appUrl}/dashboard?stripe=refresh`,
      return_url: `${appUrl}/dashboard?stripe=success`,
      type: 'account_onboarding',
    })

    return NextResponse.json({ url: accountLink.url })
  } catch (err: any) {
    console.error('Stripe Connect onboarding error:', err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
