import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import Sidebar from '@/components/Sidebar'
import TopBar from '@/components/TopBar'
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
    <div className="flex h-screen bg-bg">
      <Sidebar userEmail={userEmail} userName={userName} />
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <TopBar />
        <main className="flex-1 overflow-auto bg-gradient-to-br from-white to-slate-50 dark:from-bg dark:to-surface-light min-h-0">
          {children}
        </main>
      </div>
      <GettingStartedChecklist />
      <Toaster />
    </div>
  )
}
