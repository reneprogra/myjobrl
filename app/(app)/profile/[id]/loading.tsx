export default function ProfileLoading() {
  return (
    <div className="pb-8 animate-pulse">
      {/* Dark header skeleton */}
      <div className="px-4 pt-6 pb-8" style={{ background: '#1A1A1A' }}>
        <div className="flex justify-end mb-4">
          <div className="h-7 w-20 rounded-xl" style={{ background: 'rgba(255,255,255,0.1)' }} />
        </div>
        <div className="flex items-start gap-4">
          {/* Avatar */}
          <div className="w-20 h-20 rounded-full flex-shrink-0" style={{ background: 'rgba(255,255,255,0.1)' }} />
          <div className="flex-1 pt-1 flex flex-col gap-2">
            <div className="h-6 w-40 rounded-lg" style={{ background: 'rgba(255,255,255,0.15)' }} />
            <div className="h-4 w-28 rounded-lg" style={{ background: 'rgba(255,255,255,0.1)' }} />
            <div className="h-4 w-32 rounded-lg" style={{ background: 'rgba(255,255,255,0.1)' }} />
          </div>
        </div>
        {/* Stats */}
        <div className="grid grid-cols-3 gap-3 mt-6">
          {[0, 1, 2].map(i => (
            <div key={i} className="text-center flex flex-col items-center gap-1">
              <div className="h-8 w-10 rounded-lg" style={{ background: 'rgba(255,255,255,0.15)' }} />
              <div className="h-3 w-12 rounded" style={{ background: 'rgba(255,255,255,0.1)' }} />
            </div>
          ))}
        </div>
      </div>

      <div className="px-4 mt-4 flex flex-col gap-5">
        {/* Services */}
        <div>
          <div className="h-5 w-20 rounded mb-2" style={{ background: 'var(--secondary-bg)' }} />
          <div className="flex flex-wrap gap-2">
            {[0, 1, 2].map(i => (
              <div key={i} className="h-8 w-24 rounded-full" style={{ background: 'var(--secondary-bg)' }} />
            ))}
          </div>
        </div>

        {/* Portfolio skeleton */}
        <div>
          <div className="h-5 w-24 rounded mb-2" style={{ background: 'var(--secondary-bg)' }} />
          <div className="grid grid-cols-3 gap-2">
            {[0, 1, 2, 3, 4, 5].map(i => (
              <div key={i} className="aspect-square rounded-xl" style={{ background: 'var(--secondary-bg)' }} />
            ))}
          </div>
        </div>

        {/* Reviews skeleton */}
        <div>
          <div className="h-5 w-28 rounded mb-3" style={{ background: 'var(--secondary-bg)' }} />
          {[0, 1, 2].map(i => (
            <div key={i} className="p-4 rounded-2xl mb-3" style={{ background: 'var(--card)', border: '1px solid var(--border)' }}>
              <div className="flex items-center gap-2 mb-2">
                <div className="w-8 h-8 rounded-full" style={{ background: 'var(--secondary-bg)' }} />
                <div className="h-4 w-24 rounded" style={{ background: 'var(--secondary-bg)' }} />
              </div>
              <div className="h-4 w-full rounded mb-1" style={{ background: 'var(--secondary-bg)' }} />
              <div className="h-4 w-3/4 rounded" style={{ background: 'var(--secondary-bg)' }} />
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
