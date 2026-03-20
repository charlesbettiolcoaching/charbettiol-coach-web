'use client'

import { useState, KeyboardEvent } from 'react'
import { User, Bell, Shield, CreditCard, Palette, ChevronRight, Bot, X } from 'lucide-react'
import clsx from 'clsx'

const SECTIONS = [
  {
    id: 'profile',
    label: 'Profile',
    icon: User,
    description: 'Your name, bio, and contact details',
    fields: [
      { label: 'Full Name',          placeholder: 'Charles Bettiol',              type: 'text' },
      { label: 'Business Name',      placeholder: 'Charles Bettiol Coaching',     type: 'text' },
      { label: 'Email',              placeholder: 'coach@example.com',            type: 'email' },
      { label: 'Phone',              placeholder: '+61 400 000 000',              type: 'tel' },
    ],
    textareas: [
      { label: 'Bio', placeholder: 'Tell clients a bit about your coaching philosophy…', rows: 3 },
    ],
  },
  {
    id: 'notifications',
    label: 'Notifications',
    icon: Bell,
    description: 'When and how you hear about client activity',
    toggles: [
      { label: 'Client logs a workout',    desc: 'Get notified when a client completes a session' },
      { label: 'Weekly check-in received', desc: 'Get notified when a client submits their check-in' },
      { label: 'Client hasn\'t logged in', desc: 'Alert after 7 days of inactivity' },
    ],
  },
  {
    id: 'ai_voice',
    label: 'AI Voice',
    icon: Bot,
    description: 'Help the AI speak in your voice when covering for you.',
  },
]

const TONE_SUGGESTIONS = ['direct', 'encouraging', 'no fluff', 'data-driven', 'motivating', 'tough love', 'supportive', 'evidence-based']

function inputCls() {
  return 'w-full px-3 py-2.5 bg-surface-light border border-cb-border rounded-lg text-sm text-cb-text placeholder-cb-muted focus:outline-none focus:ring-2 focus:ring-brand/40 transition-colors'
}

