'use client'

import { useState } from 'react'
import { Package, Plus, X, Check, Edit2, Trash2 } from 'lucide-react'
import { useIsDemo } from '@/lib/demo/useDemoMode'
import clsx from 'clsx'

type CoachPackage = {
  id: string
  name: string
  description: string
  price: number
  billing: 'monthly' | 'one-time' | '3-month' | '6-month'
  features: string[]
  clientCount: number
  active: boolean
  color: string
}

const DEMO_PACKAGES: CoachPackage[] = [
  {
    id: 'pkg-1',
    name: 'Starter',
    description: 'Perfect for clients just beginning their fitness journey. Core coaching tools included.',
    price: 149,
    billing: 'monthly',
    features: [
      'Weekly check-ins',
      'Custom workout program',
      'Nutrition targets',
      'Message support (Mon–Fri)',
    ],
    clientCount: 3,
    active: true,
    color: '#5B9EAB',
  },
  {
    id: 'pkg-2',
    name: 'Performance',
    description: 'Full-featured coaching for clients serious about results. Includes priority support.',
    price: 249,
    billing: 'monthly',
    features: [
      'Everything in Starter',
      'Bi-weekly video calls',
      'Macro tracking support',
      'Habit program',
      'Progress photo reviews',
      'Priority message response',
      'Monthly body composition review',
      'Supplement guidance',
    ],
    clientCount: 7,
    active: true,
    color: '#7AAFBE',
  },
  {
    id: 'pkg-3',
    name: 'Elite',
    description: 'The full VIP coaching experience. Unlimited access and personalised everything.',
    price: 399,
    billing: 'monthly',
    features: [
      'Everything in Performance',
      'Unlimited video calls',
      'Daily check-in availability',
      'Competition prep support',
      'Custom meal plan',
      'Recipe book access',
      'Blood work review',
      'Recovery and sleep protocol',
      'In-person sessions (if local)',
      'Direct mobile number access',
      'Monthly progress report',
      'Annual goal planning session',
    ],
    clientCount: 2,
    active: true,
    color: '#4A8A99',
  },
]

const BILLING_LABELS: Record<CoachPackage['billing'], string> = {
  monthly: '/mo',
  'one-time': ' one-time',
  '3-month': ' / 3 mo',
  '6-month': ' / 6 mo',
}

