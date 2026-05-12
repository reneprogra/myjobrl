'use client'

import { useState, useEffect, useCallback } from 'react'

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
    // Small delay so the transition fires after mount
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
      {/* Close button */}
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

      {/* Image container — stopPropagation prevents closing when tapping the image */}
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
          style={{
            maxWidth: 'calc(100vw - 2rem)',
            maxHeight: '85dvh',
          }}
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

export default function PortfolioGrid({ photos }: { photos: Photo[] }) {
  const [selected, setSelected] = useState<Photo | null>(null)

  if (photos.length === 0) {
    return (
      <div
        className="p-6 rounded-2xl text-center"
        style={{ background: 'var(--card)', border: '1px solid var(--border)' }}
      >
        <div className="text-3xl mb-2">📸</div>
        <p className="text-sm" style={{ color: 'var(--muted)' }}>Sin fotos de portafolio</p>
      </div>
    )
  }

  return (
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
        <PhotoViewerModal
          photo={selected}
          onClose={() => setSelected(null)}
        />
      )}
    </>
  )
}
