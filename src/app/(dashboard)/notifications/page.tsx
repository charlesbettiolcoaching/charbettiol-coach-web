'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Bot, Bell, CheckCircle } from 'lucide-react'
import { format } from 'date-fns'

type Notification = {
  id: string
  coach_id: string
  type: string
  title: string
  body: string | null
  client_id: string | null
  session_id: string | null
  read: boolean
  created_at: string
}

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [loading, setLoading] = useState(true)
  const [expanded, setExpanded] = useState<string | null>(null)

  async function loadNotifications() {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { setLoading(false); return }
    const { data } = await supabase
      .from('coach_notifications')
      .select('*')
      .eq('coach_id', user.id)
      .order('created_at', { ascending: false })
    setNotifications(data ?? [])
    setLoading(false)
  }

  async function markRead(notificationId: string) {
    setNotifications((prev) =>
      prev.map((n) => n.id === notificationId ? { ...n, read: true } : n)
    )
    const supabase = createClient()
    await supabase
      .from('coach_notifications')
      .update({ read: true })
      .eq('id', notificationId)
  }

  function handleClick(notification: Notification) {
    if (!notification.read) markRead(notification.id)
    setExpanded((prev) => (prev === notification.id ? null : notification.id))
  }

  useEffect(() => {
    loadNotifications()
  }, [])

  return (
    <div className="p-8 max-w-3xl mx-auto">
      <div className="mb-8">
        <h1 className="text-xl font-bold text-cb-text">Notifications</h1>
        <p className="text-sm text-cb-muted mt-1">Stay updated on client activity and AI sessions</p>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-16">
          <div className="w-6 h-6 border-2 border-cb-teal border-t-transparent rounded-full animate-spin" />
        </div>
      ) : notifications.length === 0 ? (
        <div className="bg-surface border border-cb-border rounded-xl p-12 text-center">
          <Bell size={32} className="mx-auto text-cb-muted mb-3" />
          <p className="text-sm font-medium text-cb-text">No notifications yet</p>
          <p className="text-xs text-cb-muted mt-1">You'll be notified about client activity and AI Mode updates here.</p>
        </div>
      ) : (
        <div className="bg-surface border border-cb-border rounded-xl divide-y divide-cb-border overflow-hidden">
          {notifications.map((notification) => {
            const isExpanded = expanded === notification.id
            const Icon = notification.type === 'ai_summary' ? Bot : Bell

            return (
              <div
                key={notification.id}
                className="cursor-pointer hover:bg-surface-light transition-colors"
                onClick={() => handleClick(notification)}
              >
                <div className="flex items-start gap-3 px-5 py-4">
                  {/* Icon */}
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 ${
                    notification.type === 'ai_summary'
                      ? 'bg-purple-500/10'
                      : 'bg-cb-teal/10'
                  }`}>
                    <Icon
                      size={15}
                      className={notification.type === 'ai_summary' ? 'text-purple-400' : 'text-cb-teal'}
                    />
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <p className="text-sm font-medium text-cb-text">{notification.title}</p>
                      {!notification.read && (
                        <span className="w-2 h-2 rounded-full bg-cb-teal flex-shrink-0" />
                      )}
                    </div>
                    <p className="text-xs text-cb-muted">
                      {format(new Date(notification.created_at), 'd MMM yyyy · h:mm a')}
                    </p>

                    {/* Body — collapsible for ai_summary */}
                    {notification.type === 'ai_summary' ? (
                      notification.body && isExpanded && (
                        <div className="mt-3 p-3 bg-purple-500/5 border border-purple-500/15 rounded-lg">
                          <p className="text-xs text-cb-secondary leading-relaxed whitespace-pre-wrap">{notification.body}</p>
                        </div>
                      )
                    ) : (
                      notification.body && (
                        <p className="text-xs text-cb-secondary mt-1">{notification.body}</p>
                      )
                    )}

                    {notification.type === 'ai_summary' && notification.body && (
                      <p className="text-xs text-cb-teal mt-1.5 font-medium">
                        {isExpanded ? 'Collapse' : 'View summary'}
                      </p>
                    )}
                  </div>

                  {/* Read indicator */}
                  {notification.read && (
                    <CheckCircle size={14} className="text-cb-muted flex-shrink-0 mt-1" />
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
