'use client'

import { useState } from 'react'
import { Plus, Search, Play, Video, ExternalLink, MoreHorizontal, X, Clock, Dumbbell, Filter, Users, Layers, ChevronRight } from 'lucide-react'
import clsx from 'clsx'

type StudioVideo = {
  id: string
  title: string
  description: string
  url: string
  thumbnail?: string
  duration: string
  category: string
  difficulty: 'Beginner' | 'Intermediate' | 'Advanced'
  muscleGroups: string[]
  createdAt: string
}

type StudioProgram = {
  id: string
  name: string
  description: string
  videos: string[]
  assignedTo: string[]
  totalDuration: string
  level: 'Beginner' | 'Intermediate' | 'Advanced'
  createdAt: string
}

const CATEGORIES = ['All', 'Full Body', 'Upper Body', 'Lower Body', 'Core', 'Cardio', 'Mobility', 'Tutorial']
const DIFFICULTIES = ['All', 'Beginner', 'Intermediate', 'Advanced']

const MOCK_VIDEOS: StudioVideo[] = [
  {
    id: 'v1', title: '30-Min Full Body HIIT', description: 'High intensity interval training targeting all major muscle groups. No equipment needed.',
    url: 'https://youtube.com', duration: '30:00', category: 'Full Body', difficulty: 'Intermediate',
    muscleGroups: ['Chest', 'Back', 'Legs', 'Core'], createdAt: '2026-01-10',
  },
  {
    id: 'v2', title: 'Upper Body Strength Session', description: 'Dumbbell-based upper body session focusing on pressing and pulling movements.',
    url: 'https://youtube.com', duration: '45:00', category: 'Upper Body', difficulty: 'Intermediate',
    muscleGroups: ['Chest', 'Back', 'Shoulders', 'Arms'], createdAt: '2026-01-15',
  },
  {
    id: 'v3', title: 'Leg Day Fundamentals', description: 'Complete lower body workout from warm-up to cool-down. Perfect for beginners.',
    url: 'https://youtube.com', duration: '40:00', category: 'Lower Body', difficulty: 'Beginner',
    muscleGroups: ['Quads', 'Hamstrings', 'Glutes', 'Calves'], createdAt: '2026-01-22',
  },
  {
    id: 'v4', title: 'Core & Abs Burn', description: '20-minute core-focused session for a stronger, more stable midsection.',
    url: 'https://youtube.com', duration: '20:00', category: 'Core', difficulty: 'Beginner',
    muscleGroups: ['Abs', 'Obliques', 'Lower Back'], createdAt: '2026-02-01',
  },
  {
    id: 'v5', title: 'Squat Technique Tutorial', description: 'In-depth breakdown of the back squat with common mistakes and coaching cues.',
    url: 'https://youtube.com', duration: '15:00', category: 'Tutorial', difficulty: 'Beginner',
    muscleGroups: ['Quads', 'Glutes', 'Core'], createdAt: '2026-02-08',
  },
  {
    id: 'v6', title: 'Morning Mobility Flow', description: '15-minute mobility routine to start your day and improve movement quality.',
    url: 'https://youtube.com', duration: '15:00', category: 'Mobility', difficulty: 'Beginner',
    muscleGroups: ['Full Body'], createdAt: '2026-02-15',
  },
  {
    id: 'v7', title: 'Advanced Push/Pull', description: 'Challenging upper body split for experienced lifters chasing hypertrophy.',
    url: 'https://youtube.com', duration: '55:00', category: 'Upper Body', difficulty: 'Advanced',
    muscleGroups: ['Chest', 'Back', 'Shoulders', 'Arms'], createdAt: '2026-02-22',
  },
  {
    id: 'v8', title: '20-Min Cardio Blast', description: 'Steady-state and interval cardio mix to boost aerobic fitness.',
    url: 'https://youtube.com', duration: '20:00', category: 'Cardio', difficulty: 'Intermediate',
    muscleGroups: ['Full Body'], createdAt: '2026-03-01',
  },
]

