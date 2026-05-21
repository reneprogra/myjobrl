'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { createClient } from '@/lib/supabase/client'

export default function ResetPasswordPage() {
  const router = useRouter()
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const [ready, setReady] = useState(false)

  // Supabase sends the user here with a token in the URL hash.
  // onAuthStateChange fires with event SIGNED_IN or PASSWORD_RECOVERY
  // once the client exchanges the token automatically.
  useEffect(() => {
    const supabase = createClient()
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'PASSWORD_RECOVERY' || event === 'SIGNED_IN') {
        setReady(true)
      }
    })
    return () => subscription.unsubscribe()
  }, [])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')

    if (password.length < 6) {
      setError('La contraseña debe tener al menos 6 caracteres.')
      return
    }
    if (password !== confirm) {
      setError('Las contraseñas no coinciden.')
      return
    }

    setLoading(true)
    const supabase = createClient()
    const { error } = await supabase.auth.updateUser({ password })

    if (error) {
      setError(error.message || 'No se pudo actualizar la contraseña.')
      setLoading(false)
    } else {
      setSuccess(true)
      setTimeout(() => router.push('/dashboard'), 2500)
    }
  }

  const inputStyle = {
    background: '#FFFFFF',
    border: '1.5px solid #E5E2DB',
    color: '#1A1A1A',
    fontFamily: 'var(--font-dm-sans)',
  }

  return (
    <div className="min-h-screen flex flex-col" style={{ background: '#F8F6F1' }}>
      {/* Header */}
      <div className="px-6 pt-16 pb-10 text-center">
        <Image
          src="/logo.png"
          alt="MyJob"
          height={40}
          width={120}
          style={{ height: '40px', width: 'auto', margin: '0 auto' }}
        />
      </div>

      <div className="flex-1 px-6 max-w-sm mx-auto w-full">
        <h2
          className="text-2xl font-semibold mb-2"
          style={{ fontFamily: 'var(--font-syne)', color: '#1A1A1A' }}
        >
          Nueva contraseña
        </h2>

        {success ? (
          <div
            className="flex flex-col items-center text-center gap-4 p-6 rounded-2xl mt-6"
            style={{ background: '#F0FDF4', border: '1px solid #BBF7D0' }}
          >
            <div className="text-4xl">✅</div>
            <p className="text-base font-semibold" style={{ color: '#15803D' }}>
              ¡Contraseña actualizada!
            </p>
            <p className="text-sm" style={{ color: '#16A34A' }}>
              Redirigiendo a tu cuenta…
            </p>
          </div>
        ) : !ready ? (
          <div className="mt-6 flex flex-col gap-4">
            <div className="h-12 rounded-xl animate-pulse" style={{ background: '#E5E2DB' }} />
            <div className="h-12 rounded-xl animate-pulse" style={{ background: '#E5E2DB' }} />
            <p className="text-xs text-center mt-2" style={{ color: '#6B6860' }}>
              Verificando enlace…
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="flex flex-col gap-4 mt-6">
            <p className="text-sm" style={{ color: '#6B6860' }}>
              Elige una contraseña nueva para tu cuenta.
            </p>

            <div>
              <label className="block text-sm font-medium mb-1.5" style={{ color: '#1A1A1A' }}>
                Nueva contraseña
              </label>
              <input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
                minLength={6}
                autoComplete="new-password"
                placeholder="Mínimo 6 caracteres"
                className="w-full px-4 py-3 rounded-xl text-sm outline-none"
                style={inputStyle}
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1.5" style={{ color: '#1A1A1A' }}>
                Confirmar contraseña
              </label>
              <input
                type="password"
                value={confirm}
                onChange={e => setConfirm(e.target.value)}
                required
                autoComplete="new-password"
                placeholder="Repite la contraseña"
                className="w-full px-4 py-3 rounded-xl text-sm outline-none"
                style={inputStyle}
              />
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
              style={{ background: '#1A1A1A', color: '#FFFFFF', opacity: loading ? 0.6 : 1 }}
            >
              {loading ? 'Guardando...' : 'Guardar nueva contraseña'}
            </button>
          </form>
        )}
      </div>
    </div>
  )
}
