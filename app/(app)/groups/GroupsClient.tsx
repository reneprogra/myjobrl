'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import type { Category } from '@/lib/types'
import Link from 'next/link'

interface Props {
  groups: any[]
  myGroupIds: string[]
  currentUserId: string
  profile: any
  categories: Category[]
}

export default function GroupsClient({ groups, myGroupIds, currentUserId, profile, categories }: Props) {
  const router = useRouter()
  const [showCreate, setShowCreate] = useState(false)
  const [loading, setLoading] = useState(false)
  const [name, setName] = useState('')
  const [categoryId, setCategoryId] = useState('')
  const [city, setCity] = useState(profile?.city || '')

  async function handleJoin(groupId: string) {
    setLoading(true)
    const supabase = createClient()
    await supabase.from('group_members').insert({ group_id: groupId, worker_id: currentUserId })
    await supabase.rpc('increment_member_count', { group_id: groupId })
    setLoading(false)
    router.refresh()
  }

  async function handleLeave(groupId: string) {
    setLoading(true)
    const supabase = createClient()
    await supabase.from('group_members').delete().eq('group_id', groupId).eq('worker_id', currentUserId)
    setLoading(false)
    router.refresh()
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault()
    if (!name || !categoryId || !city) return
    setLoading(true)
    const supabase = createClient()
    const { data, error } = await supabase.from('groups').insert({
      name,
      leader_id: currentUserId,
      category_id: categoryId,
      city,
      member_count: 1,
    }).select().single()

    if (data && !error) {
      await supabase.from('group_members').insert({ group_id: data.id, worker_id: currentUserId })
      setShowCreate(false)
      setName('')
      setCategoryId('')
      router.refresh()
    }
    setLoading(false)
  }

  const inputStyle = {
    background: 'var(--card)',
    border: '1.5px solid #E5E2DB',
    color: 'var(--fg)',
    fontFamily: 'var(--font-dm-sans)',
  }

  return (
    <div className="px-4 py-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold" style={{ fontFamily: 'var(--font-syne)', color: 'var(--fg)' }}>
          Grupos
        </h1>
        {profile?.user_type === 'worker' && (
          <button
            onClick={() => setShowCreate(!showCreate)}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-medium"
            style={{ background: '#1A1A1A', color: '#FFFFFF' }}
          >
            <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
              <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
            </svg>
            Crear
          </button>
        )}
      </div>

      {/* Create form */}
      {showCreate && (
        <form onSubmit={handleCreate} className="p-4 rounded-2xl mb-6 flex flex-col gap-4" style={{ background: 'var(--card)', border: '1px solid var(--border)' }}>
          <h3 className="font-semibold" style={{ fontFamily: 'var(--font-syne)', color: 'var(--fg)' }}>
            Crear grupo
          </h3>
          <input
            type="text"
            value={name}
            onChange={e => setName(e.target.value)}
            placeholder="Nombre del grupo"
            required
            className="w-full px-4 py-3 rounded-xl text-sm outline-none"
            style={inputStyle}
          />
          <div>
            <label className="block text-xs font-medium mb-2" style={{ color: 'var(--muted)' }}>Categoría</label>
            <div className="flex flex-col gap-2">
              {categories.map(cat => (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => setCategoryId(cat.id)}
                  className="flex items-center gap-2 px-3 py-2 rounded-xl text-sm text-left"
                  style={{
                    background: categoryId === cat.id ? '#1A1A1A' : '#F8F6F1',
                    color: categoryId === cat.id ? '#FFFFFF' : '#1A1A1A',
                    border: `1px solid ${categoryId === cat.id ? '#1A1A1A' : '#E5E2DB'}`,
                  }}
                >
                  {cat.emoji} {cat.name}
                </button>
              ))}
            </div>
          </div>
          <input
            type="text"
            value={city}
            onChange={e => setCity(e.target.value)}
            placeholder="Ciudad"
            required
            className="w-full px-4 py-3 rounded-xl text-sm outline-none"
            style={inputStyle}
          />
          <div className="flex gap-3">
            <button type="button" onClick={() => setShowCreate(false)} className="flex-1 py-2.5 rounded-xl text-sm" style={{ background: 'var(--secondary-bg)' }}>
              Cancelar
            </button>
            <button type="submit" disabled={loading} className="flex-1 py-2.5 rounded-xl text-sm font-semibold" style={{ background: '#1A1A1A', color: '#FFFFFF', opacity: loading ? 0.6 : 1 }}>
              {loading ? 'Creando...' : 'Crear'}
            </button>
          </div>
        </form>
      )}

      {/* Groups list */}
      {groups.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="text-5xl mb-4">👥</div>
          <p className="text-lg font-semibold" style={{ fontFamily: 'var(--font-syne)', color: 'var(--fg)' }}>
            Sin grupos aún
          </p>
          <p className="text-sm mt-2" style={{ color: 'var(--muted)' }}>
            Crea un grupo con otros workers y recibe turnos en equipo
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {groups.map((group: any) => {
            const isMember = myGroupIds.includes(group.id)
            const isLeader = group.leader_id === currentUserId
            return (
              <div
                key={group.id}
                className="p-4 rounded-2xl"
                style={{ background: 'var(--card)', border: '1px solid var(--border)' }}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xl">{group.categories?.emoji}</span>
                      <h3 className="font-semibold text-base" style={{ fontFamily: 'var(--font-syne)', color: 'var(--fg)' }}>
                        {group.name}
                      </h3>
                      {isLeader && (
                        <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: 'var(--secondary-bg)', color: 'var(--muted)' }}>
                          Líder
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-3 text-sm" style={{ color: 'var(--muted)' }}>
                      <span>📍 {group.city}</span>
                      <span>👥 {group.member_count} miembros</span>
                    </div>
                    <div className="text-xs mt-1" style={{ color: 'var(--muted)' }}>
                      {group.categories?.name}
                    </div>
                    {group.profiles && (
                      <div className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>
                        Líder: {group.profiles.full_name}
                      </div>
                    )}
                  </div>

                  {profile?.user_type === 'worker' && !isLeader && (
                    <button
                      onClick={() => isMember ? handleLeave(group.id) : handleJoin(group.id)}
                      disabled={loading}
                      className="px-4 py-2 rounded-xl text-xs font-semibold flex-shrink-0"
                      style={{
                        background: isMember ? '#F0EDE6' : '#1A1A1A',
                        color: isMember ? '#1A1A1A' : '#FFFFFF',
                      }}
                    >
                      {isMember ? 'Salir' : 'Unirse'}
                    </button>
                  )}
                </div>

                {isMember && (
                  <div className="mt-2 pt-2" style={{ borderTop: '1px solid #F0EDE6' }}>
                    <span className="text-xs" style={{ color: '#166534' }}>✓ Eres miembro</span>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
