'use client'

import { useState, useEffect } from 'react'
import ShiftCard from '@/components/ShiftCard'
import { haversineKm } from '@/lib/haversine'

const MAX_KM = 50

function filterByCity(shifts: any[], workerCity: string): any[] {
  if (!workerCity) return shifts
  const cityLower = workerCity.toLowerCase()
  const filtered = shifts.filter(s => s.city?.toLowerCase().includes(cityLower))
  // If city filter finds nothing, return all shifts so list is never empty
  return filtered.length > 0 ? filtered : shifts
}

export default function WorkerShiftsClient({ shifts, workerCity }: { shifts: any[]; workerCity: string }) {
  const [gpsStatus, setGpsStatus] = useState<'loading' | 'denied' | 'ready'>('loading')
  const [nearbyShifts, setNearbyShifts] = useState<any[]>([])

  useEffect(() => {
    if (!navigator.geolocation) {
      setNearbyShifts(filterByCity(shifts, workerCity))
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

        // If GPS filter returns results use them; otherwise fall back to city
        const result = gpsFiltered.length > 0 ? gpsFiltered : filterByCity(shifts, workerCity)
        setNearbyShifts(result)
        setGpsStatus('ready')
      },
      () => {
        // GPS denied — fall back to city matching
        setNearbyShifts(filterByCity(shifts, workerCity))
        setGpsStatus('denied')
      },
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

  if (nearbyShifts.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <div className="text-5xl mb-4">🔍</div>
        <p
          className="text-lg font-semibold"
          style={{ fontFamily: 'var(--font-syne)', color: 'var(--fg)' }}
        >
          Sin turnos disponibles
        </p>
        <p className="text-sm mt-2" style={{ color: 'var(--muted)' }}>
          No hay turnos publicados en tu zona por ahora
        </p>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-3">
      {gpsStatus === 'denied' && workerCity && (
        <p className="text-xs mb-1" style={{ color: 'var(--muted)' }}>
          📍 Mostrando turnos en {workerCity}
        </p>
      )}
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
