'use client'

import { useState, useEffect, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { Message } from '@/lib/types'

interface OtherPerson {
  id: string
  full_name: string
  avatar_url: string | null
}

interface Props {
  conversationId: string
  currentUserId: string
  initialMessages: Message[]
  otherPerson: OtherPerson
}

function formatMsgTime(dateStr: string) {
  return new Date(dateStr).toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' })
}

function formatMsgDate(dateStr: string) {
  const d = new Date(dateStr)
  const now = new Date()
  const diffDays = Math.floor((now.getTime() - d.getTime()) / 86400000)
  if (diffDays === 0) return 'Hoy'
  if (diffDays === 1) return 'Ayer'
  return d.toLocaleDateString('es-MX', { weekday: 'long', day: 'numeric', month: 'long' })
}

export default function ChatThread({ conversationId, currentUserId, initialMessages, otherPerson }: Props) {
  const [messages, setMessages] = useState<Message[]>(initialMessages)
  const [input, setInput] = useState('')
  const [sending, setSending] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)

  // Mark existing unread messages as read on mount
  useEffect(() => {
    const supabase = createClient()
    supabase
      .from('messages')
      .update({ read: true })
      .eq('conversation_id', conversationId)
      .neq('sender_id', currentUserId)
      .eq('read', false)
      .then(() => {})
  }, [conversationId, currentUserId])

  // Realtime subscription for new messages
  useEffect(() => {
    const supabase = createClient()

    const channel = supabase
      .channel(`chat-${conversationId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `conversation_id=eq.${conversationId}`,
        },
        (payload) => {
          const newMsg = payload.new as Message
          setMessages(prev => {
            // Avoid duplicates (if we already added it optimistically)
            if (prev.some(m => m.id === newMsg.id)) return prev
            return [...prev, newMsg]
          })
          // Mark as read if we're the recipient
          if (newMsg.sender_id !== currentUserId) {
            supabase.from('messages').update({ read: true }).eq('id', newMsg.id).then(() => {})
          }
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [conversationId, currentUserId])

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  async function sendMessage() {
    const content = input.trim()
    if (!content || sending) return

    setSending(true)
    setInput('')

    // Optimistic update — show message immediately
    const tempId = `temp-${Date.now()}`
    const optimistic: Message = {
      id: tempId,
      conversation_id: conversationId,
      sender_id: currentUserId,
      content,
      read: false,
      created_at: new Date().toISOString(),
    }
    setMessages(prev => [...prev, optimistic])

    const supabase = createClient()
    const { data: inserted } = await supabase
      .from('messages')
      .insert({
        conversation_id: conversationId,
        sender_id: currentUserId,
        content,
        read: false,
      })
      .select()
      .single()

    // Replace temp with confirmed row (realtime may also fire but dedup handles it)
    if (inserted) {
      setMessages(prev =>
        prev.map(m => (m.id === tempId ? (inserted as Message) : m))
      )
    }

    setSending(false)
    inputRef.current?.focus()
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  // Group messages by date
  const grouped: { date: string; msgs: Message[] }[] = []
  for (const msg of messages) {
    const dateLabel = formatMsgDate(msg.created_at)
    const last = grouped[grouped.length - 1]
    if (last && last.date === dateLabel) {
      last.msgs.push(msg)
    } else {
      grouped.push({ date: dateLabel, msgs: [msg] })
    }
  }

  return (
    <div className="flex flex-col" style={{ height: 'calc(100dvh - 112px)' }}>
      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-4 flex flex-col gap-1">
        {messages.length === 0 && (
          <div className="flex-1 flex flex-col items-center justify-center text-center py-12">
            <div className="text-4xl mb-3">👋</div>
            <p className="text-sm" style={{ color: 'var(--muted)' }}>
              Sé el primero en enviar un mensaje a {otherPerson.full_name}
            </p>
          </div>
        )}

        {grouped.map(({ date, msgs }) => (
          <div key={date}>
            {/* Date separator */}
            <div className="flex items-center gap-3 my-3">
              <div className="flex-1 h-px" style={{ background: '#E5E2DB' }} />
              <span className="text-xs px-2" style={{ color: 'var(--text-muted)' }}>{date}</span>
              <div className="flex-1 h-px" style={{ background: '#E5E2DB' }} />
            </div>

            {msgs.map((msg, i) => {
              const isMe = msg.sender_id === currentUserId
              const prevMsg = msgs[i - 1]
              const showAvatar = !isMe && (!prevMsg || prevMsg.sender_id !== msg.sender_id)

              return (
                <div
                  key={msg.id}
                  className={`flex mb-1 ${isMe ? 'justify-end' : 'justify-start'}`}
                >
                  {/* Other person's avatar space */}
                  {!isMe && (
                    <div className="w-7 flex-shrink-0 mr-2 flex items-end">
                      {showAvatar && (
                        otherPerson.avatar_url ? (
                          <img
                            src={otherPerson.avatar_url}
                            alt={otherPerson.full_name}
                            className="w-7 h-7 rounded-full object-cover"
                          />
                        ) : (
                          <div
                            className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold"
                            style={{ background: 'var(--secondary-bg)', color: 'var(--fg)' }}
                          >
                            {otherPerson.full_name.charAt(0).toUpperCase()}
                          </div>
                        )
                      )}
                    </div>
                  )}

                  <div className={`flex flex-col ${isMe ? 'items-end' : 'items-start'} max-w-[75%]`}>
                    <div
                      className="px-3 py-2 rounded-2xl text-sm leading-relaxed"
                      style={
                        isMe
                          ? { background: '#1A1A1A', color: '#FFFFFF', borderBottomRightRadius: 4 }
                          : { background: 'var(--card)', color: 'var(--fg)', border: '1px solid var(--border)', borderBottomLeftRadius: 4 }
                      }
                    >
                      {msg.content}
                    </div>
                    <span className="text-xs mt-0.5 px-1" style={{ color: 'var(--text-muted)' }}>
                      {formatMsgTime(msg.created_at)}
                      {isMe && (
                        <span className="ml-1">{msg.read ? ' ✓✓' : ' ✓'}</span>
                      )}
                    </span>
                  </div>
                </div>
              )
            })}
          </div>
        ))}

        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div
        className="px-4 py-3 flex items-end gap-3"
        style={{ background: 'var(--card)', borderTop: '1px solid #E5E2DB' }}
      >
        <textarea
          ref={inputRef}
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Escribe un mensaje..."
          rows={1}
          className="flex-1 px-4 py-2.5 rounded-2xl text-sm outline-none resize-none"
          style={{
            background: 'var(--bg)',
            border: '1.5px solid #E5E2DB',
            color: 'var(--fg)',
            fontFamily: 'var(--font-dm-sans)',
            maxHeight: 120,
          }}
        />
        <button
          onClick={sendMessage}
          disabled={!input.trim() || sending}
          className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 transition-opacity"
          style={{
            background: '#1A1A1A',
            color: '#FFFFFF',
            opacity: !input.trim() || sending ? 0.4 : 1,
          }}
        >
          <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
            <line x1="22" y1="2" x2="11" y2="13"/>
            <polygon points="22 2 15 22 11 13 2 9 22 2"/>
          </svg>
        </button>
      </div>
    </div>
  )
}
