'use client'

import { useState } from 'react'
import { Search, Plus, FileText, Video, Image, Link, Download, MoreHorizontal, X, Upload, Users, Filter } from 'lucide-react'
import clsx from 'clsx'

const FILE_TYPES = ['All', 'PDF', 'Video', 'Image', 'Link', 'Document']

type Resource = {
  id: string
  title: string
  description: string
  type: 'PDF' | 'Video' | 'Image' | 'Link' | 'Document'
  url: string
  size?: string
  duration?: string
  assignedTo: string[]
  tags: string[]
  createdAt: string
}

const MOCK_RESOURCES: Resource[] = [
  {
    id: '1', title: 'Beginner Nutrition Guide', description: 'A comprehensive guide to understanding macros, meal timing, and food choices for beginners.',
    type: 'PDF', url: '#', size: '2.4 MB', assignedTo: ['Liam Carter', 'Sophie Nguyen'], tags: ['nutrition', 'beginner'], createdAt: '2026-01-10',
  },
  {
    id: '2', title: 'Squat Form Tutorial', description: 'Step-by-step breakdown of the perfect squat form including common mistakes and cues.',
    type: 'Video', url: '#', duration: '12:34', assignedTo: ['Jake Wilson'], tags: ['technique', 'legs'], createdAt: '2026-01-18',
  },
  {
    id: '3', title: 'Meal Prep Sunday Template', description: 'Weekly meal prep planning sheet with grocery list and cook times.',
    type: 'Document', url: '#', size: '845 KB', assignedTo: ['Sophie Nguyen', 'Emma Thompson'], tags: ['nutrition', 'meal prep'], createdAt: '2026-01-22',
  },
  {
    id: '4', title: 'Progress Photo Guide', description: 'Instructions on how to take consistent progress photos for accurate tracking.',
    type: 'Image', url: '#', size: '1.1 MB', assignedTo: ['Liam Carter', 'Emma Thompson'], tags: ['tracking', 'photos'], createdAt: '2026-02-01',
  },
  {
    id: '5', title: 'Sleep Optimisation Resource', description: 'Science-backed strategies to improve sleep quality for better recovery and performance.',
    type: 'PDF', url: '#', size: '3.2 MB', assignedTo: [], tags: ['recovery', 'sleep'], createdAt: '2026-02-05',
  },
  {
    id: '6', title: 'Myfitnesspal Setup Tutorial', description: 'How to set up and use MyFitnessPal for accurate macro tracking.',
    type: 'Link', url: '#', assignedTo: ['Jake Wilson', 'Sophie Nguyen'], tags: ['nutrition', 'apps'], createdAt: '2026-02-12',
  },
  {
    id: '7', title: 'Warm-Up Routine (Video)', description: '10-minute dynamic warm-up routine to do before every training session.',
    type: 'Video', url: '#', duration: '10:05', assignedTo: ['Liam Carter', 'Jake Wilson', 'Sophie Nguyen', 'Emma Thompson'], tags: ['warm-up', 'technique'], createdAt: '2026-02-20',
  },
  {
    id: '8', title: 'Hypertrophy Program Overview', description: 'Overview document explaining the principles behind the hypertrophy program structure.',
    type: 'Document', url: '#', size: '1.8 MB', assignedTo: ['Liam Carter'], tags: ['training', 'hypertrophy'], createdAt: '2026-03-01',
  },
]

const MOCK_CLIENTS = ['Liam Carter', 'Sophie Nguyen', 'Jake Wilson', 'Emma Thompson']

function typeIcon(type: Resource['type']) {
  switch (type) {
    case 'PDF': return <FileText size={14} className="text-red-400" />
    case 'Video': return <Video size={14} className="text-brand" />
    case 'Image': return <Image size={14} className="text-yellow-400" />
    case 'Link': return <Link size={14} className="text-purple-400" />
    case 'Document': return <FileText size={14} className="text-cb-secondary" />
  }
}

