import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import DashboardShell from '@/components/DashboardShell'
import GettingStartedChecklist from '@/components/GettingStartedChecklist'
import Toaster from '@/components/Toaster'

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')
  const userEmail = user.email ?? ''

  const { data: profile } = await supabase
    .from('profiles')
    .select('full_name, name')
    .eq('id', user.id)
    .single()
  const userName = (profile?.full_name || profile?.name || '').split(' ')[0] || null

  return (
    <>
      <DashboardShell userEmail={userEmail} userName={userName}>
        {children}
      </DashboardShell>
      <GettingStartedChecklist />
      <Toaster />
    </>
  )
}
