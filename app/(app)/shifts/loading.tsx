export default function ShiftsLoading() {
  return (
    <div className="px-4 py-6">
      <div className="flex items-center justify-between mb-6">
        <div className="h-8 w-40 rounded-xl animate-pulse" style={{ background: '#F0EDE6' }} />
        <div className="h-9 w-20 rounded-xl animate-pulse" style={{ background: '#F0EDE6' }} />
      </div>
      <div className="flex flex-col gap-3">
        {[1, 2, 3, 4].map(i => (
          <div key={i} className="h-28 rounded-2xl animate-pulse" style={{ background: '#F0EDE6' }} />
        ))}
      </div>
    </div>
  )
}
