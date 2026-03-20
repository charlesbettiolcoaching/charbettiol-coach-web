'use client'

import { useState } from 'react'
import { Plus, Library, FileText, Video, Image, Link, Users, X, Search, ChevronRight, MoreHorizontal } from 'lucide-react'
import clsx from 'clsx'

type CollectionResource = {
  id: string
  title: string
  type: 'PDF' | 'Video' | 'Image' | 'Link' | 'Document'
}

type Collection = {
  id: string
  name: string
  description: string
  resources: CollectionResource[]
  assignedTo: string[]
  createdAt: string
  color: string
}

const MOCK_COLLECTIONS: Collection[] = [
  {
    id: '1',
    name: 'Beginner Starter Pack',
    description: 'Everything a new client needs to get started: nutrition guide, warm-up video, and progress tracking.',
    resources: [
      { id: 'r1', title: 'Beginner Nutrition Guide', type: 'PDF' },
      { id: 'r2', title: 'Warm-Up Routine', type: 'Video' },
      { id: 'r3', title: 'Progress Photo Guide', type: 'Image' },
      { id: 'r4', title: 'Myfitnesspal Setup', type: 'Link' },
    ],
    assignedTo: ['Liam Carter', 'Sophie Nguyen'],
    createdAt: '2026-01-15',
    color: 'brand',
  },
  {
    id: '2',
    name: 'Nutrition Fundamentals',
    description: 'Core nutrition resources covering macros, meal prep, and recipe books.',
    resources: [
      { id: 'r5', title: 'Beginner Nutrition Guide', type: 'PDF' },
      { id: 'r6', title: 'Meal Prep Sunday Template', type: 'Document' },
    ],
    assignedTo: ['Emma Thompson'],
    createdAt: '2026-02-01',
    color: 'green',
  },
  {
    id: '3',
    name: 'Advanced Training Pack',
    description: 'Resources for experienced lifters — hypertrophy principles, technique videos, and program overviews.',
    resources: [
      { id: 'r7', title: 'Hypertrophy Program Overview', type: 'Document' },
      { id: 'r8', title: 'Squat Form Tutorial', type: 'Video' },
    ],
    assignedTo: ['Jake Wilson', 'Liam Carter'],
    createdAt: '2026-02-18',
    color: 'purple',
  },
  {
    id: '4',
    name: 'Recovery & Wellness',
    description: 'Sleep, stress management, and recovery resources for optimal performance.',
    resources: [
      { id: 'r9', title: 'Sleep Optimisation Resource', type: 'PDF' },
    ],
    assignedTo: [],
    createdAt: '2026-03-02',
    color: 'amber',
  },
]

const MOCK_CLIENTS = ['Liam Carter', 'Sophie Nguyen', 'Jake Wilson', 'Emma Thompson']

const ALL_RESOURCES: CollectionResource[] = [
  { id: 'r1', title: 'Beginner Nutrition Guide', type: 'PDF' },
  { id: 'r2', title: 'Squat Form Tutorial', type: 'Video' },
  { id: 'r3', title: 'Meal Prep Sunday Template', type: 'Document' },
  { id: 'r4', title: 'Progress Photo Guide', type: 'Image' },
  { id: 'r5', title: 'Sleep Optimisation Resource', type: 'PDF' },
  { id: 'r6', title: 'Myfitnesspal Setup Tutorial', type: 'Link' },
  { id: 'r7', title: 'Warm-Up Routine (Video)', type: 'Video' },
  { id: 'r8', title: 'Hypertrophy Program Overview', type: 'Document' },
]

function typeIcon(type: CollectionResource['type']) {
  const cls = 'shrink-0'
  switch (type) {
    case 'PDF': return <FileText size={13} className={clsx(cls, 'text-red-400')} />
    case 'Video': return <Video size={13} className={clsx(cls, 'text-brand')} />
    case 'Image': return <Image size={13} className={clsx(cls, 'text-yellow-400')} />
    case 'Link': return <Link size={13} className={clsx(cls, 'text-purple-400')} />
    case 'Document': return <FileText size={13} className={clsx(cls, 'text-cb-secondary')} />
  }
}

const COLOR_MAP: Record<string, string> = {
  brand: 'bg-brand/10 border-brand/30 text-brand',
  green: 'bg-green-500/10 border-green-500/30 text-green-400',
  purple: 'bg-purple-500/10 border-purple-500/30 text-purple-400',
  amber: 'bg-amber-500/10 border-amber-500/30 text-amber-400',
}

const COLOR_DOT: Record<string, string> = {
  brand: 'bg-brand',
  green: 'bg-green-500',
  purple: 'bg-purple-500',
  amber: 'bg-amber-500',
}

type NewCollectionModalProps = {
  onClose: () => void
  onAdd: (c: Partial<Collection>) => void
}

