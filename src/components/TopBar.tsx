'use client'

import { useState } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { Plus, Users, Dumbbell, UtensilsCrossed, ChevronDown } from 'lucide-react'
import clsx from 'clsx'

const PAGE_TITLES: Record<string, string> = {
  '/dashboard': 'Dashboard',
  '/clients':   'Clients',
  '/training':  'Programs',
  '/nutrition': 'Nutrition',
  '/settings':  'Settings',
  '/check-ins': 'Check-ins',
  '/tasks':     'Tasks',
  '/messages':  'Messages',
  '/metrics':   'Metrics',
  '/my-plan':   'My Meal Plan',
  '/my-workout':'My Training',
}

function getTitle(pathname: string): string {
  if (PAGE_TITLES[pathname]) return PAGE_TITLES[pathname]
  for (const [prefix, label] of Object.entries(PAGE_TITLES)) {
    if (pathname.startsWith(prefix + '/')) return label
  }
  return 'Coach Portal'
}

const QUICK_ACTIONS = [
  { label: 'New Client',     href: '/clients',   icon: Users,           desc: 'Add a coaching client' },
  { label: 'New Program',    href: '/training',  icon: Dumbbell,        desc: 'Build a workout program' },
  { label: 'New Meal Plan',  href: '/nutrition', icon: UtensilsCrossed, desc: 'Create a nutrition plan' },
]

export default function TopBar() {
  const pathname = usePathname()
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const title = getTitle(pathname)

  return (
    <div className="flex-shrink-0 h-14 flex items-center justify-between px-6 border-b border-cb-border bg-surface">
      <h1 className="text-sm font-semibold text-cb-text">{title}</h1>

      <div className="relative">
        <button
          onClick={() => setOpen(!open)}
          className="flex items-center gap-2 px-3.5 py-2 bg-brand hover:bg-brand/90 text-white text-sm font-medium rounded-lg transition-colors"
        >
          <Plus size={15} />
          <span>Quick Add</span>
          <ChevronDown size={13} className={clsx('transition-transform duration-150', open && 'rotate-180')} />
        </button>

        {open && (
          <>
            <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
            <div className="absolute right-0 top-full mt-2 w-60 bg-surface border border-cb-border rounded-xl shadow-2xl z-20 overflow-hidden py-1">
              {QUICK_ACTIONS.map((a) => {
                const Icon = a.icon
                return (
                  <button
                    key={a.label}
                    onClick={() => { router.push(a.href); setOpen(false) }}
                    className="flex items-center gap-3 w-full px-4 py-3 hover:bg-surface-light transition-colors text-left"
                  >
                    <div className="w-8 h-8 rounded-lg bg-brand/10 flex items-center justify-center flex-shrink-0">
                      <Icon size={15} className="text-brand" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-cb-text">{a.label}</p>
                      <p className="text-xs text-cb-muted">{a.desc}</p>
                    </div>
                  </button>
                )
              })}
            </div>
          </>
        )}
      </div>
    </div>
  )
}
