import { createClient } from '@/lib/supabase/server'
import { redirect, notFound } from 'next/navigation'
import Link from 'next/link'
import StarRating from '@/components/StarRating'
import ShiftActions from './ShiftActions'
import RealtimeRefresh from '@/components/RealtimeRefresh'

function formatDate(dateStr: string) {
  const d = new Date(dateStr + 'T00:00:00')
  return d.toLocaleDateString('es-MX', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })
}

function formatTime(t: string) {
  const [h, m] = t.split(':')
  const hour = parseInt(h)
  const ampm = hour >= 12 ? 'PM' : 'AM'
  const h12 = hour % 12 || 12
  return `${h12}:${m} ${ampm}`
}

export default async function ShiftDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: shift } = await supabase
    .from('shifts')
    .select('*, categories(*), profiles(*)')
    .eq('id', id)
    .single()

  if (!shift) notFound()

  const { data: profile } = await supabase.from('profiles').select('*').eq('id', user.id).single()

  const isClient = shift.client_id === user.id

  // Get applications
  const { data: applications } = isClient
    ? await supabase
        .from('applications')
        .select('*, profiles(*)')
        .eq('shift_id', id)
        .order('created_at', { ascending: false })
    : await supabase
        .from('applications')
        .select('*')
        .eq('shift_id', id)
        .eq('worker_id', user.id)
        .single().then(r => ({ data: r.data ? [r.data] : [] }))

  const myApplication = !isClient ? (applications as any[])?.[0] : null
  const acceptedApplication = isClient
    ? (applications as any[])?.find((a: any) => a.status === 'accepted') ?? null
    : null

  // Check if payment has been made for this shift
  const { data: payment } = await supabase
    .from('payments')
    .select('id')
    .eq('shift_id', id)
    .eq('status', 'succeeded')
    .maybeSingle()
  const isPaid = !!payment

  const isClosed = ['assigned', 'in_progress'].includes(shift.status) &&
    new Date() > new Date(`${shift.shift_date}T${shift.shift_start}`)

  const statusColors: Record<string, { bg: string; text: string; label: string }> = {
    open: { bg: '#DCFCE7', text: '#166534', label: 'Abierto' },
    assigned: { bg: '#DBEAFE', text: '#1E40AF', label: 'Asignado' },
    in_progress: { bg: '#FEF9C3', text: '#854D0E', label: 'En curso' },
    completed: { bg: '#F3F4F6', text: '#374151', label: 'Completado' },
    cancelled: { bg: '#FEE2E2', text: '#991B1B', label: 'Cancelado' },
    closed: { bg: '#FEE2E2', text: '#991B1B', label: 'Turno cerrado' },
  }

  const sc = isClosed ? statusColors.closed : (statusColors[shift.status] || statusColors.open)

  return (
    <div className="pb-8">
      <RealtimeRefresh table="shifts" filter={`id=eq.${id}`} channelName={`shift-${id}`} />
      <RealtimeRefresh table="applications" filter={`shift_id=eq.${id}`} channelName={`apps-${id}`} />
      <RealtimeRefresh table="payments" filter={`shift_id=eq.${id}`} channelName={`payments-${id}`} />

      {/* Header */}
      <div
        className="px-4 pt-6 pb-6"
        style={{ background: '#1A1A1A', color: '#FFFFFF' }}
      >
        <div className="flex items-center gap-3 mb-4 flex-wrap">
          <Link
            href="/shifts"
            className="p-2 rounded-xl"
            style={{ background: 'rgba(255,255,255,0.1)' }}
          >
            <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <polyline points="15 18 9 12 15 6"/>
            </svg>
          </Link>
          <span
            className="text-xs font-medium px-2 py-0.5 rounded-full"
            style={{ background: sc.bg, color: sc.text }}
          >
            {sc.label}
          </span>
          {isPaid && (
            <span
              className="text-xs font-semibold px-2 py-0.5 rounded-full"
              style={{ background: '#DCFCE7', color: '#166534' }}
            >
              Pagado ✓
            </span>
          )}
        </div>

        <div className="flex items-start gap-3">
          <span className="text-4xl">{shift.categories?.emoji}</span>
          <div>
            <h1
              className="text-2xl font-bold leading-tight"
              style={{ fontFamily: 'var(--font-syne)' }}
            >
              {shift.title}
            </h1>
            <p className="text-sm mt-1 opacity-70">{shift.categories?.name}</p>
          </div>
        </div>

        {/* Pay */}
        <div className="mt-4 flex items-center gap-2">
          <span className="text-3xl font-bold" style={{ fontFamily: 'var(--font-syne)' }}>
            ${shift.pay_amount.toLocaleString('es-MX')}
          </span>
          <span className="text-sm opacity-60">{shift.pay_currency}</span>
        </div>
      </div>

      <div className="px-4 mt-4 flex flex-col gap-4">
        {/* Info cards */}
        <div className="grid grid-cols-2 gap-3">
          <InfoCard icon="📅" label="Fecha" value={formatDate(shift.shift_date)} />
          <InfoCard icon="🕐" label="Horario" value={`${formatTime(shift.shift_start)} – ${formatTime(shift.shift_end)}`} />
          <InfoCard icon="📍" label="Ciudad" value={`${shift.city}${shift.state ? `, ${shift.state}` : ''}`} />
          <InfoCard icon="👥" label="Cupos" value={`${shift.slots} trabajador${shift.slots > 1 ? 'es' : ''}`} />
        </div>

        {/* Address */}
        <div className="p-4 rounded-2xl" style={{ background: 'var(--info-card-bg)', border: '1px solid var(--info-card-border)' }}>
          <div className="flex items-center gap-2 mb-1">
            <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z"/><circle cx="12" cy="10" r="3"/>
            </svg>
            <span className="text-sm font-medium" style={{ color: 'var(--info-card-fg)' }}>Dirección</span>
          </div>
          <p className="text-sm" style={{ color: 'var(--info-card-muted)' }}>{shift.location_address}</p>
        </div>

        {/* Description */}
        {shift.description && (
          <div className="p-4 rounded-2xl" style={{ background: 'var(--info-card-bg)', border: '1px solid var(--info-card-border)' }}>
            <h3 className="text-sm font-semibold mb-2" style={{ fontFamily: 'var(--font-syne)', color: 'var(--info-card-fg)' }}>
              Descripción
            </h3>
            <p className="text-sm leading-relaxed" style={{ color: 'var(--info-card-muted)' }}>{shift.description}</p>
          </div>
        )}

        {/* Client info (for workers) */}
        {!isClient && shift.profiles && (
          <div className="p-4 rounded-2xl" style={{ background: 'var(--info-card-bg)', border: '1px solid var(--info-card-border)' }}>
            <h3 className="text-sm font-semibold mb-3" style={{ fontFamily: 'var(--font-syne)', color: 'var(--info-card-fg)' }}>
              Cliente
            </h3>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full flex items-center justify-center font-bold"
                style={{ background: 'var(--secondary-bg)', color: 'var(--fg)' }}>
                {shift.profiles.full_name.charAt(0).toUpperCase()}
              </div>
              <div>
                <div className="font-medium text-sm" style={{ color: 'var(--info-card-fg)' }}>
                  {shift.profiles.full_name}
                  {shift.profiles.is_verified && (
                    <span className="ml-1.5 text-xs font-medium" style={{ color: '#1877F2' }}>✓ Verificado</span>
                  )}
                </div>
                {shift.profiles.rating > 0 && (
                  <StarRating rating={shift.profiles.rating} size={12} showValue count={shift.profiles.rating_count} />
                )}
              </div>
            </div>
          </div>
        )}

        {/* Worker contact banner — shown to client when shift has an accepted worker */}
        {isClient && acceptedApplication && acceptedApplication.profiles?.phone_number && (
          <div
            className="px-4 py-3 rounded-2xl flex items-center gap-3"
            style={{ background: '#DCFCE7', border: '1px solid #BBF7D0' }}
          >
            <svg width="18" height="18" fill="none" stroke="#166534" strokeWidth="2" viewBox="0 0 24 24">
              <path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07A19.5 19.5 0 013.07 9.81 19.79 19.79 0 01.1 1.18 2 2 0 012.11 0h3a2 2 0 012 1.72c.127.96.361 1.903.7 2.81a2 2 0 01-.45 2.11L6.09 7.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0122 14.92v2z"/>
            </svg>
            <div>
              <p className="text-xs font-semibold" style={{ color: '#166534' }}>Contacta a tu worker</p>
              <p className="text-sm font-bold" style={{ color: '#166534' }}>
                {acceptedApplication.profiles.phone_number}
              </p>
            </div>
          </div>
        )}

        {/* Turno cerrado banner */}
        {isClosed && (
          <div className="px-4 py-3 rounded-2xl flex items-center gap-3" style={{ background: '#FEE2E2', border: '1px solid #FECACA' }}>
            <svg width="18" height="18" fill="none" stroke="#991B1B" strokeWidth="2" viewBox="0 0 24 24">
              <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
            </svg>
            <p className="text-sm font-medium" style={{ color: '#991B1B' }}>
              Este turno ha cerrado. El tiempo de servicio ya pasó.
            </p>
          </div>
        )}

        {/* Actions */}
        <ShiftActions
          shift={shift}
          isClient={isClient}
          currentUserId={user.id}
          myApplication={myApplication}
          applications={isClient ? applications as any[] : []}
          acceptedApplication={acceptedApplication}
          isClosed={isClosed}
          isPaid={isPaid}
        />
      </div>
    </div>
  )
}

function InfoCard({ icon, label, value }: { icon: string; label: string; value: string }) {
  return (
    <div className="p-3 rounded-2xl" style={{ background: 'var(--info-card-bg)', border: '1px solid var(--info-card-border)' }}>
      <div className="text-base mb-0.5">{icon}</div>
      <div className="text-xs" style={{ color: 'var(--info-card-muted)' }}>{label}</div>
      <div className="text-sm font-medium mt-0.5" style={{ color: 'var(--info-card-fg)' }}>{value}</div>
    </div>
  )
}
