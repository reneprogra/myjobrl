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

      {/* Form */}
      <div className="flex-1 px-6 max-w-sm mx-auto w-full">
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
              style={{
                background: '#FFFFFF',
                border: '1.5px solid #E5E2DB',
                color: '#1A1A1A',
                fontFamily: 'var(--font-dm-sans)',
              }}
              placeholder="tu@correo.com"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1.5" style={{ color: '#1A1A1A' }}>
              Contraseña
            </label>
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
              autoComplete="current-password"
              className="w-full px-4 py-3 rounded-xl text-sm outline-none transition-all"
              style={{
                background: '#FFFFFF',
                border: '1.5px solid #E5E2DB',
                color: '#1A1A1A',
                fontFamily: 'var(--font-dm-sans)',
              }}
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
          <Link
            href="/signup"
            className="font-semibold underline"
            style={{ color: '#1A1A1A' }}
          >
            Regístrate
          </Link>
        </p>
      </div>
    </div>
  )
}
