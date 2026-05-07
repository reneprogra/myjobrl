'use client'

import { useState, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'

interface Photo {
  id: string
  photo_url: string
  caption: string | null
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
          style={{ fontFamily: 'var(--font-syne)', color: '#1A1A1A' }}
        >
          Portafolio
        </h2>
        <button
          onClick={() => fileRef.current?.click()}
          disabled={uploading}
          className="text-xs font-medium"
          style={{ color: '#6B6860', opacity: uploading ? 0.5 : 1 }}
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
        <div className="grid grid-cols-3 gap-1.5">
          {photos.map(photo => (
            <div
              key={photo.id}
              className="aspect-square rounded-xl overflow-hidden"
              style={{ background: '#F0EDE6' }}
            >
              <img
                src={photo.photo_url}
                alt={photo.caption || ''}
                className="w-full h-full object-cover"
              />
            </div>
          ))}
        </div>
      ) : (
        <div
          className="p-6 rounded-2xl text-center"
          style={{ background: '#FFFFFF', border: '1px solid #E5E2DB' }}
        >
          <div className="text-3xl mb-2">📸</div>
          <p className="text-sm" style={{ color: '#6B6860' }}>
            Agrega fotos de tu trabajo
          </p>
        </div>
      )}
    </div>
  )
}
