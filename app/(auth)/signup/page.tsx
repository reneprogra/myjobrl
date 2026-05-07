'use client'

import { useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

export default function SignupPage() {
  const router = useRouter()
  const [step, setStep] = useState<'account' | 'role'>('account')
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [userType, setUserType] = useState<'cliente' | 'worker' | ''>('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [userId, setUserId] = useState('')
  const [session, setSession] = useState<{ access_token: string; refresh_token: string } | null>(null)

  async function handleAccountStep(e: React.FormEvent) {
    e.preventDefault()
    if (password.length < 6) {
      setError('La contraseña debe tener al menos 6 caracteres')
      return
    }
    setLoading(true)
    setError('')

    const supabase = createClient()
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { full_name: fullName } }
    })

    if (error) {
      setError(error.message)
      setLoading(false)
    } else if (data.user) {
      setUserId(data.user.id)
      if (data.session) {
        setSession({ access_token: data.session.access_token, refresh_token: data.session.refresh_token })
      }
      setStep('role')
      setLoading(false)
    }
  }

  async function handleRoleStep() {
    if (!userType) return
    setLoading(true)
    setError('')

    const supabase = createClient()

    // Ensure the session is active before writing — signUp may not have
    // flushed tokens to storage yet when this runs in a new client instance.
    if (session) {
      await supabase.auth.setSession(session)
    }

    // Create profile
    const { error } = await supabase.from('profiles').upsert({
      id: userId,
      full_name: fullName,
      user_type: userType,
      rating: 0,
      rating_count: 0,
      is_verified: false,
      cancellation_count: 0,
      has_warning: false,
    })

    if (error) {
      setError(error.message)
      setLoading(false)
      return
    }

    if (userType === 'worker') {
      router.push('/onboarding')
    } else {
      router.push('/dashboard')
    }
    router.refresh()
  }

  if (step === 'role') {
    return (
      <div className="min-h-screen flex flex-col" style={{ background: '#F8F6F1' }}>
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
          <h2 className="text-2xl font-semibold mb-2" style={{ fontFamily: 'var(--font-syne)', color: '#1A1A1A' }}>
            ¿Cómo usarás MyJob?
          </h2>
          <p className="text-sm mb-8" style={{ color: '#6B6860' }}>
            Elige tu rol. Podrás cambiarlo más tarde en ajustes.
          </p>

          <div className="flex flex-col gap-4">
            <button
              onClick={() => setUserType('cliente')}
              className="w-full p-5 rounded-2xl text-left transition-all"
              style={{
                background: userType === 'cliente' ? '#1A1A1A' : '#FFFFFF',
                border: `2px solid ${userType === 'cliente' ? '#1A1A1A' : '#E5E2DB'}`,
                color: userType === 'cliente' ? '#FFFFFF' : '#1A1A1A',
              }}
            >
              <div className="text-3xl mb-2">💼</div>
              <div className="font-semibold text-lg" style={{ fontFamily: 'var(--font-syne)' }}>
                Cliente
              </div>
              <div className="text-sm mt-1 opacity-70">
                Publico turnos y contrato trabajadores
              </div>
            </button>

            <button
              onClick={() => setUserType('worker')}
              className="w-full p-5 rounded-2xl text-left transition-all"
              style={{
                background: userType === 'worker' ? '#1A1A1A' : '#FFFFFF',
                border: `2px solid ${userType === 'worker' ? '#1A1A1A' : '#E5E2DB'}`,
                color: userType === 'worker' ? '#FFFFFF' : '#1A1A1A',
              }}
            >
              <div className="text-3xl mb-2">🔧</div>
              <div className="font-semibold text-lg" style={{ fontFamily: 'var(--font-syne)' }}>
                Worker
              </div>
              <div className="text-sm mt-1 opacity-70">
                Busco turnos y ofrezco mis servicios
              </div>
            </button>
          </div>

          {error && (
            <div className="mt-4 text-sm px-4 py-3 rounded-xl" style={{ background: '#FEE2E2', color: '#991B1B' }}>
              {error}
            </div>
          )}

          <button
            onClick={handleRoleStep}
            disabled={!userType || loading}
            className="w-full py-3.5 rounded-xl text-sm font-semibold transition-opacity mt-6"
            style={{
              background: '#1A1A1A',
              color: '#FFFFFF',
              opacity: (!userType || loading) ? 0.4 : 1,
              fontFamily: 'var(--font-dm-sans)',
            }}
          >
            {loading ? 'Configurando...' : 'Continuar'}
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex flex-col" style={{ background: '#F8F6F1' }}>
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
        <h2 className="text-2xl font-semibold mb-6" style={{ fontFamily: 'var(--font-syne)', color: '#1A1A1A' }}>
          Crear cuenta
        </h2>

        <form onSubmit={handleAccountStep} className="flex flex-col gap-4">
          <div>
            <label className="block text-sm font-medium mb-1.5" style={{ color: '#1A1A1A' }}>
              Nombre completo
            </label>
            <input
              type="text"
              value={fullName}
              onChange={e => setFullName(e.target.value)}
              required
              className="w-full px-4 py-3 rounded-xl text-sm outline-none"
              style={{ background: '#FFFFFF', border: '1.5px solid #E5E2DB', color: '#1A1A1A', fontFamily: 'var(--font-dm-sans)' }}
              placeholder="Tu nombre"
            />
          </div>

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
              className="w-full px-4 py-3 rounded-xl text-sm outline-none"
              style={{ background: '#FFFFFF', border: '1.5px solid #E5E2DB', color: '#1A1A1A', fontFamily: 'var(--font-dm-sans)' }}
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
              autoComplete="new-password"
              className="w-full px-4 py-3 rounded-xl text-sm outline-none"
              style={{ background: '#FFFFFF', border: '1.5px solid #E5E2DB', color: '#1A1A1A', fontFamily: 'var(--font-dm-sans)' }}
              placeholder="Mínimo 6 caracteres"
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
            className="w-full py-3.5 rounded-xl text-sm font-semibold transition-opacity mt-2"
            style={{
              background: '#1A1A1A',
              color: '#FFFFFF',
              opacity: loading ? 0.6 : 1,
              fontFamily: 'var(--font-dm-sans)',
            }}
          >
            {loading ? 'Creando cuenta...' : 'Continuar'}
          </button>
        </form>

        <p className="mt-6 text-center text-sm" style={{ color: '#6B6860' }}>
          ¿Ya tienes cuenta?{' '}
          <Link href="/login" className="font-semibold underline" style={{ color: '#1A1A1A' }}>
            Inicia sesión
          </Link>
        </p>
      </div>
    </div>
  )
}
