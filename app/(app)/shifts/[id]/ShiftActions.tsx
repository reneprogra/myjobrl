'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'
import StarRating from '@/components/StarRating'

interface Props {
  shift: any
  isClient: boolean
  currentUserId: string
  myApplication: any | null
  applications: any[]
}

function CountdownTimer({ createdAt }: { createdAt: string }) {
  const [remaining, setRemaining] = useState('')

  useEffect(() => {
    const deadline = new Date(createdAt).getTime() + 15 * 60 * 1000

    function update() {
      const now = Date.now()
      const diff = deadline - now
      if (diff <= 0) {
        setRemaining('Expirado')
        return
      }
      const m = Math.floor(diff / 60000)
      const s = Math.floor((diff % 60000) / 1000)
      setRemaining(`${m}:${s.toString().padStart(2, '0')}`)
    }

    update()
    const interval = setInterval(update, 1000)
    return () => clearInterval(interval)
  }, [createdAt])

  if (remaining === 'Expirado') return null

  return (
    <div className="flex items-center gap-2 p-3 rounded-xl mb-4" style={{ background: '#FEF9C3', border: '1px solid #FDE68A' }}>
      <svg width="16" height="16" fill="none" stroke="#854D0E" strokeWidth="2" viewBox="0 0 24 24">
        <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
      </svg>
      <span className="text-sm font-medium" style={{ color: '#854D0E' }}>
        Responde en: {remaining}
      </span>
    </div>
  )
}

