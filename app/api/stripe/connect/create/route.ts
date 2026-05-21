import { NextResponse } from 'next/server'
import Stripe from 'stripe'
import { createClient } from '@/lib/supabase/server'
import { createClient as createServiceClient } from '@supabase/supabase-js'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2026-04-22.dahlia',
})

function getServiceClient() {
  return createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  )
}

export async function POST() {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

    const serviceClient = getServiceClient()

    // Return existing account if already created
    const { data: existing } = await serviceClient
      .from('stripe_accounts')
      .select('stripe_account_id, status, charges_enabled, payouts_enabled')
      .eq('user_id', user.id)
      .single()

    if (existing) {
      return NextResponse.json({ stripe_account_id: existing.stripe_account_id })
    }

    // Fetch worker profile for pre-filling
    const { data: profile } = await supabase
      .from('profiles')
      .select('full_name')
      .eq('id', user.id)
      .single()

    // Create Stripe Express account
    const account = await stripe.accounts.create({
      type: 'express',
      country: 'MX',
      email: user.email,
      capabilities: {
        card_payments: { requested: true },
        transfers: { requested: true },
      },
      business_type: 'individual',
      metadata: { user_id: user.id },
    })

    // Save to DB
    await serviceClient.from('stripe_accounts').insert({
      user_id: user.id,
      stripe_account_id: account.id,
      status: 'pending',
      charges_enabled: false,
      payouts_enabled: false,
    })

    return NextResponse.json({ stripe_account_id: account.id })
  } catch (err: any) {
    console.error('Stripe Connect create error:', JSON.stringify({
      message: err.message,
      type: err.type,
      code: err.code,
      statusCode: err.statusCode,
      raw: err.raw,
    }, null, 2))
    const message = err?.raw?.message || err.message || 'Error desconocido'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
