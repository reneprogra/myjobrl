'use client'

import { useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'

export function useNotifications() {
  useEffect(() => {
    if (typeof window === 'undefined') return
    if (!('Notification' in window)) return
    if (!('serviceWorker' in navigator)) return

    async function register() {
      try {
        const permission = await Notification.requestPermission()
        if (permission !== 'granted') return

        const registration = await navigator.serviceWorker.register(
          '/firebase-messaging-sw.js',
          { scope: '/' }
        )
        await navigator.serviceWorker.ready

        const { getFirebaseMessaging } = await import('@/lib/firebase-client')
        const { getToken, onMessage } = await import('firebase/messaging')

        const messaging = getFirebaseMessaging()
        if (!messaging) return

        const token = await getToken(messaging, {
          vapidKey: process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY,
          serviceWorkerRegistration: registration,
        })

        if (!token) return

        const supabase = createClient()
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return

        await supabase.from('push_tokens').upsert(
          {
            user_id: user.id,
            token,
            device_type: 'web',
            updated_at: new Date().toISOString(),
          },
          { onConflict: 'user_id,token' }
        )

        onMessage(messaging, (payload) => {
          const { title, body } = payload.notification || {}
          if (title && Notification.permission === 'granted') {
            new Notification(title, {
              body: body || '',
              icon: '/icon.png',
            })
          }
        })
      } catch (err) {
        // Notification setup failed silently — app continues to work without push
        console.error('Push notification setup failed:', err)
      }
    }

    register()
  }, [])
}