function typeBadgeClass(type: Resource['type']) {
  switch (type) {
    case 'PDF': return 'bg-red-500/10 text-red-400'
    case 'Video': return 'bg-brand/10 text-brand'
    case 'Image': return 'bg-yellow-500/10 text-yellow-400'
    case 'Link': return 'bg-purple-500/10 text-purple-400'
    case 'Document': return 'bg-surface-light text-cb-secondary'
  }
}

function AddResourceModal({ onClose, onAdd }: { onClose: () => void; onAdd: (r: Partial<Resource>) => void }) {
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [type, setType] = useState<Resource['type']>('PDF')
  const [url, setUrl] = useState('')
  const [tags, setTags] = useState('')
  const [selectedClients, setSelectedClients] = useState<string[]>([])

  function toggle(c: string) {
    setSelectedClients(prev => prev.includes(c) ? prev.filter(x => x !== c) : [...prev, c])
  }

  function submit() {
    if (!title.trim()) return
    onAdd({ title, description, type, url, tags: tags.split(',').map(t => t.trim()).filter(Boolean), assignedTo: selectedClients })
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="bg-surface rounded-2xl shadow-2xl w-full max-w-lg mx-4 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-cb-border">
          <h2 className="text-lg font-semibold text-cb-text">Add Resource</h2>
          <button onClick={onClose} className="text-cb-muted hover:text-cb-text transition-colors"><X size={20} /></button>
        </div>
        <div className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-cb-secondary mb-1">Title</label>
            <input className="w-full bg-surface-light border border-cb-border rounded-xl px-3 py-2 text-cb-text text-sm focus:outline-none focus:border-brand" placeholder="Resource title..." value={title} onChange={e => setTitle(e.target.value)} />
          </div>
          <div>
            <label className="block text-sm font-medium text-cb-secondary mb-1">Description</label>
            <textarea className="w-full bg-surface-light border border-cb-border rounded-xl px-3 py-2 text-cb-text text-sm focus:outline-none focus:border-brand resize-none h-20" placeholder="Brief description..." value={description} onChange={e => setDescription(e.target.value)} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-cb-secondary mb-1">Type</label>
              <select className="w-full bg-surface-light border border-cb-border rounded-xl px-3 py-2 text-cb-text text-sm focus:outline-none focus:border-brand" value={type} onChange={e => setType(e.target.value as Resource['type'])}>
                {(['PDF', 'Video', 'Image', 'Link', 'Document'] as Resource['type'][]).map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-cb-secondary mb-1">Tags (comma separated)</label>
              <input className="w-full bg-surface-light border border-cb-border rounded-xl px-3 py-2 text-cb-text text-sm focus:outline-none focus:border-brand" placeholder="nutrition, beginner..." value={tags} onChange={e => setTags(e.target.value)} />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-cb-secondary mb-1">{type === 'Link' ? 'URL' : 'File URL'}</label>
            <div className="flex gap-2">
              <input className="flex-1 bg-surface-light border border-cb-border rounded-xl px-3 py-2 text-cb-text text-sm focus:outline-none focus:border-brand" placeholder={type === 'Link' ? 'https://...' : 'Paste URL or upload'} value={url} onChange={e => setUrl(e.target.value)} />
              <button className="flex items-center gap-1 px-3 py-2 bg-surface-light border border-cb-border rounded-xl text-cb-secondary text-sm hover:text-cb-text transition-colors">
                <Upload size={14} /> Upload
              </button>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-cb-secondary mb-2">Assign to Clients</label>
            <div className="flex flex-wrap gap-2">
              {MOCK_CLIENTS.map(c => (
                <button key={c} onClick={() => toggle(c)} className={clsx('px-3 py-1 rounded-full text-xs font-medium border transition-colors', selectedClients.includes(c) ? 'bg-brand text-white border-brand' : 'bg-surface-light border-cb-border text-cb-secondary hover:border-brand')}>
                  {c}
                </button>
              ))}
            </div>
          </div>
        </div>
        <div className="flex justify-end gap-3 p-6 pt-0">
          <button onClick={onClose} className="px-4 py-2 text-sm text-cb-secondary hover:text-cb-text transition-colors">Cancel</button>
          <button onClick={submit} disabled={!title.trim()} className="px-4 py-2 bg-brand text-white rounded-xl text-sm font-medium hover:bg-brand-light transition-colors disabled:opacity-50">Add Resource</button>
        </div>
      </div>
    </div>
  )
}

function AssignModal({ resource, onClose, onAssign }: { resource: Resource; onClose: () => void; onAssign: (clients: string[]) => void }) {
  const [selected, setSelected] = useState<string[]>(resource.assignedTo)
  function toggle(c: string) { setSelected(prev => prev.includes(c) ? prev.filter(x => x !== c) : [...prev, c]) }
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="bg-surface rounded-2xl shadow-2xl w-full max-w-sm mx-4">
        <div className="flex items-center justify-between p-5 border-b border-cb-border">
          <div>
            <h2 className="font-semibold text-cb-text">Assign Resource</h2>
            <p className="text-xs text-cb-muted mt-0.5">{resource.title}</p>
          </div>
          <button onClick={onClose} className="text-cb-muted hover:text-cb-text transition-colors"><X size={18} /></button>
        </div>
        <div className="p-5 space-y-2">
          {MOCK_CLIENTS.map(c => (
            <label key={c} className="flex items-center gap-3 cursor-pointer group">
              <input type="checkbox" checked={selected.includes(c)} onChange={() => toggle(c)} className="accent-brand w-4 h-4" />
              <span className="text-sm text-cb-text group-hover:text-brand transition-colors">{c}</span>
            </label>
          ))}
        </div>
        <div className="flex justify-end gap-3 p-5 pt-0">
          <button onClick={onClose} className="px-4 py-2 text-sm text-cb-secondary hover:text-cb-text transition-colors">Cancel</button>
          <button onClick={() => { onAssign(selected); onClose() }} className="px-4 py-2 bg-brand text-white rounded-xl text-sm font-medium hover:bg-brand-light transition-colors">Save</button>
        </div>
      </div>
    </div>
  )
}

