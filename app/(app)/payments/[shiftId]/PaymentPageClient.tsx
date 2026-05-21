'use client'

import { useState, useEffect, useMemo } from 'react'
import { loadStripe } from '@stripe/stripe-js'
import { Elements } from '@stripe/react-stripe-js'
import PaymentForm from '@/components/payments/PaymentForm'
import Link from 'next/link'

interface Props {
  shift: any
  workerName: string
  workerId: string
  agreedAmount: number
  hasCounterOffer: boolean
  publishableKey: string
}

function formatDate(dateStr: string) {
  const d = new Date(dateStr + 'T00:00:00')
  return d.toLocaleDateString('es-MX', { weekday: 'short', day: 'numeric', month: 'long' })
}

export default function PaymentPageClient({ shift, workerName, workerId, agreedAmount, hasCounterOffer, publishableKey }: Props) {
  const [clientSecret, setClientSecret] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const stripePromise = useMemo(() => loadStripe(publishableKey), [publishableKey])

  useEffect(() => {
    fetch('/api/payments/create-intent', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        shiftId: shift.id,
        amount: agreedAmount,
        workerId,
      }),
    })
      .then(r => r.json())
      .then(data => {
        if (data.clientSecret) {
          setClientSecret(data.clientSecret)
        } else {
          setError(data.error || 'No se pudo inicializar el pago')
          console.error('Payment intent error:', data)
        }
      })
      .catch(err => {
        setError('Error de conexión al servidor de pagos')
        console.error('Payment fetch error:', err)
      })
  }, [shift.id, agreedAmount, workerId])

  return (
    <div className="px-4 py-6">
      {/* Header */}
      <div className="flex items-center gap-3 mb-4">
        <Link href={`/shifts/${shift.id}`} className="p-2 rounded-xl" style={{ background: 'var(--secondary-bg)' }}>
          <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <polyline points="15 18 9 12 15 6"/>
          </svg>
        </Link>
        <h1 className="text-xl font-bold" style={{ color: 'var(--fg)' }}>
          Pagar turno
        </h1>
      </div>

      {/* Stripe security badge */}
      <div
        className="flex items-center gap-2 px-3 py-2 rounded-xl mb-5"
        style={{ background: '#EFF6FF', border: '1px solid #BFDBFE' }}
      >
        <span>🔒</span>
        <span className="text-xs font-medium" style={{ color: '#1E40AF' }}>
          Pagos protegidos por Stripe
        </span>
      </div>

      {error && (
        <div className="p-4 rounded-2xl mb-4 text-sm" style={{ background: '#FEE2E2', color: '#991B1B' }}>
          {error}
        </div>
      )}

      {!clientSecret && !error && (
        <div className="flex flex-col gap-4">
          <div className="p-4 rounded-2xl animate-pulse" style={{ background: 'var(--secondary-bg)', height: 120 }} />
          <div className="p-4 rounded-2xl animate-pulse" style={{ background: 'var(--secondary-bg)', height: 200 }} />
        </div>
      )}

      {clientSecret && (
        <Elements
          stripe={stripePromise}
          options={{
            clientSecret,
            appearance: {
              theme: 'stripe',
              variables: { fontFamily: 'var(--font-plus-jakarta-sans), system-ui, sans-serif' },
            },
          }}
        >
          <PaymentForm
            shiftTitle={shift.title}
            workerName={workerName}
            shiftDate={formatDate(shift.shift_date)}
            amount={agreedAmount}
            hasCounterOffer={hasCounterOffer}
            shiftId={shift.id}
          />
        </Elements>
      )}
    </div>
  )
}