function NewCollectionModal({ onClose, onAdd }: NewCollectionModalProps) {
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [color, setColor] = useState('brand')
  const [selectedResources, setSelectedResources] = useState<string[]>([])
  const [selectedClients, setSelectedClients] = useState<string[]>([])

  function toggleRes(id: string) {
    setSelectedResources(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id])
  }

  function toggleClient(c: string) {
    setSelectedClients(prev => prev.includes(c) ? prev.filter(x => x !== c) : [...prev, c])
  }

  function submit() {
    if (!name.trim()) return
    onAdd({ name, description, color, resources: ALL_RESOURCES.filter(r => selectedResources.includes(r.id)), assignedTo: selectedClients })
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="bg-surface rounded-2xl shadow-2xl w-full max-w-lg mx-4 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-cb-border">
          <h2 className="text-lg font-semibold text-cb-text">New Collection</h2>
          <button onClick={onClose} className="text-cb-muted hover:text-cb-text transition-colors"><X size={20} /></button>
        </div>
        <div className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-cb-secondary mb-1">Name</label>
            <input className="w-full bg-surface-light border border-cb-border rounded-xl px-3 py-2 text-cb-text text-sm focus:outline-none focus:border-brand" placeholder="Collection name..." value={name} onChange={e => setName(e.target.value)} />
          </div>
          <div>
            <label className="block text-sm font-medium text-cb-secondary mb-1">Description</label>
            <textarea className="w-full bg-surface-light border border-cb-border rounded-xl px-3 py-2 text-cb-text text-sm focus:outline-none focus:border-brand resize-none h-16" placeholder="Describe what this collection is for..." value={description} onChange={e => setDescription(e.target.value)} />
          </div>
          <div>
            <label className="block text-sm font-medium text-cb-secondary mb-2">Color</label>
            <div className="flex gap-3">
              {Object.entries(COLOR_DOT).map(([key, cls]) => (
                <button key={key} onClick={() => setColor(key)} className={clsx('w-7 h-7 rounded-full transition-all', cls, color === key ? 'ring-2 ring-offset-2 ring-offset-surface ring-cb-border scale-110' : '')} />
              ))}
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-cb-secondary mb-2">Resources</label>
            <div className="space-y-2 max-h-40 overflow-y-auto">
              {ALL_RESOURCES.map(r => (
                <label key={r.id} className="flex items-center gap-3 cursor-pointer group">
                  <input type="checkbox" checked={selectedResources.includes(r.id)} onChange={() => toggleRes(r.id)} className="accent-brand w-4 h-4" />
                  <div className="flex items-center gap-2">
                    {typeIcon(r.type)}
                    <span className="text-sm text-cb-text group-hover:text-brand transition-colors">{r.title}</span>
                  </div>
                </label>
              ))}
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-cb-secondary mb-2">Assign to Clients</label>
            <div className="flex flex-wrap gap-2">
              {MOCK_CLIENTS.map(c => (
                <button key={c} onClick={() => toggleClient(c)} className={clsx('px-3 py-1 rounded-full text-xs font-medium border transition-colors', selectedClients.includes(c) ? 'bg-brand text-white border-brand' : 'bg-surface-light border-cb-border text-cb-secondary hover:border-brand')}>
                  {c}
                </button>
              ))}
            </div>
          </div>
        </div>
        <div className="flex justify-end gap-3 p-6 pt-0">
          <button onClick={onClose} className="px-4 py-2 text-sm text-cb-secondary hover:text-cb-text transition-colors">Cancel</button>
          <button onClick={submit} disabled={!name.trim()} className="px-4 py-2 bg-brand text-white rounded-xl text-sm font-medium hover:bg-brand-light transition-colors disabled:opacity-50">Create Collection</button>
        </div>
      </div>
    </div>
  )
}