export default function ResourcesPage() {
  const [resources, setResources] = useState<Resource[]>(MOCK_RESOURCES)
  const [search, setSearch] = useState('')
  const [typeFilter, setTypeFilter] = useState('All')
  const [showAddModal, setShowAddModal] = useState(false)
  const [assignResource, setAssignResource] = useState<Resource | null>(null)
  const [openMenu, setOpenMenu] = useState<string | null>(null)

  const filtered = resources.filter(r => {
    const matchesSearch = r.title.toLowerCase().includes(search.toLowerCase()) || r.description.toLowerCase().includes(search.toLowerCase()) || r.tags.some(t => t.includes(search.toLowerCase()))
    return matchesSearch && (typeFilter === 'All' || r.type === typeFilter)
  })

  function handleAdd(data: Partial<Resource>) {
    setResources(prev => [{ id: Date.now().toString(), title: data.title!, description: data.description || '', type: data.type || 'Document', url: data.url || '#', assignedTo: data.assignedTo || [], tags: data.tags || [], createdAt: new Date().toISOString().split('T')[0] }, ...prev])
  }

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-cb-text">Resources</h1>
          <p className="text-cb-secondary text-sm mt-0.5">Manage and share resources with your clients</p>
        </div>
        <button onClick={() => setShowAddModal(true)} className="flex items-center gap-2 px-4 py-2 bg-brand text-white rounded-xl text-sm font-medium hover:bg-brand-light transition-colors">
          <Plus size={16} /> Add Resource
        </button>
      </div>

      <div className="grid grid-cols-3 gap-4 mb-6">
        {[
          { label: 'Total Resources', value: resources.length },
          { label: 'Assigned Resources', value: resources.filter(r => r.assignedTo.length > 0).length },
          { label: 'File Types', value: Array.from(new Set(resources.map(r => r.type))).length },
        ].map(s => (
          <div key={s.label} className="bg-surface border border-cb-border rounded-xl p-4">
            <p className="text-2xl font-bold text-cb-text">{s.value}</p>
            <p className="text-sm text-cb-secondary mt-0.5">{s.label}</p>
          </div>
        ))}
      </div>

      <div className="flex flex-col sm:flex-row gap-3 mb-5">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-cb-muted" />
          <input className="w-full bg-surface border border-cb-border rounded-xl pl-9 pr-4 py-2 text-sm text-cb-text placeholder-cb-muted focus:outline-none focus:border-brand" placeholder="Search resources..." value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <div className="flex gap-2 items-center flex-wrap">
          <Filter size={15} className="text-cb-muted" />
          {FILE_TYPES.map(t => (
            <button key={t} onClick={() => setTypeFilter(t)} className={clsx('px-3 py-1.5 rounded-xl text-xs font-medium transition-colors border', typeFilter === t ? 'bg-brand text-white border-brand' : 'bg-surface border-cb-border text-cb-secondary hover:border-brand')}>
              {t}
            </button>
          ))}
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="text-center py-16 text-cb-muted">
          <FileText size={40} className="mx-auto mb-3 opacity-40" />
          <p className="font-medium">No resources found</p>
          <p className="text-sm mt-1">Try adjusting your filters or add a new resource</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filtered.map(r => (
            <div key={r.id} className="bg-surface border border-cb-border rounded-xl p-4 flex flex-col gap-3 hover:border-brand/40 transition-colors">
              <div className="flex items-start justify-between gap-2">
                <div className={clsx('flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium', typeBadgeClass(r.type))}>
                  {typeIcon(r.type)} {r.type}
                </div>
                <div className="relative">
                  <button onClick={() => setOpenMenu(openMenu === r.id ? null : r.id)} className="p-1 rounded-lg text-cb-muted hover:text-cb-text hover:bg-surface-light transition-colors">
                    <MoreHorizontal size={16} />
                  </button>
                  {openMenu === r.id && (
                    <div className="absolute right-0 top-7 z-20 bg-surface border border-cb-border rounded-xl shadow-2xl w-44 py-1">
                      <button onClick={() => { setAssignResource(r); setOpenMenu(null) }} className="w-full flex items-center gap-2 px-3 py-2 text-sm text-cb-text hover:bg-surface-light transition-colors">
                        <Users size={14} /> Assign to Clients
                      </button>
                      <button onClick={() => window.open(r.url, '_blank')} className="w-full flex items-center gap-2 px-3 py-2 text-sm text-cb-text hover:bg-surface-light transition-colors">
                        <Download size={14} /> Download
                      </button>
                      <div className="h-px bg-cb-border mx-2 my-1" />
                      <button onClick={() => { setResources(prev => prev.filter(x => x.id !== r.id)); setOpenMenu(null) }} className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-400 hover:bg-surface-light transition-colors">
                        <X size={14} /> Delete
                      </button>
                    </div>
                  )}
                </div>
              </div>
              <div>
                <h3 className="font-semibold text-cb-text text-sm">{r.title}</h3>
                <p className="text-xs text-cb-secondary mt-1 line-clamp-2">{r.description}</p>
              </div>
              {r.tags.length > 0 && (
                <div className="flex flex-wrap gap-1">
                  {r.tags.map(tag => <span key={tag} className="px-2 py-0.5 rounded-full bg-surface-light text-cb-muted text-xs">{tag}</span>)}
                </div>
              )}
              <div className="flex items-center justify-between mt-auto pt-2 border-t border-cb-border">
                <span className="text-xs text-cb-muted">{r.size || r.duration || r.createdAt}</span>
                {r.assignedTo.length > 0 ? (
                  <div className="flex items-center gap-1 text-xs text-cb-secondary">
                    <Users size={12} /> {r.assignedTo.length} client{r.assignedTo.length !== 1 ? 's' : ''}
                  </div>
                ) : (
                  <button onClick={() => setAssignResource(r)} className="text-xs text-brand hover:underline">Assign clients</button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {showAddModal && <AddResourceModal onClose={() => setShowAddModal(false)} onAdd={handleAdd} />}
      {assignResource && (
        <AssignModal resource={assignResource} onClose={() => setAssignResource(null)} onAssign={clients => setResources(prev => prev.map(r => r.id === assignResource.id ? { ...r, assignedTo: clients } : r))} />
      )}
    </div>
  )
}