const COLOR_OPTIONS = ['#5B9EAB', '#7AAFBE', '#4A8A99', '#22C55E', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899']

function PackageModal({
  initial,
  onClose,
  onSave,
}: {
  initial?: CoachPackage | null
  onClose: () => void
  onSave: (pkg: CoachPackage) => void
}) {
  const [name, setName] = useState(initial?.name ?? '')
  const [description, setDescription] = useState(initial?.description ?? '')
  const [price, setPrice] = useState(initial?.price ?? 149)
  const [billing, setBilling] = useState<CoachPackage['billing']>(initial?.billing ?? 'monthly')
  const [features, setFeatures] = useState<string[]>(initial?.features ?? [''])
  const [color, setColor] = useState(initial?.color ?? '#5B9EAB')
  const [active, setActive] = useState(initial?.active ?? true)

  function addFeature() {
    setFeatures(prev => [...prev, ''])
  }

  function updateFeature(idx: number, val: string) {
    setFeatures(prev => prev.map((f, i) => i === idx ? val : f))
  }

  function removeFeature(idx: number) {
    setFeatures(prev => prev.filter((_, i) => i !== idx))
  }

  function handleSave() {
    if (!name.trim()) return
    onSave({
      id: initial?.id ?? `pkg-${Date.now()}`,
      name: name.trim(),
      description: description.trim(),
      price,
      billing,
      features: features.filter(f => f.trim()),
      clientCount: initial?.clientCount ?? 0,
      active,
      color,
    })
  }

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
      <div className="bg-surface border border-cb-border rounded-xl w-full max-w-lg shadow-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-5 border-b border-cb-border">
          <h2 className="text-lg font-semibold text-cb-text">{initial ? 'Edit Package' : 'New Package'}</h2>
          <button onClick={onClose} className="text-cb-muted hover:text-cb-secondary"><X size={20} /></button>
        </div>
        <div className="p-5 space-y-4">
          <div>
            <label className="block text-xs font-medium text-cb-muted mb-1">Package Name *</label>
            <input
              type="text"
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="e.g. Performance"
              className="w-full px-3 py-2 bg-surface-light border border-cb-border rounded-lg text-sm text-cb-text placeholder-cb-muted focus:outline-none focus:ring-2 focus:ring-brand"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-cb-muted mb-1">Description</label>
            <textarea
              rows={2}
              value={description}
              onChange={e => setDescription(e.target.value)}
              placeholder="Brief description of this package..."
              className="w-full px-3 py-2 bg-surface-light border border-cb-border rounded-lg text-sm text-cb-text placeholder-cb-muted focus:outline-none focus:ring-2 focus:ring-brand resize-none"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-cb-muted mb-1">Price ($)</label>
              <input
                type="number"
                min={0}
                value={price}
                onChange={e => setPrice(Number(e.target.value))}
                className="w-full px-3 py-2 bg-surface-light border border-cb-border rounded-lg text-sm text-cb-text focus:outline-none focus:ring-2 focus:ring-brand"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-cb-muted mb-1">Billing</label>
              <select
                value={billing}
                onChange={e => setBilling(e.target.value as CoachPackage['billing'])}
                className="w-full px-3 py-2 bg-surface-light border border-cb-border rounded-lg text-sm text-cb-secondary focus:outline-none focus:ring-2 focus:ring-brand"
              >
                <option value="monthly">Monthly</option>
                <option value="one-time">One-time</option>
                <option value="3-month">3 Month</option>
                <option value="6-month">6 Month</option>
              </select>
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-cb-muted mb-2">Accent Color</label>
            <div className="flex gap-2 flex-wrap">
              {COLOR_OPTIONS.map(c => (
                <button
                  key={c}
                  onClick={() => setColor(c)}
                  className="w-7 h-7 rounded-full border-2 transition-all"
                  style={{
                    backgroundColor: c,
                    borderColor: color === c ? '#fff' : 'transparent',
                    boxShadow: color === c ? '0 0 0 2px ' + c : 'none',
                  }}
                />
              ))}
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-cb-muted mb-2">Features</label>
            <div className="space-y-2">
              {features.map((f, idx) => (
                <div key={idx} className="flex items-center gap-2">
                  <input
                    type="text"
                    value={f}
                    onChange={e => updateFeature(idx, e.target.value)}
                    placeholder={'Feature ' + (idx + 1)}
                    className="flex-1 px-3 py-1.5 bg-surface-light border border-cb-border rounded-lg text-sm text-cb-text placeholder-cb-muted focus:outline-none focus:ring-2 focus:ring-brand"
                  />
                  <button onClick={() => removeFeature(idx)} className="text-cb-muted hover:text-cb-danger flex-shrink-0">
                    <X size={14} />
                  </button>
                </div>
              ))}
            </div>
            <button onClick={addFeature} className="mt-2 text-xs text-brand hover:text-brand-light flex items-center gap-1">
              <Plus size={12} /> Add feature
            </button>
          </div>
          <div className="flex items-center gap-3">
            <label className="text-sm text-cb-secondary">Active</label>
            <button
              onClick={() => setActive(v => !v)}
              className={clsx(
                'w-10 h-5 rounded-full relative transition-colors',
                active ? 'bg-brand' : 'bg-surface-light border border-cb-border'
              )}
            >
              <span className={clsx('absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-all', active ? 'left-5' : 'left-0.5')} />
            </button>
          </div>
        </div>
        <div className="flex items-center justify-end gap-3 p-5 border-t border-cb-border">
          <button onClick={onClose} className="px-4 py-2 text-sm text-cb-secondary hover:text-cb-text border border-cb-border rounded-lg hover:bg-surface-light transition-colors">Cancel</button>
          <button
            onClick={handleSave}
            disabled={!name.trim()}
            className="px-4 py-2 text-sm bg-brand hover:bg-brand-light disabled:opacity-50 text-white rounded-lg font-medium"
          >
            {initial ? 'Save Changes' : 'Create Package'}
          </button>
        </div>
      </div>
    </div>
  )
}

