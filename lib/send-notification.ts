import { createClient } from '@supabase/supabase-js'
import { getAdminApp, admin } from '@/lib/firebase-admin'

function getServiceClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  )
}

export async function sendNotification(
  userId: string,
  title: string,
  body: string,
  url = '/dashboard',
): Promise<void> {
  try {
    const supabase = getServiceClient()
    const { data: tokens } = await supabase
      .from('push_tokens')
      .select('token')
      .eq('user_id', userId)

    if (!tokens || tokens.length === 0) return

    getAdminApp()
    const messaging = admin.messaging()

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
  } catch {
    // Notification failures are non-fatal
  }
}
