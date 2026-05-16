import { createClient } from '@/lib/supabase/server'
import { redirect, notFound } from 'next/navigation'
import Link from 'next/link'
import ChatThread from './ChatThread'
import type { Message } from '@/lib/types'

export default async function ChatThreadPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // Fetch conversation (RLS ensures user is a participant)
  const { data: conversation } = await supabase
    .from('conversations')
    .select('id, shift_id, client_id, worker_id, shifts(id, title)')
    .eq('id', id)
    .single()

  if (!conversation) notFound()

  // Verify current user is a participant
  if (conversation.client_id !== user.id && conversation.worker_id !== user.id) {
    redirect('/chat')
  }

  const otherId = conversation.client_id === user.id ? conversation.worker_id : conversation.client_id

  // Fetch both profiles in parallel
  const [{ data: otherProfile }, { data: currentProfile }] = await Promise.all([
    supabase.from('profiles').select('id, full_name, avatar_url').eq('id', otherId).single(),
    supabase.from('profiles').select('full_name').eq('id', user.id).single(),
  ])

  if (!otherProfile) notFound()

  // Fetch initial messages
  const { data: messagesData } = await supabase
    .from('messages')
    .select('id, conversation_id, sender_id, content, read, created_at')
    .eq('conversation_id', id)
    .order('created_at', { ascending: true })

  const initialMessages: Message[] = messagesData || []

  const shiftTitle = (conversation as any).shifts?.title

  return (
    <div className="flex flex-col" style={{ height: 'calc(100dvh - 56px)' }}>
      {/* Chat header */}
      <div
        className="flex items-center gap-3 px-4 py-3 flex-shrink-0"
        style={{ background: '#FFFFFF', borderBottom: '1px solid #E5E2DB' }}
      >
        <Link
          href="/chat"
          className="p-2 rounded-xl flex-shrink-0"
          style={{ background: '#F8F6F1' }}
        >
          <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <polyline points="15 18 9 12 15 6"/>
          </svg>
        </Link>

        <div className="flex items-center gap-3 flex-1 min-w-0">
          {otherProfile.avatar_url ? (
            <img
              src={otherProfile.avatar_url}
              alt={otherProfile.full_name}
              className="w-9 h-9 rounded-full object-cover flex-shrink-0"
            />
          ) : (
            <div
              className="w-9 h-9 rounded-full flex items-center justify-center font-bold text-sm flex-shrink-0"
              style={{ background: '#F0EDE6', color: '#1A1A1A' }}
            >
              {otherProfile.full_name.charAt(0).toUpperCase()}
            </div>
          )}
          <div className="min-w-0">
            <div
              className="font-semibold text-sm truncate"
              style={{ fontFamily: 'var(--font-syne)', color: '#1A1A1A' }}
            >
              {otherProfile.full_name}
            </div>
            {shiftTitle && (
              <div className="text-xs truncate" style={{ color: '#6B6860' }}>
                {shiftTitle}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Thread */}
      <ChatThread
        conversationId={id}
        currentUserId={user.id}
        currentUserName={currentProfile?.full_name || 'Alguien'}
        initialMessages={initialMessages}
        otherPerson={otherProfile}
      />
    </div>
  )
}
