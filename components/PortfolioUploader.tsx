'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'

interface Photo {
  id: string
  photo_url: string
  caption: string | null
}

function PhotoViewerModal({
  photo,
  onClose,
}: {
  photo: Photo
  onClose: () => void
}) {
  const [visible, setVisible] = useState(false)

  const handleClose = useCallback(() => {
    setVisible(false)
    setTimeout(onClose, 200)
  }, [onClose])

  useEffect(() => {
    const t = requestAnimationFrame(() => setVisible(true))
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') handleClose()
    }
    document.addEventListener('keydown', onKey)
    return () => {
      cancelAnimationFrame(t)
      document.removeEventListener('keydown', onKey)
    }
  }, [handleClose])

  return (
    <div
      className={`fixed inset-0 z-50 flex items-center justify-center p-4 transition-opacity duration-200 ${
        visible ? 'opacity-100' : 'opacity-0'
      }`}
      style={{ background: 'rgba(0,0,0,0.88)' }}
      onClick={handleClose}
    >
      <button
        className={`absolute top-4 right-4 w-10 h-10 flex items-center justify-center rounded-full text-white text-lg font-medium transition-transform duration-200 ${
          visible ? 'scale-100' : 'scale-90'
        }`}
        style={{ background: 'rgba(255,255,255,0.15)' }}
        onClick={handleClose}
        aria-label="Cerrar"
      >
        ✕
      </button>
      <div
        className={`flex flex-col items-center transition-all duration-200 ${
          visible ? 'opacity-100 scale-100' : 'opacity-0 scale-95'
        }`}
        onClick={e => e.stopPropagation()}
      >
        <img
          src={photo.photo_url}
          alt={photo.caption || ''}
          className="rounded-xl object-contain"
          style={{ maxWidth: 'calc(100vw - 2rem)', maxHeight: '85dvh' }}
        />
        {photo.caption && (
          <p className="mt-3 text-sm text-center" style={{ color: 'rgba(255,255,255,0.65)' }}>
            {photo.caption}
          </p>
        )}
      </div>
    </div>
  )
}

export default function PortfolioUploader({
  workerId,
  initialPhotos,
}: {
  workerId: string
  initialPhotos: Photo[]
}) {
  const [photos, setPhotos] = useState<Photo[]>(initialPhotos)
  const [uploading, setUploading] = useState(false)
  const [toast, setToast] = useState('')
  const [selected, setSelected] = useState<Photo | null>(null)
  const fileRef = useRef<HTMLInputElement>(null)

  function showToast(msg: string) {
    setToast(msg)
    setTimeout(() => setToast(''), 3500)
  }

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    // Reset input so the same file can be re-selected after an error
    if (fileRef.current) fileRef.current.value = ''

    setUploading(true)

    const supabase = createClient()
    const ext = file.name.split('.').pop() || 'jpg'
    const path = `${workerId}/${Date.now()}.${ext}`

    const { error: uploadError } = await supabase.storage
      .from('portfolio')
      .upload(path, file, { contentType: file.type })

    if (uploadError) {
      showToast('Error al subir la foto. Intenta de nuevo.')
      setUploading(false)
      return
    }

    const { data: { publicUrl } } = supabase.storage.from('portfolio').getPublicUrl(path)

    const { data: newPhoto, error: dbError } = await supabase
      .from('portfolio_photos')
      .insert({ worker_id: workerId, photo_url: publicUrl })
      .select()
      .single()

    if (dbError || !newPhoto) {
      showToast('Error al guardar la foto.')
      setUploading(false)
      return
    }

    setPhotos(prev => [newPhoto as Photo, ...prev])
    setUploading(false)
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <h2
          className="text-base font-semibold"
          style={{ fontFamily: 'var(--font-syne)', color: 'var(--fg)' }}
        >
          Portafolio
        </h2>
        <button
          onClick={() => fileRef.current?.click()}
          disabled={uploading}
          className="text-xs font-medium"
          style={{ color: 'var(--muted)', opacity: uploading ? 0.5 : 1 }}
        >
          {uploading ? 'Subiendo...' : '+ Agregar foto'}
        </button>
        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleFile}
        />
      </div>

      {toast && (
        <div
          className="mb-2 px-3 py-2 rounded-xl text-sm"
          style={{ background: '#FEE2E2', color: '#991B1B' }}
        >
          {toast}
        </div>
      )}

      {photos.length > 0 ? (
        <>
          <div className="grid grid-cols-3 gap-1.5">
            {photos.map(photo => (
              <button
                key={photo.id}
                className="aspect-square rounded-xl overflow-hidden focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-1"
                style={{ background: 'var(--secondary-bg)' }}
                onClick={() => setSelected(photo)}
              >
                <img
                  src={photo.photo_url}
                  alt={photo.caption || ''}
                  className="w-full h-full object-cover"
                />
              </button>
            ))}
          </div>
          {selected && (
            <PhotoViewerModal photo={selected} onClose={() => setSelected(null)} />
          )}
        </>
      ) : (
        <div
          className="p-6 rounded-2xl text-center"
          style={{ background: 'var(--card)', border: '1px solid var(--border)' }}
        >
          <div className="text-3xl mb-2">📸</div>
          <p className="text-sm" style={{ color: 'var(--muted)' }}>
            Agrega fotos de tu trabajo
          </p>
        </div>
      )}
    </div>
  )
}
