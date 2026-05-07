'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'

interface Props {
  profile: any
  email: string
}

function SectionHeader({ title }: { title: string }) {
  return (
    <div className="px-4 pt-5 pb-1">
      <h2 className="text-xs font-semibold uppercase tracking-wider" style={{ color: '#6B6860' }}>
        {title}
      </h2>
    </div>
  )
}

function SettingRow({ icon, label, value, onClick, danger, href }: {
  icon: string
  label: string
  value?: string
  onClick?: () => void
  danger?: boolean
  href?: string
}) {
  const content = (
    <div
      className="flex items-center gap-3 px-4 py-3.5 transition-all"
      style={{ cursor: 'pointer' }}
      onClick={onClick}
    >
      <span className="text-base w-5 text-center flex-shrink-0">{icon}</span>
      <div className="flex-1">
        <span className="text-sm" style={{ color: danger ? '#DC2626' : '#1A1A1A' }}>{label}</span>
        {value && <div className="text-xs mt-0.5" style={{ color: '#6B6860' }}>{value}</div>}
      </div>
      {!danger && (
        <svg width="16" height="16" fill="none" stroke="#9CA3AF" strokeWidth="2" viewBox="0 0 24 24">
          <polyline points="9 18 15 12 9 6"/>
        </svg>
      )}
    </div>
  )

  if (href) return <Link href={href}>{content}</Link>
  return content
}

function ToggleRow({ icon, label, value, checked, onToggle }: {
  icon: string
  label: string
  value?: string
  checked: boolean
  onToggle: () => void
}) {
  return (
    <div
      className="flex items-center gap-3 px-4 py-3.5"
      style={{ cursor: 'pointer' }}
      onClick={onToggle}
    >
      <span className="text-base w-5 text-center flex-shrink-0">{icon}</span>
      <div className="flex-1">
        <span className="text-sm" style={{ color: '#1A1A1A' }}>{label}</span>
        {value && <div className="text-xs mt-0.5" style={{ color: '#6B6860' }}>{value}</div>}
      </div>
      <div
        className="relative w-11 h-6 rounded-full transition-colors flex-shrink-0"
        style={{ background: checked ? '#1A1A1A' : '#E5E2DB' }}
      >
        <div
          className="absolute top-0.5 w-5 h-5 rounded-full transition-transform"
          style={{
            background: '#FFFFFF',
            transform: checked ? 'translateX(1.25rem)' : 'translateX(0.125rem)',
          }}
        />
      </div>
    </div>
  )
}

function Divider() {
  return <div style={{ height: '1px', background: '#F0EDE6', marginLeft: '3.25rem' }} />
}

