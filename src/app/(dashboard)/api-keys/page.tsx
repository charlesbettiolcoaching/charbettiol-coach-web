'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Lock, Sparkles, Plus, Copy, Check, Trash2, KeyRound, AlertTriangle } from 'lucide-react'
import { toast } from '@/lib/toast'
import { format } from 'date-fns'

interface ApiKey {
  id: string
  name: string
  key_prefix: string
  last_used_at: string | null
  revoked_at: string | null
  created_at: string
  expires_at: string | null
}

export default function ApiKeysPage() {
  const [loading, setLoading] = useState(true)
  const [locked, setLocked] = useState(false)
  const [keys, setKeys] = useState<ApiKey[]>([])
  const [creating, setCreating] = useState(false)
  const [newKeyName, setNewKeyName] = useState('')
  const [freshKey, setFreshKey] = useState<{ plaintext: string; name: string } | null>(null)
  const [copied, setCopied] = useState(false)

  const refresh = async () => {
    setLoading(true)
    try {
      const r = await fetch('/api/api-keys')
      if (r.status === 402) {
        setLocked(true)
        return
      }
      if (!r.ok) throw new Error('load_failed')
      const data = await r.json()
      setKeys(data.keys ?? [])
    } catch {
      toast.error('Could not load your API keys')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { refresh() }, [])

  const createKey = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newKeyName.trim()) return
    setCreating(true)
    try {
      const r = await fetch('/api/api-keys', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newKeyName.trim() }),
      })
      if (!r.ok) {
        const data = await r.json().catch(() => ({}))
        toast.error(data.message ?? data.error ?? 'Could not create key')
        return
      }
      const data = await r.json()
      setFreshKey({ plaintext: data.plaintext, name: data.key.name })
      setNewKeyName('')
      await refresh()
    } finally {
      setCreating(false)
    }
  }

  const revoke = async (id: string, name: string) => {
    if (!confirm(`Revoke "${name}"? Any service using this key will immediately fail.`)) return
    const r = await fetch(`/api/api-keys/${id}`, { method: 'DELETE' })
    if (r.ok) {
      toast.success('Key revoked')
      await refresh()
    } else {
      toast.error('Could not revoke key')
    }
  }

  const copyFresh = async () => {
    if (!freshKey) return
    await navigator.clipboard.writeText(freshKey.plaintext)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-5 h-5 border-2 border-cb-border border-t-brand rounded-full animate-spin" />
      </div>
    )
  }

  if (locked) {
    return (
      <div className="p-8 max-w-3xl mx-auto">
        <div className="rounded-2xl border border-cb-border bg-cb-surface p-10 text-center">
          <div className="mx-auto w-14 h-14 rounded-full bg-brand/10 flex items-center justify-center mb-5">
            <Lock size={24} className="text-brand" />
          </div>
          <h1 className="text-xl font-bold text-cb-text mb-2">API access is a Scale feature</h1>
          <p className="text-sm text-cb-muted mb-6 max-w-md mx-auto">
            Upgrade to Scale to generate API keys and integrate Propel with your own tools, Zapier,
            or webhooks.
          </p>
          <Link
            href="/pricing"
            className="inline-flex items-center gap-2 bg-brand hover:opacity-90 text-white text-sm font-semibold px-5 py-3 rounded-xl transition-colors"
          >
            <Sparkles size={16} />
            See plans
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <div className="mb-6">
        <h1 className="text-xl font-bold text-cb-text">API keys</h1>
        <p className="text-sm text-cb-muted mt-1">
          Keys authenticate programmatic requests against <code className="font-mono text-xs bg-cb-border/40 px-1.5 py-0.5 rounded">api.propelcoaches.com/v1</code>.
          Send as <code className="font-mono text-xs bg-cb-border/40 px-1.5 py-0.5 rounded">Authorization: Bearer prk_live_…</code>.
        </p>
      </div>

      {/* Fresh key banner — shown only once immediately after creation */}
      {freshKey && (
        <div className="mb-6 rounded-2xl border-2 border-brand bg-brand/5 p-5">
          <div className="flex items-start gap-3">
            <AlertTriangle className="text-brand flex-shrink-0 mt-1" size={20} />
            <div className="flex-1">
              <p className="font-semibold text-cb-text mb-1">Save this key now</p>
              <p className="text-sm text-cb-muted mb-3">
                This is the only time you&apos;ll see the full key. If you lose it, revoke it and create a new one.
              </p>
              <div className="flex items-center gap-2 rounded-lg bg-cb-surface border border-cb-border px-3 py-2 font-mono text-sm">
                <code className="flex-1 truncate text-cb-text">{freshKey.plaintext}</code>
                <button
                  onClick={copyFresh}
                  className="flex items-center gap-1.5 text-brand font-semibold hover:opacity-80"
                >
                  {copied ? <Check size={14} /> : <Copy size={14} />}
                  {copied ? 'Copied' : 'Copy'}
                </button>
              </div>
              <button
                onClick={() => setFreshKey(null)}
                className="mt-3 text-xs text-cb-muted hover:text-cb-text underline"
              >
                I&apos;ve saved it
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Create form */}
      <form onSubmit={createKey} className="mb-8 flex items-center gap-2">
        <input
          type="text"
          value={newKeyName}
          onChange={e => setNewKeyName(e.target.value)}
          placeholder="Key name (e.g. Zapier integration)"
          className="flex-1 rounded-xl border border-cb-border bg-cb-surface px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand/40"
          maxLength={100}
        />
        <button
          type="submit"
          disabled={creating || !newKeyName.trim()}
          className="inline-flex items-center gap-2 bg-brand text-white text-sm font-semibold px-4 py-2.5 rounded-xl transition-colors disabled:opacity-60"
        >
          <Plus size={16} />
          {creating ? 'Creating…' : 'Create key'}
        </button>
      </form>

      {/* Keys list */}
      {keys.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-cb-border p-10 text-center">
          <KeyRound className="mx-auto text-cb-muted mb-2" size={28} />
          <p className="text-sm text-cb-muted">No API keys yet. Create one above.</p>
        </div>
      ) : (
        <div className="rounded-2xl border border-cb-border bg-cb-surface divide-y divide-cb-border">
          {keys.map(k => (
            <div key={k.id} className="p-4 flex items-center justify-between gap-4">
              <div>
                <p className="font-semibold text-cb-text text-sm">{k.name}</p>
                <p className="font-mono text-xs text-cb-muted">{k.key_prefix}………</p>
                <p className="text-xs text-cb-muted mt-1">
                  Created {format(new Date(k.created_at), 'd MMM yyyy')}
                  {k.last_used_at
                    ? ` · Last used ${format(new Date(k.last_used_at), 'd MMM')}`
                    : ' · Never used'}
                  {k.revoked_at ? ` · Revoked ${format(new Date(k.revoked_at), 'd MMM')}` : ''}
                </p>
              </div>
              {!k.revoked_at && (
                <button
                  onClick={() => revoke(k.id, k.name)}
                  className="flex items-center gap-1.5 text-red-600 hover:bg-red-50 text-xs font-semibold px-3 py-2 rounded-lg"
                >
                  <Trash2 size={14} />
                  Revoke
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
