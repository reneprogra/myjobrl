import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { getAdminApp, admin } from '@/lib/firebase-admin'

export const dynamic = 'force-dynamic'

function getServiceClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  )
}

async function sendToUser(
  supabase: ReturnType<typeof getServiceClient>,
  messaging: admin.messaging.Messaging,
  userId: string,
  title: string,
  body: string,
  url: string,
): Promise<number> {
  const { data: tokens } = await supabase
    .from('push_tokens')
    .select('token')
    .eq('user_id', userId)

  if (!tokens || tokens.length === 0) return 0

  const results = await Promise.allSettled(
    tokens.map(({ token }: { token: string }) =>
      messaging.send({
        token,
        notification: { title, body },
        data: { url },
        webpush: {
          notification: { icon: '/icon.png', badge: '/icon.png' },
          fcmOptions: { link: url },
        },
      })
    )
  )

  // Clean up invalid tokens
  const invalidTokens: string[] = []
  results.forEach((result, i) => {
    if (result.status === 'rejected') {
      const code = (result.reason as any)?.code
      if (
        code === 'messaging/invalid-registration-token' ||
        code === 'messaging/registration-token-not-registered'
      ) {
        invalidTokens.push(tokens[i].token)
      }
    }
  })
  if (invalidTokens.length > 0) {
    await supabase.from('push_tokens').delete().in('token', invalidTokens)
  }

  return results.filter(r => r.status === 'fulfilled').length
}

export async function POST(req: NextRequest) {
  try {
    const { userId, userIds, targetCity, targetUserType, title, body, url } = await req.json()

    if (!title || !body) {
      return NextResponse.json({ error: 'Missing title or body' }, { status: 400 })
    }

    getAdminApp()
    const messaging = admin.messaging()
    const supabase = getServiceClient()
    const notifUrl = url || '/dashboard'
    let totalSent = 0

    // Single user
    if (userId) {
      totalSent = await sendToUser(supabase, messaging, userId, title, body, notifUrl)
    }

    // Multiple specific users
    if (userIds && Array.isArray(userIds)) {
      const counts = await Promise.all(
        userIds.map((id: string) => sendToUser(supabase, messaging, id, title, body, notifUrl))
      )
      totalSent = counts.reduce((a, b) => a + b, 0)
    }

    // Broadcast to users by city and type (e.g. new shift → all workers in city)
    if (targetCity && targetUserType) {
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id')
        .eq('user_type', targetUserType)

      if (profiles && profiles.length > 0) {
        // Only notify users who have push tokens (avoid unnecessary DB hits)
        const profileIds = profiles.map((p: { id: string }) => p.id)
        const { data: tokenRows } = await supabase
          .from('push_tokens')
          .select('user_id')
          .in('user_id', profileIds)

        if (tokenRows && tokenRows.length > 0) {
          const uniqueIds = [...new Set(tokenRows.map((r: { user_id: string }) => r.user_id))]
          const counts = await Promise.all(
            uniqueIds.map((id: string) => sendToUser(supabase, messaging, id, title, body, notifUrl))
          )
          totalSent = counts.reduce((a, b) => a + b, 0)
        }
      }
    }

    return NextResponse.json({ sent: totalSent })
  } catch (err: any) {
    console.error('Notification send error:', err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
