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

    const paymentIntent = await stripe.paymentIntents.create({
      amount: amountInCents,
      currency: 'mxn',
      payment_method_types: ['card'],
      metadata: {
        shiftId,
        workerId,
        clientId: user.id,
      },
    })

    return NextResponse.json({ clientSecret: paymentIntent.client_secret })
  } catch (error: any) {
    console.error('Error creating payment intent:', error)
    return NextResponse.json({ error: error.message || 'Error interno' }, { status: 500 })
  }
}
