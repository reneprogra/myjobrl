import BottomNav from '@/components/BottomNav'
import PageTransition from '@/components/PageTransition'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Image from 'next/image'

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
    .select('user_type')
    .eq('id', user.id)
    .single()

  const userType = profile?.user_type || 'worker'

  return (
    <div className="min-h-screen" style={{ background: 'var(--bg)' }}>
      <header
        className="sticky top-0 z-10 flex items-center gap-2 px-4 h-14 max-w-lg mx-auto"
        style={{ background: 'var(--bg)', borderBottom: '1px solid var(--border)' }}
      >
        <Image
          src="/logo.png"
          alt="MyJob"
          height={32}
          width={96}
          style={{ height: '32px', width: 'auto' }}
        />
        <span
          className="text-lg font-bold"
          style={{ fontFamily: 'var(--font-syne)', color: 'var(--fg)' }}
        >
          MyJob
        </span>
      </header>
      <main className="pb-24 max-w-lg mx-auto">
        <PageTransition>{children}</PageTransition>
      </main>
      <BottomNav userType={userType} />
    </div>
  )
}
