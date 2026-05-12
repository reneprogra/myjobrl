import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import type { Message } from '@/lib/types'

function formatTime(dateStr: string) {
  const d = new Date(dateStr)
  const now = new Date()
  const diffDays = Math.floor((now.getTime() - d.getTime()) / 86400000)
  if (diffDays === 0) {
    return d.toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' })
  }
  if (diffDays === 1) return 'Ayer'
  if (diffDays < 7) return d.toLocaleDateString('es-MX', { weekday: 'short' })
  return d.toLocaleDateString('es-MX', { day: 'numeric', month: 'short' })
}

function Avatar({ name, avatarUrl, size = 44 }: { name: string; avatarUrl: string | null; size?: number }) {
  if (avatarUrl) {
    return (
      <img
        src={avatarUrl}
        alt={name}
        className="rounded-full object-cover flex-shrink-0"
        style={{ width: size, height: size }}
      />
    )
  }
  return (
    <div
      className="rounded-full flex items-center justify-center font-bold flex-shrink-0"
      style={{ width: size, height: size, background: 'var(--secondary-bg)', color: 'var(--fg)', fontSize: size * 0.4 }}
    >
      {name.charAt(0).toUpperCase()}
    </div>
  )
}

export default async function ChatPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // Fetch conversations
  const { data: conversations } = await supabase
    .from('conversations')
    .select('id, shift_id, client_id, worker_id, created_at, shifts(id, title)')
    .or(`client_id.eq.${user.id},worker_id.eq.${user.id}`)
    .order('created_at', { ascending: false })

  const convList = conversations || []

  // Fetch profiles for all participants
  const participantIds = [...new Set(convList.flatMap(c => [c.client_id, c.worker_id]))]
  const { data: profilesData } = participantIds.length > 0
    ? await supabase.from('profiles').select('id, full_name, avatar_url').in('id', participantIds)
    : { data: [] }
  const profileMap = Object.fromEntries((profilesData || []).map(p => [p.id, p]))

  // Fetch messages for all conversations
  const convIds = convList.map(c => c.id)
  const { data: messagesData } = convIds.length > 0
    ? await supabase
        .from('messages')
        .select('id, conversation_id, sender_id, content, read, created_at')
        .in('conversation_id', convIds)
        .order('created_at', { ascending: false })
    : { data: [] }

  const allMessages: Message[] = messagesData || []

  // Build per-conversation data
  const convData = convList.map(conv => {
    const msgs = allMessages.filter(m => m.conversation_id === conv.id)
    const lastMessage = msgs[0] || null
    const unread = msgs.filter(m => !m.read && m.sender_id !== user.id).length
    const otherId = conv.client_id === user.id ? conv.worker_id : conv.client_id
    const otherProfile = profileMap[otherId] || { id: otherId, full_name: 'Usuario', avatar_url: null }
    return { conv, lastMessage, unread, otherProfile }
  })

  // Sort by last message time (most recent first)
  convData.sort((a, b) => {
    const aTime = a.lastMessage?.created_at || a.conv.created_at
    const bTime = b.lastMessage?.created_at || b.conv.created_at
    return new Date(bTime).getTime() - new Date(aTime).getTime()
  })

  return (
    <div className="pb-8">
      {/* Header */}
      <div className="px-4 pt-6 pb-4">
        <h1
          className="text-2xl font-bold"
          style={{ fontFamily: 'var(--font-syne)', color: 'var(--fg)' }}
        >
          Mensajes
        </h1>
      </div>

      {convData.length === 0 ? (
        <div className="mx-4 mt-8 p-8 rounded-2xl text-center" style={{ background: 'var(--card)', border: '1px solid var(--border)' }}>
          <div className="text-4xl mb-3">💬</div>
          <h3 className="font-semibold mb-1" style={{ fontFamily: 'var(--font-syne)', color: 'var(--fg)' }}>
            Sin conversaciones
          </h3>
          <p className="text-sm" style={{ color: 'var(--muted)' }}>
            Las conversaciones aparecen cuando se acepta una aplicación a un turno.
          </p>
        </div>
      ) : (
        <div className="flex flex-col">
          {convData.map(({ conv, lastMessage, unread, otherProfile }) => (
            <Link
              key={conv.id}
              href={`/chat/${conv.id}`}
              className="flex items-center gap-3 px-4 py-3 active:opacity-70 transition-opacity"
              style={{ borderBottom: '1px solid var(--border)' }}
            >
              <div className="relative">
                <Avatar name={otherProfile.full_name} avatarUrl={otherProfile.avatar_url} />
                {unread > 0 && (
                  <span
                    className="absolute -top-0.5 -right-0.5 w-4 h-4 rounded-full flex items-center justify-center text-white font-bold"
                    style={{ background: '#1A1A1A', fontSize: 9 }}
                  >
                    {unread > 9 ? '9+' : unread}
                  </span>
                )}
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-baseline justify-between gap-2">
                  <span
                    className="font-semibold text-sm truncate"
                    style={{ color: 'var(--fg)', fontFamily: 'var(--font-syne)' }}
                  >
                    {otherProfile.full_name}
                  </span>
                  {lastMessage && (
                    <span className="text-xs flex-shrink-0" style={{ color: 'var(--text-muted)' }}>
                      {formatTime(lastMessage.created_at)}
                    </span>
                  )}
                </div>
                {(conv as any).shifts?.title && (
                  <div className="text-xs mb-0.5 truncate" style={{ color: 'var(--text-muted)' }}>
                    Turno: {(conv as any).shifts.title}
                  </div>
                )}
                <div className="flex items-center gap-1">
                  {lastMessage ? (
                    <p
                      className="text-sm truncate"
                      style={{ color: unread > 0 ? '#1A1A1A' : '#6B6860', fontWeight: unread > 0 ? 600 : 400 }}
                    >
                      {lastMessage.sender_id === user.id ? 'Tú: ' : ''}
                      {lastMessage.content}
                    </p>
                  ) : (
                    <p className="text-sm italic" style={{ color: 'var(--text-muted)' }}>Sin mensajes aún</p>
                  )}
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
