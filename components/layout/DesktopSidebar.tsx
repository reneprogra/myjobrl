'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

function HomeIcon({ filled }: { filled?: boolean }) {
  return filled ? (
    <svg width="20" height="20" fill="currentColor" viewBox="0 0 24 24">
      <path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z"/>
    </svg>
  ) : (
    <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
      <path d="M3 9.5L12 3l9 6.5V20a1 1 0 01-1 1H5a1 1 0 01-1-1V9.5z"/>
      <path d="M9 21V12h6v9"/>
    </svg>
  )
}

function BriefcaseIcon({ filled }: { filled?: boolean }) {
  return filled ? (
    <svg width="20" height="20" fill="currentColor" viewBox="0 0 24 24">
      <path d="M20 7h-4V5a2 2 0 00-2-2h-4a2 2 0 00-2 2v2H4a2 2 0 00-2 2v11a2 2 0 002 2h16a2 2 0 002-2V9a2 2 0 00-2-2zm-8 9a2 2 0 110-4 2 2 0 010 4zm2-9h-4V5h4v2z"/>
    </svg>
  ) : (
    <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
      <rect x="2" y="7" width="20" height="14" rx="2"/>
      <path d="M16 7V5a2 2 0 00-2-2h-4a2 2 0 00-2 2v2"/>
    </svg>
  )
}

function GroupIcon({ filled }: { filled?: boolean }) {
  return filled ? (
    <svg width="20" height="20" fill="currentColor" viewBox="0 0 24 24">
      <path d="M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5c-1.66 0-3 1.34-3 3s1.34 3 3 3zm-8 0c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5C6.34 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5c0-2.33-4.67-3.5-7-3.5zm8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 1.97 1.97 3.45V19h6v-2.5c0-2.33-4.67-3.5-7-3.5z"/>
    </svg>
  ) : (
    <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
      <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/>
      <circle cx="9" cy="7" r="4"/>
      <path d="M23 21v-2a4 4 0 00-3-3.87"/>
      <path d="M16 3.13a4 4 0 010 7.75"/>
    </svg>
  )
}

function UserIcon({ filled }: { filled?: boolean }) {
  return filled ? (
    <svg width="20" height="20" fill="currentColor" viewBox="0 0 24 24">
      <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
    </svg>
  ) : (
    <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
      <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/>
      <circle cx="12" cy="7" r="4"/>
    </svg>
  )
}

interface Props {
  userType: string
  profile: { full_name?: string; avatar_url?: string | null } | null
}

export default function DesktopSidebar({ userType, profile }: Props) {
  const pathname = usePathname()
  const router = useRouter()

  const allNavItems = [
    { href: '/dashboard', label: 'Inicio', icon: <HomeIcon />, activeIcon: <HomeIcon filled /> },
    { href: '/shifts', label: 'Turnos', icon: <BriefcaseIcon />, activeIcon: <BriefcaseIcon filled /> },
    { href: '/groups', label: 'Grupos', icon: <GroupIcon />, activeIcon: <GroupIcon filled /> },
    { href: '/profile', label: 'Perfil', icon: <UserIcon />, activeIcon: <UserIcon filled /> },
  ]

  const navItems = userType === 'cliente'
    ? allNavItems.filter(item => item.href !== '/groups')
    : allNavItems

  async function handleSignOut() {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/login')
  }

  return (
    <aside
      className="hidden lg:flex flex-col w-60 min-h-screen sticky top-0 flex-shrink-0 border-r"
      style={{ background: 'var(--card)', borderColor: 'var(--border)' }}
    >
      {/* Nav items */}
      <nav className="flex-1 px-3 py-4 flex flex-col gap-1">
        {navItems.map(item => {
          const isActive = pathname.startsWith(item.href)
          return (
            <Link
              key={item.href}
              href={item.href}
              className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors"
              style={{
                background: isActive ? 'var(--secondary-bg)' : 'transparent',
                color: isActive ? 'var(--fg)' : 'var(--muted)',
              }}
            >
              {isActive ? item.activeIcon : item.icon}
              {item.label}
            </Link>
          )
        })}
      </nav>

      {/* User + sign out */}
      <div className="px-3 py-4 border-t flex flex-col gap-2" style={{ borderColor: 'var(--border)' }}>
        <Link href="/profile" className="flex items-center gap-3 px-3 py-2 rounded-xl hover:bg-[var(--secondary-bg)] transition-colors">
          <div
            className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0 overflow-hidden"
            style={{ background: '#1A1A1A', color: '#F8F6F1' }}
          >
            {profile?.avatar_url ? (
              <img src={profile.avatar_url} alt="" className="w-full h-full object-cover" />
            ) : (
              profile?.full_name?.charAt(0).toUpperCase() || '?'
            )}
          </div>
          <span className="text-sm font-medium truncate" style={{ color: 'var(--fg)' }}>
            {profile?.full_name || 'Mi perfil'}
          </span>
        </Link>

        <Link
          href="/"
          className="flex items-center gap-3 px-3 py-2 rounded-xl text-sm w-full transition-colors hover:bg-[var(--secondary-bg)]"
          style={{ color: 'var(--muted)' }}
        >
          <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <circle cx="12" cy="12" r="10"/>
            <line x1="2" y1="12" x2="22" y2="12"/>
            <path d="M12 2a15.3 15.3 0 010 20M12 2a15.3 15.3 0 000 20"/>
          </svg>
          Ver sitio
        </Link>

        <button
          onClick={handleSignOut}
          className="flex items-center gap-3 px-3 py-2 rounded-xl text-sm w-full text-left transition-colors hover:bg-[var(--secondary-bg)]"
          style={{ color: 'var(--muted)' }}
        >
          <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4"/>
            <polyline points="16 17 21 12 16 7"/>
            <line x1="21" y1="12" x2="9" y2="12"/>
          </svg>
          Cerrar sesión
        </button>
      </div>
    </aside>
  )
}
