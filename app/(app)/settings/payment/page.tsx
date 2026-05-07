import Link from 'next/link'

export default function PaymentPage() {
  return (
    <div className="px-4 py-6" style={{ background: '#F8F6F1', minHeight: '100vh' }}>
      <div className="flex items-center gap-3 mb-6">
        <Link
          href="/settings"
          className="p-2 rounded-xl"
          style={{ background: '#FFFFFF', border: '1px solid #E5E2DB' }}
        >
          <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <polyline points="15 18 9 12 15 6"/>
          </svg>
        </Link>
        <h1 className="text-xl font-bold" style={{ fontFamily: 'var(--font-syne)', color: '#1A1A1A' }}>
          Método de pago
        </h1>
      </div>

      <div className="flex flex-col items-center justify-center py-16 text-center px-4 rounded-2xl" style={{ background: '#FFFFFF', border: '1px solid #E5E2DB' }}>
        <div className="text-5xl mb-4">💳</div>
        <h2 className="text-xl font-bold mb-2" style={{ fontFamily: 'var(--font-syne)', color: '#1A1A1A' }}>
          Próximamente
        </h2>
        <p className="text-sm" style={{ color: '#6B6860' }}>
          Integración con Stripe en camino.
        </p>
        <p className="text-sm mt-1" style={{ color: '#6B6860' }}>
          Podrás agregar y gestionar tus métodos de pago directamente desde la app.
        </p>
        <div className="mt-6 px-5 py-2.5 rounded-xl text-sm font-medium" style={{ background: '#F0EDE6', color: '#6B6860' }}>
          🔒 Pagos seguros con Stripe
        </div>
      </div>
    </div>
  )
}