export default function PackagesPage() {
  const isDemo = useIsDemo()
  const [packages, setPackages] = useState<CoachPackage[]>(isDemo ? DEMO_PACKAGES : [])
  const [showModal, setShowModal] = useState(false)
  const [editPkg, setEditPkg] = useState<CoachPackage | null>(null)

  function handleSave(pkg: CoachPackage) {
    setPackages(prev => {
      const exists = prev.find(p => p.id === pkg.id)
      if (exists) return prev.map(p => p.id === pkg.id ? pkg : p)
      return [...prev, pkg]
    })
    setShowModal(false)
    setEditPkg(null)
  }

  function handleDelete(id: string) {
    setPackages(prev => prev.filter(p => p.id !== id))
  }

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-cb-text">Packages</h1>
          <p className="text-sm text-cb-muted mt-0.5">Create and manage your coaching packages</p>
        </div>
        <button
          onClick={() => { setEditPkg(null); setShowModal(true) }}
          className="flex items-center gap-2 px-4 py-2 bg-brand hover:bg-brand-light text-white rounded-lg text-sm font-medium transition-colors"
        >
          <Plus size={15} /> New Package
        </button>
      </div>

      {packages.length === 0 ? (
        <div className="bg-surface border border-cb-border rounded-lg p-16 text-center">
          <Package size={48} className="mx-auto text-cb-muted mb-4" />
          <h2 className="text-lg font-semibold text-cb-secondary mb-2">No packages yet</h2>
          <p className="text-sm text-cb-muted max-w-sm mx-auto mb-4">
            Create coaching packages to bundle your services and simplify client billing.
          </p>
          <button
            onClick={() => { setEditPkg(null); setShowModal(true) }}
            className="px-4 py-2 bg-brand hover:bg-brand-light text-white rounded-lg text-sm font-medium"
          >
            Create your first package
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
          {packages.map(pkg => (
            <div key={pkg.id} className="bg-surface border border-cb-border rounded-xl overflow-hidden flex flex-col">
              <div className="h-1.5 w-full" style={{ backgroundColor: pkg.color }} />
              <div className="p-5 flex-1 flex flex-col">
                <div className="flex items-start justify-between mb-2">
                  <h3 className="text-lg font-bold text-cb-text">{pkg.name}</h3>
                  <span className={clsx(
                    'text-xs px-2 py-0.5 rounded-full font-medium',
                    pkg.active ? 'bg-cb-success/15 text-cb-success' : 'bg-surface-light text-cb-muted'
                  )}>
                    {pkg.active ? 'Active' : 'Inactive'}
                  </span>
                </div>
                <div className="mb-3">
                  <span className="text-2xl font-bold text-cb-text">${pkg.price.toLocaleString()}</span>
                  <span className="text-sm text-cb-muted">{BILLING_LABELS[pkg.billing]}</span>
                </div>
                <p className="text-sm text-cb-secondary mb-4 leading-relaxed">{pkg.description}</p>
                <ul className="space-y-2 flex-1 mb-4">
                  {pkg.features.map((feat, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm text-cb-secondary">
                      <Check size={14} className="flex-shrink-0 mt-0.5" style={{ color: pkg.color }} />
                      {feat}
                    </li>
                  ))}
                </ul>
                <div className="flex items-center justify-between pt-3 border-t border-cb-border">
                  <span className="text-xs text-cb-muted">
                    {pkg.clientCount} client{pkg.clientCount !== 1 ? 's' : ''} on this plan
                  </span>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => { setEditPkg(pkg); setShowModal(true) }}
                      className="p-1.5 rounded text-cb-muted hover:text-cb-secondary hover:bg-surface-light transition-colors"
                    >
                      <Edit2 size={14} />
                    </button>
                    <button
                      onClick={() => handleDelete(pkg.id)}
                      className="p-1.5 rounded text-cb-muted hover:text-cb-danger hover:bg-surface-light transition-colors"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {showModal && (
        <PackageModal
          initial={editPkg}
          onClose={() => { setShowModal(false); setEditPkg(null) }}
          onSave={handleSave}
        />
      )}
    </div>
  )
}
