'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

interface StripeAccount {
  stripe_account_id: string
  status: string
  charges_enabled: boolean
  payouts_enabled: boolean
}

interface Props {
  stripeAccount: StripeAccount | null
  /** Mirror of stripe_accounts.charges_enabled stored on profiles for reliability */
  stripeChargesEnabled?: boolean
}

export default function StripeConnectOnboarding({ stripeAccount, stripeChargesEnabled }: Props) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const router = useRouter()

  // Use profile-level flag as primary source; fall back to stripe_accounts row
  const isActive = stripeChargesEnabled || (stripeAccount?.charges_enabled && stripeAccount?.payouts_enabled)
  const isPending = stripeAccount && !isActive

  async function handleSetup() {
    setLoading(true)
    setError('')

    try {
      let accountId = stripeAccount?.stripe_account_id

      // Create account if needed
      if (!accountId) {
        const createRes = await fetch('/api/stripe/connect/create', { method: 'POST' })
        const createData = await createRes.json()
        if (!createRes.ok) throw new Error(createData.error || 'Error al crear cuenta')
        accountId = createData.stripe_account_id
      }

      // Get onboarding link
      const onboardRes = await fetch('/api/stripe/connect/onboarding', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ stripe_account_id: accountId }),
      })
      const onboardData = await onboardRes.json()
      if (!onboardRes.ok) throw new Error(onboardData.error || 'Error al generar enlace')

      router.push(onboardData.url)
    } catch (err: any) {
      setError(err.message)
      setLoading(false)
    }
  }

  if (isActive) {
    return (
      <div
        className="flex items-center gap-3 p-4 rounded-2xl"
        style={{ background: '#F0FDF4', border: '1px solid #BBF7D0' }}
      >
        <div
          className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 text-base font-bold"
          style={{ background: '#16A34A', color: '#FFFFFF' }}
        >
          ✓
        </div>
        <div>
          <p className="text-sm font-semibold" style={{ color: '#15803D' }}>
            ✓ Cuenta de pagos activada
          </p>
          <p className="text-xs mt-0.5" style={{ color: '#16A34A' }}>
            Recibirás pagos automáticamente en tu cuenta bancaria
          </p>
        </div>
      </div>
    )
  }

  return (
    <div
      className="p-4 rounded-2xl flex flex-col gap-3"
      style={{ background: 'var(--card)', border: '1px solid var(--border)' }}
    >
      <div className="flex items-start gap-3">
        <div
          className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0"
          style={{ background: isPending ? '#FEF3C7' : '#EFF6FF' }}
        >
          {isPending ? '⏳' : '💳'}
        </div>
        <div>
          <p className="text-sm font-semibold" style={{ color: 'var(--fg)' }}>
            {isPending ? 'Completa tu perfil de pagos' : 'Configura cómo recibir pagos'}
          </p>
          <p className="text-xs mt-0.5 leading-relaxed" style={{ color: 'var(--muted)' }}>
            {isPending
              ? 'Falta información para activar tu cuenta. Completa el proceso para recibir pagos.'
              : 'Conecta tu cuenta bancaria para recibir el pago cuando completes un turno.'}
          </p>
        </div>
      </div>

      {error && (
        <p className="text-xs px-1" style={{ color: '#EF4444' }}>{error}</p>
      )}

      <button
        onClick={handleSetup}
        disabled={loading}
        className="w-full py-3 rounded-xl text-sm font-semibold transition-opacity"
        style={{
          background: '#1A1A1A',
          color: '#FFFFFF',
          opacity: loading ? 0.6 : 1,
        }}
      >
        {loading
          ? 'Redirigiendo...'
          : isPending
          ? 'Completar perfil de pagos'
          : 'Configurar pagos'}
      </button>
    </div>
  )
}