const MOCK_PROGRAMS: StudioProgram[] = [
  {
    id: 'p1', name: '4-Week Beginner Foundation', description: 'A structured 4-week program for clients new to exercise. 3 sessions per week.',
    videos: ['v3', 'v4', 'v6'], assignedTo: ['Sophie Nguyen'], totalDuration: '75 min / session', level: 'Beginner', createdAt: '2026-01-20',
  },
  {
    id: 'p2', name: 'Strength & Conditioning', description: 'Upper/lower split with cardio finishers. Designed for intermediate trainees.',
    videos: ['v1', 'v2', 'v5', 'v8'], assignedTo: ['Liam Carter', 'Jake Wilson'], totalDuration: '50–60 min / session', level: 'Intermediate', createdAt: '2026-02-10',
  },
  {
    id: 'p3', name: 'Advanced Hypertrophy Block', description: '6-week hypertrophy-focused program for experienced lifters.',
    videos: ['v7', 'v2'], assignedTo: [], totalDuration: '60–70 min / session', level: 'Advanced', createdAt: '2026-03-01',
  },
]

const MOCK_CLIENTS = ['Liam Carter', 'Sophie Nguyen', 'Jake Wilson', 'Emma Thompson']

function difficultyBadge(level: string) {
  switch (level) {
    case 'Beginner': return 'bg-green-500/10 text-green-400'
    case 'Intermediate': return 'bg-amber-500/10 text-amber-400'
    case 'Advanced': return 'bg-red-500/10 text-red-400'
    default: return 'bg-surface-light text-cb-secondary'
  }
}

