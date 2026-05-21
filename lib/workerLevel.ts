export type WorkerLevel = 'confiable' | 'intermedio' | 'avanzado' | 'pro' | 'elite' | null

export function getWorkerLevel(completedCount: number, rating: number): WorkerLevel {
  if (completedCount >= 100 && rating >= 4.5) return 'elite'
  if (completedCount >= 50 && rating >= 4.0) return 'pro'
  if (completedCount >= 25) return 'avanzado'
  if (completedCount >= 10) return 'intermedio'
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
  intermedio: {
    label: 'Intermedio',
    image: '/logo-intermedio.png',
    color: '#0369A1',
    bg: '#E0F2FE',
    order: 2,
  },
  avanzado: {
    label: 'Avanzado',
    image: '/logo-avanzado.png',
    color: '#7C3AED',
    bg: '#EDE9FE',
    order: 3,
  },
  pro: {
    label: 'Pro',
    image: '/logo-pro.png',
    color: '#1D4ED8',
    bg: '#DBEAFE',
    order: 4,
  },
  elite: {
    label: 'Elite',
    image: '/logo-elite.png',
    color: '#B45309',
    bg: '#FEF3C7',
    order: 5,
  },
} as const

export const levelBenefits: Record<NonNullable<WorkerLevel>, string[]> = {
  confiable: ['Perfil verificado'],
  intermedio: ['Perfil verificado', 'Acceso a más turnos'],
  avanzado: ['Perfil verificado', 'Acceso a más turnos', 'Mayor visibilidad'],
  pro: ['Perfil verificado', 'Prioridad en búsquedas'],
  elite: ['Perfil verificado', 'Máxima prioridad en búsquedas', 'Badge dorado exclusivo'],
}

export function levelOrder(level: WorkerLevel): number {
  if (!level) return 0
  return levelConfig[level].order
}
