import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import GroupsClient from './GroupsClient'

export default async function GroupsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase.from('profiles').select('*').eq('id', user.id).single()

  const { data: groups } = await supabase
    .from('groups')
    .select('*, categories(*), profiles(*)')
    .order('member_count', { ascending: false })

  const { data: myGroups } = await supabase
    .from('group_members')
    .select('group_id')
    .eq('worker_id', user.id)

  const { data: categories } = await supabase.from('categories').select('*').order('name')

  const myGroupIds = myGroups?.map(g => g.group_id) || []

  return (
    <GroupsClient
      groups={groups || []}
      myGroupIds={myGroupIds}
      currentUserId={user.id}
      profile={profile}
      categories={categories || []}
    />
  )
}