export default function SettingsClient({ profile, email }: Props) {
  const router = useRouter()
  const [editProfile, setEditProfile] = useState(false)
  const [changePassword, setChangePassword] = useState(false)
  const [fullName, setFullName] = useState(profile?.full_name || '')
  const [bio, setBio] = useState(profile?.bio || '')
  const [city, setCity] = useState(profile?.city || '')
  const [state, setState] = useState(profile?.state || '')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')

  // Privacy toggles
  const [isPublic, setIsPublic] = useState<boolean>(profile?.is_public ?? true)
  const [shareLocation, setShareLocation] = useState(true)

  // Notification toggles
  const [notifShifts, setNotifShifts] = useState(true)
  const [notifApps, setNotifApps] = useState(true)
  const [notifMessages, setNotifMessages] = useState(true)

  // Load localStorage preferences on mount
  useEffect(() => {
    setShareLocation(localStorage.getItem('pref_share_location') !== 'false')
    setNotifShifts(localStorage.getItem('pref_notif_shifts') !== 'false')
    setNotifApps(localStorage.getItem('pref_notif_apps') !== 'false')
    setNotifMessages(localStorage.getItem('pref_notif_messages') !== 'false')
  }, [])

  async function handleTogglePublic() {
    const newVal = !isPublic
    setIsPublic(newVal)
    const supabase = createClient()
    await supabase.from('profiles').update({ is_public: newVal }).eq('id', profile.id)
  }

  function handleToggleLocation() {
    const newVal = !shareLocation
    setShareLocation(newVal)
    localStorage.setItem('pref_share_location', String(newVal))
  }

  function handleToggleNotif(key: 'shifts' | 'apps' | 'messages') {
    if (key === 'shifts') {
      const newVal = !notifShifts
      setNotifShifts(newVal)
      localStorage.setItem('pref_notif_shifts', String(newVal))
    } else if (key === 'apps') {
      const newVal = !notifApps
      setNotifApps(newVal)
      localStorage.setItem('pref_notif_apps', String(newVal))
    } else {
      const newVal = !notifMessages
      setNotifMessages(newVal)
      localStorage.setItem('pref_notif_messages', String(newVal))
    }
  }

  async function handleSaveProfile() {
    setSaving(true)
    const supabase = createClient()
    const { error } = await supabase.from('profiles').update({
      full_name: fullName,
      bio: bio || null,
      city: city || null,
      state: state || null,
    }).eq('id', profile.id)

    setSaving(false)
    if (!error) {
      setMessage('Perfil actualizado')
      setEditProfile(false)
      router.refresh()
    }
  }

  async function handleChangePassword() {
    if (newPassword !== confirmPassword) {
      setMessage('Las contraseñas no coinciden')
      return
    }
    if (newPassword.length < 6) {
      setMessage('Mínimo 6 caracteres')
      return
    }
    setSaving(true)
    const supabase = createClient()
    const { error } = await supabase.auth.updateUser({ password: newPassword })
    setSaving(false)
    if (error) {
      setMessage(error.message)
    } else {
      setMessage('Contraseña actualizada')
      setChangePassword(false)
      setNewPassword('')
      setConfirmPassword('')
    }
  }

  async function handleSignOut() {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/login')
  }

  const inputStyle = {
    background: '#FFFFFF',
    border: '1.5px solid #E5E2DB',
    color: '#1A1A1A',
    fontFamily: 'var(--font-dm-sans)',
  }

  return (
    <div className="pb-8" style={{ background: '#F8F6F1' }}>
      {/* Header */}
      <div className="px-4 pt-6 pb-4 flex items-center gap-3">
        <Link
          href={`/profile/${profile?.id}`}
          className="p-2 rounded-xl"
          style={{ background: '#FFFFFF', border: '1px solid #E5E2DB' }}
        >
          <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <polyline points="15 18 9 12 15 6"/>
          </svg>
        </Link>
        <h1 className="text-xl font-bold" style={{ fontFamily: 'var(--font-syne)', color: '#1A1A1A' }}>
          Ajustes
        </h1>
      </div>

      {/* User summary */}
      <div className="mx-4 mb-4 p-4 rounded-2xl flex items-center gap-3" style={{ background: '#FFFFFF', border: '1px solid #E5E2DB' }}>
        <div className="w-12 h-12 rounded-full flex items-center justify-center text-lg font-bold" style={{ background: '#1A1A1A', color: '#F8F6F1' }}>
          {profile?.full_name?.charAt(0).toUpperCase()}
        </div>
        <div>
          <div className="font-semibold" style={{ fontFamily: 'var(--font-syne)', color: '#1A1A1A' }}>{profile?.full_name}</div>
          <div className="text-sm" style={{ color: '#6B6860' }}>{email}</div>
          <div className="text-xs mt-0.5" style={{ color: '#9CA3AF' }}>
            {profile?.user_type === 'cliente' ? '💼 Cliente' : '🔧 Worker'}
          </div>
        </div>
      </div>

      {message && (
        <div className="mx-4 mb-4 px-4 py-3 rounded-xl text-sm" style={{ background: '#DCFCE7', color: '#166534' }}>
          {message}
        </div>
      )}

      {/* Edit Profile Modal */}
      {editProfile && (
        <div className="mx-4 mb-4 p-4 rounded-2xl flex flex-col gap-4" style={{ background: '#FFFFFF', border: '1px solid #E5E2DB' }}>
          <h3 className="font-semibold" style={{ fontFamily: 'var(--font-syne)', color: '#1A1A1A' }}>Editar perfil</h3>
          <div>
            <label className="block text-xs font-medium mb-1" style={{ color: '#6B6860' }}>Nombre completo</label>
            <input type="text" value={fullName} onChange={e => setFullName(e.target.value)} className="w-full px-4 py-3 rounded-xl text-sm outline-none" style={inputStyle} />
          </div>
          <div>
            <label className="block text-xs font-medium mb-1" style={{ color: '#6B6860' }}>Bio</label>
            <textarea value={bio} onChange={e => setBio(e.target.value)} rows={3} placeholder="Cuéntanos sobre ti..." className="w-full px-4 py-3 rounded-xl text-sm outline-none resize-none" style={inputStyle} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium mb-1" style={{ color: '#6B6860' }}>Ciudad</label>
              <input type="text" value={city} onChange={e => setCity(e.target.value)} className="w-full px-4 py-3 rounded-xl text-sm outline-none" style={inputStyle} />
            </div>
            <div>
              <label className="block text-xs font-medium mb-1" style={{ color: '#6B6860' }}>Estado</label>
              <input type="text" value={state} onChange={e => setState(e.target.value)} className="w-full px-4 py-3 rounded-xl text-sm outline-none" style={inputStyle} />
            </div>
          </div>
          <div className="flex gap-3">
            <button onClick={() => setEditProfile(false)} className="flex-1 py-2.5 rounded-xl text-sm" style={{ background: '#F0EDE6' }}>Cancelar</button>
            <button onClick={handleSaveProfile} disabled={saving} className="flex-1 py-2.5 rounded-xl text-sm font-semibold" style={{ background: '#1A1A1A', color: '#FFFFFF', opacity: saving ? 0.6 : 1 }}>{saving ? 'Guardando...' : 'Guardar'}</button>
          </div>
        </div>
      )}

      {/* Change Password Modal */}
      {changePassword && (
        <div className="mx-4 mb-4 p-4 rounded-2xl flex flex-col gap-4" style={{ background: '#FFFFFF', border: '1px solid #E5E2DB' }}>
          <h3 className="font-semibold" style={{ fontFamily: 'var(--font-syne)', color: '#1A1A1A' }}>Cambiar contraseña</h3>
          <input type="password" value={newPassword} onChange={e => setNewPassword(e.target.value)} placeholder="Nueva contraseña" className="w-full px-4 py-3 rounded-xl text-sm outline-none" style={inputStyle} />
          <input type="password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} placeholder="Confirmar contraseña" className="w-full px-4 py-3 rounded-xl text-sm outline-none" style={inputStyle} />
          <div className="flex gap-3">
            <button onClick={() => setChangePassword(false)} className="flex-1 py-2.5 rounded-xl text-sm" style={{ background: '#F0EDE6' }}>Cancelar</button>
            <button onClick={handleChangePassword} disabled={saving} className="flex-1 py-2.5 rounded-xl text-sm font-semibold" style={{ background: '#1A1A1A', color: '#FFFFFF', opacity: saving ? 0.6 : 1 }}>{saving ? 'Guardando...' : 'Cambiar'}</button>
          </div>
        </div>
      )}

      {/* Sections */}
      <div className="mx-4 rounded-2xl overflow-hidden" style={{ background: '#FFFFFF', border: '1px solid #E5E2DB' }}>
        <SectionHeader title="Cuenta" />
        <SettingRow icon="👤" label="Editar perfil" value={profile?.full_name} onClick={() => { setEditProfile(true); setChangePassword(false) }} />
        <Divider />
        <SettingRow icon="🔑" label="Cambiar contraseña" onClick={() => { setChangePassword(true); setEditProfile(false) }} />
        <Divider />
        <SettingRow icon="✅" label="Verificación de identidad" value="Próximamente" onClick={() => {}} />
      </div>

      <div className="mx-4 mt-3 rounded-2xl overflow-hidden" style={{ background: '#FFFFFF', border: '1px solid #E5E2DB' }}>
        <SectionHeader title="Privacidad" />
        <ToggleRow
          icon="👁️"
          label="Visibilidad del perfil"
          value={isPublic ? 'Público' : 'Privado'}
          checked={isPublic}
          onToggle={handleTogglePublic}
        />
        <Divider />
        <ToggleRow
          icon="📍"
          label="Compartir ubicación"
          value={shareLocation ? 'Activado' : 'Desactivado'}
          checked={shareLocation}
          onToggle={handleToggleLocation}
        />
      </div>

      <div className="mx-4 mt-3 rounded-2xl overflow-hidden" style={{ background: '#FFFFFF', border: '1px solid #E5E2DB' }}>
        <SectionHeader title="Notificaciones" />
        <ToggleRow
          icon="💼"
          label="Nuevos turnos"
          value={notifShifts ? 'Activado' : 'Desactivado'}
          checked={notifShifts}
          onToggle={() => handleToggleNotif('shifts')}
        />
        <Divider />
        <ToggleRow
          icon="📩"
          label="Aplicaciones"
          value={notifApps ? 'Activado' : 'Desactivado'}
          checked={notifApps}
          onToggle={() => handleToggleNotif('apps')}
        />
        <Divider />
        <ToggleRow
          icon="💬"
          label="Mensajes"
          value={notifMessages ? 'Activado' : 'Desactivado'}
          checked={notifMessages}
          onToggle={() => handleToggleNotif('messages')}
        />
      </div>

      <div className="mx-4 mt-3 rounded-2xl overflow-hidden" style={{ background: '#FFFFFF', border: '1px solid #E5E2DB' }}>
        <SectionHeader title="Pagos" />
        {profile?.user_type === 'cliente' ? (
          <SettingRow icon="💳" label="Método de pago" value="Próximamente" href="/settings/payment" />
        ) : (
          <SettingRow icon="🏦" label="Cuenta bancaria" value="Próximamente" href="/settings/payment" />
        )}
      </div>

      <div className="mx-4 mt-3 rounded-2xl overflow-hidden" style={{ background: '#FFFFFF', border: '1px solid #E5E2DB' }}>
        <SectionHeader title="Ayuda" />
        <SettingRow icon="❓" label="Centro de ayuda" href="/settings/help" />
        <Divider />
        <SettingRow icon="📜" label="Términos y condiciones" href="/settings/terms" />
        <Divider />
        <SettingRow icon="🚩" label="Reportar problema" href="/settings/report" />
      </div>

      <div className="mx-4 mt-3 rounded-2xl overflow-hidden" style={{ background: '#FFFFFF', border: '1px solid #E5E2DB' }}>
        <SettingRow icon="🚪" label="Cerrar sesión" danger onClick={handleSignOut} />
      </div>

      <div className="px-4 mt-6 text-center">
        <p className="text-xs" style={{ color: '#9CA3AF' }}>MyJob v1.0.0</p>
      </div>
    </div>
  )
}
