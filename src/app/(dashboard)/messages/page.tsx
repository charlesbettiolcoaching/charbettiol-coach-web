'use client'

import { useEffect, useState, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Message, Profile } from '@/lib/types'
import { format } from 'date-fns'
import { Send, MessageSquare, Bot, BotOff } from 'lucide-react'
import clsx from 'clsx'
import { useIsDemo } from '@/lib/demo/useDemoMode'
import { DEMO_CLIENTS } from '@/lib/demo/mockData'

type ClientThread = {
  client: Profile
  lastMessage: Message | null
  unreadCount: number
}

type AiSession = {
  id: string
  is_active: boolean
}

const DEMO_MESSAGES: Message[] = [
  {
    id: 'dm-1',
    coach_id: 'demo-coach-1',
    client_id: 'demo-client-1',
    sender_id: 'demo-client-1',
    sender_role: 'client',
    content: 'Hey coach! Just finished the workout, feeling great. That new squat variation is tough.',
    message_type: 'text',
    read: true,
    created_at: '2026-03-08T14:22:00Z',
  },
  {
    id: 'dm-2',
    coach_id: 'demo-coach-1',
    client_id: 'demo-client-1',
    sender_id: 'demo-coach-1',
    sender_role: 'coach',
    content: 'Awesome work Liam! Yes the pause squats will fire up your quads like nothing else. Keep it up!',
    message_type: 'text',
    read: true,
    created_at: '2026-03-08T14:45:00Z',
  },
  {
    id: 'dm-3',
    coach_id: 'demo-coach-1',
    client_id: 'demo-client-2',
    sender_id: 'demo-client-2',
    sender_role: 'client',
    content: 'Quick question — should I run the day before my strength session or take it off?',
    message_type: 'text',
    read: false,
    created_at: '2026-03-09T08:10:00Z',
  },
  {
    id: 'dm-4',
    coach_id: 'demo-coach-1',
    client_id: 'demo-client-3',
    sender_id: 'demo-coach-1',
    sender_role: 'coach',
    content: 'Jake — make sure you\'re getting those calories in on rest days too. Recovery is where the gains happen!',
    message_type: 'text',
    read: true,
    created_at: '2026-03-07T16:00:00Z',
  },
  {
    id: 'dm-5',
    coach_id: 'demo-coach-1',
    client_id: 'demo-client-4',
    sender_id: 'demo-client-4',
    sender_role: 'client',
    content: 'I did all 3 sessions this week!! First time ever. So happy right now 😊',
    message_type: 'text',
    read: true,
    created_at: '2026-03-05T18:30:00Z',
  },
  {
    id: 'dm-6',
    coach_id: 'demo-coach-1',
    client_id: 'demo-client-4',
    sender_id: 'demo-coach-1',
    sender_role: 'coach',
    content: 'Emma that is AMAZING!! I\'m so proud of you. This is exactly the habit we want to build. Keep going! 💪',
    message_type: 'text',
    read: true,
    created_at: '2026-03-05T19:00:00Z',
  },
]

