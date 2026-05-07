export default function DashboardLoading() {
  return (
    <div className="px-4 py-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <div className="h-8 w-44 rounded-xl animate-pulse mb-1" style={{ background: '#F0EDE6' }} />
          <div className="h-4 w-24 rounded-lg animate-pulse" style={{ background: '#F0EDE6' }} />
        </div>
        <div className="w-11 h-11 rounded-full animate-pulse" style={{ background: '#F0EDE6' }} />
      </div>
      <div className="grid grid-cols-3 gap-3 mb-6">
        {[1, 2, 3].map(i => (
          <div key={i} className="h-20 rounded-2xl animate-pulse" style={{ background: '#F0EDE6' }} />
        ))}
      </div>
      <div className="h-16 rounded-2xl animate-pulse mb-6" style={{ background: '#F0EDE6' }} />
      <div className="h-6 w-32 rounded-lg animate-pulse mb-3" style={{ background: '#F0EDE6' }} />
      <div className="flex flex-col gap-3">
        {[1, 2, 3].map(i => (
          <div key={i} className="h-28 rounded-2xl animate-pulse" style={{ background: '#F0EDE6' }} />
        ))}
      </div>
    </div>
  )
}
