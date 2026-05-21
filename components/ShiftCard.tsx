'use client'

import Link from 'next/link'
import { motion } from 'framer-motion'
import type { Shift } from '@/lib/types'
import StarRating from './StarRating'

interface ShiftCardProps {
  shift: Shift
  showClientRating?: boolean
  applicationStatus?: string
  distanceKm?: number
  isPaid?: boolean
}

const statusColors: Record<string, { bg: string; text: string; label: string }> = {
  open: { bg: '#DCFCE7', text: '#166534', label: 'Abierto' },
  assigned: { bg: '#DBEAFE', text: '#1E40AF', label: 'Asignado' },
  in_progress: { bg: '#FEF9C3', text: '#854D0E', label: 'En curso' },
  completed: { bg: '#F3F4F6', text: '#374151', label: 'Completado' },
  cancelled: { bg: '#FEE2E2', text: '#991B1B', label: 'Cancelado' },
  closed: { bg: '#FEE2E2', text: '#991B1B', label: 'Turno cerrado' },
  expired: { bg: '#F3F4F6', text: '#6B7280', label: 'Vencido' },
  pending: { bg: '#FEF9C3', text: '#854D0E', label: 'Pendiente' },
  accepted: { bg: '#DCFCE7', text: '#166534', label: 'Aceptado' },
  rejected: { bg: '#FEE2E2', text: '#991B1B', label: 'Rechazado' },
}

function computeStatusKey(shift: Shift, applicationStatus?: string): string {
  if (applicationStatus) return applicationStatus
  if (shift.status === 'assigned') {
    const shiftDateTime = new Date(`${shift.shift_date}T${shift.shift_start}`)
    if (new Date() > shiftDateTime) return 'closed'
  }
  return shift.status
}

function formatDate(dateStr: string) {
  const d = new Date(dateStr + 'T00:00:00')
  return d.toLocaleDateString('es-MX', { weekday: 'short', day: 'numeric', month: 'short' })
}

function formatTime(t: string) {
  const [h, m] = t.split(':')
  const hour = parseInt(h)
  const ampm = hour >= 12 ? 'PM' : 'AM'
  const h12 = hour % 12 || 12
  return `${h12}:${m} ${ampm}`
}

function formatDistance(km: number): string {
  return km < 1 ? `${Math.round(km * 1000)} m` : `${km.toFixed(1)} km`
}

export default function ShiftCard({ shift, showClientRating, applicationStatus, distanceKm, isPaid }: ShiftCardProps) {
  const statusKey = computeStatusKey(shift, applicationStatus)
  const statusInfo = statusColors[statusKey] || statusColors.open

  return (
    <Link href={`/shifts/${shift.id}`}>
      <motion.div
        className="rounded-2xl p-4"
        style={{ background: 'var(--card)', border: '1px solid var(--border)' }}
        whileHover={{ y: -2, boxShadow: '0 6px 16px rgba(0,0,0,0.08)' }}
        whileTap={{ scale: 0.98 }}
        transition={{ type: 'spring', stiffness: 400, damping: 30 }}
      >
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1 flex-wrap">
              <span className="text-xl">{shift.categories?.emoji}</span>
              <span
                className="text-xs font-medium px-2 py-0.5 rounded-full"
                style={{ background: statusInfo.bg, color: statusInfo.text }}
              >
                {statusInfo.label}
              </span>
              {isPaid && (
                <span
                  className="text-xs font-semibold px-2 py-0.5 rounded-full"
                  style={{ background: '#DCFCE7', color: '#166534' }}
                >
                  Pagado ✓
                </span>
              )}
            </div>
            <h3
              className="font-semibold text-base truncate"
              style={{ fontFamily: 'var(--font-syne)', color: 'var(--fg)' }}
            >
              {shift.title}
            </h3>
            <div className="flex items-center gap-2 mt-0.5">
              <p className="text-sm" style={{ color: 'var(--muted)' }}>
                {shift.city}{shift.state ? `, ${shift.state}` : ''}
              </p>
              {distanceKm !== undefined && (
                <span
                  className="text-xs font-medium px-1.5 py-0.5 rounded-full"
                  style={{ background: '#DCFCE7', color: '#166534' }}
                >
                  📍 {formatDistance(distanceKm)}
                </span>
              )}
            </div>
          </div>
          <div className="text-right flex-shrink-0">
            <div
              className="text-lg font-bold"
              style={{ fontFamily: 'var(--font-syne)', color: 'var(--fg)' }}
            >
              ${shift.pay_amount.toLocaleString('es-MX')}
            </div>
            <div className="text-xs" style={{ color: 'var(--muted)' }}>{shift.pay_currency}</div>
          </div>
        </div>

        <div className="mt-3 flex items-center gap-3 text-sm" style={{ color: 'var(--muted)' }}>
          <div className="flex items-center gap-1">
            <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>
            </svg>
            <span>{formatDate(shift.shift_date)}</span>
          </div>
          <div className="flex items-center gap-1">
            <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
            </svg>
            <span>{formatTime(shift.shift_start)} – {formatTime(shift.shift_end)}</span>
          </div>
          {shift.slots > 1 && (
            <div className="flex items-center gap-1">
              <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 00-3-3.87"/><path d="M16 3.13a4 4 0 010 7.75"/>
              </svg>
              <span>{shift.slots} cupos</span>
            </div>
          )}
        </div>

        {showClientRating && shift.profiles && shift.profiles.rating > 0 && (
          <div className="mt-2 flex items-center gap-1">
            <span className="text-xs" style={{ color: 'var(--muted)' }}>Cliente:</span>
            <StarRating rating={shift.profiles.rating} size={12} showValue />
          </div>
        )}
      </motion.div>
    </Link>
  )
}
