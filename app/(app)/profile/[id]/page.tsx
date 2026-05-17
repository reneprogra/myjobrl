import { createClient } from '@/lib/supabase/server'
import { redirect, notFound } from 'next/navigation'
import Link from 'next/link'
import StarRating from '@/components/StarRating'
import PortfolioUploader from '@/components/PortfolioUploader'
import PortfolioGrid from '@/components/PortfolioGrid'
import AvatarUpload from '@/components/AvatarUpload'
import StripeConnectOnboarding from '@/components/payments/StripeConnectOnboarding'

export default async function ProfilePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', id)
    .single()

  if (!profile) notFound()

  const isOwn = user.id === id

  // Get worker categories
  const { data: workerCats } = await supabase
    .from('worker_categories')
    .select('*, categories(*)')
    .eq('worker_id', id)

  // Get portfolio photos
  const { data: photos } = await supabase
    .from('portfolio_photos')
    .select('*')
    .eq('worker_id', id)
    .order('created_at', { ascending: false })
    .limit(6)

  // Get reviews for display (latest 10)
  const { data: reviews } = await supabase
    .from('reviews')
    .select('*, profiles!reviews_reviewer_id_fkey(*)')
    .eq('reviewed_id', id)
    .order('created_at', { ascending: false })
    .limit(10)

  // Real count and average directly from reviews table (source of truth)
  const { data: allRatings } = await supabase
    .from('reviews')
    .select('rating')
    .eq('reviewed_id', id)

  const realReviewCount = allRatings?.length ?? 0
  const realAvgRating = realReviewCount > 0
    ? allRatings!.reduce((sum, r) => sum + r.rating, 0) / realReviewCount
    : 0

  // Sync profile if values are out of date
  if (
    realReviewCount !== profile.rating_count ||
    (realReviewCount > 0 && Math.abs(parseFloat(realAvgRating.toFixed(2)) - profile.rating) > 0.01)
  ) {
    await supabase.from('profiles').update({
      rating_count: realReviewCount,
      rating: realReviewCount > 0 ? parseFloat(realAvgRating.toFixed(2)) : 0,
    }).eq('id', id)
  }

  // Stripe Connect account (only needed for own worker profile)
  let stripeAccount = null
  if (isOwn && profile.user_type === 'worker') {
    const { data } = await supabase
      .from('stripe_accounts')
      .select('stripe_account_id, status, charges_enabled, payouts_enabled')
      .eq('user_id', id)
      .single()
    stripeAccount = data
  }

  // Completed shifts count
  const { count: completedCount } = await supabase
    .from('applications')
    .select('*', { count: 'exact', head: true })
    .eq('worker_id', id)
    .eq('status', 'accepted')

  // Sanción temporal: >2 turnos cerrados (assigned + pasado su horario) en los últimos 30 días
  const thirtyDaysAgo = new Date()
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

  const { data: acceptedAppsForSanction } = await supabase
    .from('applications')
    .select('shifts(shift_date, shift_start, status, created_at)')
    .eq('worker_id', id)
    .eq('status', 'accepted')
    .gte('created_at', thirtyDaysAgo.toISOString())

  const closedShiftsCount = acceptedAppsForSanction?.filter((app: any) => {
    if (!app.shifts) return false
    if (app.shifts.status !== 'assigned') return false
    return new Date() > new Date(`${app.shifts.shift_date}T${app.shifts.shift_start}`)
  }).length ?? 0

  const hasSanction = closedShiftsCount > 2

  return (
    <div className="pb-8">
      {/* Dark header */}
      <div className="relative px-4 pt-6 pb-8" style={{ background: '#1A1A1A', color: '#FFFFFF' }}>
        {isOwn && (
          <div className="flex justify-end mb-4">
            <Link
              href="/settings"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium"
              style={{ background: 'rgba(255,255,255,0.1)' }}
            >
              <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z"/>
              </svg>
              Ajustes
            </Link>
          </div>
        )}

        {!isOwn && (
          <Link href="/shifts" className="block mb-4">
            <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <polyline points="15 18 9 12 15 6"/>
            </svg>
          </Link>
        )}

        {/* Avatar */}
        <div className="flex items-start gap-4">
          {isOwn && profile.user_type === 'worker' ? (
            <AvatarUpload
              userId={id}
              initialAvatarUrl={profile.avatar_url}
              displayName={profile.full_name}
            />
          ) : (
            <div
              className="w-20 h-20 rounded-full flex items-center justify-center text-3xl font-bold flex-shrink-0 overflow-hidden"
              style={{ background: 'var(--secondary-bg)', color: 'var(--fg)' }}
            >
              {profile.avatar_url ? (
                <img src={profile.avatar_url} alt="" className="w-full h-full object-cover" />
              ) : (
                profile.full_name.charAt(0).toUpperCase()
              )}
            </div>
          )}
          <div className="flex-1 pt-1">
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-xl font-bold" style={{ fontFamily: 'var(--font-syne)' }}>
                {profile.full_name}
              </h1>
              {profile.is_verified && (
                <span className="flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full"
                  style={{ background: '#1877F2', color: '#FFFFFF' }}>
                  ✓ Verificado
                </span>
              )}
            </div>
            {profile.has_warning && (
              <span className="text-xs" style={{ color: '#F59E0B' }}>⚠️ Advertencia por cancelaciones</span>
            )}
            {hasSanction && (
              <span className="inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full mt-1"
                style={{ background: '#FEE2E2', color: '#991B1B' }}>
                🚫 Sanción temporal
              </span>
            )}
            {profile.city && (
              <p className="text-sm mt-1 opacity-70">📍 {profile.city}{profile.state ? `, ${profile.state}` : ''}</p>
            )}
            {profile.bio && (
              <p className="text-sm mt-2 opacity-80 leading-relaxed">{profile.bio}</p>
            )}
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-3 mt-6">
          <div className="text-center">
            <div className="text-2xl font-bold" style={{ fontFamily: 'var(--font-syne)' }}>
              {completedCount || 0}
            </div>
            <div className="text-xs opacity-60">Turnos</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold" style={{ fontFamily: 'var(--font-syne)' }}>
              {realAvgRating > 0 ? realAvgRating.toFixed(1) : '–'}
            </div>
            <div className="text-xs opacity-60">Calificación</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold" style={{ fontFamily: 'var(--font-syne)' }}>
              {realReviewCount}
            </div>
            <div className="text-xs opacity-60">Reseñas</div>
          </div>
        </div>
      </div>

      <div className="px-4 mt-4 flex flex-col gap-5">
        {/* Service categories */}
        {workerCats && workerCats.length > 0 && (
          <div>
            <h2 className="text-base font-semibold mb-2" style={{ fontFamily: 'var(--font-syne)', color: 'var(--fg)' }}>
              Servicios
            </h2>
            <div className="flex flex-wrap gap-2">
              {workerCats.map((wc: any) => (
                <span
                  key={wc.id}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium"
                  style={{ background: '#1A1A1A', color: '#FFFFFF' }}
                >
                  {wc.categories?.emoji} {wc.categories?.name}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Portfolio */}
        {profile.user_type === 'worker' && (
          isOwn ? (
            <PortfolioUploader
              workerId={id}
              initialPhotos={(photos || []).map((p: any) => ({
                id: p.id,
                photo_url: p.photo_url,
                caption: p.caption,
              }))}
            />
          ) : (
            <div>
              <h2 className="text-base font-semibold mb-2" style={{ fontFamily: 'var(--font-syne)', color: 'var(--fg)' }}>
                Portafolio
              </h2>
              <PortfolioGrid
                photos={(photos || []).map((p: any) => ({
                  id: p.id,
                  photo_url: p.photo_url,
                  caption: p.caption,
                }))}
              />
            </div>
          )
        )}

        {/* Stripe Connect — own worker profile only */}
        {isOwn && profile.user_type === 'worker' && (
          <div>
            <h2 className="text-base font-semibold mb-2" style={{ fontFamily: 'var(--font-syne)', color: 'var(--fg)' }}>
              Pagos
            </h2>
            <StripeConnectOnboarding stripeAccount={stripeAccount} />
          </div>
        )}

        {/* Reviews — workers only */}
        {profile.user_type === 'worker' && <div>
          <h2 className="text-base font-semibold mb-3" style={{ fontFamily: 'var(--font-syne)', color: 'var(--fg)' }}>
            Reseñas ({realReviewCount})
          </h2>
          {realAvgRating > 0 && (
            <div className="flex items-center gap-3 mb-4 p-4 rounded-2xl" style={{ background: 'var(--card)', border: '1px solid var(--border)' }}>
              <div className="text-4xl font-bold" style={{ fontFamily: 'var(--font-syne)', color: 'var(--fg)' }}>
                {realAvgRating.toFixed(1)}
              </div>
              <div>
                <StarRating rating={realAvgRating} size={18} />
                <div className="text-xs mt-1" style={{ color: 'var(--muted)' }}>
                  {realReviewCount} reseña{realReviewCount !== 1 ? 's' : ''}
                </div>
              </div>
            </div>
          )}
          {reviews && reviews.length > 0 ? (
            <div className="flex flex-col gap-3">
              {reviews.map((review: any) => (
                <div key={review.id} className="p-4 rounded-2xl" style={{ background: 'var(--card)', border: '1px solid var(--border)' }}>
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <div
                        className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold"
                        style={{ background: 'var(--secondary-bg)', color: 'var(--fg)' }}
                      >
                        {review.profiles?.full_name?.charAt(0).toUpperCase()}
                      </div>
                      <span className="text-sm font-medium" style={{ color: 'var(--fg)' }}>
                        {review.profiles?.full_name}
                      </span>
                    </div>
                    <StarRating rating={review.rating} size={14} />
                  </div>
                  {review.comment && (
                    <p className="text-sm leading-relaxed" style={{ color: 'var(--muted)' }}>{review.comment}</p>
                  )}
                  <p className="text-xs mt-2" style={{ color: 'var(--text-muted)' }}>
                    {new Date(review.created_at).toLocaleDateString('es-MX', { day: 'numeric', month: 'long', year: 'numeric' })}
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-6 rounded-2xl text-center" style={{ background: 'var(--card)', border: '1px solid var(--border)' }}>
              <div className="text-3xl mb-2">⭐</div>
              <p className="text-sm" style={{ color: 'var(--muted)' }}>Sin reseñas aún</p>
            </div>
          )}
        </div>}
      </div>
    </div>
  )
}
