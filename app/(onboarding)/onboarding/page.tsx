'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import type { Category } from '@/lib/types'

export default function OnboardingPage() {
  const router = useRouter()
  const [categories, setCategories] = useState<Category[]>([])
  const [selectedCategories, setSelectedCategories] = useState<string[]>([])
  const [city, setCity] = useState('')
  const [state, setState] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    async function loadCategories() {
      const supabase = createClient()
      const { data } = await supabase.from('categories').select('*').order('name')
      if (data) setCategories(data)
    }
    loadCategories()
  }, [])

  function toggleCategory(id: string) {
    setSelectedCategories(prev => {
      if (prev.includes(id)) return prev.filter(c => c !== id)
      if (prev.length >= 3) return prev
      return [...prev, id]
    })
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (selectedCategories.length === 0) {
      setError('Selecciona al menos una categoría')
      return
    }
    if (!city.trim()) {
      setError('Ingresa tu ciudad')
      return
    }
    setLoading(true)
    setError('')

    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { router.push('/login'); return }

    // Update profile city
    await supabase.from('profiles').update({ city, state }).eq('id', user.id)

    // Insert worker categories
    const inserts = selectedCategories.map(cid => ({
      worker_id: user.id,
      category_id: cid,
    }))
    await supabase.from('worker_categories').insert(inserts)

    router.push('/dashboard')
    router.refresh()
  }

  return (
    <div className="min-h-screen flex flex-col" style={{ background: '#F8F6F1' }}>
      <div className="px-6 pt-16 pb-8">
        <h1 className="text-3xl font-bold" style={{ fontFamily: 'var(--font-syne)', color: '#1A1A1A' }}>
          Configura tu perfil
        </h1>
        <p className="mt-2 text-sm" style={{ color: '#6B6860' }}>
          Selecciona hasta 3 servicios que ofreces y tu ciudad.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="flex-1 px-6 max-w-sm mx-auto w-full flex flex-col gap-6">
        <div>
          <h3 className="text-base font-semibold mb-3" style={{ fontFamily: 'var(--font-syne)', color: '#1A1A1A' }}>
            Tus servicios ({selectedCategories.length}/3)
          </h3>
          <div className="flex flex-col gap-3">
            {categories.map(cat => {
              const selected = selectedCategories.includes(cat.id)
              return (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => toggleCategory(cat.id)}
                  className="flex items-center gap-3 p-4 rounded-2xl text-left transition-all"
                  style={{
                    background: selected ? '#1A1A1A' : '#FFFFFF',
                    border: `1.5px solid ${selected ? '#1A1A1A' : '#E5E2DB'}`,
                    color: selected ? '#FFFFFF' : '#1A1A1A',
                  }}
                >
                  <span className="text-2xl">{cat.emoji}</span>
                  <div>
                    <div className="font-medium text-sm">{cat.name}</div>
                    {cat.description && (
                      <div className="text-xs mt-0.5 opacity-60">{cat.description}</div>
                    )}
                  </div>
                  {selected && (
                    <span className="ml-auto">
                      <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                        <polyline points="20 6 9 17 4 12"/>
                      </svg>
                    </span>
                  )}
                </button>
              )
            })}
          </div>
        </div>

        <div>
          <h3 className="text-base font-semibold mb-3" style={{ fontFamily: 'var(--font-syne)', color: '#1A1A1A' }}>
            Tu ubicación
          </h3>
          <div className="flex flex-col gap-3">
            <input
              type="text"
              value={city}
              onChange={e => setCity(e.target.value)}
              placeholder="Ciudad (ej. Ciudad de México)"
              className="w-full px-4 py-3 rounded-xl text-sm outline-none"
              style={{ background: '#FFFFFF', border: '1.5px solid #E5E2DB', color: '#1A1A1A', fontFamily: 'var(--font-dm-sans)' }}
            />
            <input
              type="text"
              value={state}
              onChange={e => setState(e.target.value)}
              placeholder="Estado (ej. CDMX)"
              className="w-full px-4 py-3 rounded-xl text-sm outline-none"
              style={{ background: '#FFFFFF', border: '1.5px solid #E5E2DB', color: '#1A1A1A', fontFamily: 'var(--font-dm-sans)' }}
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
          className="w-full py-3.5 rounded-xl text-sm font-semibold transition-opacity mb-8"
          style={{
            background: '#1A1A1A',
            color: '#FFFFFF',
            opacity: loading ? 0.6 : 1,
            fontFamily: 'var(--font-dm-sans)',
          }}
        >
          {loading ? 'Guardando...' : 'Empezar a trabajar →'}
        </button>
      </form>
    </div>
  )
}
