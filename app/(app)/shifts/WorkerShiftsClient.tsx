'use client'

import { useState, useEffect } from 'react'
import ShiftCard from '@/components/ShiftCard'
import { haversineKm } from '@/lib/haversine'

const MAX_KM = 10

export default function WorkerShiftsClient({ shifts, workerCity }: { shifts: any[]; workerCity: string }) {
  const [gpsStatus, setGpsStatus] = useState<'loading' | 'denied' | 'ready'>('loading')
  const [nearbyShifts, setNearbyShifts] = useState<any[]>([])

  useEffect(() => {
    if (!navigator.geolocation) {
      setGpsStatus('denied')
      return
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude, longitude } = pos.coords
        const gpsFiltered = shifts
          .map(s => ({
            ...s,
            _distKm:
              s.latitude != null && s.longitude != null
                ? haversineKm(latitude, longitude, s.latitude, s.longitude)
                : undefined,
          }))
          .filter(s => s._distKm == null || s._distKm <= MAX_KM)
          .sort((a, b) => {
            if (a._distKm == null) return 1
            if (b._distKm == null) return -1
            return a._distKm - b._distKm
          })

        if (gpsFiltered.length > 0) {
          setNearbyShifts(gpsFiltered)
        } else if (workerCity) {
          // Fall back to city name matching (ILIKE equivalent)
          const cityLower = workerCity.toLowerCase()
          const cityFallback = shifts.filter(s =>
            s.city && s.city.toLowerCase().includes(cityLower)
          )
          setNearbyShifts(cityFallback)
        } else {
          setNearbyShifts([])
        }
        setGpsStatus('ready')
      },
      () => setGpsStatus('denied'),
      { enableHighAccuracy: true, timeout: 10_000, maximumAge: 60_000 }
    )
  }, []) // shifts is stable (rendered from server)

  if (gpsStatus === 'loading') {
    return (
      <div className="flex flex-col gap-3">
        {[1, 2, 3].map(i => (
          <div
            key={i}
            className="h-28 rounded-2xl animate-pulse"
            style={{ background: 'var(--secondary-bg)' }}
          />
        ))}
      </div>
    )
  }

  if (gpsStatus === 'denied') {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <div className="text-5xl mb-4">📍</div>
        <p
          className="text-lg font-semibold"
          style={{ fontFamily: 'var(--font-syne)', color: 'var(--fg)' }}
        >
          Activa tu ubicación para ver turnos cercanos
        </p>
        <p className="text-sm mt-2" style={{ color: 'var(--muted)' }}>
          Necesitamos tu ubicación para mostrarte turnos dentro de {MAX_KM} km
        </p>
      </div>
    )
  }

  if (nearbyShifts.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <div className="text-5xl mb-4">🔍</div>
        <p
          className="text-lg font-semibold"
          style={{ fontFamily: 'var(--font-syne)', color: 'var(--fg)' }}
        >
          Sin turnos cercanos
        </p>
        <p className="text-sm mt-2" style={{ color: 'var(--muted)' }}>
          No hay turnos disponibles en un radio de {MAX_KM} km de tu ubicación
        </p>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-3">
      {nearbyShifts.map((shift: any) => (
        <ShiftCard
          key={shift.id}
          shift={shift}
          showClientRating
          distanceKm={shift._distKm}
        />
      ))}
    </div>
  )
}