type AddVideoModalProps = { onClose: () => void; onAdd: (v: Partial<StudioVideo>) => void }
function AddVideoModal({ onClose, onAdd }: AddVideoModalProps) {
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [url, setUrl] = useState('')
  const [duration, setDuration] = useState('')
  const [category, setCategory] = useState('Full Body')
  const [difficulty, setDifficulty] = useState<StudioVideo['difficulty']>('Intermediate')

  function submit() {
    if (!title.trim() || !url.trim()) return
    onAdd({ title, description, url, duration, category, difficulty, muscleGroups: [], createdAt: new Date().toISOString().split('T')[0] })
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="bg-surface rounded-2xl shadow-2xl w-full max-w-lg mx-4">
        <div className="flex items-center justify-between p-6 border-b border-cb-border">
          <h2 className="text-lg font-semibold text-cb-text">Add Video</h2>
          <button onClick={onClose} className="text-cb-muted hover:text-cb-text transition-colors"><X size={20} /></button>
        </div>
        <div className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-cb-secondary mb-1">Title</label>
            <input className="w-full bg-surface-light border border-cb-border rounded-xl px-3 py-2 text-cb-text text-sm focus:outline-none focus:border-brand" placeholder="Video title..." value={title} onChange={e => setTitle(e.target.value)} />
          </div>
          <div>
            <label className="block text-sm font-medium text-cb-secondary mb-1">Description</label>
            <textarea className="w-full bg-surface-light border border-cb-border rounded-xl px-3 py-2 text-cb-text text-sm focus:outline-none focus:border-brand resize-none h-16" placeholder="Brief description..." value={description} onChange={e => setDescription(e.target.value)} />
          </div>
          <div>
            <label className="block text-sm font-medium text-cb-secondary mb-1">YouTube / Vimeo URL</label>
            <input className="w-full bg-surface-light border border-cb-border rounded-xl px-3 py-2 text-cb-text text-sm focus:outline-none focus:border-brand" placeholder="https://youtube.com/watch?v=..." value={url} onChange={e => setUrl(e.target.value)} />
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-sm font-medium text-cb-secondary mb-1">Duration</label>
              <input className="w-full bg-surface-light border border-cb-border rounded-xl px-3 py-2 text-cb-text text-sm focus:outline-none focus:border-brand" placeholder="30:00" value={duration} onChange={e => setDuration(e.target.value)} />
            </div>
            <div>
              <label className="block text-sm font-medium text-cb-secondary mb-1">Category</label>
              <select className="w-full bg-surface-light border border-cb-border rounded-xl px-3 py-2 text-cb-text text-sm focus:outline-none focus:border-brand" value={category} onChange={e => setCategory(e.target.value)}>
                {['Full Body', 'Upper Body', 'Lower Body', 'Core', 'Cardio', 'Mobility', 'Tutorial'].map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-cb-secondary mb-1">Difficulty</label>
              <select className="w-full bg-surface-light border border-cb-border rounded-xl px-3 py-2 text-cb-text text-sm focus:outline-none focus:border-brand" value={difficulty} onChange={e => setDifficulty(e.target.value as StudioVideo['difficulty'])}>
                {(['Beginner', 'Intermediate', 'Advanced'] as const).map(d => <option key={d} value={d}>{d}</option>)}
              </select>
            </div>
          </div>
        </div>
        <div className="flex justify-end gap-3 p-6 pt-0">
          <button onClick={onClose} className="px-4 py-2 text-sm text-cb-secondary hover:text-cb-text transition-colors">Cancel</button>
          <button onClick={submit} disabled={!title.trim() || !url.trim()} className="px-4 py-2 bg-brand text-white rounded-xl text-sm font-medium hover:bg-brand-light transition-colors disabled:opacity-50">Add Video</button>
        </div>
      </div>
    </div>
  )
}

function VideoCard({ video, onDelete }: { video: StudioVideo; onDelete: () => void }) {
  const [showMenu, setShowMenu] = useState(false)
  return (
    <div className="bg-surface border border-cb-border rounded-xl overflow-hidden hover:border-brand/40 transition-colors group">
      {/* Thumbnail area */}
      <div className="relative h-36 bg-surface-light flex items-center justify-center">
        <div className="absolute inset-0 bg-gradient-to-br from-brand/5 to-brand/20" />
        <button onClick={() => window.open(video.url, '_blank')} className="relative z-10 w-12 h-12 rounded-full bg-black/50 flex items-center justify-center hover:bg-brand transition-colors group-hover:scale-105 transition-transform">
          <Play size={20} className="text-white ml-0.5" fill="white" />
        </button>
        <div className="absolute bottom-2 right-2 bg-black/70 text-white text-xs px-1.5 py-0.5 rounded flex items-center gap-1">
          <Clock size={10} /> {video.duration}
        </div>
      </div>
      <div className="p-3">
        <div className="flex items-start justify-between gap-2 mb-1">
          <h4 className="font-semibold text-cb-text text-sm leading-tight">{video.title}</h4>
          <div className="relative shrink-0">
            <button onClick={() => setShowMenu(!showMenu)} className="p-0.5 rounded text-cb-muted hover:text-cb-text transition-colors">
              <MoreHorizontal size={15} />
            </button>
            {showMenu && (
              <div className="absolute right-0 top-5 z-20 bg-surface border border-cb-border rounded-xl shadow-2xl w-36 py-1">
                <button onClick={() => { window.open(video.url, '_blank'); setShowMenu(false) }} className="w-full flex items-center gap-2 px-3 py-2 text-sm text-cb-text hover:bg-surface-light transition-colors">
                  <ExternalLink size={13} /> Open Video
                </button>
                <div className="h-px bg-cb-border mx-2 my-1" />
                <button onClick={() => { onDelete(); setShowMenu(false) }} className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-400 hover:bg-surface-light transition-colors">
                  <X size={13} /> Delete
                </button>
              </div>
            )}
          </div>
        </div>
        <p className="text-xs text-cb-secondary mb-2 line-clamp-2">{video.description}</p>
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className={clsx('px-2 py-0.5 rounded-full text-xs font-medium', difficultyBadge(video.difficulty))}>{video.difficulty}</span>
          <span className="px-2 py-0.5 rounded-full bg-surface-light text-cb-muted text-xs">{video.category}</span>
        </div>
      </div>
    </div>
  )
}

export default function WorkoutStudioPage() {
  const [activeTab, setActiveTab] = useState<'library' | 'programs'>('library')
  const [videos, setVideos] = useState<StudioVideo[]>(MOCK_VIDEOS)
  const [programs] = useState<StudioProgram[]>(MOCK_PROGRAMS)
  const [search, setSearch] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('All')
  const [difficultyFilter, setDifficultyFilter] = useState('All')
  const [showAddVideo, setShowAddVideo] = useState(false)
  const [expandedProgram, setExpandedProgram] = useState<string | null>(null)

  const filteredVideos = videos.filter(v => {
    const matchSearch = v.title.toLowerCase().includes(search.toLowerCase()) || v.description.toLowerCase().includes(search.toLowerCase())
    const matchCat = categoryFilter === 'All' || v.category === categoryFilter
    const matchDiff = difficultyFilter === 'All' || v.difficulty === difficultyFilter
    return matchSearch && matchCat && matchDiff
  })

  function handleAddVideo(data: Partial<StudioVideo>) {
    setVideos(prev => [{ id: Date.now().toString(), title: data.title!, description: data.description || '', url: data.url!, duration: data.duration || '—', category: data.category || 'Full Body', difficulty: data.difficulty || 'Intermediate', muscleGroups: [], createdAt: data.createdAt! }, ...prev])
  }

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-cb-text">Workout Studio</h1>
          <p className="text-cb-secondary text-sm mt-0.5">Build on-demand video workout content for clients</p>
        </div>
        <div className="flex gap-2">
          {activeTab === 'library' && (
            <button onClick={() => setShowAddVideo(true)} className="flex items-center gap-2 px-4 py-2 bg-brand text-white rounded-xl text-sm font-medium hover:bg-brand-light transition-colors">
              <Plus size={16} /> Add Video
            </button>
          )}
          {activeTab === 'programs' && (
            <button className="flex items-center gap-2 px-4 py-2 bg-brand text-white rounded-xl text-sm font-medium hover:bg-brand-light transition-colors">
              <Plus size={16} /> New Program
            </button>
          )}
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        {[
          { label: 'Total Videos', value: videos.length },
          { label: 'Studio Programs', value: programs.length },
          { label: 'Clients Enrolled', value: Array.from(new Set(programs.flatMap(p => p.assignedTo))).length },
        ].map(s => (
          <div key={s.label} className="bg-surface border border-cb-border rounded-xl p-4">
            <p className="text-2xl font-bold text-cb-text">{s.value}</p>
            <p className="text-sm text-cb-secondary mt-0.5">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-5 bg-surface-light rounded-xl p-1 w-fit">
        {(['library', 'programs'] as const).map(tab => (
          <button key={tab} onClick={() => setActiveTab(tab)} className={clsx('px-4 py-1.5 rounded-lg text-sm font-medium transition-colors capitalize', activeTab === tab ? 'bg-surface text-cb-text shadow-sm' : 'text-cb-secondary hover:text-cb-text')}>
            {tab === 'library' ? (
              <span className="flex items-center gap-1.5"><Video size={14} /> Video Library</span>
            ) : (
              <span className="flex items-center gap-1.5"><Layers size={14} /> Studio Programs</span>
            )}
          </button>
        ))}
      </div>

      {activeTab === 'library' && (
        <>
          <div className="flex flex-col sm:flex-row gap-3 mb-5">
            <div className="relative flex-1">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-cb-muted" />
              <input className="w-full bg-surface border border-cb-border rounded-xl pl-9 pr-4 py-2 text-sm text-cb-text placeholder-cb-muted focus:outline-none focus:border-brand" placeholder="Search videos..." value={search} onChange={e => setSearch(e.target.value)} />
            </div>
            <div className="flex gap-2 flex-wrap">
              {CATEGORIES.map(c => (
                <button key={c} onClick={() => setCategoryFilter(c)} className={clsx('px-3 py-1.5 rounded-xl text-xs font-medium border transition-colors', categoryFilter === c ? 'bg-brand text-white border-brand' : 'bg-surface border-cb-border text-cb-secondary hover:border-brand')}>
                  {c}
                </button>
              ))}
            </div>
          </div>
          <div className="flex gap-2 mb-5">
            {DIFFICULTIES.map(d => (
              <button key={d} onClick={() => setDifficultyFilter(d)} className={clsx('px-3 py-1 rounded-full text-xs font-medium border transition-colors', difficultyFilter === d ? difficultyBadge(d) + ' border-current' : 'border-cb-border text-cb-muted hover:border-brand hover:text-brand')}>
                {d}
              </button>
            ))}
          </div>
          {filteredVideos.length === 0 ? (
            <div className="text-center py-16 text-cb-muted">
              <Video size={40} className="mx-auto mb-3 opacity-40" />
              <p className="font-medium">No videos found</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {filteredVideos.map(v => (
                <VideoCard key={v.id} video={v} onDelete={() => setVideos(prev => prev.filter(x => x.id !== v.id))} />
              ))}
            </div>
          )}
        </>
      )}

      {activeTab === 'programs' && (
        <div className="space-y-3">
          {programs.map(p => {
            const programVideos = videos.filter(v => p.videos.includes(v.id))
            return (
              <div key={p.id} className={clsx('bg-surface border rounded-xl transition-colors', expandedProgram === p.id ? 'border-brand/40' : 'border-cb-border hover:border-brand/30')}>
                <div className="flex items-center gap-4 p-4">
                  <div className="w-10 h-10 rounded-xl bg-brand/10 border border-brand/30 flex items-center justify-center">
                    <Dumbbell size={18} className="text-brand" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold text-cb-text">{p.name}</h3>
                      <span className={clsx('px-2 py-0.5 rounded-full text-xs font-medium', difficultyBadge(p.level))}>{p.level}</span>
                    </div>
                    <p className="text-sm text-cb-secondary truncate">{p.description}</p>
                  </div>
                  <div className="flex items-center gap-4 shrink-0 text-xs text-cb-muted">
                    <div className="flex items-center gap-1"><Video size={12} /> {p.videos.length} videos</div>
                    <div className="flex items-center gap-1"><Clock size={12} /> {p.totalDuration}</div>
                    {p.assignedTo.length > 0 && <div className="flex items-center gap-1"><Users size={12} /> {p.assignedTo.length}</div>}
                  </div>
                  <button onClick={() => setExpandedProgram(expandedProgram === p.id ? null : p.id)} className="p-1 rounded-lg text-cb-muted hover:text-cb-text hover:bg-surface-light transition-colors">
                    <ChevronRight size={16} className={clsx('transition-transform', expandedProgram === p.id ? 'rotate-90' : '')} />
                  </button>
                </div>
                {expandedProgram === p.id && (
                  <div className="border-t border-cb-border p-4">
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-2 mb-3">
                      {programVideos.map(v => (
                        <a key={v.id} href={v.url} target="_blank" rel="noreferrer" className="flex items-center gap-2 p-2 bg-surface-light rounded-lg hover:bg-brand/5 transition-colors group">
                          <Play size={13} className="text-brand shrink-0" />
                          <span className="text-xs text-cb-text truncate group-hover:text-brand transition-colors">{v.title}</span>
                          <span className="text-xs text-cb-muted ml-auto shrink-0">{v.duration}</span>
                        </a>
                      ))}
                    </div>
                    {p.assignedTo.length > 0 && (
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-cb-muted">Assigned to:</span>
                        {p.assignedTo.map(n => <span key={n} className="px-2 py-0.5 rounded-full bg-brand/10 text-brand text-xs">{n}</span>)}
                      </div>
                    )}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}

      {showAddVideo && <AddVideoModal onClose={() => setShowAddVideo(false)} onAdd={handleAddVideo} />}
    </div>
  )
}
