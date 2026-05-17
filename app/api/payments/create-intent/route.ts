import { NextRequest, NextResponse } from 'next/server'
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

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const { shiftId, amount, workerId } = await req.json()

    if (!shiftId || !amount || !workerId) {
      return NextResponse.json({ error: 'Faltan parámetros' }, { status: 400 })
    }

    // Verify the shift belongs to this client
    const { data: shift } = await supabase
      .from('shifts')
      .select('id, client_id, status')
      .eq('id', shiftId)
      .eq('client_id', user.id)
      .single()

    if (!shift) {
      return NextResponse.json({ error: 'Turno no encontrado' }, { status: 404 })
    }

    const amountInCents = Math.round(amount * 100)
    const commissionRate = parseFloat(process.env.STRIPE_COMMISSION_RATE || '0.10')
    const platformFee = Math.round(amountInCents * commissionRate)

    // Look up worker's Stripe Connect account (service role to bypass RLS)
    const serviceClient = getServiceClient()
    const { data: stripeAccount } = await serviceClient
      .from('stripe_accounts')
      .select('stripe_account_id, charges_enabled')
      .eq('user_id', workerId)
      .single()

    const workerHasActiveAccount = stripeAccount?.charges_enabled === true

    const paymentIntentParams: Stripe.PaymentIntentCreateParams = {
      amount: amountInCents,
      currency: 'mxn',
      payment_method_types: ['card'],
      metadata: {
        shiftId,
        workerId,
        clientId: user.id,
      },
    }

    if (workerHasActiveAccount) {
      // Split: 90% to worker, 10% to MyJob platform
      paymentIntentParams.transfer_data = {
        destination: stripeAccount.stripe_account_id,
        amount: amountInCents - platformFee,
      }
      paymentIntentParams.application_fee_amount = platformFee
    }

    const paymentIntent = await stripe.paymentIntents.create(paymentIntentParams)

    return NextResponse.json({ clientSecret: paymentIntent.client_secret })
  } catch (error: any) {
    console.error('Error creating payment intent:', error)
    return NextResponse.json({ error: error.message || 'Error interno' }, { status: 500 })
  }
}
