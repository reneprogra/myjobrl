'use client'

import { useState } from 'react'
import { useStripe, useElements, PaymentElement } from '@stripe/react-stripe-js'

interface Props {
  shiftTitle: string
  workerName: string
  shiftDate: string
  amount: number
  hasCounterOffer?: boolean
  shiftId: string
}

export default function PaymentForm({ shiftTitle, workerName, shiftDate, amount, hasCounterOffer, shiftId }: Props) {
  const stripe = useStripe()
  const elements = useElements()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!stripe || !elements) return

    setLoading(true)
    setError(null)

    const { error: submitError } = await stripe.confirmPayment({
      elements,
      confirmParams: {
        return_url: `${window.location.origin}/shifts/${shiftId}?paid=1`,
      },
    })

    if (submitError) {
      setError(submitError.message || 'Error al procesar el pago')
      setLoading(false)
    } else {
      setSuccess(true)
      setLoading(false)
    }
  }

  if (success) {
    return (
      <div className="p-6 rounded-2xl text-center flex flex-col items-center gap-3"
        style={{ background: '#DCFCE7', border: '1px solid #BBF7D0' }}>
        <div className="text-4xl">✅</div>
        <p className="font-semibold text-lg" style={{ color: '#166534' }}>¡Pago exitoso!</p>
        <p className="text-sm" style={{ color: '#166534' }}>El worker ha sido notificado.</p>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-5">
      {/* Resumen del turno */}
      <div className="p-4 rounded-2xl flex flex-col gap-2" style={{ background: 'var(--card)', border: '1px solid var(--border)' }}>
        <h3 className="font-semibold text-sm" style={{ color: 'var(--muted)' }}>Resumen del turno</h3>
        <p className="font-bold text-base" style={{ color: 'var(--fg)' }}>{shiftTitle}</p>
        <div className="flex items-center justify-between text-sm" style={{ color: 'var(--muted)' }}>
          <span>Worker: {workerName}</span>
          <span>{shiftDate}</span>
        </div>
        <div className="flex items-center justify-between pt-2" style={{ borderTop: '1px solid var(--border)' }}>
          <span className="text-sm font-medium" style={{ color: 'var(--fg)' }}>
            {hasCounterOffer ? 'Monto acordado' : 'Total a pagar'}
          </span>
          <div className="text-right">
            <span className="text-xl font-bold" style={{ color: 'var(--fg)' }}>
              ${amount.toLocaleString('es-MX')} MXN
            </span>
            {hasCounterOffer && (
              <div className="text-xs" style={{ color: 'var(--muted)' }}>contraoferta aceptada</div>
            )}
          </div>
        </div>
      </div>

      {/* Stripe Payment Element */}
      <div className="p-4 rounded-2xl" style={{ background: 'var(--card)', border: '1px solid var(--border)' }}>
        <PaymentElement />
      </div>

      {error && (
        <div className="px-4 py-3 rounded-xl text-sm" style={{ background: '#FEE2E2', color: '#991B1B' }}>
          {error}
        </div>
      )}

      <button
        type="submit"
        disabled={!stripe || loading}
        className="w-full py-4 rounded-xl font-semibold text-sm"
        style={{
          background: '#1877F2',
          color: '#FFFFFF',
          opacity: (!stripe || loading) ? 0.6 : 1,
        }}
      >
        {loading ? 'Procesando...' : `Pagar $${amount.toLocaleString('es-MX')} MXN`}
      </button>
    </form>
  )
}