export default function SettingsPage() {
  const [activeSection, setActiveSection] = useState('profile')
  const [saved, setSaved] = useState(false)
  const [toggles, setToggles] = useState<Record<string, boolean>>({
    'Client logs a workout': true,
    'Weekly check-in received': true,
    "Client hasn't logged in": false,
  })

  // AI Voice state
  const [aiProfileBio, setAiProfileBio] = useState('')
  const [toneKeywords, setToneKeywords] = useState<string[]>(['direct', 'encouraging'])
  const [tagInput, setTagInput] = useState('')
  const [aiSaving, setAiSaving] = useState(false)
  const [aiSaved, setAiSaved] = useState(false)

  function handleSave() {
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  function addTag(tag: string) {
    const trimmed = tag.trim().toLowerCase()
    if (!trimmed || toneKeywords.includes(trimmed) || toneKeywords.length >= 8) return
    setToneKeywords((prev) => [...prev, trimmed])
  }

  function removeTag(tag: string) {
    setToneKeywords((prev) => prev.filter((t) => t !== tag))
  }

  function handleTagKeyDown(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault()
      addTag(tagInput)
      setTagInput('')
    }
  }

  async function handleAiSave() {
    setAiSaving(true)
    await new Promise((r) => setTimeout(r, 1000))
    setAiSaving(false)
    setAiSaved(true)
    setTimeout(() => setAiSaved(false), 2000)
  }

  const section = SECTIONS.find((s) => s.id === activeSection)

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <div className="mb-8">
        <h1 className="text-xl font-bold text-cb-text">Settings</h1>
        <p className="text-sm text-cb-muted mt-1">Manage your account and preferences</p>
      </div>

      <div className="flex gap-6">
        {/* Sidebar nav */}
        <div className="w-52 flex-shrink-0">
          <nav className="space-y-0.5">
            {SECTIONS.map((s) => {
              const Icon = s.icon
              return (
                <button
                  key={s.id}
                  onClick={() => setActiveSection(s.id)}
                  className={clsx(
                    'flex items-center gap-3 w-full px-3 py-2.5 rounded-lg text-sm font-medium transition-colors text-left',
                    activeSection === s.id
                      ? 'bg-brand/10 text-brand'
                      : 'text-cb-secondary hover:bg-surface-light hover:text-cb-text'
                  )}
                >
                  <Icon size={16} className={activeSection === s.id ? 'text-brand' : 'text-cb-muted'} />
                  {s.label}
                </button>
              )
            })}
          </nav>
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          {section && activeSection !== 'ai_voice' && (
            <div className="bg-surface border border-cb-border rounded-xl p-6">
              <div className="mb-6">
                <h2 className="text-base font-semibold text-cb-text">{section.label}</h2>
                <p className="text-sm text-cb-muted mt-0.5">{section.description}</p>
              </div>

              <div className="space-y-4">
                {section.fields?.map((f) => (
                  <div key={f.label}>
                    <label className="block text-xs font-medium text-cb-secondary mb-1.5">{f.label}</label>
                    <input type={f.type} placeholder={f.placeholder} className={inputCls()} />
                  </div>
                ))}
                {section.textareas?.map((f) => (
                  <div key={f.label}>
                    <label className="block text-xs font-medium text-cb-secondary mb-1.5">{f.label}</label>
                    <textarea rows={f.rows} placeholder={f.placeholder} className={`${inputCls()} resize-none`} />
                  </div>
                ))}
                {section.toggles?.map((t) => (
                  <div key={t.label} className="flex items-start justify-between gap-4 py-3 border-b border-cb-border last:border-0">
                    <div>
                      <p className="text-sm font-medium text-cb-text">{t.label}</p>
                      <p className="text-xs text-cb-muted mt-0.5">{t.desc}</p>
                    </div>
                    <button
                      onClick={() => setToggles((prev) => ({ ...prev, [t.label]: !prev[t.label] }))}
                      className={clsx(
                        'relative w-10 h-5.5 rounded-full transition-colors flex-shrink-0 mt-0.5',
                        toggles[t.label] ? 'bg-brand' : 'bg-cb-border'
                      )}
                      style={{ height: '22px', width: '40px' }}
                    >
                      <span
                        className={clsx(
                          'absolute top-0.5 w-4.5 h-4.5 rounded-full bg-white shadow transition-transform',
                          toggles[t.label] ? 'translate-x-5' : 'translate-x-0.5'
                        )}
                        style={{ width: '18px', height: '18px' }}
                      />
                    </button>
                  </div>
                ))}
              </div>

              {section.fields && (
                <div className="mt-6 flex items-center gap-3">
                  <button
                    onClick={handleSave}
                    className="px-5 py-2 bg-brand hover:bg-brand/90 text-white text-sm font-medium rounded-lg transition-colors"
                  >
                    {saved ? 'Saved!' : 'Save Changes'}
                  </button>
                </div>
              )}
            </div>
          )}

          {/* AI Voice section */}
          {activeSection === 'ai_voice' && (
            <div className="bg-surface border border-cb-border rounded-xl p-6">
              <div className="mb-6">
                <h2 className="text-base font-semibold text-cb-text">AI Coach Profile</h2>
                <p className="text-sm text-cb-muted mt-0.5">Help the AI speak in your voice when covering for you.</p>
              </div>

              <div className="space-y-6">
                {/* Coaching Style & Tone */}
                <div>
                  <label className="block text-xs font-medium text-cb-secondary mb-1.5">Coaching Style &amp; Tone</label>
                  <textarea
                    rows={5}
                    value={aiProfileBio}
                    onChange={(e) => setAiProfileBio(e.target.value)}
                    placeholder="Describe how you communicate with clients. E.g. 'I'm direct but encouraging. I use Australian slang, keep messages short, and always acknowledge effort before giving feedback. I hate fluff.'"
                    className={`${inputCls()} resize-none`}
                  />
                </div>

                {/* Tone Keywords */}
                <div>
                  <label className="block text-xs font-medium text-cb-secondary mb-1.5">
                    Tone Keywords
                    <span className="ml-2 text-cb-muted font-normal">{toneKeywords.length}/8</span>
                  </label>

                  {/* Tag pills */}
                  <div className="flex flex-wrap gap-2 mb-2">
                    {toneKeywords.map((tag) => (
                      <span
                        key={tag}
                        className="inline-flex items-center gap-1 px-2.5 py-1 bg-cb-teal/15 text-cb-teal text-xs font-medium rounded-full"
                      >
                        {tag}
                        <button
                          onClick={() => removeTag(tag)}
                          className="hover:text-cb-teal/60 transition-colors"
                          aria-label={`Remove ${tag}`}
                        >
                          <X size={11} />
                        </button>
                      </span>
                    ))}
                  </div>

                  {/* Tag input */}
                  <input
                    type="text"
                    value={tagInput}
                    onChange={(e) => setTagInput(e.target.value)}
                    onKeyDown={handleTagKeyDown}
                    placeholder="Type a keyword and press Enter or comma…"
                    disabled={toneKeywords.length >= 8}
                    className={`${inputCls()} mb-3`}
                  />

                  {/* Suggestions */}
                  <div className="flex flex-wrap gap-1.5">
                    {TONE_SUGGESTIONS.filter((s) => !toneKeywords.includes(s)).map((suggestion) => (
                      <button
                        key={suggestion}
                        onClick={() => addTag(suggestion)}
                        disabled={toneKeywords.length >= 8}
                        className="px-2.5 py-1 border border-cb-border text-xs text-cb-secondary rounded-full hover:bg-surface-light hover:text-cb-text transition-colors disabled:opacity-40"
                      >
                        + {suggestion}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Sample Messages info box */}
                <div>
                  <label className="block text-xs font-medium text-cb-secondary mb-1.5">Sample Messages</label>
                  <div className="flex gap-3 p-4 bg-blue-500/8 border border-blue-500/20 rounded-lg">
                    <span className="text-base flex-shrink-0">💬</span>
                    <p className="text-xs text-cb-secondary leading-relaxed">
                      We'll automatically pull your last 50 sent messages to help the AI match your writing style. This happens when you first activate AI Mode.
                    </p>
                  </div>
                </div>

                {/* Save button */}
                <div className="flex items-center gap-3 pt-2">
                  <button
                    onClick={handleAiSave}
                    disabled={aiSaving}
                    className="flex items-center gap-2 px-5 py-2 bg-brand hover:bg-brand/90 disabled:opacity-60 text-white text-sm font-medium rounded-lg transition-colors"
                  >
                    {aiSaving && (
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    )}
                    {aiSaved ? 'Saved!' : 'Save Changes'}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