export default function ResourceCollectionsPage() {
  const [collections, setCollections] = useState<Collection[]>(MOCK_COLLECTIONS)
  const [search, setSearch] = useState('')
  const [showNewModal, setShowNewModal] = useState(false)
  const [expanded, setExpanded] = useState<string | null>(null)
  const [openMenu, setOpenMenu] = useState<string | null>(null)

  const filtered = collections.filter(c =>
    c.name.toLowerCase().includes(search.toLowerCase()) || c.description.toLowerCase().includes(search.toLowerCase())
  )

  function handleAdd(data: Partial<Collection>) {
    setCollections(prev => [{ id: Date.now().toString(), name: data.name!, description: data.description || '', resources: data.resources || [], assignedTo: data.assignedTo || [], createdAt: new Date().toISOString().split('T')[0], color: data.color || 'brand' }, ...prev])
  }

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-cb-text">Resource Collections</h1>
          <p className="text-cb-secondary text-sm mt-0.5">Bundle resources into curated collections for clients</p>
        </div>
        <button onClick={() => setShowNewModal(true)} className="flex items-center gap-2 px-4 py-2 bg-brand text-white rounded-xl text-sm font-medium hover:bg-brand-light transition-colors">
          <Plus size={16} /> New Collection
        </button>
      </div>

      <div className="grid grid-cols-3 gap-4 mb-6">
        {[
          { label: 'Collections', value: collections.length },
          { label: 'Total Resources', value: collections.reduce((a, c) => a + c.resources.length, 0) },
          { label: 'Assigned', value: collections.filter(c => c.assignedTo.length > 0).length },
        ].map(s => (
          <div key={s.label} className="bg-surface border border-cb-border rounded-xl p-4">
            <p className="text-2xl font-bold text-cb-text">{s.value}</p>
            <p className="text-sm text-cb-secondary mt-0.5">{s.label}</p>
          </div>
        ))}
      </div>

      <div className="relative mb-5">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-cb-muted" />
        <input className="w-full bg-surface border border-cb-border rounded-xl pl-9 pr-4 py-2 text-sm text-cb-text placeholder-cb-muted focus:outline-none focus:border-brand" placeholder="Search collections..." value={search} onChange={e => setSearch(e.target.value)} />
      </div>

      {filtered.length === 0 ? (
        <div className="text-center py-16 text-cb-muted">
          <Library size={40} className="mx-auto mb-3 opacity-40" />
          <p className="font-medium">No collections found</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map(c => (
            <div key={c.id} className={clsx('bg-surface border rounded-xl transition-colors', expanded === c.id ? 'border-brand/40' : 'border-cb-border hover:border-brand/30')}>
              <div className="flex items-center gap-4 p-4">
                <div className={clsx('w-10 h-10 rounded-xl flex items-center justify-center border', COLOR_MAP[c.color])}>
                  <Library size={18} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold text-cb-text">{c.name}</h3>
                    <span className={clsx('px-2 py-0.5 rounded-full text-xs border', COLOR_MAP[c.color])}>
                      {c.resources.length} item{c.resources.length !== 1 ? 's' : ''}
                    </span>
                  </div>
                  <p className="text-sm text-cb-secondary truncate mt-0.5">{c.description}</p>
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  {c.assignedTo.length > 0 ? (
                    <div className="flex items-center gap-1 text-xs text-cb-secondary">
                      <Users size={12} /> {c.assignedTo.length}
                    </div>
                  ) : (
                    <span className="text-xs text-cb-muted">Unassigned</span>
                  )}
                  <div className="relative">
                    <button onClick={() => setOpenMenu(openMenu === c.id ? null : c.id)} className="p-1 rounded-lg text-cb-muted hover:text-cb-text hover:bg-surface-light transition-colors">
                      <MoreHorizontal size={16} />
                    </button>
                    {openMenu === c.id && (
                      <div className="absolute right-0 top-7 z-20 bg-surface border border-cb-border rounded-xl shadow-2xl w-40 py-1">
                        <button className="w-full flex items-center gap-2 px-3 py-2 text-sm text-cb-text hover:bg-surface-light transition-colors">
                          <Users size={14} /> Assign Clients
                        </button>
                        <div className="h-px bg-cb-border mx-2 my-1" />
                        <button onClick={() => { setCollections(prev => prev.filter(x => x.id !== c.id)); setOpenMenu(null) }} className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-400 hover:bg-surface-light transition-colors">
                          <X size={14} /> Delete
                        </button>
                      </div>
                    )}
                  </div>
                  <button onClick={() => setExpanded(expanded === c.id ? null : c.id)} className="p-1 rounded-lg text-cb-muted hover:text-cb-text hover:bg-surface-light transition-colors">
                    <ChevronRight size={16} className={clsx('transition-transform', expanded === c.id ? 'rotate-90' : '')} />
                  </button>
                </div>
              </div>

              {expanded === c.id && (
                <div className="border-t border-cb-border px-4 py-3">
                  <div className="grid grid-cols-2 gap-2 mb-3">
                    {c.resources.map(r => (
                      <div key={r.id} className="flex items-center gap-2 p-2 bg-surface-light rounded-lg">
                        {typeIcon(r.type)}
                        <span className="text-xs text-cb-text truncate">{r.title}</span>
                      </div>
                    ))}
                  </div>
                  {c.assignedTo.length > 0 && (
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-cb-muted">Assigned to:</span>
                      <div className="flex flex-wrap gap-1">
                        {c.assignedTo.map(name => (
                          <span key={name} className="px-2 py-0.5 rounded-full bg-brand/10 text-brand text-xs">{name}</span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {showNewModal && <NewCollectionModal onClose={() => setShowNewModal(false)} onAdd={handleAdd} />}
    </div>
  )
}
