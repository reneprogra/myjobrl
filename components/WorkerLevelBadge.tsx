import Image from 'next/image'
import { getWorkerLevel, levelConfig, type WorkerLevel } from '@/lib/workerLevel'

interface Props {
  completedCount: number
  rating: number
  size?: 'sm' | 'md' | 'lg'
  /** Pass a pre-computed level to skip recalculation */
  level?: WorkerLevel
}

export default function WorkerLevelBadge({ completedCount, rating, size = 'sm', level: levelProp }: Props) {
  const level = levelProp ?? getWorkerLevel(completedCount, rating)
  if (!level) return null

  const cfg = levelConfig[level]
  const imgSize = size === 'lg' ? 24 : size === 'md' ? 18 : 14

  return (
    <span
      className="inline-flex items-center gap-1 rounded-full font-semibold"
      style={{
        background: cfg.bg,
        color: cfg.color,
        fontSize: size === 'lg' ? 13 : size === 'md' ? 11 : 10,
        padding: size === 'lg' ? '3px 8px' : size === 'md' ? '2px 6px' : '1px 5px',
      }}
    >
      <Image src={cfg.image} alt={cfg.label} width={imgSize} height={imgSize} />
      {cfg.label}
    </span>
  )
}