export default function ShiftActions({ shift, isClient, currentUserId, myApplication, applications }: Props) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [showApplyForm, setShowApplyForm] = useState(false)
  const [message, setMessage] = useState('')
  const [proposedPay, setProposedPay] = useState('')
  const [showReviewForm, setShowReviewForm] = useState<string | null>(null)
  const [reviewRating, setReviewRating] = useState(5)
  const [reviewComment, setReviewComment] = useState('')

  async function handleApply() {
    setLoading(true)
    const supabase = createClient()
    await supabase.from('applications').insert({
      shift_id: shift.id,
      worker_id: currentUserId,
      status: 'pending',
      proposed_pay: proposedPay ? parseFloat(proposedPay) : null,
      message: message || null,
    })
    setLoading(false)
    setShowApplyForm(false)
    router.refresh()
  }

  async function handleApplicationAction(appId: string, workerId: string, action: 'accepted' | 'rejected') {
    setLoading(true)
    const supabase = createClient()
    await supabase.from('applications').update({ status: action }).eq('id', appId)

    if (action === 'accepted') {
      // Update shift status to assigned
      await supabase.from('shifts').update({ status: 'assigned' }).eq('id', shift.id)
    }

    setLoading(false)
    router.refresh()
  }

  async function handleMarkCompleted() {
    setLoading(true)
    const supabase = createClient()
    await supabase.from('shifts').update({ status: 'completed' }).eq('id', shift.id)
    setLoading(false)
    router.refresh()
  }

  async function handleCancel() {
    if (!confirm('¿Cancelar este turno?')) return
    setLoading(true)
    const supabase = createClient()
    await supabase.from('shifts').update({ status: 'cancelled' }).eq('id', shift.id)

    // If worker cancels (only shifts assigned to them)
    if (!isClient) {
      // Increment cancellation count
      const { data: profile } = await supabase.from('profiles').select('cancellation_count, rating').eq('id', currentUserId).single()
      if (profile) {
        const newCount = (profile.cancellation_count || 0) + 1
        const updates: any = { cancellation_count: newCount }
        if (newCount >= 3) {
          updates.rating = Math.max(0, (profile.rating || 0) - 0.5)
          updates.has_warning = true
        }
        await supabase.from('profiles').update(updates).eq('id', currentUserId)
      }
    }

    setLoading(false)
    router.refresh()
  }

  async function handleSubmitReview(workerId: string) {
    setLoading(true)
    const supabase = createClient()

    // Insert review
    await supabase.from('reviews').insert({
      shift_id: shift.id,
      reviewer_id: currentUserId,
      reviewed_id: workerId,
      rating: reviewRating,
      comment: reviewComment || null,
    })

    // Update worker average rating
    const { data: reviews } = await supabase
      .from('reviews')
      .select('rating')
      .eq('reviewed_id', workerId)

    if (reviews && reviews.length > 0) {
      const avg = reviews.reduce((s: number, r: any) => s + r.rating, 0) / reviews.length
      await supabase.from('profiles').update({
        rating: parseFloat(avg.toFixed(2)),
        rating_count: reviews.length,
      }).eq('id', workerId)
    }

    setLoading(false)
    setShowReviewForm(null)
    router.refresh()
  }

  async function handleOpenChat(workerId: string) {
    setLoading(true)
    const supabase = createClient()

    // Find existing conversation for this shift + pair
    const { data: existing } = await supabase
      .from('conversations')
      .select('id')
      .eq('shift_id', shift.id)
      .eq('client_id', currentUserId)
      .eq('worker_id', workerId)
      .maybeSingle()

    if (existing) {
      router.push(`/chat/${existing.id}`)
      return
    }

    // Create new conversation
    const { data: created } = await supabase
      .from('conversations')
      .insert({ shift_id: shift.id, client_id: currentUserId, worker_id: workerId })
      .select('id')
      .single()

    setLoading(false)
    if (created) router.push(`/chat/${created.id}`)
  }

  // Worker view
  if (!isClient) {
    if (shift.status !== 'open') {
      return (
        <div className="p-4 rounded-2xl text-center" style={{ background: '#F0EDE6' }}>
          <p className="text-sm" style={{ color: '#6B6860' }}>
            {myApplication?.status === 'accepted' ? '✅ Tu aplicación fue aceptada' :
             myApplication?.status === 'rejected' ? '❌ Tu aplicación fue rechazada' :
             'Este turno ya no está disponible'}
          </p>
        </div>
      )
    }

    if (myApplication) {
      const appStatusLabels: Record<string, string> = {
        pending: '⏳ Aplicación enviada — esperando respuesta',
        accepted: '✅ ¡Tu aplicación fue aceptada!',
        rejected: '❌ Tu aplicación fue rechazada',
      }
      return (
        <div>
          <CountdownTimer createdAt={myApplication.created_at} />
          <div className="p-4 rounded-2xl" style={{ background: '#FFFFFF', border: '1px solid #E5E2DB' }}>
            <p className="text-sm font-medium" style={{ color: '#1A1A1A' }}>
              {appStatusLabels[myApplication.status]}
            </p>
            {myApplication.proposed_pay && (
              <p className="text-xs mt-1" style={{ color: '#6B6860' }}>
                Contraoferta: ${myApplication.proposed_pay.toLocaleString('es-MX')} MXN
              </p>
            )}
            {myApplication.message && (
              <p className="text-xs mt-1" style={{ color: '#6B6860' }}>
                Mensaje: {myApplication.message}
              </p>
            )}
          </div>
        </div>
      )
    }

    if (showApplyForm) {
      return (
        <div className="p-4 rounded-2xl flex flex-col gap-4" style={{ background: '#FFFFFF', border: '1px solid #E5E2DB' }}>
          <h3 className="font-semibold" style={{ fontFamily: 'var(--font-syne)', color: '#1A1A1A' }}>
            Aplicar al turno
          </h3>
          <div>
            <label className="block text-sm font-medium mb-1.5" style={{ color: '#1A1A1A' }}>
              Mensaje (opcional)
            </label>
            <textarea
              value={message}
              onChange={e => setMessage(e.target.value)}
              rows={3}
              placeholder="Cuéntale al cliente sobre tu experiencia..."
              className="w-full px-4 py-3 rounded-xl text-sm outline-none resize-none"
              style={{ background: '#F8F6F1', border: '1.5px solid #E5E2DB', color: '#1A1A1A', fontFamily: 'var(--font-dm-sans)' }}
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1.5" style={{ color: '#1A1A1A' }}>
              Contraoferta de pago (opcional)
            </label>
            <input
              type="number"
              value={proposedPay}
              onChange={e => setProposedPay(e.target.value)}
              placeholder={`Pago ofrecido: $${shift.pay_amount}`}
              className="w-full px-4 py-3 rounded-xl text-sm outline-none"
              style={{ background: '#F8F6F1', border: '1.5px solid #E5E2DB', color: '#1A1A1A', fontFamily: 'var(--font-dm-sans)' }}
            />
          </div>
          <div className="flex gap-3">
            <button
              onClick={() => setShowApplyForm(false)}
              className="flex-1 py-3 rounded-xl text-sm font-medium"
              style={{ background: '#F0EDE6', color: '#1A1A1A' }}
            >
              Cancelar
            </button>
            <button
              onClick={handleApply}
              disabled={loading}
              className="flex-1 py-3 rounded-xl text-sm font-semibold"
              style={{ background: '#1A1A1A', color: '#FFFFFF', opacity: loading ? 0.6 : 1 }}
            >
              {loading ? 'Enviando...' : 'Enviar aplicación'}
            </button>
          </div>
        </div>
      )
    }

    return (
      <div className="flex flex-col gap-3">
        <CountdownTimer createdAt={shift.created_at} />
        <button
          onClick={() => setShowApplyForm(true)}
          className="w-full py-3.5 rounded-xl text-sm font-semibold"
          style={{ background: '#1A1A1A', color: '#FFFFFF' }}
        >
          Aplicar al turno →
        </button>
      </div>
    )
  }

  // Client view
  return (
    <div className="flex flex-col gap-4">
      {/* Action buttons */}
      {shift.status === 'assigned' && (
        <button
          onClick={handleMarkCompleted}
          disabled={loading}
          className="w-full py-3.5 rounded-xl text-sm font-semibold"
          style={{ background: '#166534', color: '#FFFFFF', opacity: loading ? 0.6 : 1 }}
        >
          {loading ? 'Actualizando...' : '✓ Marcar como completado'}
        </button>
      )}

      {['open', 'assigned'].includes(shift.status) && (
        <button
          onClick={handleCancel}
          disabled={loading}
          className="w-full py-3 rounded-xl text-sm font-medium"
          style={{ background: '#FEE2E2', color: '#991B1B' }}
        >
          Cancelar turno
        </button>
      )}

      {/* Applicants */}
      {applications && applications.length > 0 && (
        <div>
          <h3 className="text-base font-semibold mb-3" style={{ fontFamily: 'var(--font-syne)', color: '#1A1A1A' }}>
            Aplicantes ({applications.length})
          </h3>
          <div className="flex flex-col gap-3">
            {applications.map((app: any) => (
              <div key={app.id} className="p-4 rounded-2xl" style={{ background: '#FFFFFF', border: '1px solid #E5E2DB' }}>
                <div className="flex items-center gap-3 mb-3">
                  <Link href={`/profile/${app.worker_id}`}>
                    <div className="w-10 h-10 rounded-full flex items-center justify-center font-bold overflow-hidden"
                      style={{ background: '#F0EDE6', color: '#1A1A1A' }}>
                      {app.profiles?.avatar_url ? (
                        <img src={app.profiles.avatar_url} alt="" className="w-full h-full object-cover" />
                      ) : (
                        app.profiles?.full_name?.charAt(0).toUpperCase()
                      )}
                    </div>
                  </Link>
                  <div className="flex-1">
                    <Link href={`/profile/${app.worker_id}`}>
                      <div className="font-medium text-sm" style={{ color: '#1A1A1A' }}>
                        {app.profiles?.full_name}
                        {app.profiles?.is_verified && (
                          <span className="ml-1 text-xs" style={{ color: '#1877F2' }}>✓</span>
                        )}
                      </div>
                    </Link>
                    {app.profiles?.rating > 0 && (
                      <StarRating rating={app.profiles.rating} size={12} showValue count={app.profiles.rating_count} />
                    )}
                  </div>
                  {app.proposed_pay && (
                    <div className="text-right">
                      <div className="text-sm font-semibold" style={{ color: '#1A1A1A' }}>
                        ${app.proposed_pay.toLocaleString('es-MX')}
                      </div>
                      <div className="text-xs" style={{ color: '#6B6860' }}>contraoferta</div>
                    </div>
                  )}
                </div>

                {app.message && (
                  <p className="text-xs mb-3 leading-relaxed" style={{ color: '#6B6860' }}>{app.message}</p>
                )}

                {app.status === 'pending' && shift.status !== 'cancelled' && (
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleApplicationAction(app.id, app.worker_id, 'rejected')}
                      disabled={loading}
                      className="flex-1 py-2 rounded-xl text-xs font-medium"
                      style={{ background: '#FEE2E2', color: '#991B1B' }}
                    >
                      Rechazar
                    </button>
                    <button
                      onClick={() => handleApplicationAction(app.id, app.worker_id, 'accepted')}
                      disabled={loading}
                      className="flex-1 py-2 rounded-xl text-xs font-semibold"
                      style={{ background: '#1A1A1A', color: '#FFFFFF' }}
                    >
                      Aceptar
                    </button>
                  </div>
                )}

                {app.status === 'accepted' && (
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-xs font-medium px-2 py-1 rounded-full" style={{ background: '#DCFCE7', color: '#166534' }}>
                      ✓ Aceptado
                    </span>
                    <button
                      onClick={() => handleOpenChat(app.worker_id)}
                      disabled={loading}
                      className="text-xs font-semibold px-3 py-1 rounded-full flex items-center gap-1"
                      style={{ background: '#1A1A1A', color: '#FFFFFF', opacity: loading ? 0.6 : 1 }}
                    >
                      <svg width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                        <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/>
                      </svg>
                      Abrir chat
                    </button>
                    {shift.status === 'completed' && (
                      <button
                        onClick={() => setShowReviewForm(app.worker_id)}
                        className="text-xs font-medium underline"
                        style={{ color: '#1A1A1A' }}
                      >
                        Dejar reseña
                      </button>
                    )}
                  </div>
                )}

                {app.status === 'rejected' && (
                  <span className="text-xs font-medium px-2 py-1 rounded-full" style={{ background: '#FEE2E2', color: '#991B1B' }}>
                    Rechazado
                  </span>
                )}

                {/* Review form */}
                {showReviewForm === app.worker_id && (
                  <div className="mt-3 flex flex-col gap-3 pt-3" style={{ borderTop: '1px solid #E5E2DB' }}>
                    <div>
                      <label className="block text-xs font-medium mb-2" style={{ color: '#1A1A1A' }}>Calificación</label>
                      <div className="flex gap-2">
                        {[1, 2, 3, 4, 5].map(n => (
                          <button
                            key={n}
                            type="button"
                            onClick={() => setReviewRating(n)}
                            className="text-2xl"
                          >
                            {n <= reviewRating ? '⭐' : '☆'}
                          </button>
                        ))}
                      </div>
                    </div>
                    <textarea
                      value={reviewComment}
                      onChange={e => setReviewComment(e.target.value)}
                      rows={2}
                      placeholder="Deja un comentario..."
                      className="w-full px-3 py-2 rounded-xl text-xs outline-none resize-none"
                      style={{ background: '#F8F6F1', border: '1px solid #E5E2DB', color: '#1A1A1A' }}
                    />
                    <div className="flex gap-2">
                      <button onClick={() => setShowReviewForm(null)} className="flex-1 py-2 rounded-xl text-xs" style={{ background: '#F0EDE6' }}>
                        Cancelar
                      </button>
                      <button
                        onClick={() => handleSubmitReview(app.worker_id)}
                        disabled={loading}
                        className="flex-1 py-2 rounded-xl text-xs font-semibold"
                        style={{ background: '#1A1A1A', color: '#FFFFFF' }}
                      >
                        Publicar reseña
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {applications?.length === 0 && (
        <div className="p-6 rounded-2xl text-center" style={{ background: '#FFFFFF', border: '1px solid #E5E2DB' }}>
          <div className="text-3xl mb-2">👀</div>
          <p className="text-sm" style={{ color: '#6B6860' }}>Aún no hay aplicantes</p>
        </div>
      )}
    </div>
  )
}
