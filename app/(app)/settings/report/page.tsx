'use client'

import { useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'

export default function ReportPage() {
  const [subject, setSubject] = useState('')
  const [description, setDescription] = useState('')
  const [sending, setSending] = useState(false)
  const [sent, setSent] = useState(false)
  const [error, setError] = useState('')

  const inputStyle = {
    background: '#FFFFFF',
    border: '1.5px solid #E5E2DB',
    color: '#1A1A1A',
    fontFamily: 'var(--font-dm-sans)',
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!subject.trim() || !description.trim()) return
    setSending(true)
    setError('')

    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      setError('Debes iniciar sesión para enviar un reporte.')
      setSending(false)
      return
    }

    const { error: dbError } = await supabase.from('reports').insert({
      user_id: user.id,
      subject: subject.trim(),
      description: description.trim(),
    })

    setSending(false)
    if (dbError) {
      setError('Error al enviar. Por favor intenta de nuevo.')
    } else {
      setSent(true)
    }
  }

  return (
    <div className="px-4 py-6" style={{ background: '#F8F6F1', minHeight: '100vh' }}>
      <div className="flex items-center gap-3 mb-6">
        <Link
          href="/settings"
          className="p-2 rounded-xl"
          style={{ background: '#FFFFFF', border: '1px solid #E5E2DB' }}
        >
          <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <polyline points="15 18 9 12 15 6"/>
          </svg>
        </Link>
        <h1 className="text-xl font-bold" style={{ fontFamily: 'var(--font-syne)', color: '#1A1A1A' }}>
          Reportar problema
        </h1>
      </div>

      {sent ? (
        <div className="flex flex-col items-center justify-center py-16 text-center px-4 rounded-2xl" style={{ background: '#FFFFFF', border: '1px solid #E5E2DB' }}>
          <div className="text-5xl mb-4">✅</div>
          <h2 className="text-xl font-bold mb-2" style={{ fontFamily: 'var(--font-syne)', color: '#1A1A1A' }}>
            Reporte enviado
          </h2>
          <p className="text-sm" style={{ color: '#6B6860' }}>
            Gracias por tu reporte. Nuestro equipo lo revisará a la brevedad.
          </p>
          <Link
            href="/settings"
            className="mt-6 px-6 py-2.5 rounded-xl text-sm font-semibold"
            style={{ background: '#1A1A1A', color: '#FFFFFF' }}
          >
            Volver a ajustes
          </Link>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="p-4 rounded-2xl flex flex-col gap-4" style={{ background: '#FFFFFF', border: '1px solid #E5E2DB' }}>
            <div>
              <label className="block text-xs font-medium mb-1.5" style={{ color: '#6B6860' }}>
                Asunto
              </label>
              <input
                type="text"
                value={subject}
                onChange={e => setSubject(e.target.value)}
                placeholder="Describe brevemente el problema"
                required
                className="w-full px-4 py-3 rounded-xl text-sm outline-none"
                style={inputStyle}
              />
            </div>
            <div>
              <label className="block text-xs font-medium mb-1.5" style={{ color: '#6B6860' }}>
                Descripción
              </label>
              <textarea
                value={description}
                onChange={e => setDescription(e.target.value)}
                placeholder="Cuéntanos con detalle qué ocurrió, cuándo y qué esperabas que sucediera..."
                required
                rows={5}
                className="w-full px-4 py-3 rounded-xl text-sm outline-none resize-none"
                style={inputStyle}
              />
            </div>
          </div>

          {error && (
            <div className="px-4 py-3 rounded-xl text-sm" style={{ background: '#FEE2E2', color: '#DC2626' }}>
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={sending || !subject.trim() || !description.trim()}
            className="w-full py-3.5 rounded-xl text-sm font-semibold"
            style={{
              background: '#1A1A1A',
              color: '#FFFFFF',
              opacity: (sending || !subject.trim() || !description.trim()) ? 0.5 : 1,
            }}
          >
            {sending ? 'Enviando...' : 'Enviar reporte'}
          </button>
        </form>
      )}
    </div>
  )
}
