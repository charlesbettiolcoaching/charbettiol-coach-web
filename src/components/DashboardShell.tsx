'use client'

import { useState } from 'react'
import Sidebar from './Sidebar'
import TopBar from './TopBar'

interface DashboardShellProps {
  children: React.ReactNode
  userEmail: string | null
  userName: string | null
}

export default function DashboardShell({ children, userEmail, userName }: DashboardShellProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  return (
    <div className="flex h-screen bg-bg">
      {/* Mobile overlay */}
      {mobileMenuOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      {/* Sidebar — fixed overlay on mobile, static on desktop */}
      <div
        className={[
          'fixed inset-y-0 left-0 z-50',
          'lg:static lg:z-auto lg:block',
          mobileMenuOpen ? 'block' : 'hidden lg:block',
        ].join(' ')}
      >
        <Sidebar
          userEmail={userEmail}
          userName={userName}
          onClose={() => setMobileMenuOpen(false)}
        />
      </div>

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <TopBar onMenuToggle={() => setMobileMenuOpen(!mobileMenuOpen)} />
        <main className="flex-1 overflow-auto bg-gradient-to-br from-white to-slate-50 dark:from-bg dark:to-surface-light min-h-0">
          {children}
        </main>
      </div>
    </div>
  )
}
