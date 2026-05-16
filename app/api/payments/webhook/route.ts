import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { createClient } from '@supabase/supabase-js'
import { sendNotification } from '@/lib/send-notification'

export const dynamic = 'force-dynamic'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2026-04-22.dahlia',
})

// Use service role client for webhook (bypasses RLS)
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
    event = stripe.webhooks.constructEvent(body, sig, process.env.STRIPE_WEBHOOK_SECRET!)
  } catch (err: any) {
    console.error('Webhook signature verification failed:', err.message)
    return NextResponse.json({ error: `Webhook Error: ${err.message}` }, { status: 400 })
  }

  if (event.type === 'payment_intent.succeeded') {
    const paymentIntent = event.data.object as Stripe.PaymentIntent
    const { shiftId, workerId, clientId } = paymentIntent.metadata

    const supabase = getServiceClient()

    // Update shift status to 'paid' (we'll use 'completed' as closest existing status)
    await supabase
      .from('shifts')
      .update({ status: 'completed' })
      .eq('id', shiftId)

    // Record payment
    const amount = paymentIntent.amount
    const platformFee = Math.round(amount * 0.10)
    const workerAmount = amount - platformFee

    await supabase.from('payments').insert({
      shift_id: shiftId,
      client_id: clientId,
      worker_id: workerId,
      amount,
      platform_fee: platformFee,
      worker_amount: workerAmount,
      stripe_payment_intent_id: paymentIntent.id,
      status: 'succeeded',
      payment_method: paymentIntent.payment_method_types?.[0] || 'card',
    })

    // Notify worker that payment was processed
    const workerAmountFormatted = (workerAmount / 100).toLocaleString('es-MX')
    await sendNotification(
      workerId,
      '💰 Pago recibido',
      `Recibiste $${workerAmountFormatted} MXN por tu trabajo`,
      '/dashboard',
    )
  }

  return NextResponse.json({ received: true })
}
