'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import type { Category } from '@/lib/types'

export default function NewShiftPage() {
  const router = useRouter()
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const [form, setForm] = useState({
    category_id: '',
    title: '',
    description: '',
    location_address: '',
    city: '',
    state: '',
    pay_amount: '',
    shift_date: '',
    shift_start: '',
    shift_end: '',
    slots: '1',
  })
  const [coords, setCoords] = useState<{ lat: number; lon: number } | null>(null)
  const [geoStatus, setGeoStatus] = useState<'idle' | 'loading' | 'ok' | 'error'>('idle')

  useEffect(() => {
    async function load() {
      const supabase = createClient()
      const { data } = await supabase.from('categories').select('*').order('name')
      if (data) setCategories(data)
    }
    load()
  }, [])

  function set(field: string, value: string) {
    setForm(prev => ({ ...prev, [field]: value }))
  }

  function useGPS() {
    if (!navigator.geolocation) {
      setGeoStatus('error')
      return
    }
    setGeoStatus('loading')
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude, longitude } = pos.coords
        setCoords({ lat: latitude, lon: longitude })
        // Reverse-geocode with Nominatim to fill address fields
        try {
          const res = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&addressdetails=1`,
            { headers: { 'Accept-Language': 'es' } }
          )
          const data = await res.json()
          const addr = data.address || {}
          const road = addr.road || addr.pedestrian || ''
          const number = addr.house_number || ''
          const suburb = addr.suburb || addr.neighbourhood || ''
          const city =
            addr.city || addr.town || addr.village || addr.municipality || ''
          const state = addr.state || ''
          if (road) set('location_address', [road, number, suburb].filter(Boolean).join(', '))
          if (city) set('city', city)
          if (state) set('state', state)
        } catch {
          // geocoding failed silently — user can fill address manually
        }
        setGeoStatus('ok')
      },
      () => setGeoStatus('error'),
      { enableHighAccuracy: true, timeout: 15_000 }
    )
  }

  async function geocodeAddress() {
    const q = [form.location_address, form.city, form.state].filter(Boolean).join(', ')
    if (!q) return
    setGeoStatus('loading')
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(q)}&limit=1&countrycodes=mx`,
        { headers: { 'Accept-Language': 'es' } }
      )
      const data = await res.json()
      if (data[0]) {
        setCoords({ lat: parseFloat(data[0].lat), lon: parseFloat(data[0].lon) })
        setGeoStatus('ok')
      } else {
        setGeoStatus('error')
      }
    } catch {
      setGeoStatus('error')
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')

    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { router.push('/login'); return }

    const { data, error } = await supabase.from('shifts').insert({
      client_id: user.id,
      category_id: form.category_id,
      title: form.title,
      description: form.description || null,
      location_address: form.location_address,
      city: form.city,
      state: form.state || null,
      pay_amount: parseFloat(form.pay_amount),
      pay_currency: 'MXN',
      shift_date: form.shift_date,
      shift_start: form.shift_start,
      shift_end: form.shift_end,
      slots: parseInt(form.slots),
      status: 'open',
      latitude: coords?.lat ?? null,
      longitude: coords?.lon ?? null,
    }).select().single()

    if (error) {
      setError(error.message)
      setLoading(false)
    } else {
      router.push(`/shifts/${data.id}`)
    }
  }

  const inputStyle = {
    background: '#FFFFFF',
    border: '1.5px solid #E5E2DB',
    color: '#1A1A1A',
    fontFamily: 'var(--font-dm-sans)',
  }

  return (
    <div className="px-4 py-6">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <button onClick={() => router.back()} className="p-2 rounded-xl" style={{ background: '#FFFFFF', border: '1px solid #E5E2DB' }}>
          <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <polyline points="15 18 9 12 15 6"/>
          </svg>
        </button>
        <h1 className="text-xl font-bold" style={{ fontFamily: 'var(--font-syne)', color: '#1A1A1A' }}>
          Publicar turno
        </h1>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-5">
        {/* Category */}
        <div>
          <label className="block text-sm font-medium mb-1.5" style={{ color: '#1A1A1A' }}>
            Categoría *
          </label>
          <div className="grid grid-cols-1 gap-2">
            {categories.map(cat => (
              <button
                key={cat.id}
                type="button"
                onClick={() => set('category_id', cat.id)}
                className="flex items-center gap-3 px-4 py-3 rounded-xl text-left"
                style={{
                  background: form.category_id === cat.id ? '#1A1A1A' : '#FFFFFF',
                  border: `1.5px solid ${form.category_id === cat.id ? '#1A1A1A' : '#E5E2DB'}`,
                  color: form.category_id === cat.id ? '#FFFFFF' : '#1A1A1A',
                }}
              >
                <span className="text-xl">{cat.emoji}</span>
                <span className="text-sm font-medium">{cat.name}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Title */}
        <div>
          <label className="block text-sm font-medium mb-1.5" style={{ color: '#1A1A1A' }}>
            Título del turno *
          </label>
          <input
            type="text"
            value={form.title}
            onChange={e => set('title', e.target.value)}
            required
            placeholder="ej. Mesero para evento de bodas"
            className="w-full px-4 py-3 rounded-xl text-sm outline-none"
            style={inputStyle}
          />
        </div>

        {/* Description */}
        <div>
          <label className="block text-sm font-medium mb-1.5" style={{ color: '#1A1A1A' }}>
            Descripción
          </label>
          <textarea
            value={form.description}
            onChange={e => set('description', e.target.value)}
            rows={3}
            placeholder="Describe el trabajo, requisitos, uniforme, etc."
            className="w-full px-4 py-3 rounded-xl text-sm outline-none resize-none"
            style={inputStyle}
          />
        </div>

        {/* Address + geolocation */}
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className="block text-sm font-medium" style={{ color: '#1A1A1A' }}>
              Dirección *
            </label>
            <button
              type="button"
              onClick={useGPS}
              disabled={geoStatus === 'loading'}
              className="text-xs font-medium px-2.5 py-1 rounded-lg"
              style={{ background: '#F0EDE6', color: '#1A1A1A', opacity: geoStatus === 'loading' ? 0.6 : 1 }}
            >
              {geoStatus === 'loading' ? 'Detectando...' : '📍 Usar mi ubicación GPS'}
            </button>
          </div>
          <input
            type="text"
            value={form.location_address}
            onChange={e => set('location_address', e.target.value)}
            required
            placeholder="Calle, número, colonia"
            className="w-full px-4 py-3 rounded-xl text-sm outline-none"
            style={inputStyle}
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-sm font-medium mb-1.5" style={{ color: '#1A1A1A' }}>Ciudad *</label>
            <input
              type="text"
              value={form.city}
              onChange={e => set('city', e.target.value)}
              required
              placeholder="CDMX"
              className="w-full px-4 py-3 rounded-xl text-sm outline-none"
              style={inputStyle}
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1.5" style={{ color: '#1A1A1A' }}>Estado</label>
            <input
              type="text"
              value={form.state}
              onChange={e => set('state', e.target.value)}
              placeholder="CDMX"
              className="w-full px-4 py-3 rounded-xl text-sm outline-none"
              style={inputStyle}
            />
          </div>
        </div>

        {/* Geocoding status + manual geocode button */}
        <div className="flex items-center gap-3">
          {geoStatus === 'ok' && coords && (
            <span className="text-xs px-2.5 py-1 rounded-lg" style={{ background: '#DCFCE7', color: '#166534' }}>
              ✓ Coordenadas guardadas ({coords.lat.toFixed(4)}, {coords.lon.toFixed(4)})
            </span>
          )}
          {geoStatus === 'error' && (
            <span className="text-xs px-2.5 py-1 rounded-lg" style={{ background: '#FEE2E2', color: '#991B1B' }}>
              No se pudo obtener la ubicación
            </span>
          )}
          {geoStatus !== 'ok' && (
            <button
              type="button"
              onClick={geocodeAddress}
              disabled={geoStatus === 'loading' || !form.city}
              className="text-xs font-medium px-2.5 py-1 rounded-lg"
              style={{ background: '#F0EDE6', color: '#1A1A1A', opacity: (geoStatus === 'loading' || !form.city) ? 0.5 : 1 }}
            >
              🔍 Geocodificar dirección
            </button>
          )}
        </div>

        {/* Date & Time */}
        <div>
          <label className="block text-sm font-medium mb-1.5" style={{ color: '#1A1A1A' }}>
            Fecha *
          </label>
          <input
            type="date"
            value={form.shift_date}
            onChange={e => set('shift_date', e.target.value)}
            required
            className="w-full px-4 py-3 rounded-xl text-sm outline-none"
            style={inputStyle}
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-sm font-medium mb-1.5" style={{ color: '#1A1A1A' }}>Hora inicio *</label>
            <input
              type="time"
              value={form.shift_start}
              onChange={e => set('shift_start', e.target.value)}
              required
              className="w-full px-4 py-3 rounded-xl text-sm outline-none"
              style={inputStyle}
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1.5" style={{ color: '#1A1A1A' }}>Hora fin *</label>
            <input
              type="time"
              value={form.shift_end}
              onChange={e => set('shift_end', e.target.value)}
              required
              className="w-full px-4 py-3 rounded-xl text-sm outline-none"
              style={inputStyle}
            />
          </div>
        </div>

        {/* Pay & Slots */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-sm font-medium mb-1.5" style={{ color: '#1A1A1A' }}>Pago (MXN) *</label>
            <input
              type="number"
              value={form.pay_amount}
              onChange={e => set('pay_amount', e.target.value)}
              required
              min="1"
              placeholder="500"
              className="w-full px-4 py-3 rounded-xl text-sm outline-none"
              style={inputStyle}
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1.5" style={{ color: '#1A1A1A' }}>Cupos *</label>
            <input
              type="number"
              value={form.slots}
              onChange={e => set('slots', e.target.value)}
              required
              min="1"
              max="50"
              placeholder="1"
              className="w-full px-4 py-3 rounded-xl text-sm outline-none"
              style={inputStyle}
            />
          </div>
        </div>

        {error && (
          <div className="text-sm px-4 py-3 rounded-xl" style={{ background: '#FEE2E2', color: '#991B1B' }}>
            {error}
          </div>
        )}

        <button
          type="submit"
          disabled={loading}
          className="w-full py-3.5 rounded-xl text-sm font-semibold mt-2"
          style={{
            background: '#1A1A1A',
            color: '#FFFFFF',
            opacity: loading ? 0.6 : 1,
            fontFamily: 'var(--font-dm-sans)',
          }}
        >
          {loading ? 'Publicando...' : 'Publicar turno'}
        </button>
      </form>
    </div>
  )
}
