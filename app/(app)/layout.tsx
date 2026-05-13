import BottomNav from '@/components/BottomNav'
import DesktopSidebar from '@/components/layout/DesktopSidebar'
import PageTransition from '@/components/PageTransition'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('user_type, full_name, avatar_url')
    .eq('id', user.id)
    .single()

  const userType = profile?.user_type || 'worker'

  return (
    <div className="min-h-screen flex" style={{ background: 'var(--bg)' }}>
      {/* Desktop sidebar — hidden on mobile */}
      <DesktopSidebar userType={userType} profile={profile} />

      {/* Main content */}
      <main className="flex-1 pb-24 lg:pb-0 min-w-0">
        <div className="max-w-2xl mx-auto lg:max-w-5xl lg:px-8">
          <PageTransition>{children}</PageTransition>
        </div>
      </main>

      {/* Bottom nav — hidden on desktop */}
      <BottomNav userType={userType} />
    </div>
  )
}
