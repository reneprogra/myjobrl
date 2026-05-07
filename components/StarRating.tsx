interface StarRatingProps {
  rating: number
  size?: number
  showValue?: boolean
  count?: number
}

export default function StarRating({ rating, size = 16, showValue = false, count }: StarRatingProps) {
  return (
    <div className="flex items-center gap-1">
      <div className="flex items-center">
        {[1, 2, 3, 4, 5].map((star) => {
          const filled = star <= Math.floor(rating)
          const partial = !filled && star === Math.ceil(rating) && rating % 1 > 0
          return (
            <svg
              key={star}
              width={size}
              height={size}
              viewBox="0 0 24 24"
              fill={filled ? '#F59E0B' : partial ? 'url(#half)' : 'none'}
              stroke={filled || partial ? '#F59E0B' : '#D1D5DB'}
              strokeWidth="1.5"
            >
              {partial && (
                <defs>
                  <linearGradient id="half">
                    <stop offset="50%" stopColor="#F59E0B"/>
                    <stop offset="50%" stopColor="transparent"/>
                  </linearGradient>
                </defs>
              )}
              <polygon points="12,2 15.09,8.26 22,9.27 17,14.14 18.18,21.02 12,17.77 5.82,21.02 7,14.14 2,9.27 8.91,8.26"/>
            </svg>
          )
        })}
      </div>
      {showValue && (
        <span className="text-sm font-medium" style={{ color: '#1A1A1A' }}>
          {rating.toFixed(1)}
          {count !== undefined && (
            <span className="font-normal" style={{ color: '#6B6860' }}> ({count})</span>
          )}
        </span>
      )}
    </div>
  )
}
