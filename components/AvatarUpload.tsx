'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'

interface Props {
  userId: string
  initialAvatarUrl: string | null
  displayName: string
}

function ConfirmModal({
  preview,
  uploading,
  error,
  onConfirm,
  onCancel,
}: {
  preview: string
  uploading: boolean
  error: string
  onConfirm: () => void
  onCancel: () => void
}) {
  const [visible, setVisible] = useState(false)

  const handleCancel = useCallback(() => {
    setVisible(false)
    setTimeout(onCancel, 180)
  }, [onCancel])

  useEffect(() => {
    const t = requestAnimationFrame(() => setVisible(true))
    return () => cancelAnimationFrame(t)
  }, [])

  return (
    <div
      className={`fixed inset-0 z-50 flex items-center justify-center p-4 transition-opacity duration-200 ${
        visible ? 'opacity-100' : 'opacity-0'
      }`}
      style={{ background: 'rgba(0,0,0,0.75)' }}
      onClick={handleCancel}
    >
      <div
        className={`w-full max-w-xs p-6 rounded-2xl flex flex-col items-center gap-4 transition-all duration-200 ${
          visible ? 'opacity-100 scale-100' : 'opacity-0 scale-95'
        }`}
        style={{ background: 'var(--card)' }}
        onClick={e => e.stopPropagation()}
      >
        <h3
          className="font-semibold text-base"
          style={{ fontFamily: 'var(--font-syne)', color: 'var(--fg)' }}
        >
          ¿Usar esta foto?
        </h3>

        <div className="w-28 h-28 rounded-full overflow-hidden ring-4 ring-amber-400">
          <img src={preview} alt="Preview" className="w-full h-full object-cover" />
        </div>

        {error && (
          <p className="text-xs text-center" style={{ color: '#DC2626' }}>{error}</p>
        )}

        <div className="flex gap-3 w-full">
          <button
            onClick={handleCancel}
            disabled={uploading}
            className="flex-1 py-2.5 rounded-xl text-sm"
            style={{ background: 'var(--secondary-bg)', color: 'var(--fg)' }}
          >
            Cancelar
          </button>
          <button
            onClick={onConfirm}
            disabled={uploading}
            className="flex-1 py-2.5 rounded-xl text-sm font-semibold"
            style={{ background: '#F59E0B', color: '#FFFFFF', opacity: uploading ? 0.6 : 1 }}
          >
            {uploading ? 'Subiendo…' : 'Confirmar'}
          </button>
        </div>
      </div>
    </div>
  )
}

export default function AvatarUpload({ userId, initialAvatarUrl, displayName }: Props) {
  const [avatarUrl, setAvatarUrl] = useState<string | null>(initialAvatarUrl)
  const [preview, setPreview] = useState<string | null>(null)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState('')
  const fileRef = useRef<HTMLInputElement>(null)

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    if (fileRef.current) fileRef.current.value = ''

    const url = URL.createObjectURL(file)
    setPreview(url)
    setSelectedFile(file)
    setError('')
  }

  async function handleConfirm() {
    if (!selectedFile) return
    setUploading(true)
    setError('')

    const supabase = createClient()
    const ext = selectedFile.name.split('.').pop()?.toLowerCase() || 'jpg'
    const path = `workers/${userId}/avatar.${ext}`

    const { error: uploadError } = await supabase.storage
      .from('avatars')
      .upload(path, selectedFile, { contentType: selectedFile.type, upsert: true })

    if (uploadError) {
      setError('Error al subir la imagen. Intenta de nuevo.')
      setUploading(false)
      return
    }

    // Bust cache by appending a timestamp query param
    const { data: { publicUrl } } = supabase.storage.from('avatars').getPublicUrl(path)
    const bustedUrl = `${publicUrl}?t=${Date.now()}`

    const { error: dbError } = await supabase
      .from('profiles')
      .update({ avatar_url: bustedUrl })
      .eq('id', userId)

    if (dbError) {
      setError('Error al guardar la foto.')
      setUploading(false)
      return
    }

    if (preview) URL.revokeObjectURL(preview)
    setAvatarUrl(bustedUrl)
    setPreview(null)
    setSelectedFile(null)
    setUploading(false)
  }

  function handleCancel() {
    if (preview) URL.revokeObjectURL(preview)
    setPreview(null)
    setSelectedFile(null)
    setError('')
  }

  return (
    <>
      {/* Avatar circle with camera button */}
      <div className="relative w-20 h-20 flex-shrink-0">
        <div
          className="w-20 h-20 rounded-full flex items-center justify-center text-3xl font-bold overflow-hidden"
          style={{ background: 'var(--secondary-bg)', color: 'var(--fg)' }}
        >
          {avatarUrl ? (
            <img src={avatarUrl} alt="" className="w-full h-full object-cover" />
          ) : (
            displayName.charAt(0).toUpperCase()
          )}
        </div>

        {/* Camera icon — amber accent */}
        <button
          onClick={() => fileRef.current?.click()}
          className="absolute bottom-0 right-0 w-7 h-7 rounded-full flex items-center justify-center shadow-md"
          style={{ background: '#F59E0B', color: '#FFFFFF' }}
          aria-label="Cambiar foto de perfil"
        >
          <svg width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <path d="M23 19a2 2 0 01-2 2H3a2 2 0 01-2-2V8a2 2 0 012-2h4l2-3h6l2 3h4a2 2 0 012 2z"/>
            <circle cx="12" cy="13" r="4"/>
          </svg>
        </button>

        <input
          ref={fileRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          className="hidden"
          onChange={handleFileChange}
        />
      </div>

      {/* Preview / confirm modal */}
      {preview && (
        <ConfirmModal
          preview={preview}
          uploading={uploading}
          error={error}
          onConfirm={handleConfirm}
          onCancel={handleCancel}
        />
      )}
    </>
  )
}
