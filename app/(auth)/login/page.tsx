'use client'

import { useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  // Forgot password state
  const [showForgot, setShowForgot] = useState(false)
  const [forgotEmail, setForgotEmail] = useState('')
  const [forgotLoading, setForgotLoading] = useState(false)
  const [forgotSent, setForgotSent] = useState(false)
  const [forgotError, setForgotError] = useState('')

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')

    const supabase = createClient()
    const { error } = await supabase.auth.signInWithPassword({ email, password })

    if (error) {
      setError('Correo o contraseña incorrectos')
      setLoading(false)
    } else {
      router.push('/dashboard')
      router.refresh()
    }
  }

  async function handleForgotPassword(e: React.FormEvent) {
    e.preventDefault()
    setForgotLoading(true)
    setForgotError('')

    const supabase = createClient()
    const { error } = await supabase.auth.resetPasswordForEmail(forgotEmail, {
      redirectTo: `${window.location.origin}/auth/reset-password`,
    })

    setForgotLoading(false)
    if (error) {
      setForgotError('No se pudo enviar el correo. Verifica el email e intenta de nuevo.')
    } else {
      setForgotSent(true)
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
        <p className="mt-2 text-sm" style={{ color: '#6B6860' }}>
          El trabajo te debe buscar a ti
        </p>
      </div>

      <div className="flex-1 px-6 max-w-sm mx-auto w-full">

        {/* ── Forgot password panel ── */}
        {showForgot ? (
          <>
            <div className="flex items-center gap-3 mb-6">
              <button
                onClick={() => { setShowForgot(false); setForgotSent(false); setForgotError('') }}
                className="p-2 rounded-xl"
                style={{ background: '#FFFFFF', border: '1.5px solid #E5E2DB' }}
              >
                <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <polyline points="15 18 9 12 15 6"/>
                </svg>
              </button>
              <h2
                className="text-2xl font-semibold"
                style={{ fontFamily: 'var(--font-syne)', color: '#1A1A1A' }}
              >
                Recuperar contraseña
              </h2>
            </div>

            {forgotSent ? (
              <div
                className="flex flex-col items-center text-center gap-4 p-6 rounded-2xl"
                style={{ background: '#F0FDF4', border: '1px solid #BBF7D0' }}
              >
                <div className="text-4xl">📬</div>
                <p className="text-base font-semibold" style={{ color: '#15803D' }}>
                  ¡Correo enviado!
                </p>
                <p className="text-sm leading-relaxed" style={{ color: '#16A34A' }}>
                  Te enviamos un correo para recuperar tu contraseña. Revisa tu bandeja de entrada (y spam).
                </p>
                <button
                  onClick={() => { setShowForgot(false); setForgotSent(false) }}
                  className="mt-2 text-sm font-semibold underline"
                  style={{ color: '#15803D' }}
                >
                  Volver al inicio de sesión
                </button>
              </div>
            ) : (
              <form onSubmit={handleForgotPassword} className="flex flex-col gap-4">
                <p className="text-sm" style={{ color: '#6B6860' }}>
                  Ingresa tu correo y te mandaremos un enlace para crear una nueva contraseña.
                </p>
                <div>
                  <label className="block text-sm font-medium mb-1.5" style={{ color: '#1A1A1A' }}>
                    Correo electrónico
                  </label>
                  <input
                    type="email"
                    value={forgotEmail}
                    onChange={e => setForgotEmail(e.target.value)}
                    required
                    autoComplete="email"
                    placeholder="tu@correo.com"
                    className="w-full px-4 py-3 rounded-xl text-sm outline-none"
                    style={inputStyle}
                  />
                </div>

                {forgotError && (
                  <div className="text-sm px-4 py-3 rounded-xl" style={{ background: '#FEE2E2', color: '#991B1B' }}>
                    {forgotError}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={forgotLoading}
                  className="w-full py-3.5 rounded-xl text-sm font-semibold mt-2"
                  style={{ background: '#1A1A1A', color: '#FFFFFF', opacity: forgotLoading ? 0.6 : 1 }}
                >
                  {forgotLoading ? 'Enviando...' : 'Enviar correo de recuperación'}
                </button>
              </form>
            )}
          </>
        ) : (

        /* ── Login form ── */
        <>
          <h2
            className="text-2xl font-semibold mb-6"
            style={{ fontFamily: 'var(--font-syne)', color: '#1A1A1A' }}
          >
            Iniciar sesión
          </h2>

          <form onSubmit={handleLogin} className="flex flex-col gap-4">
            <div>
              <label className="block text-sm font-medium mb-1.5" style={{ color: '#1A1A1A' }}>
                Correo electrónico
              </label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
                autoComplete="email"
                className="w-full px-4 py-3 rounded-xl text-sm outline-none transition-all"
                style={inputStyle}
                placeholder="tu@correo.com"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-sm font-medium" style={{ color: '#1A1A1A' }}>
                  Contraseña
                </label>
                <button
                  type="button"
                  onClick={() => { setShowForgot(true); setForgotEmail(email) }}
                  className="text-xs font-medium"
                  style={{ color: '#6B6860' }}
                >
                  ¿Olvidé mi contraseña?
                </button>
              </div>
              <input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
                autoComplete="current-password"
                className="w-full px-4 py-3 rounded-xl text-sm outline-none transition-all"
                style={inputStyle}
                placeholder="••••••••"
              />
            </div>

            {error && (
              <div
                className="text-sm px-4 py-3 rounded-xl"
                style={{ background: '#FEE2E2', color: '#991B1B' }}
              >
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 rounded-xl text-sm font-semibold transition-opacity mt-2"
              style={{
                background: '#1A1A1A',
                color: '#FFFFFF',
                opacity: loading ? 0.6 : 1,
                fontFamily: 'var(--font-dm-sans)',
              }}
            >
              {loading ? 'Entrando...' : 'Entrar'}
            </button>
          </form>

          <p className="mt-6 text-center text-sm" style={{ color: '#6B6860' }}>
            ¿No tienes cuenta?{' '}
            <Link href="/signup" className="font-semibold underline" style={{ color: '#1A1A1A' }}>
              Regístrate
            </Link>
          </p>
        </>
        )}
      </div>
    </div>
  )
}
