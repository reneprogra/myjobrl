import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import ShiftCard from '@/components/ShiftCard'

export default async function ApplicationsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase.from('profiles').select('user_type').eq('id', user.id).single()
  if (profile?.user_type !== 'worker') redirect('/dashboard')

  const { data: applications } = await supabase
    .from('applications')
    .select('*, shifts(*, categories(*), profiles(*))')
    .eq('worker_id', user.id)
    .order('created_at', { ascending: false })

  const statusLabels: Record<string, string> = {
    pending: 'Pendientes',
    accepted: 'Aceptadas',
    rejected: 'Rechazadas',
  }

  const grouped = {
    pending: applications?.filter(a => a.status === 'pending') || [],
    accepted: applications?.filter(a => a.status === 'accepted') || [],
    rejected: applications?.filter(a => a.status === 'rejected') || [],
  }

  return (
    <div className="px-4 py-6">
      <h1 className="text-2xl font-bold mb-6" style={{ fontFamily: 'var(--font-syne)', color: '#1A1A1A' }}>
        Mis aplicaciones
      </h1>

      {(applications?.length || 0) === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="text-5xl mb-4">📝</div>
          <p className="text-lg font-semibold" style={{ fontFamily: 'var(--font-syne)', color: '#1A1A1A' }}>
            Sin aplicaciones
          </p>
          <p className="text-sm mt-2" style={{ color: '#6B6860' }}>
            Explora turnos disponibles y aplica
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-6">
          {(['pending', 'accepted', 'rejected'] as const).map(status => {
            const apps = grouped[status]
            if (apps.length === 0) return null
            return (
              <div key={status}>
                <h2 className="text-base font-semibold mb-3 flex items-center gap-2" style={{ fontFamily: 'var(--font-syne)', color: '#1A1A1A' }}>
                  {statusLabels[status]}
                  <span className="text-xs font-medium px-2 py-0.5 rounded-full" style={{ background: '#F0EDE6', color: '#6B6860' }}>
                    {apps.length}
                  </span>
                </h2>
                <div className="flex flex-col gap-3">
                  {apps.map(app => (
                    app.shifts && (
                      <ShiftCard
                        key={app.id}
                        shift={app.shifts as any}
                        applicationStatus={app.status}
                      />
                    )
                  ))}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
