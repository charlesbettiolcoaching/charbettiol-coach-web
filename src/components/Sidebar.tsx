'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { exitDemo } from '@/lib/demo/useDemoMode'
import { useTheme } from '@/contexts/ThemeContext'
import clsx from 'clsx'
import {
  LayoutDashboard,
  Users,
  Dumbbell,
  UtensilsCrossed,
  Settings,
  LogOut,
  Sun,
  Moon,
  Bell,
  MessageSquare,
  ClipboardCheck,
} from 'lucide-react'

const NAV_ITEMS = [
  { href: '/dashboard',       label: 'Dashboard',      icon: LayoutDashboard },
  { href: '/clients',         label: 'Clients',        icon: Users },
  { href: '/messages',        label: 'Messages',       icon: MessageSquare },
  { href: '/check-ins',       label: 'Check-ins',      icon: ClipboardCheck },
  { href: '/training',        label: 'Programs',       icon: Dumbbell },
  { href: '/nutrition',       label: 'Nutrition',      icon: UtensilsCrossed },
  { href: '/notifications',   label: 'Notifications',  icon: Bell },
  { href: '/settings',        label: 'Settings',       icon: Settings },
]

export default function Sidebar({ userEmail, isDemo }: { userEmail?: string | null; isDemo?: boolean }) {
  const pathname = usePathname()
  const router = useRouter()
  const { theme, toggleTheme } = useTheme()

  async function handleLogout() {
    if (isDemo) {
      exitDemo()
      return
    }
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }

  function isActive(href: string) {
    if (href === '/dashboard') return pathname === '/dashboard' || pathname === '/'
    return pathname === href || pathname.startsWith(href + '/')
  }

  const initials = userEmail ? userEmail.slice(0, 2).toUpperCase() : 'CB'

  return (
    <aside className="w-56 flex-shrink-0 bg-surface border-r border-cb-border flex flex-col h-screen">
      {/* Logo */}
      <div className="px-5 py-5 border-b border-cb-border">
        <div className="flex items-center gap-3">
          <img
            src={theme === 'dark' ? '/logo/icon-dark.png' : '/logo/icon-light.png'}
            alt="BC Coaching"
            className="w-8 h-8 object-contain flex-shrink-0"
          />
          <span className="font-semibold text-cb-text text-sm leading-tight">BC Coaching</span>
        </div>
        {isDemo && (
          <div className="mt-3 px-2 py-1 bg-amber-500/10 border border-amber-500/20 rounded-md text-amber-500 text-[11px] font-medium text-center">
            Demo Mode
          </div>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-5">
        <ul className="space-y-1">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon
            const active = isActive(item.href)
            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className={clsx(
                    'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors',
                    active
                      ? 'bg-brand/10 text-brand'
                      : 'text-cb-secondary hover:bg-surface-light hover:text-cb-text'
                  )}
                >
                  <Icon
                    size={17}
                    className={clsx('flex-shrink-0', active ? 'text-brand' : 'text-cb-muted')}
                  />
                  {item.label}
                </Link>
              </li>
            )
          })}
        </ul>
      </nav>

      {/* User footer */}
      <div className="px-3 pb-4 pt-3 border-t border-cb-border space-y-1">
        <div className="flex items-center gap-2.5 px-3 py-2">
          <div className="w-7 h-7 rounded-full bg-brand/10 border border-brand/20 flex items-center justify-center flex-shrink-0">
            <span className="text-xs font-semibold text-brand">{initials}</span>
          </div>
          <span className="text-xs text-cb-secondary truncate flex-1">{userEmail ?? 'Coach'}</span>
          <button
            onClick={toggleTheme}
            className="flex-shrink-0 p-1.5 rounded-md text-cb-muted hover:text-cb-secondary hover:bg-surface-light transition-colors"
            title={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
          >
            {theme === 'dark' ? <Sun size={13} /> : <Moon size={13} />}
          </button>
        </div>
        <button
          onClick={handleLogout}
          className="flex items-center gap-3 w-full px-3 py-2 rounded-lg text-sm text-cb-secondary hover:bg-surface-light hover:text-cb-text transition-colors"
        >
          <LogOut size={15} className="text-cb-muted" />
          {isDemo ? 'Exit Demo' : 'Sign out'}
        </button>
      </div>
    </aside>
  )
}
