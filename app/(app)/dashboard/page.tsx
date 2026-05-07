import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import ShiftCard from '@/components/ShiftCard'
import WorkerAvailabilityToggle from '@/components/WorkerAvailabilityToggle'
import { haversineKm } from '@/lib/haversine'
import type { Shift, Application } from '@/lib/types'

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  if (!profile) redirect('/onboarding')

  if (profile.user_type === 'cliente') {
    return <ClientDashboard userId={user.id} profile={profile} />
  } else {
    return <WorkerDashboard userId={user.id} profile={profile} />
  }
}

async function ClientDashboard({ userId, profile }: { userId: string; profile: any }) {
  const supabase = await createClient()

  let groupsQuery = supabase
    .from('groups')
    .select('*, categories(*), profiles(*)')
    .order('member_count', { ascending: false })
    .limit(5)

  if (profile.city) {
    groupsQuery = groupsQuery.ilike('city', `%${profile.city}%`)
  }

  // Parallel fetch
  const [{ data: shifts }, { data: availableGroups }] = await Promise.all([
    supabase
      .from('shifts')
      .select('*, categories(*), profiles(*)')
      .eq('client_id', userId)
      .order('created_at', { ascending: false })
      .limit(20),
    groupsQuery,
  ])

  const now = new Date().toISOString()
  const isExpired = (s: any) =>
    s.status === 'open' && s.expires_at && s.expires_at <= now

  const activeShifts =
    shifts?.filter(s => ['open', 'assigned'].includes(s.status) && !isExpired(s)) || []
  const expiredShifts = shifts?.filter(s => isExpired(s)) || []
  const pastShifts =
    shifts?.filter(s => ['completed', 'cancelled'].includes(s.status)) || []

  return (
    <div className="px-4 py-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1
            className="text-2xl font-bold"
            style={{ fontFamily: 'var(--font-syne)', color: '#1A1A1A' }}
          >
            Hola, {profile.full_name.split(' ')[0]} 👋
          </h1>
          <p className="text-sm mt-0.5" style={{ color: '#6B6860' }}>
            Panel de cliente
          </p>
        </div>
        <Link href="/profile">
          <div
            className="w-11 h-11 rounded-full flex items-center justify-center text-lg font-bold"
            style={{ background: '#1A1A1A', color: '#F8F6F1' }}
          >
            {profile.full_name.charAt(0).toUpperCase()}
          </div>
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3 mb-6">
        {[
          { label: 'Activos', value: activeShifts.length, color: '#1877F2' },
          { label: 'Completados', value: pastShifts.filter((s: any) => s.status === 'completed').length, color: '#166534' },
          { label: 'Calificación', value: profile.rating > 0 ? profile.rating.toFixed(1) : '–', color: '#F59E0B' },
        ].map(stat => (
          <div
            key={stat.label}
            className="p-3 rounded-2xl text-center"
            style={{ background: '#FFFFFF', border: '1px solid #E5E2DB' }}
          >
            <div className="text-2xl font-bold" style={{ fontFamily: 'var(--font-syne)', color: stat.color }}>
              {stat.value}
            </div>
            <div className="text-xs mt-0.5" style={{ color: '#6B6860' }}>{stat.label}</div>
          </div>
        ))}
      </div>

      {/* Post shift CTA */}
      <Link href="/shifts/new">
        <div
          className="flex items-center justify-between p-4 rounded-2xl mb-6 transition-all active:scale-[0.99]"
          style={{ background: '#1A1A1A', color: '#FFFFFF' }}
        >
          <div>
            <div className="font-semibold" style={{ fontFamily: 'var(--font-syne)' }}>
              Publicar nuevo turno
            </div>
            <div className="text-xs mt-0.5 opacity-60">
              Encuentra trabajadores rápido
            </div>
          </div>
          <svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <circle cx="12" cy="12" r="10"/>
            <line x1="12" y1="8" x2="12" y2="16"/>
            <line x1="8" y1="12" x2="16" y2="12"/>
          </svg>
        </div>
      </Link>

      {/* Active shifts */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-semibold" style={{ fontFamily: 'var(--font-syne)', color: '#1A1A1A' }}>
            Turnos activos
          </h2>
          <Link href="/shifts" className="text-sm" style={{ color: '#6B6860' }}>Ver todos</Link>
        </div>
        {activeShifts.length === 0 ? (
          <div
            className="p-6 rounded-2xl text-center"
            style={{ background: '#FFFFFF', border: '1px solid #E5E2DB' }}
          >
            <div className="text-3xl mb-2">📋</div>
            <p className="text-sm" style={{ color: '#6B6860' }}>No tienes turnos activos</p>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {activeShifts.slice(0, 5).map((shift: Shift) => (
              <ShiftCard key={shift.id} shift={shift} />
            ))}
          </div>
        )}
      </div>

      {/* Expired shifts notice */}
      {expiredShifts.length > 0 && (
        <div
          className="mb-6 px-4 py-3 rounded-2xl flex items-center justify-between"
          style={{ background: '#F3F4F6', border: '1px solid #E5E2DB' }}
        >
          <span className="text-sm" style={{ color: '#6B7280' }}>
            {expiredShifts.length} turno{expiredShifts.length > 1 ? 's' : ''} vencido{expiredShifts.length > 1 ? 's' : ''}
          </span>
          <Link href="/shifts" className="text-xs font-medium" style={{ color: '#1877F2' }}>
            Ver en turnos
          </Link>
        </div>
      )}

      {/* Recent completed */}
      {pastShifts.length > 0 && (
        <div className="mb-6">
          <h2 className="text-lg font-semibold mb-3" style={{ fontFamily: 'var(--font-syne)', color: '#1A1A1A' }}>
            Historial reciente
          </h2>
          <div className="flex flex-col gap-3">
            {pastShifts.slice(0, 3).map((shift: Shift) => (
              <ShiftCard key={shift.id} shift={shift} />
            ))}
          </div>
        </div>
      )}

      {/* Available groups */}
      <div>
        <h2 className="text-lg font-semibold mb-3" style={{ fontFamily: 'var(--font-syne)', color: '#1A1A1A' }}>
          Grupos disponibles
        </h2>
        {(availableGroups?.length || 0) === 0 ? (
          <div className="p-6 rounded-2xl text-center" style={{ background: '#FFFFFF', border: '1px solid #E5E2DB' }}>
            <div className="text-3xl mb-2">👥</div>
            <p className="text-sm" style={{ color: '#6B6860' }}>No hay grupos disponibles en tu zona</p>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {availableGroups!.map((group: any) => (
              <div
                key={group.id}
                className="p-4 rounded-2xl"
                style={{ background: '#FFFFFF', border: '1px solid #E5E2DB' }}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xl">{group.categories?.emoji}</span>
                      <h3 className="font-semibold text-base" style={{ fontFamily: 'var(--font-syne)', color: '#1A1A1A' }}>
                        {group.name}
                      </h3>
                    </div>
                    <div className="flex items-center gap-3 text-sm" style={{ color: '#6B6860' }}>
                      <span>📍 {group.city}</span>
                      <span>👥 {group.member_count} miembros</span>
                    </div>
                    <div className="text-xs mt-1" style={{ color: '#9CA3AF' }}>
                      {group.categories?.name}
                    </div>
                  </div>
                  <button
                    className="px-3 py-2 rounded-xl text-xs font-semibold flex-shrink-0"
                    style={{ background: '#1A1A1A', color: '#FFFFFF' }}
                  >
                    Contratar grupo
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

async function WorkerDashboard({ userId, profile }: { userId: string; profile: any }) {
  const supabase = await createClient()

  // Round 1 — parallel (independent)
  const [{ data: workerCats }, { data: workerLoc }] = await Promise.all([
    supabase
      .from('worker_categories')
      .select('category_id')
      .eq('worker_id', userId),
    supabase
      .from('worker_locations')
      .select('latitude, longitude')
      .eq('worker_id', userId)
      .single(),
  ])

  const categoryIds = workerCats?.map(wc => wc.category_id) || []

  let shiftsQuery = supabase
    .from('shifts')
    .select('*, categories(*), profiles(*)')
    .eq('status', 'open')
    .gt('expires_at', new Date().toISOString())
    .order('created_at', { ascending: false })
    .limit(20)

  if (profile.city) {
    shiftsQuery = shiftsQuery.ilike('city', `%${profile.city}%`)
  }
  if (categoryIds.length > 0) {
    shiftsQuery = shiftsQuery.in('category_id', categoryIds)
  }

  // Round 2 — parallel (shifts depends on categoryIds; applications are independent)
  const [{ data: rawShifts }, { data: applications }, { data: acceptedApps }] = await Promise.all([
    shiftsQuery,
    supabase
      .from('applications')
      .select('*, shifts(*, categories(*), profiles(*))')
      .eq('worker_id', userId)
      .order('created_at', { ascending: false })
      .limit(5),
    supabase
      .from('applications')
      .select('shifts(pay_amount)')
      .eq('worker_id', userId)
      .eq('status', 'accepted'),
  ])

  const openShifts = (() => {
    if (!rawShifts) return []
    if (!workerLoc) return rawShifts
    return rawShifts
      .map(s => ({
        ...s,
        _distKm:
          s.latitude != null && s.longitude != null
            ? haversineKm(workerLoc.latitude, workerLoc.longitude, s.latitude, s.longitude)
            : undefined,
      }))
      .sort((a, b) => {
        if (a._distKm == null) return 1
        if (b._distKm == null) return -1
        return a._distKm - b._distKm
      })
  })()

  const earnings =
    acceptedApps?.reduce((sum: number, app: any) => sum + (app.shifts?.pay_amount || 0), 0) || 0

  return (
    <div className="px-4 py-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold" style={{ fontFamily: 'var(--font-syne)', color: '#1A1A1A' }}>
            Hola, {profile.full_name.split(' ')[0]} 👋
          </h1>
          <p className="text-sm mt-0.5" style={{ color: '#6B6860' }}>
            {profile.city || 'Worker'}
          </p>
        </div>
        <Link href="/profile">
          <div className="w-11 h-11 rounded-full flex items-center justify-center text-lg font-bold overflow-hidden"
            style={{ background: '#1A1A1A', color: '#F8F6F1' }}>
            {profile.avatar_url ? (
              <img src={profile.avatar_url} alt="" className="w-full h-full object-cover" />
            ) : (
              profile.full_name.charAt(0).toUpperCase()
            )}
          </div>
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3 mb-6">
        {[
          { label: 'Ganancias', value: `$${earnings.toLocaleString('es-MX')}`, color: '#166534' },
          { label: 'Calificación', value: profile.rating > 0 ? profile.rating.toFixed(1) : '–', color: '#F59E0B' },
          { label: 'Reseñas', value: profile.rating_count, color: '#1877F2' },
        ].map(stat => (
          <div key={stat.label} className="p-3 rounded-2xl text-center" style={{ background: '#FFFFFF', border: '1px solid #E5E2DB' }}>
            <div className="text-xl font-bold" style={{ fontFamily: 'var(--font-syne)', color: stat.color }}>
              {stat.value}
            </div>
            <div className="text-xs mt-0.5" style={{ color: '#6B6860' }}>{stat.label}</div>
          </div>
        ))}
      </div>

      {profile.has_warning && (
        <div className="mb-4 p-3 rounded-xl flex items-center gap-2" style={{ background: '#FEF9C3', border: '1px solid #FDE68A' }}>
          <span>⚠️</span>
          <span className="text-sm" style={{ color: '#854D0E' }}>
            Tienes una advertencia por cancelaciones frecuentes
          </span>
        </div>
      )}

      {/* Availability toggle */}
      <WorkerAvailabilityToggle workerId={userId} />

      {/* Open shifts */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-semibold" style={{ fontFamily: 'var(--font-syne)', color: '#1A1A1A' }}>
            Turnos disponibles
          </h2>
          <Link href="/shifts" className="text-sm" style={{ color: '#6B6860' }}>Ver todos</Link>
        </div>
        {openShifts.length === 0 ? (
          <div className="p-6 rounded-2xl text-center" style={{ background: '#FFFFFF', border: '1px solid #E5E2DB' }}>
            <div className="text-3xl mb-2">🔍</div>
            <p className="text-sm" style={{ color: '#6B6860' }}>No hay turnos disponibles en tu zona</p>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {openShifts.slice(0, 5).map((shift: any) => (
              <ShiftCard key={shift.id} shift={shift} showClientRating distanceKm={shift._distKm} />
            ))}
          </div>
        )}
      </div>

      {/* Recent applications */}
      {(applications?.length || 0) > 0 && (
        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-lg font-semibold" style={{ fontFamily: 'var(--font-syne)', color: '#1A1A1A' }}>
              Mis aplicaciones
            </h2>
            <Link href="/applications" className="text-sm" style={{ color: '#6B6860' }}>Ver todas</Link>
          </div>
          <div className="flex flex-col gap-3">
            {applications!.slice(0, 3).map((app: Application) => (
              app.shifts && <ShiftCard key={app.id} shift={app.shifts as Shift} applicationStatus={app.status} />
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
