import { createClient } from '@/lib/supabase/server'
import { redirect, notFound } from 'next/navigation'
import PaymentPageClient from './PaymentPageClient'

export default async function PaymentPage({ params }: { params: Promise<{ shiftId: string }> }) {
  const { shiftId } = await params
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // Only the client who owns the shift can access this page
  const { data: shift } = await supabase
    .from('shifts')
    .select('*, categories(*), profiles(*)')
    .eq('id', shiftId)
    .eq('client_id', user.id)
    .single()

  if (!shift) notFound()

  // Get the accepted worker for this shift
  const { data: acceptedApp } = await supabase
    .from('applications')
    .select('*, profiles(*)')
    .eq('shift_id', shiftId)
    .eq('status', 'accepted')
    .single()

  if (!acceptedApp) {
    redirect(`/shifts/${shiftId}`)
  }

  // Payment intent is created client-side in PaymentPageClient via /api/payments/create-intent
  return (
    <PaymentPageClient
      shift={shift}
      workerName={acceptedApp.profiles?.full_name || 'Worker'}
      workerId={acceptedApp.worker_id}
      publishableKey={process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!}
    />
  )
}
