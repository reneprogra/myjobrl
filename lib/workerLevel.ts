export type WorkerLevel = 'confiable' | 'pro' | 'elite' | null

export function getWorkerLevel(completedCount: number, rating: number): WorkerLevel {
  if (completedCount >= 50 && rating >= 4.5) return 'elite'
  if (completedCount >= 10 && rating >= 4.0) return 'pro'
  if (completedCount >= 1) return 'confiable'
  return null
}

export const levelConfig = {
  confiable: {
    label: 'Confiable',
    image: '/logo-confiable.png',
    color: '#15803D',
    bg: '#DCFCE7',
    order: 1,
  },
  pro: {
    label: 'Pro',
    image: '/logo-pro.png',
    color: '#1D4ED8',
    bg: '#DBEAFE',
    order: 2,
  },
  elite: {
    label: 'Elite',
    image: '/logo-elite.png',
    color: '#B45309',
    bg: '#FEF3C7',
    order: 3,
  },
} as const

export const levelBenefits: Record<NonNullable<WorkerLevel>, string[]> = {
  confiable: ['Perfil verificado'],
  pro: ['Perfil verificado', 'Prioridad en búsquedas'],
  elite: ['Perfil verificado', 'Máxima prioridad en búsquedas', 'Badge dorado exclusivo'],
}

export function levelOrder(level: WorkerLevel): number {
  if (!level) return 0
  return levelConfig[level].order
}
