import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'

function formatDate(dateStr: string) {
  return new Date(dateStr + 'T00:00:00').toLocaleDateString('es-MX', {
    day: 'numeric', month: 'short', year: 'numeric',
  })
}

function formatMXN(cents: number) {
  return (cents / 100).toLocaleString('es-MX', { minimumFractionDigits: 0 })
}

export default async function HistorialPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('user_type')
    .eq('id', user.id)
    .single()

  if (!profile) redirect('/onboarding')

  if (profile.user_type === 'worker') {
    return <WorkerHistorial userId={user.id} />
  }
  return <ClientHistorial userId={user.id} />
}

async function WorkerHistorial({ userId }: { userId: string }) {
  const supabase = await createClient()

  const [{ data: payments }, { data: completedApps }] = await Promise.all([
    supabase
      .from('payments')
      .select('shift_id, worker_amount, created_at, shifts(title, shift_date, categories(emoji))')
      .eq('worker_id', userId)
      .eq('status', 'succeeded')
      .order('created_at', { ascending: false }),
    supabase
      .from('applications')
      .select('shifts(id, title, shift_date, status, categories(emoji), pay_amount, pay_currency)')
      .eq('worker_id', userId)
      .eq('status', 'accepted')
      .order('created_at', { ascending: false }),
  ])

  const paidShiftIds = new Set(payments?.map(p => p.shift_id) || [])
  const totalEarnings = payments?.reduce((sum, p) => sum + (p.worker_amount ?? 0), 0) ?? 0

  // Completed shifts (with or without recorded payment)
  const completedShifts = completedApps?.filter(a => (a.shifts as any)?.status === 'completed') || []

  return (
    <div className="px-4 py-6">
      <div className="flex items-center gap-3 mb-6">
        <Link href="/profile" className="p-2 rounded-xl" style={{ background: 'var(--secondary-bg)' }}>
          <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <polyline points="15 18 9 12 15 6"/>
          </svg>
        </Link>
        <h1 className="text-2xl font-bold" style={{ fontFamily: 'var(--font-syne)', color: 'var(--fg)' }}>
          Historial de ganancias
        </h1>
      </div>

      {/* Summary card */}
      <div
        className="p-5 rounded-2xl mb-6"
        style={{ background: '#1A1A1A', color: '#FFFFFF' }}
      >
        <p className="text-xs opacity-60 mb-1">Total ganado</p>
        <p className="text-3xl font-bold" style={{ fontFamily: 'var(--font-syne)' }}>
          ${formatMXN(totalEarnings)} MXN
        </p>
        <p className="text-xs opacity-60 mt-2">
          {payments?.length ?? 0} pago{(payments?.length ?? 0) !== 1 ? 's' : ''} recibido{(payments?.length ?? 0) !== 1 ? 's' : ''} · {completedShifts.length} turno{completedShifts.length !== 1 ? 's' : ''} completado{completedShifts.length !== 1 ? 's' : ''}
        </p>
      </div>

      {/* Payments list */}
      {(payments?.length ?? 0) > 0 ? (
        <div className="flex flex-col gap-3">
          <h2 className="text-base font-semibold" style={{ fontFamily: 'var(--font-syne)', color: 'var(--fg)' }}>
            Pagos recibidos
          </h2>
          {payments!.map((p: any) => (
            <div
              key={p.shift_id}
              className="flex items-center justify-between p-4 rounded-2xl"
              style={{ background: 'var(--card)', border: '1px solid var(--border)' }}
            >
              <div className="flex items-center gap-3">
                <span className="text-2xl">{p.shifts?.categories?.emoji ?? '📋'}</span>
                <div>
                  <p className="text-sm font-medium" style={{ color: 'var(--fg)' }}>
                    {p.shifts?.title ?? 'Turno'}
                  </p>
                  <p className="text-xs" style={{ color: 'var(--muted)' }}>
                    {p.shifts?.shift_date ? formatDate(p.shifts.shift_date) : ''}
                  </p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-base font-bold" style={{ color: '#16A34A', fontFamily: 'var(--font-syne)' }}>
                  +${formatMXN(p.worker_amount)} MXN
                </p>
                <span className="text-xs px-1.5 py-0.5 rounded-full" style={{ background: '#DCFCE7', color: '#166534' }}>
                  Pagado ✓
                </span>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="text-5xl mb-4">💰</div>
          <p className="text-lg font-semibold" style={{ fontFamily: 'var(--font-syne)', color: 'var(--fg)' }}>
            Sin ganancias aún
          </p>
          <p className="text-sm mt-2" style={{ color: 'var(--muted)' }}>
            Completa turnos para ver tu historial aquí
          </p>
        </div>
      )}
    </div>
  )
}

async function ClientHistorial({ userId }: { userId: string }) {
  const supabase = await createClient()

  const { data: payments } = await supabase
    .from('payments')
    .select('shift_id, amount, platform_fee, worker_amount, created_at, shifts(title, shift_date, categories(emoji))')
    .eq('client_id', userId)
    .eq('status', 'succeeded')
    .order('created_at', { ascending: false })

  const totalSpent = payments?.reduce((sum, p) => sum + (p.amount ?? 0), 0) ?? 0

  return (
    <div className="px-4 py-6">
      <div className="flex items-center gap-3 mb-6">
        <Link href="/profile" className="p-2 rounded-xl" style={{ background: 'var(--secondary-bg)' }}>
          <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <polyline points="15 18 9 12 15 6"/>
          </svg>
        </Link>
        <h1 className="text-2xl font-bold" style={{ fontFamily: 'var(--font-syne)', color: 'var(--fg)' }}>
          Historial de pagos
        </h1>
      </div>

      {/* Summary card */}
      <div
        className="p-5 rounded-2xl mb-6"
        style={{ background: '#1A1A1A', color: '#FFFFFF' }}
      >
        <p className="text-xs opacity-60 mb-1">Total pagado</p>
        <p className="text-3xl font-bold" style={{ fontFamily: 'var(--font-syne)' }}>
          ${formatMXN(totalSpent)} MXN
        </p>
        <p className="text-xs opacity-60 mt-2">
          {payments?.length ?? 0} turno{(payments?.length ?? 0) !== 1 ? 's' : ''} pagado{(payments?.length ?? 0) !== 1 ? 's' : ''}
        </p>
      </div>

      {(payments?.length ?? 0) > 0 ? (
        <div className="flex flex-col gap-3">
          <h2 className="text-base font-semibold" style={{ fontFamily: 'var(--font-syne)', color: 'var(--fg)' }}>
            Turnos pagados
          </h2>
          {payments!.map((p: any) => (
            <Link
              key={p.shift_id}
              href={`/shifts/${p.shift_id}`}
              className="flex items-center justify-between p-4 rounded-2xl"
              style={{ background: 'var(--card)', border: '1px solid var(--border)' }}
            >
              <div className="flex items-center gap-3">
                <span className="text-2xl">{p.shifts?.categories?.emoji ?? '📋'}</span>
                <div>
                  <p className="text-sm font-medium" style={{ color: 'var(--fg)' }}>
                    {p.shifts?.title ?? 'Turno'}
                  </p>
                  <p className="text-xs" style={{ color: 'var(--muted)' }}>
                    {p.shifts?.shift_date ? formatDate(p.shifts.shift_date) : ''}
                  </p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-base font-bold" style={{ fontFamily: 'var(--font-syne)', color: 'var(--fg)' }}>
                  ${formatMXN(p.amount)} MXN
                </p>
                <span className="text-xs px-1.5 py-0.5 rounded-full" style={{ background: '#DCFCE7', color: '#166534' }}>
                  Pagado ✓
                </span>
              </div>
            </Link>
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="text-5xl mb-4">📊</div>
          <p className="text-lg font-semibold" style={{ fontFamily: 'var(--font-syne)', color: 'var(--fg)' }}>
            Sin pagos aún
          </p>
          <p className="text-sm mt-2" style={{ color: 'var(--muted)' }}>
            Aquí verás el historial de turnos pagados
          </p>
        </div>
      )}
    </div>
  )
}
