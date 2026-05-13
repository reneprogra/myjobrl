import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import ShiftCard from '@/components/ShiftCard'
import WorkerShiftsClient from './WorkerShiftsClient'
import type { Shift } from '@/lib/types'

export default async function ShiftsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase.from('profiles').select('*').eq('id', user.id).single()
  if (!profile) redirect('/onboarding')

  if (profile.user_type === 'cliente') {
    return <ClientShifts userId={user.id} />
  } else {
    return <WorkerShifts userId={user.id} profile={profile} />
  }
}

async function ClientShifts({ userId }: { userId: string }) {
  const supabase = await createClient()
  const { data: shifts } = await supabase
    .from('shifts')
    .select('*, categories(*), profiles(*)')
    .eq('client_id', userId)
    .order('created_at', { ascending: false })

  const now = new Date().toISOString()

  const grouped = {
    open: shifts?.filter(s => s.status === 'open' && (!s.expires_at || s.expires_at > now)) || [],
    expired: shifts?.filter(s => s.status === 'open' && s.expires_at && s.expires_at <= now) || [],
    assigned: shifts?.filter(s => s.status === 'assigned') || [],
    completed: shifts?.filter(s => s.status === 'completed') || [],
    cancelled: shifts?.filter(s => s.status === 'cancelled') || [],
  }

  return (
    <div className="px-4 py-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold" style={{ fontFamily: 'var(--font-syne)', color: 'var(--fg)' }}>
          Mis turnos
        </h1>
        <Link
          href="/shifts/new"
          className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-medium"
          style={{ background: 'var(--btn-bg)', color: 'var(--btn-fg)' }}
        >
          <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
            <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
          </svg>
          Nuevo
        </Link>
      </div>

      {shifts?.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="text-5xl mb-4">📋</div>
          <p className="text-lg font-semibold" style={{ fontFamily: 'var(--font-syne)', color: 'var(--fg)' }}>
            Sin turnos aún
          </p>
          <p className="text-sm mt-2 mb-6" style={{ color: 'var(--muted)' }}>
            Publica tu primer turno para encontrar trabajadores
          </p>
          <Link
            href="/shifts/new"
            className="px-6 py-3 rounded-xl text-sm font-semibold"
            style={{ background: 'var(--btn-bg)', color: 'var(--btn-fg)' }}
          >
            Publicar turno
          </Link>
        </div>
      ) : (
        <div className="flex flex-col gap-6">
          {grouped.open.length > 0 && (
            <Section title="Abiertos" count={grouped.open.length} shifts={grouped.open} />
          )}
          {grouped.assigned.length > 0 && (
            <Section title="Asignados" count={grouped.assigned.length} shifts={grouped.assigned} />
          )}
          {grouped.completed.length > 0 && (
            <Section title="Completados" count={grouped.completed.length} shifts={grouped.completed} />
          )}
          {grouped.cancelled.length > 0 && (
            <Section title="Cancelados" count={grouped.cancelled.length} shifts={grouped.cancelled} />
          )}
          {grouped.expired.length > 0 && (
            <Section title="Vencidos" count={grouped.expired.length} shifts={grouped.expired} statusOverride="expired" />
          )}
        </div>
      )}
    </div>
  )
}

function Section({
  title,
  count,
  shifts,
  statusOverride,
}: {
  title: string
  count: number
  shifts: Shift[]
  statusOverride?: string
}) {
  return (
    <div>
      <h2 className="text-base font-semibold mb-3 flex items-center gap-2" style={{ fontFamily: 'var(--font-syne)', color: 'var(--fg)' }}>
        {title}
        <span
          className="text-xs font-medium px-2 py-0.5 rounded-full"
          style={{ background: 'var(--secondary-bg)', color: 'var(--muted)' }}
        >
          {count}
        </span>
      </h2>
      <div className="flex flex-col gap-3">
        {shifts.map(shift => (
          <ShiftCard
            key={shift.id}
            shift={shift}
            applicationStatus={statusOverride}
          />
        ))}
      </div>
    </div>
  )
}

async function WorkerShifts({ userId, profile }: { userId: string; profile: any }) {
  const supabase = await createClient()

  const { data: workerCats } = await supabase
    .from('worker_categories')
    .select('category_id')
    .eq('worker_id', userId)

  const categoryIds = workerCats?.map(wc => wc.category_id) || []

  const now = new Date().toISOString()
  let query = supabase
    .from('shifts')
    .select('*, categories(*), profiles(*)')
    .eq('status', 'open')
    .or(`expires_at.gt.${now},expires_at.is.null`)
    .order('shift_date', { ascending: true })

  if (categoryIds.length > 0) query = query.in('category_id', categoryIds)

  const { data: rawShifts } = await query

  return (
    <div className="px-4 py-6">
      <h1 className="text-2xl font-bold mb-6" style={{ fontFamily: 'var(--font-syne)', color: 'var(--fg)' }}>
        Turnos disponibles
      </h1>
      <WorkerShiftsClient shifts={rawShifts || []} workerCity={profile.city || ''} />
    </div>
  )
}
