'use client'

import { useState, useEffect, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'

export default function WorkerAvailabilityToggle({ workerId }: { workerId: string }) {
  const [available, setAvailable] = useState(false)
  const [initialised, setInitialised] = useState(false)
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const watchRef = useRef<number | null>(null)

  useEffect(() => {
    const supabase = createClient()
    supabase
      .from('worker_locations')
      .select('is_available')
      .eq('worker_id', workerId)
      .single()
      .then(({ data }) => {
        setAvailable(data?.is_available ?? false)
        setInitialised(true)
      })

    return () => {
      if (watchRef.current !== null) navigator.geolocation.clearWatch(watchRef.current)
    }
  }, [workerId])

  async function upsertLocation(lat: number, lon: number, isAvailable: boolean) {
    const supabase = createClient()
    await supabase.from('worker_locations').upsert(
      { worker_id: workerId, latitude: lat, longitude: lon, is_available: isAvailable, updated_at: new Date().toISOString() },
      { onConflict: 'worker_id' }
    )
  }

  async function disable() {
    if (watchRef.current !== null) {
      navigator.geolocation.clearWatch(watchRef.current)
      watchRef.current = null
    }
    const supabase = createClient()
    await supabase
      .from('worker_locations')
      .update({ is_available: false, updated_at: new Date().toISOString() })
      .eq('worker_id', workerId)
    setAvailable(false)
  }

  function enable() {
    if (!navigator.geolocation) {
      setError('Tu dispositivo no soporta geolocalización')
      return
    }
    setError('')
    setBusy(true)

    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        await upsertLocation(pos.coords.latitude, pos.coords.longitude, true)

        watchRef.current = navigator.geolocation.watchPosition(
          (p) => upsertLocation(p.coords.latitude, p.coords.longitude, true),
          () => { /* silent — will retry on next update */ },
          { enableHighAccuracy: true, maximumAge: 30_000, timeout: 15_000 }
        )
        setAvailable(true)
        setBusy(false)
      },
      () => {
        setError('No se pudo obtener tu ubicación. Verifica los permisos de la app.')
        setBusy(false)
      },
      { enableHighAccuracy: true, timeout: 15_000 }
    )
  }

  async function toggle() {
    if (available) {
      await disable()
    } else {
      enable()
    }
  }

  if (!initialised) return null

  return (
    <div className="mb-6 p-4 rounded-2xl" style={{ background: '#FFFFFF', border: '1px solid #E5E2DB' }}>
      <div className="flex items-center justify-between gap-3">
        <div>
          <div className="font-semibold text-sm" style={{ fontFamily: 'var(--font-syne)', color: '#1A1A1A' }}>
            Estoy disponible
          </div>
          <div className="text-xs mt-0.5" style={{ color: '#6B6860' }}>
            {available
              ? '📡 Compartiendo tu ubicación en tiempo real'
              : 'Activa para recibir solicitudes cercanas a ti'}
          </div>
        </div>

        {/* Toggle switch */}
        <button
          onClick={toggle}
          disabled={busy}
          aria-pressed={available}
          className="relative flex-shrink-0 w-12 h-6 rounded-full transition-colors duration-200 focus:outline-none"
          style={{ background: available ? '#166534' : '#D1D5DB', opacity: busy ? 0.6 : 1 }}
        >
          <span
            className="absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-all duration-200"
            style={{ left: available ? '26px' : '2px' }}
          />
        </button>
      </div>

      {error && (
        <p className="text-xs mt-2" style={{ color: '#991B1B' }}>{error}</p>
      )}
    </div>
  )
}
