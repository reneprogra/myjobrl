export default function ChatLoading() {
  return (
    <div className="pb-8">
      <div className="px-4 pt-6 pb-4">
        <div className="h-8 w-36 rounded-xl animate-pulse" style={{ background: '#F0EDE6' }} />
      </div>
      <div className="flex flex-col">
        {[1, 2, 3, 4, 5].map(i => (
          <div
            key={i}
            className="flex items-center gap-3 px-4 py-3"
            style={{ borderBottom: '1px solid #F0EDE6' }}
          >
            <div className="w-11 h-11 rounded-full animate-pulse flex-shrink-0" style={{ background: '#F0EDE6' }} />
            <div className="flex-1">
              <div className="h-4 w-32 rounded-lg animate-pulse mb-2" style={{ background: '#F0EDE6' }} />
              <div className="h-3 w-48 rounded-lg animate-pulse" style={{ background: '#F0EDE6' }} />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
