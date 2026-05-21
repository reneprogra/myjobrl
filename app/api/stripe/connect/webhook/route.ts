import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { createClient } from '@supabase/supabase-js'

export const dynamic = 'force-dynamic'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2026-04-22.dahlia',
})

function getServiceClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  )
}

export async function POST(req: NextRequest) {
  const body = await req.text()
  const sig = req.headers.get('stripe-signature')

  if (!sig) {
    return NextResponse.json({ error: 'Missing stripe-signature' }, { status: 400 })
  }

  let event: Stripe.Event

  try {
    event = stripe.webhooks.constructEvent(
      body,
      sig,
      process.env.STRIPE_CONNECT_WEBHOOK_SECRET!,
    )
  } catch (err: any) {
    console.error('Connect webhook signature error:', err.message)
    return NextResponse.json({ error: `Webhook Error: ${err.message}` }, { status: 400 })
  }

  if (event.type === 'account.updated') {
    const account = event.data.object as Stripe.Account
    const chargesEnabled = account.charges_enabled ?? false
    const payoutsEnabled = account.payouts_enabled ?? false
    const status = chargesEnabled && payoutsEnabled ? 'active' : 'pending'

    const supabase = getServiceClient()

    // Update stripe_accounts and get the linked user_id
    const { data: stripeAccRow } = await supabase
      .from('stripe_accounts')
      .update({
        charges_enabled: chargesEnabled,
        payouts_enabled: payoutsEnabled,
        status,
        updated_at: new Date().toISOString(),
      })
      .eq('stripe_account_id', account.id)
      .select('user_id')
      .single()

    // Mirror charges_enabled onto profiles for fast, reliable access
    if (stripeAccRow?.user_id) {
      await supabase
        .from('profiles')
        .update({ stripe_charges_enabled: chargesEnabled })
        .eq('id', stripeAccRow.user_id)
    }
  }

  return NextResponse.json({ received: true })
}
