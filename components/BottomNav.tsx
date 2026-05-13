'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { createClient } from '@/lib/supabase/client'

interface NavItem {
  href: string
  label: string
  icon: React.ReactNode
  activeIcon: React.ReactNode
  badge?: number
}

function HomeIcon({ filled }: { filled?: boolean }) {
  return filled ? (
    <svg width="24" height="24" fill="currentColor" viewBox="0 0 24 24">
      <path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z"/>
    </svg>
  ) : (
    <svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
      <path d="M3 9.5L12 3l9 6.5V20a1 1 0 01-1 1H5a1 1 0 01-1-1V9.5z"/>
      <path d="M9 21V12h6v9"/>
    </svg>
  )
}

function BriefcaseIcon({ filled }: { filled?: boolean }) {
  return filled ? (
    <svg width="24" height="24" fill="currentColor" viewBox="0 0 24 24">
      <path d="M20 7h-4V5a2 2 0 00-2-2h-4a2 2 0 00-2 2v2H4a2 2 0 00-2 2v11a2 2 0 002 2h16a2 2 0 002-2V9a2 2 0 00-2-2zm-8 9a2 2 0 110-4 2 2 0 010 4zm2-9h-4V5h4v2z"/>
    </svg>
  ) : (
    <svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
      <rect x="2" y="7" width="20" height="14" rx="2"/>
      <path d="M16 7V5a2 2 0 00-2-2h-4a2 2 0 00-2 2v2"/>
      <line x1="12" y1="12" x2="12" y2="12"/>
    </svg>
  )
}

function ChatIcon({ filled }: { filled?: boolean }) {
  return filled ? (
    <svg width="24" height="24" fill="currentColor" viewBox="0 0 24 24">
      <path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2z"/>
    </svg>
  ) : (
    <svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
      <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/>
    </svg>
  )
}

function GroupIcon({ filled }: { filled?: boolean }) {
  return filled ? (
    <svg width="24" height="24" fill="currentColor" viewBox="0 0 24 24">
      <path d="M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5c-1.66 0-3 1.34-3 3s1.34 3 3 3zm-8 0c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5C6.34 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5c0-2.33-4.67-3.5-7-3.5zm8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 1.97 1.97 3.45V19h6v-2.5c0-2.33-4.67-3.5-7-3.5z"/>
    </svg>
  ) : (
    <svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
      <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/>
      <circle cx="9" cy="7" r="4"/>
      <path d="M23 21v-2a4 4 0 00-3-3.87"/>
      <path d="M16 3.13a4 4 0 010 7.75"/>
    </svg>
  )
}

function UserIcon({ filled }: { filled?: boolean }) {
  return filled ? (
    <svg width="24" height="24" fill="currentColor" viewBox="0 0 24 24">
      <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
    </svg>
  ) : (
    <svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
      <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/>
      <circle cx="12" cy="7" r="4"/>
    </svg>
  )
}

export default function BottomNav({ userType }: { userType: string }) {
  const pathname = usePathname()
  const [unreadCount, setUnreadCount] = useState(0)

  useEffect(() => {
    const supabase = createClient()

    async function fetchUnread() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data: convs } = await supabase
        .from('conversations')
        .select('id')
        .or(`client_id.eq.${user.id},worker_id.eq.${user.id}`)

      if (!convs?.length) {
        setUnreadCount(0)
        return
      }

      const { count } = await supabase
        .from('messages')
        .select('id', { count: 'exact', head: true })
        .in('conversation_id', convs.map(c => c.id))
        .eq('read', false)
        .neq('sender_id', user.id)

      setUnreadCount(count || 0)
    }

    fetchUnread()

    // Subscribe to message changes to update badge live
    const channel = supabase
      .channel('nav-unread')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'messages' }, fetchUnread)
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [])

  const allNavItems: NavItem[] = [
    {
      href: '/dashboard',
      label: 'Inicio',
      icon: <HomeIcon />,
      activeIcon: <HomeIcon filled />,
    },
    {
      href: '/shifts',
      label: 'Turnos',
      icon: <BriefcaseIcon />,
      activeIcon: <BriefcaseIcon filled />,
    },
    {
      href: '/chat',
      label: 'Chat',
      icon: <ChatIcon />,
      activeIcon: <ChatIcon filled />,
      badge: unreadCount,
    },
    {
      href: '/groups',
      label: 'Grupos',
      icon: <GroupIcon />,
      activeIcon: <GroupIcon filled />,
    },
    {
      href: '/profile',
      label: 'Perfil',
      icon: <UserIcon />,
      activeIcon: <UserIcon filled />,
    },
  ]

  const navItems = userType === 'cliente'
    ? allNavItems.filter(item => item.href !== '/groups')
    : allNavItems

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-50 border-t lg:hidden"
      style={{ background: 'var(--nav-bg)', borderColor: 'var(--nav-border)' }}
    >
      <div className="flex items-center justify-around px-2 py-2 max-w-lg mx-auto"
        style={{ paddingBottom: `calc(env(safe-area-inset-bottom) + 0.5rem)` }}>
        {navItems.map((item) => {
          const isActive = pathname.startsWith(item.href)
          return (
            <Link
              key={item.href}
              href={item.href}
              prefetch={true}
              className="flex flex-col items-center gap-0.5 px-3 py-1 rounded-xl relative"
              style={{ color: isActive ? 'var(--fg)' : 'var(--muted)' }}
            >
              <div className="relative">
                {/* Bounce animation when tab becomes active */}
                <motion.div
                  key={isActive ? `${item.href}-on` : `${item.href}-off`}
                  initial={isActive ? { scale: 0.65 } : { scale: 1 }}
                  animate={{ scale: 1 }}
                  transition={{ type: 'spring', stiffness: 500, damping: 18 }}
                >
                  {isActive ? item.activeIcon : item.icon}
                </motion.div>

                {/* Badge pop animation when count changes */}
                <AnimatePresence>
                  {item.badge != null && item.badge > 0 && (
                    <motion.span
                      key={item.badge}
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      exit={{ scale: 0 }}
                      transition={{ type: 'spring', stiffness: 600, damping: 20 }}
                      className="absolute -top-1 -right-1 min-w-[16px] h-4 px-0.5 rounded-full flex items-center justify-center text-white font-bold"
                      style={{ background: '#EF4444', fontSize: 9, lineHeight: 1 }}
                    >
                      {item.badge > 9 ? '9+' : item.badge}
                    </motion.span>
                  )}
                </AnimatePresence>
              </div>
              <span className="text-xs font-medium" style={{ fontFamily: 'var(--font-dm-sans)' }}>
                {item.label}
              </span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