export default function MessagesPage() {
  const isDemo = useIsDemo()
  const [threads, setThreads] = useState<ClientThread[]>([])
  const [selectedClientId, setSelectedClientId] = useState<string | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [newMessage, setNewMessage] = useState('')
  const [sending, setSending] = useState(false)
  const [loading, setLoading] = useState(true)
  const [loadingMessages, setLoadingMessages] = useState(false)
  const [userId, setUserId] = useState<string | null>(null)
  const [aiSession, setAiSession] = useState<AiSession | null>(null)
  const [togglingAi, setTogglingAi] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)
  const realtimeRef = useRef<ReturnType<typeof createClient> | null>(null)

  useEffect(() => {
    loadThreads()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isDemo])

  useEffect(() => {
    if (selectedClientId) {
      loadMessages(selectedClientId)
      if (!isDemo) loadAiSession(selectedClientId)
      else setAiSession(null)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedClientId])

  // Real-time subscription
  useEffect(() => {
    if (isDemo || !selectedClientId || !userId) return

    const supabase = createClient()
    realtimeRef.current = supabase

    const channel = supabase
      .channel(`messages:${userId}:${selectedClientId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `coach_id=eq.${userId}`,
        },
        (payload) => {
          const msg = payload.new as Message
          if (msg.client_id === selectedClientId) {
            setMessages((prev) => [...prev, msg])
            // Mark incoming client messages as read
            if (msg.sender_role === 'client') {
              supabase
                .from('messages')
                .update({ read: true })
                .eq('id', msg.id)
                .then(() => {})
            }
          }
          // Refresh thread list for unread counts
          loadThreads()
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedClientId, userId, isDemo])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  async function loadThreads() {
    setLoading(true)

    if (isDemo) {
      setUserId('demo-coach-1')
      const demoClients = DEMO_CLIENTS as unknown as Profile[]
      const threadList: ClientThread[] = demoClients.map((client) => {
        const clientMsgs = DEMO_MESSAGES.filter((m) => m.client_id === client.id)
        const lastMessage = clientMsgs.length > 0 ? clientMsgs[clientMsgs.length - 1] : null
        const unreadCount = clientMsgs.filter((m) => !m.read && m.sender_role === 'client').length
        return { client, lastMessage, unreadCount }
      })
      threadList.sort((a, b) => {
        if (!a.lastMessage) return 1
        if (!b.lastMessage) return -1
        return new Date(b.lastMessage.created_at).getTime() - new Date(a.lastMessage.created_at).getTime()
      })
      setThreads(threadList)
      if (threadList.length > 0 && !selectedClientId) {
        setSelectedClientId(threadList[0].client.id)
      }
      setLoading(false)
      return
    }

    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    setUserId(user.id)

    const { data: clientData } = await supabase
      .from('profiles')
      .select('*')
      .eq('coach_id', user.id)
      .eq('role', 'client')

    const threadList: ClientThread[] = []
    for (const client of (clientData ?? []) as Profile[]) {
      const { data: msgs } = await supabase
        .from('messages')
        .select('*')
        .eq('coach_id', user.id)
        .eq('client_id', client.id)
        .order('created_at', { ascending: false })
        .limit(1)

      const { count } = await supabase
        .from('messages')
        .select('*', { count: 'exact', head: true })
        .eq('coach_id', user.id)
        .eq('client_id', client.id)
        .eq('read', false)
        .eq('sender_role', 'client')

      threadList.push({
        client,
        lastMessage: msgs?.[0] ?? null,
        unreadCount: count ?? 0,
      })
    }

    threadList.sort((a, b) => {
      if (!a.lastMessage) return 1
      if (!b.lastMessage) return -1
      return new Date(b.lastMessage.created_at).getTime() - new Date(a.lastMessage.created_at).getTime()
    })

    setThreads(threadList)
    if (threadList.length > 0 && !selectedClientId) {
      setSelectedClientId(threadList[0].client.id)
    }
    setLoading(false)
  }

  async function loadMessages(clientId: string) {
    setLoadingMessages(true)

    if (isDemo) {
      const msgs = DEMO_MESSAGES.filter((m) => m.client_id === clientId)
      setMessages(msgs)
      setLoadingMessages(false)
      return
    }

    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const { data } = await supabase
      .from('messages')
      .select('*')
      .eq('coach_id', user.id)
      .eq('client_id', clientId)
      .order('created_at', { ascending: true })

    setMessages(data ?? [])

    await supabase
      .from('messages')
      .update({ read: true })
      .eq('coach_id', user.id)
      .eq('client_id', clientId)
      .eq('sender_role', 'client')
      .eq('read', false)

    setLoadingMessages(false)
  }

  async function loadAiSession(clientId: string) {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const { data } = await supabase
      .from('ai_mode_sessions')
      .select('id, is_active')
      .eq('coach_id', user.id)
      .eq('client_id', clientId)
      .eq('is_active', true)
      .maybeSingle()

    setAiSession(data ?? null)
  }

  async function toggleAiMode() {
    if (!selectedClientId || !userId || isDemo) return
    setTogglingAi(true)
    const supabase = createClient()

    if (aiSession) {
      // Deactivate existing session
      await supabase
        .from('ai_mode_sessions')
        .update({ is_active: false })
        .eq('id', aiSession.id)
      setAiSession(null)
    } else {
      // Create new session (7-day default)
      const endsAt = new Date()
      endsAt.setDate(endsAt.getDate() + 7)
      const { data } = await supabase
        .from('ai_mode_sessions')
        .insert({
          coach_id: userId,
          client_id: selectedClientId,
          is_active: true,
          duration_days: 7,
          ends_at: endsAt.toISOString(),
        })
        .select('id, is_active')
        .single()
      setAiSession(data ?? null)
    }

    setTogglingAi(false)
  }

  async function sendMessage() {
    if (!newMessage.trim() || !selectedClientId || !userId) return
    if (isDemo) {
      setNewMessage('')
      return
    }
    setSending(true)
    const supabase = createClient()

    await supabase.from('messages').insert({
      coach_id: userId,
      client_id: selectedClientId,
      sender_id: userId,
      sender_role: 'coach',
      content: newMessage.trim(),
      message_type: 'text',
      read: false,
    })

    setNewMessage('')
    setSending(false)
    loadThreads()
  }

  const selectedThread = threads.find((t) => t.client.id === selectedClientId)

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="w-6 h-6 border-2 border-cb-teal border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="flex h-full">
      {/* Thread List */}
      <div className="w-72 flex-shrink-0 border-r border-cb-border bg-surface flex flex-col">
        <div className="px-4 py-4 border-b border-cb-border">
          <h1 className="text-lg font-bold text-cb-text">Messages</h1>
        </div>

        <div className="flex-1 overflow-y-auto">
          {threads.length === 0 ? (
            <div className="p-6 text-center text-sm text-cb-muted">
              No clients to message.
            </div>
          ) : (
            threads.map((thread) => (
              <button
                key={thread.client.id}
                onClick={() => setSelectedClientId(thread.client.id)}
                className={clsx(
                  'w-full px-4 py-3 flex items-center gap-3 text-left border-b border-cb-border hover:bg-surface-light transition-colors',
                  selectedClientId === thread.client.id ? 'bg-cb-teal/10' : ''
                )}
              >
                <div className="w-9 h-9 rounded-full bg-cb-teal/10 flex items-center justify-center flex-shrink-0">
                  <span className="text-sm font-semibold text-cb-teal">
                    {(thread.client.name ?? '?').split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2)}
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-semibold text-cb-text truncate">{thread.client.name ?? thread.client.email}</span>
                    {thread.unreadCount > 0 && (
                      <span className="ml-2 flex-shrink-0 w-5 h-5 bg-cb-teal rounded-full flex items-center justify-center">
                        <span className="text-[10px] text-white font-bold">{thread.unreadCount}</span>
                      </span>
                    )}
                  </div>
                  {thread.lastMessage && (
                    <p className="text-xs text-cb-muted truncate mt-0.5">
                      {thread.lastMessage.sender_role === 'coach' ? 'You: ' : ''}
                      {thread.lastMessage.content}
                    </p>
                  )}
                  {thread.lastMessage && (
                    <p className="text-[10px] text-cb-muted mt-0.5">
                      {format(new Date(thread.lastMessage.created_at), 'd MMM · h:mm a')}
                    </p>
                  )}
                </div>
              </button>
            ))
          )}
        </div>
      </div>

      {/* Message Thread */}
      <div className="flex-1 flex flex-col bg-bg">
        {!selectedClientId ? (
          <div className="flex-1 flex flex-col items-center justify-center text-cb-muted">
            <MessageSquare size={48} className="mb-3" />
            <p className="text-sm">Select a client to view messages</p>
          </div>
        ) : (
          <>
            {/* Thread Header */}
            <div className="px-5 py-3 bg-surface border-b border-cb-border flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-cb-teal/10 flex items-center justify-center flex-shrink-0">
                <span className="text-sm font-semibold text-cb-teal">
                  {(selectedThread?.client.name ?? '?').split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2)}
                </span>
              </div>
              <div className="flex-1">
                <p className="text-sm font-semibold text-cb-text">{selectedThread?.client.name ?? selectedThread?.client.email}</p>
                <p className="text-xs text-cb-muted">{selectedThread?.client.email}</p>
              </div>

              {/* AI Mode Toggle */}
              {!isDemo && (
                <button
                  onClick={toggleAiMode}
                  disabled={togglingAi}
                  title={aiSession ? 'AI mode is ON — click to disable' : 'Enable AI mode for this client'}
                  className={clsx(
                    'flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors',
                    aiSession
                      ? 'bg-brand/10 border-brand/30 text-brand hover:bg-brand/20'
                      : 'bg-surface-light border-cb-border text-cb-muted hover:text-cb-secondary hover:border-cb-secondary'
                  )}
                >
                  {togglingAi ? (
                    <div className="w-3.5 h-3.5 border-2 border-current border-t-transparent rounded-full animate-spin" />
                  ) : aiSession ? (
                    <Bot size={14} />
                  ) : (
                    <BotOff size={14} />
                  )}
                  {aiSession ? 'AI mode on' : 'AI mode off'}
                </button>
              )}
              {isDemo && (
                <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium border bg-brand/10 border-brand/30 text-brand">
                  <Bot size={14} />
                  AI mode on
                </div>
              )}
            </div>

            {/* AI mode banner */}
            {aiSession && (
              <div className="px-5 py-2 bg-brand/5 border-b border-brand/15 flex items-center gap-2 text-xs text-brand">
                <Bot size={13} />
                AI is responding to new messages from this client on your behalf.
              </div>
            )}

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-5 space-y-3">
              {loadingMessages ? (
                <div className="flex items-center justify-center h-full">
                  <div className="w-5 h-5 border-2 border-cb-teal border-t-transparent rounded-full animate-spin" />
                </div>
              ) : messages.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-cb-muted">
                  <MessageSquare size={36} className="mb-2" />
                  <p className="text-sm">No messages yet. Send the first message!</p>
                </div>
              ) : (
                messages.map((msg) => {
                  const isCoach = msg.sender_role === 'coach'
                  return (
                    <div key={msg.id} className={clsx('flex', isCoach ? 'justify-end' : 'justify-start')}>
                      <div
                        className={clsx(
                          'max-w-xs lg:max-w-md xl:max-w-lg px-4 py-2.5 rounded-2xl text-sm',
                          isCoach
                            ? 'bg-cb-teal text-white rounded-br-sm'
                            : 'bg-surface text-cb-text border border-cb-border rounded-bl-sm'
                        )}
                      >
                        {/* AI badge on AI-generated messages */}
                        {(msg as Message & { is_ai_generated?: boolean }).is_ai_generated && (
                          <div className="flex items-center gap-1 mb-1 opacity-70">
                            <Bot size={11} />
                            <span className="text-[10px]">AI reply</span>
                          </div>
                        )}
                        <p className="leading-relaxed">{msg.content}</p>
                        <p className={clsx('text-[10px] mt-1', isCoach ? 'text-white/70' : 'text-cb-muted')}>
                          {format(new Date(msg.created_at), 'h:mm a')}
                        </p>
                      </div>
                    </div>
                  )
                })
              )}
              <div ref={bottomRef} />
            </div>

            {/* Input */}
            <div className="px-5 py-4 bg-surface border-t border-cb-border">
              <div className="flex items-end gap-3">
                <textarea
                  rows={1}
                  placeholder="Type a message…"
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault()
                      sendMessage()
                    }
                  }}
                  className="flex-1 px-4 py-2.5 border border-cb-border rounded-xl text-sm text-cb-text placeholder-cb-muted bg-surface-light focus:outline-none focus:ring-2 focus:ring-cb-teal resize-none"
                />
                <button
                  onClick={sendMessage}
                  disabled={sending || !newMessage.trim()}
                  className="w-10 h-10 bg-cb-teal hover:bg-cb-teal/90 disabled:bg-surface-light text-white rounded-xl flex items-center justify-center flex-shrink-0 transition-colors"
                >
                  {sending ? (
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <Send size={16} />
                  )}
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
