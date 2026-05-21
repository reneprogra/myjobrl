'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

/**
 * Drop this anywhere in a server-rendered page to get automatic live updates.
 * It subscribes to Postgres changes and calls router.refresh() on any event.
 */
export default function RealtimeRefresh({
  table,
  filter,
  channelName,
}: {
  table: string
  filter?: string
  channelName?: string
}) {
  const router = useRouter()

  useEffect(() => {
    const supabase = createClient()
    const ch = supabase
      .channel(channelName ?? `rt-${table}-${Math.random()}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table, filter },
        () => router.refresh()
      )
      .subscribe()

    return () => {
      supabase.removeChannel(ch)
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  return null
}
