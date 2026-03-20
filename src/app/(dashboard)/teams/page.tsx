'use client'

import { useState } from 'react'
import { Shield, Plus, X, Users, ChevronRight, Trash2 } from 'lucide-react'
import { useIsDemo } from '@/lib/demo/useDemoMode'
import { DEMO_CLIENTS } from '@/lib/demo/mockData'
import clsx from 'clsx'

type TeamMember = { id: string; name: string; email: string }
type Team = { id: string; name: string; description: string; members: TeamMember[]; lastActivity: string }

const DEMO_TEAMS: Team[] = [
  {
    id: 'team-1',
    name: 'Morning Crew',
    description: 'Early risers who train 5–7am. Shared programming and weekly challenges.',
    members: [
      { id: 'demo-client-1', name: 'Liam Carter', email: 'liam.carter@example.com' },
      { id: 'demo-client-3', name: 'Jake Wilson', email: 'jake.wilson@example.com' },
    ],
    lastActivity: '2026-03-09',
  },
  {
    id: 'team-2',
    name: 'Competition Prep',
    description: 'Clients preparing for physique or performance competitions. High accountability group.',
    members: [
      { id: 'demo-client-2', name: 'Sophie Nguyen', email: 'sophie.nguyen@example.com' },
      { id: 'demo-client-3', name: 'Jake Wilson', email: 'jake.wilson@example.com' },
    ],
    lastActivity: '2026-03-08',
  },
]

function NewTeamModal({
  onClose,
  onSave,
  allClients,
}: {
  onClose: () => void
  onSave: (t: Team) => void
  allClients: TeamMember[]
}) {
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [selected, setSelected] = useState<string[]>([])

  function toggleClient(id: string) {
    setSelected(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id])
  }

  function handleSave() {
    if (!name.trim()) return
    const members = allClients.filter(c => selected.includes(c.id))
    onSave({
      id: 'team-' + Date.now(),
      name: name.trim(),
      description: description.trim(),
      members,
      lastActivity: new Date().toISOString().slice(0, 10),
    })
  }

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
      <div className="bg-surface border border-cb-border rounded-xl w-full max-w-lg shadow-2xl">
        <div className="flex items-center justify-between p-5 border-b border-cb-border">
          <h2 className="text-lg font-semibold text-cb-text">New Team</h2>
          <button onClick={onClose} className="text-cb-muted hover:text-cb-secondary"><X size={20} /></button>
        </div>
        <div className="p-5 space-y-4">
          <div>
            <label className="block text-xs font-medium text-cb-muted mb-1">Team Name *</label>
            <input type="text" value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Morning Crew"
              className="w-full px-3 py-2 bg-surface-light border border-cb-border rounded-lg text-sm text-cb-text placeholder-cb-muted focus:outline-none focus:ring-2 focus:ring-brand" />
          </div>
          <div>
            <label className="block text-xs font-medium text-cb-muted mb-1">Description</label>
            <textarea rows={2} value={description} onChange={e => setDescription(e.target.value)} placeholder="What is this team for?"
              className="w-full px-3 py-2 bg-surface-light border border-cb-border rounded-lg text-sm text-cb-text placeholder-cb-muted focus:outline-none focus:ring-2 focus:ring-brand resize-none" />
          </div>
          <div>
            <label className="block text-xs font-medium text-cb-muted mb-2">Add Members</label>
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {allClients.map(c => (
                <label key={c.id} className="flex items-center gap-3 p-2 rounded-lg hover:bg-surface-light cursor-pointer">
                  <input type="checkbox" checked={selected.includes(c.id)} onChange={() => toggleClient(c.id)}
                    className="rounded border-cb-border" />
                  <div className="w-7 h-7 rounded-full bg-brand-bg flex items-center justify-center flex-shrink-0">
                    <span className="text-xs font-bold text-brand">{c.name.slice(0, 2).toUpperCase()}</span>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-cb-text">{c.name}</p>
                    <p className="text-xs text-cb-muted">{c.email}</p>
                  </div>
                </label>
              ))}
            </div>
          </div>
        </div>
        <div className="flex items-center justify-end gap-3 p-5 border-t border-cb-border">
          <button onClick={onClose} className="px-4 py-2 text-sm text-cb-secondary border border-cb-border rounded-lg hover:bg-surface-light transition-colors">Cancel</button>
          <button onClick={handleSave} disabled={!name.trim()}
            className="px-4 py-2 text-sm bg-brand hover:bg-brand-light disabled:opacity-50 text-white rounded-lg font-medium">
            Create Team
          </button>
        </div>
      </div>
    </div>
  )
}

