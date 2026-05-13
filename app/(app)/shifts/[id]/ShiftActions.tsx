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
  acceptedApplication: any | null
  isClosed?: boolean
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

export default function ShiftActions({ shift, isClient, currentUserId, myApplication, applications, acceptedApplication, isClosed }: Props) {
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
      // Move shift to in_progress so it disappears from available list
      await supabase.from('shifts').update({ status: 'in_progress' }).eq('id', shift.id)
    }

    setLoading(false)
    router.refresh()
  }

  async function handleMarkCompleted() {
    setLoading(true)
    const supabase = createClient()
    await supabase.from('shifts').update({ status: 'completed' }).eq('id', shift.id)

    // Notify the accepted worker via chat if a conversation exists
    const workerId = acceptedApplication?.worker_id
    if (workerId) {
      const { data: conv } = await supabase
        .from('conversations')
        .select('id')
        .eq('shift_id', shift.id)
        .eq('client_id', currentUserId)
        .eq('worker_id', workerId)
        .maybeSingle()

      if (conv) {
        await supabase.from('messages').insert({
          conversation_id: conv.id,
          sender_id: currentUserId,
          content: '✅ El cliente ha confirmado que el trabajo fue completado. Espera el pago.',
        })
      }
    }

    setLoading(false)
    router.refresh()
  }

  async function handleCancel() {
    if (!confirm('¿Cancelar este turno?')) return
    setLoading(true)
    const supabase = createClient()
    await supabase.from('shifts').update({ status: 'cancelled' }).eq('id', shift.id)

    if (!isClient) {
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

    await supabase.from('reviews').insert({
      shift_id: shift.id,
      reviewer_id: currentUserId,
      reviewed_id: workerId,
      rating: reviewRating,
      comment: reviewComment || null,
    })

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

    const { data: created } = await supabase
      .from('conversations')
      .insert({ shift_id: shift.id, client_id: currentUserId, worker_id: workerId })
      .select('id')
      .single()

    setLoading(false)
    if (created) router.push(`/chat/${created.id}`)
  }

  // ─── Worker view ────────────────────────────────────────────────
  if (!isClient) {
    // Shift is no longer open and this worker didn't get it
    if (!['open', 'in_progress', 'assigned'].includes(shift.status)) {
      return (
        <div className="p-4 rounded-2xl text-center" style={{ background: 'var(--secondary-bg)' }}>
          <p className="text-sm" style={{ color: 'var(--muted)' }}>
            {myApplication?.status === 'accepted' ? '✅ Tu aplicación fue aceptada' :
             myApplication?.status === 'rejected' ? '❌ Tu aplicación fue rechazada' :
             'Este turno ya no está disponible'}
          </p>
        </div>
      )
    }

    // Worker's application was accepted
    if (myApplication?.status === 'accepted') {
      // Client confirmed work is done
      if (shift.status === 'completed') {
        return (
          <div className="p-4 rounded-2xl flex flex-col gap-2" style={{ background: '#DCFCE7', border: '1px solid #BBF7D0' }}>
            <div className="flex items-center gap-2">
              <span className="text-xl">✅</span>
              <p className="text-sm font-semibold" style={{ color: '#166534' }}>
                El cliente confirmó el trabajo
              </p>
            </div>
            <p className="text-xs" style={{ color: '#166534' }}>
              El pago será procesado en breve. ¡Buen trabajo!
            </p>
          </div>
        )
      }
      // Shift in progress
      return (
        <div className="p-4 rounded-2xl flex flex-col gap-2" style={{ background: '#FEF9C3', border: '1px solid #FDE68A' }}>
          <div className="flex items-center gap-2">
            <span className="text-xl">🟡</span>
            <p className="text-sm font-semibold" style={{ color: '#854D0E' }}>
              Turno en curso
            </p>
          </div>
          <p className="text-xs" style={{ color: '#92400E' }}>
            El cliente te ha asignado este turno. Preséntate puntualmente.
          </p>
          {myApplication.proposed_pay && (
            <p className="text-xs mt-1" style={{ color: '#92400E' }}>
              Pago acordado: ${myApplication.proposed_pay.toLocaleString('es-MX')} MXN
            </p>
          )}
        </div>
      )
    }

    // Worker applied — show status
    if (myApplication) {
      const appStatusLabels: Record<string, string> = {
        pending: '⏳ Aplicación enviada — esperando respuesta',
        accepted: '✅ ¡Tu aplicación fue aceptada!',
        rejected: '❌ Tu aplicación fue rechazada',
      }
      return (
        <div>
          <CountdownTimer createdAt={myApplication.created_at} />
          <div className="p-4 rounded-2xl" style={{ background: 'var(--card)', border: '1px solid var(--border)' }}>
            <p className="text-sm font-medium" style={{ color: 'var(--fg)' }}>
              {appStatusLabels[myApplication.status]}
            </p>
            {myApplication.proposed_pay && (
              <p className="text-xs mt-1" style={{ color: 'var(--muted)' }}>
                Contraoferta: ${myApplication.proposed_pay.toLocaleString('es-MX')} MXN
              </p>
            )}
            {myApplication.message && (
              <p className="text-xs mt-1" style={{ color: 'var(--muted)' }}>
                Mensaje: {myApplication.message}
              </p>
            )}
          </div>
        </div>
      )
    }

    // Apply form
    if (showApplyForm) {
      return (
        <div className="p-4 rounded-2xl flex flex-col gap-4" style={{ background: 'var(--card)', border: '1px solid var(--border)' }}>
          <h3 className="font-semibold" style={{ fontFamily: 'var(--font-syne)', color: 'var(--fg)' }}>
            Aplicar al turno
          </h3>
          <div>
            <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--fg)' }}>
              Mensaje (opcional)
            </label>
            <textarea
              value={message}
              onChange={e => setMessage(e.target.value)}
              rows={3}
              placeholder="Cuéntale al cliente sobre tu experiencia..."
              className="w-full px-4 py-3 rounded-xl text-sm outline-none resize-none"
              style={{ background: 'var(--bg)', border: '1.5px solid var(--border)', color: 'var(--fg)', fontFamily: 'var(--font-dm-sans)' }}
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--fg)' }}>
              Contraoferta de pago (opcional)
            </label>
            <input
              type="number"
              value={proposedPay}
              onChange={e => setProposedPay(e.target.value)}
              placeholder={`Pago ofrecido: $${shift.pay_amount}`}
              className="w-full px-4 py-3 rounded-xl text-sm outline-none"
              style={{ background: 'var(--bg)', border: '1.5px solid var(--border)', color: 'var(--fg)', fontFamily: 'var(--font-dm-sans)' }}
            />
          </div>
          <div className="flex gap-3">
            <button
              onClick={() => setShowApplyForm(false)}
              className="flex-1 py-3 rounded-xl text-sm font-medium"
              style={{ background: 'var(--secondary-bg)', color: 'var(--fg)' }}
            >
              Cancelar
            </button>
            <button
              onClick={handleApply}
              disabled={loading}
              className="flex-1 py-3 rounded-xl text-sm font-semibold"
              style={{ background: 'var(--btn-bg)', color: 'var(--btn-fg)', opacity: loading ? 0.6 : 1 }}
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
          style={{ background: 'var(--btn-bg)', color: 'var(--btn-fg)' }}
        >
          Aplicar al turno →
        </button>
      </div>
    )
  }

  // ─── Client view ────────────────────────────────────────────────
  return (
    <div className="flex flex-col gap-4">

      {/* En curso: worker info + prominent "Finalizado" button */}
      {['in_progress', 'assigned'].includes(shift.status) && (
        <div className="flex flex-col gap-3">
          <div className="p-4 rounded-2xl" style={{ background: '#FEF9C3', border: '1px solid #FDE68A' }}>
            <p className="text-sm font-semibold" style={{ color: '#854D0E' }}>🟡 Turno en curso</p>
            {acceptedApplication?.profiles?.full_name && (
              <p className="text-xs mt-1" style={{ color: '#92400E' }}>
                Worker: <span className="font-semibold">{acceptedApplication.profiles.full_name}</span>
              </p>
            )}
          </div>
          <button
            onClick={handleMarkCompleted}
            disabled={loading}
            className="w-full py-4 rounded-2xl text-base font-bold tracking-wide"
            style={{
              background: '#16A34A',
              color: '#FFFFFF',
              opacity: loading ? 0.7 : 1,
              boxShadow: '0 4px 14px rgba(22,163,74,0.35)',
            }}
          >
            {loading ? 'Procesando...' : '✓ Finalizado — el trabajo está completo'}
          </button>
        </div>
      )}

      {/* Cancel button */}
      {['open', 'in_progress', 'assigned'].includes(shift.status) && (
        <button
          onClick={handleCancel}
          disabled={loading}
          className="w-full py-3 rounded-xl text-sm font-medium"
          style={{ background: '#FEE2E2', color: '#991B1B' }}
        >
          Cancelar turno
        </button>
      )}

      {/* Applicants list */}
      {applications && applications.length > 0 && (
        <div>
          <h3 className="text-base font-semibold mb-3" style={{ fontFamily: 'var(--font-syne)', color: 'var(--fg)' }}>
            Aplicantes ({applications.length})
          </h3>
          <div className="flex flex-col gap-3">
            {applications.map((app: any) => (
              <div key={app.id} className="p-4 rounded-2xl" style={{ background: 'var(--card)', border: '1px solid var(--border)' }}>
                <div className="flex items-center gap-3 mb-3">
                  <Link href={`/profile/${app.worker_id}`}>
                    <div className="w-10 h-10 rounded-full flex items-center justify-center font-bold overflow-hidden"
                      style={{ background: 'var(--secondary-bg)', color: 'var(--fg)' }}>
                      {app.profiles?.avatar_url ? (
                        <img src={app.profiles.avatar_url} alt="" className="w-full h-full object-cover" />
                      ) : (
                        app.profiles?.full_name?.charAt(0).toUpperCase()
                      )}
                    </div>
                  </Link>
                  <div className="flex-1">
                    <Link href={`/profile/${app.worker_id}`}>
                      <div className="font-medium text-sm" style={{ color: 'var(--fg)' }}>
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
                      <div className="text-sm font-semibold" style={{ color: 'var(--fg)' }}>
                        ${app.proposed_pay.toLocaleString('es-MX')}
                      </div>
                      <div className="text-xs" style={{ color: 'var(--muted)' }}>contraoferta</div>
                    </div>
                  )}
                </div>

                {app.message && (
                  <p className="text-xs mb-3 leading-relaxed" style={{ color: 'var(--muted)' }}>{app.message}</p>
                )}

                {app.status === 'pending' && shift.status === 'open' && (
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
                      style={{ background: 'var(--btn-bg)', color: 'var(--btn-fg)' }}
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
                      style={{ background: 'var(--btn-bg)', color: 'var(--btn-fg)', opacity: loading ? 0.6 : 1 }}
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
                        style={{ color: 'var(--fg)' }}
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
                  <div className="mt-3 flex flex-col gap-3 pt-3" style={{ borderTop: '1px solid var(--border)' }}>
                    <div>
                      <label className="block text-xs font-medium mb-2" style={{ color: 'var(--fg)' }}>Calificación</label>
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
                      style={{ background: 'var(--bg)', border: '1px solid var(--border)', color: 'var(--fg)' }}
                    />
                    <div className="flex gap-2">
                      <button onClick={() => setShowReviewForm(null)} className="flex-1 py-2 rounded-xl text-xs" style={{ background: 'var(--secondary-bg)', color: 'var(--fg)' }}>
                        Cancelar
                      </button>
                      <button
                        onClick={() => handleSubmitReview(app.worker_id)}
                        disabled={loading}
                        className="flex-1 py-2 rounded-xl text-xs font-semibold"
                        style={{ background: 'var(--btn-bg)', color: 'var(--btn-fg)' }}
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

      {applications?.length === 0 && shift.status === 'open' && (
        <div className="p-6 rounded-2xl text-center" style={{ background: 'var(--card)', border: '1px solid var(--border)' }}>
          <div className="text-3xl mb-2">👀</div>
          <p className="text-sm" style={{ color: 'var(--muted)' }}>Aún no hay aplicantes</p>
        </div>
      )}

      {/* Payment button — only appears after client clicks Finalizado (completed) */}
      {shift.status === 'completed' && acceptedApplication && (
        <div className="p-4 rounded-2xl flex flex-col gap-3" style={{ background: '#EFF6FF', border: '1px solid #BFDBFE' }}>
          <p className="text-sm font-medium" style={{ color: '#1E40AF' }}>
            ✅ Trabajo confirmado. Realiza el pago a{' '}
            <span className="font-semibold">{acceptedApplication.profiles?.full_name || 'el worker'}</span>.
          </p>
          <Link
            href={`/payments/${shift.id}`}
            className="w-full py-4 rounded-2xl text-base font-bold text-center block"
            style={{ background: '#1877F2', color: '#FFFFFF' }}
          >
            Pagar turno — ${shift.pay_amount.toLocaleString('es-MX')} MXN
          </Link>
        </div>
      )}
    </div>
  )
}