export default function TeamsPage() {
  const isDemo = useIsDemo()
  const [teams, setTeams] = useState<Team[]>(isDemo ? DEMO_TEAMS : [])
  const [showModal, setShowModal] = useState(false)
  const [viewTeam, setViewTeam] = useState<Team | null>(null)

  const allClients: TeamMember[] = isDemo
    ? DEMO_CLIENTS.map(c => ({ id: c.id, name: c.name, email: c.email }))
    : []

  function formatDate(d: string) {
    return new Date(d).toLocaleDateString('en-AU', { day: 'numeric', month: 'short' })
  }

  function removeMember(teamId: string, memberId: string) {
    setTeams(prev => prev.map(t =>
      t.id === teamId ? { ...t, members: t.members.filter(m => m.id !== memberId) } : t
    ))
    if (viewTeam?.id === teamId) {
      setViewTeam(prev => prev ? { ...prev, members: prev.members.filter(m => m.id !== memberId) } : null)
    }
  }

  function deleteTeam(id: string) {
    setTeams(prev => prev.filter(t => t.id !== id))
    if (viewTeam?.id === id) setViewTeam(null)
  }

  if (viewTeam) {
    const team = teams.find(t => t.id === viewTeam.id) ?? viewTeam
    return (
      <div className="p-6 max-w-3xl mx-auto">
        <button onClick={() => setViewTeam(null)} className="flex items-center gap-1 text-sm text-cb-muted hover:text-cb-secondary mb-4 transition-colors">
          <ChevronRight size={14} className="rotate-180" /> Back to Teams
        </button>
        <div className="flex items-start justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-cb-text">{team.name}</h1>
            <p className="text-sm text-cb-muted mt-0.5">{team.description}</p>
          </div>
          <button onClick={() => deleteTeam(team.id)}
            className="p-2 text-cb-muted hover:text-cb-danger hover:bg-surface-light rounded-lg transition-colors">
            <Trash2 size={16} />
          </button>
        </div>
        <div className="bg-surface border border-cb-border rounded-xl overflow-hidden">
          <div className="px-5 py-3 border-b border-cb-border bg-surface-light">
            <p className="text-xs font-semibold text-cb-muted uppercase tracking-wider">Members ({team.members.length})</p>
          </div>
          {team.members.length === 0 ? (
            <p className="text-sm text-cb-muted p-5">No members yet.</p>
          ) : (
            <div className="divide-y divide-cb-border">
              {team.members.map(m => (
                <div key={m.id} className="flex items-center gap-3 px-5 py-3">
                  <div className="w-8 h-8 rounded-full bg-brand-bg flex items-center justify-center flex-shrink-0">
                    <span className="text-xs font-bold text-brand">{m.name.slice(0, 2).toUpperCase()}</span>
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-cb-text">{m.name}</p>
                    <p className="text-xs text-cb-muted">{m.email}</p>
                  </div>
                  <button onClick={() => removeMember(team.id, m.id)}
                    className="text-xs text-cb-muted hover:text-cb-danger transition-colors">Remove</button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    )
  }

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-cb-text">Teams</h1>
          <p className="text-sm text-cb-muted mt-0.5">Group clients into teams for shared programming and challenges</p>
        </div>
        <button onClick={() => setShowModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-brand hover:bg-brand-light text-white rounded-lg text-sm font-medium transition-colors">
          <Plus size={15} /> New Team
        </button>
      </div>

      {teams.length === 0 ? (
        <div className="bg-surface border border-cb-border rounded-lg p-16 text-center">
          <Shield size={48} className="mx-auto text-cb-muted mb-4" />
          <h2 className="text-lg font-semibold text-cb-secondary mb-2">No teams yet</h2>
          <p className="text-sm text-cb-muted max-w-sm mx-auto mb-4">
            Create teams to group clients and assign shared workouts or challenges.
          </p>
          <button onClick={() => setShowModal(true)}
            className="px-4 py-2 bg-brand hover:bg-brand-light text-white rounded-lg text-sm font-medium">
            Create your first team
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {teams.map(team => (
            <div key={team.id} className="bg-surface border border-cb-border rounded-xl p-5">
              <div className="flex items-start justify-between mb-2">
                <h3 className="font-semibold text-cb-text">{team.name}</h3>
                <span className="text-xs text-cb-muted">{formatDate(team.lastActivity)}</span>
              </div>
              <p className="text-sm text-cb-secondary mb-4">{team.description}</p>
              <div className="flex items-center gap-1 mb-4">
                {team.members.slice(0, 5).map((m, i) => (
                  <div key={m.id} className={clsx('w-8 h-8 rounded-full bg-brand-bg border-2 border-surface flex items-center justify-center', i > 0 && '-ml-2')}>
                    <span className="text-[10px] font-bold text-brand">{m.name.slice(0, 2).toUpperCase()}</span>
                  </div>
                ))}
                <span className="ml-2 text-xs text-cb-muted">{team.members.length} member{team.members.length !== 1 ? 's' : ''}</span>
              </div>
              <div className="flex items-center gap-2 pt-3 border-t border-cb-border">
                <button onClick={() => setViewTeam(team)}
                  className="flex-1 py-1.5 text-sm text-center text-brand hover:bg-brand-bg rounded-lg transition-colors font-medium">
                  View Team
                </button>
                <button onClick={() => deleteTeam(team.id)}
                  className="p-1.5 text-cb-muted hover:text-cb-danger hover:bg-surface-light rounded-lg transition-colors">
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {showModal && (
        <NewTeamModal
          onClose={() => setShowModal(false)}
          onSave={t => { setTeams(prev => [...prev, t]); setShowModal(false) }}
          allClients={allClients}
        />
      )}
    </div>
  )
}
