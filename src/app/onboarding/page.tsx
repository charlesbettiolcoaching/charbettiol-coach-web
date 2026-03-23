'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import {
  Dumbbell, UtensilsCrossed, ClipboardCheck, HeartPulse,
  ListTodo, BookOpen, MessageSquare, TrendingUp, ChevronRight,
  ChevronLeft, Check, Sparkles,
} from 'lucide-react'

type Profession =
  | 'personal_trainer' | 'nutritionist' | 'dietitian'
  | 'exercise_physiologist' | 'strength_coach'
  | 'online_fitness_coach' | 'physiotherapist' | 'other'

interface ClientFeatures {
  training: boolean; nutrition: boolean; check_ins: boolean
  habits: boolean; tasks: boolean; resources: boolean
  messaging: boolean; progress: boolean
}

const PROFESSIONS = [
  { id: 'personal_trainer',      label: 'Personal Trainer',              emoji: '🏋️' },
  { id: 'nutritionist',          label: 'Nutritionist',                  emoji: '🥗' },
  { id: 'dietitian',             label: 'Dietitian',                     emoji: '🍎' },
  { id: 'exercise_physiologist', label: 'Exercise Physiologist',         emoji: '🫀' },
  { id: 'strength_coach',        label: 'Strength & Conditioning Coach', emoji: '💪' },
  { id: 'online_fitness_coach',  label: 'Online Fitness Coach',          emoji: '📱' },
  { id: 'physiotherapist',       label: 'Physiotherapist',               emoji: '🩺' },
  { id: 'other',                 label: 'Other',                         emoji: '✨' },
] as const

const DEFAULTS: Record<Profession, ClientFeatures> = {
  personal_trainer:      { training: true,  nutrition: true,  check_ins: true, habits: true, tasks: true, resources: true, messaging: true, progress: true },
  nutritionist:          { training: false, nutrition: true,  check_ins: true, habits: true, tasks: true, resources: true, messaging: true, progress: true },
  dietitian:             { training: false, nutrition: true,  check_ins: true, habits: true, tasks: true, resources: true, messaging: true, progress: true },
  exercise_physiologist: { training: true,  nutrition: false, check_ins: true, habits: true, tasks: true, resources: true, messaging: true, progress: true },
  strength_coach:        { training: true,  nutrition: false, check_ins: true, habits: true, tasks: true, resources: true, messaging: true, progress: true },
  online_fitness_coach:  { training: true,  nutrition: true,  check_ins: true, habits: true, tasks: true, resources: true, messaging: true, progress: true },
  physiotherapist:       { training: true,  nutrition: false, check_ins: true, habits: true, tasks: true, resources: true, messaging: true, progress: true },
  other:                 { training: true,  nutrition: true,  check_ins: true, habits: true, tasks: true, resources: true, messaging: true, progress: true },
}

const FEATURES = [
  { key: 'training'  as const, label: 'Training & Workouts',  desc: 'Programs, exercises, workout sessions', icon: Dumbbell },
  { key: 'nutrition' as const, label: 'Nutrition Plans',       desc: 'Meal plans, macros, food logging',      icon: UtensilsCrossed },
  { key: 'check_ins' as const, label: 'Check-ins',             desc: 'Weekly progress check-ins',             icon: ClipboardCheck },
  { key: 'habits'    as const, label: 'Habits',                desc: 'Daily habit tracking',                  icon: HeartPulse },
  { key: 'tasks'     as const, label: 'Tasks',                 desc: 'Client to-do lists and assignments',    icon: ListTodo },
  { key: 'resources' as const, label: 'Resources',             desc: 'Share files, videos and guides',        icon: BookOpen },
  { key: 'messaging' as const, label: 'Messaging',             desc: 'Direct chat with clients',              icon: MessageSquare },
  { key: 'progress'  as const, label: 'Progress Tracking',     desc: 'Metrics, photos, measurements',         icon: TrendingUp },
]

export default function OnboardingPage() {
  const router = useRouter()
  const [step, setStep] = useState(1)
  const [profession, setProfession] = useState<Profession | null>(null)
  const [features, setFeatures] = useState<ClientFeatures>(DEFAULTS.personal_trainer)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  function selectProfession(p: Profession) {
    setProfession(p)
    setFeatures(DEFAULTS[p])
  }

  function toggleFeature(key: keyof ClientFeatures) {
    setFeatures(prev => ({ ...prev, [key]: !prev[key] }))
  }

  async function finish() {
    if (!profession) return
    setLoading(true)
    setError(null)
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { router.push('/login'); return }

    const { error: err } = await supabase.from('profiles').update({
      profession,
      client_features: features,
      onboarding_completed: true,
    }).eq('id', user.id)

    if (err) { setError(err.message); setLoading(false); return }
    router.push('/dashboard')
  }

  const TOTAL = 3

  return (
    <div className="min-h-screen bg-cb-bg flex items-center justify-center p-4">
      <div className={`w-full transition-all duration-300 ${step === 1 ? 'max-w-sm' : 'max-w-2xl'}`}>

        {/* Logo */}
        <div className="flex justify-center mb-8">
          <div className="bg-[#2B2B2B] rounded-xl px-8 py-5 flex justify-center">
            <img src="/logo/full-dark.png" alt="CB Coaching" style={{ width: 160, height: 'auto' }} />
          </div>
        </div>

        {/* Progress bar */}
        <div className="flex items-center gap-2 mb-8 px-1">
          {Array.from({ length: TOTAL }).map((_, i) => (
            <div key={i} className={`h-1.5 flex-1 rounded-full transition-all duration-300 ${i < step ? 'bg-[var(--brand)]' : 'bg-cb-border'}`} />
          ))}
        </div>

        <div className="bg-cb-surface border border-cb-border rounded-2xl shadow-lg overflow-hidden">

          {/* ── Step 1: Welcome ─────────────────────── */}
          {step === 1 && (
            <div className="p-8 text-center">
              <div className="w-16 h-16 rounded-2xl bg-[var(--brand)]/10 flex items-center justify-center mx-auto mb-5">
                <Sparkles className="w-8 h-8 text-[var(--brand)]" />
              </div>
              <h1 className="text-2xl font-bold text-cb-text mb-2">Welcome to your platform!</h1>
              <p className="text-cb-text-secondary text-sm mb-8 max-w-xs mx-auto">
                Let's take 60 seconds to set up your coaching workspace so it's perfect for your practice.
              </p>
              <div className="space-y-3 text-left mb-8">
                {[
                  { icon: '🎯', title: 'Tell us your profession', desc: 'So we can set smart defaults' },
                  { icon: '⚙️', title: 'Choose client features', desc: 'Control what your clients see in the app' },
                  { icon: '🚀', title: 'Start coaching', desc: 'Your dashboard will be ready to go' },
                ].map((item, i) => (
                  <div key={i} className="flex items-start gap-3 bg-cb-bg rounded-xl p-4">
                    <span className="text-xl">{item.icon}</span>
                    <div>
                      <p className="text-sm font-semibold text-cb-text">{item.title}</p>
                      <p className="text-xs text-cb-text-secondary mt-0.5">{item.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
              <button
                onClick={() => setStep(2)}
                className="w-full bg-[var(--brand)] hover:opacity-90 text-white font-semibold py-3 px-6 rounded-xl text-sm transition-opacity flex items-center justify-center gap-2"
              >
                Let's get started <ChevronRight size={16} />
              </button>
            </div>
          )}

          {/* ── Step 2: Profession ──────────────────── */}
          {step === 2 && (
            <div className="p-8">
              <div className="mb-6">
                <h2 className="text-xl font-bold text-cb-text">What's your profession?</h2>
                <p className="text-cb-text-secondary text-sm mt-1">We'll pre-select the best features for your clients based on this.</p>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
                {PROFESSIONS.map((p) => (
                  <button
                    key={p.id}
                    onClick={() => selectProfession(p.id as Profession)}
                    className={`p-4 rounded-xl border-2 text-center transition-all ${
                      profession === p.id
                        ? 'border-[var(--brand)] bg-[var(--brand)]/10'
                        : 'border-cb-border bg-cb-bg hover:border-[var(--brand)]/40'
                    }`}
                  >
                    <div className="text-2xl mb-2">{p.emoji}</div>
                    <p className={`text-xs font-semibold leading-tight ${profession === p.id ? 'text-cb-text' : 'text-cb-text-secondary'}`}>
                      {p.label}
                    </p>
                  </button>
                ))}
              </div>
              {error && <p className="text-sm text-red-500 mb-4">{error}</p>}
              <div className="flex gap-3">
                <button onClick={() => setStep(1)} className="flex items-center gap-2 px-5 py-2.5 rounded-xl border border-cb-border text-sm font-medium text-cb-text hover:bg-cb-bg transition-colors">
                  <ChevronLeft size={16} /> Back
                </button>
                <button
                  onClick={() => { if (!profession) { setError('Please select a profession'); return } setError(null); setStep(3) }}
                  className="flex-1 bg-[var(--brand)] hover:opacity-90 text-white font-semibold py-2.5 px-6 rounded-xl text-sm transition-opacity flex items-center justify-center gap-2"
                >
                  Next <ChevronRight size={16} />
                </button>
              </div>
            </div>
          )}

          {/* ── Step 3: Features ────────────────────── */}
          {step === 3 && (
            <div className="p-8">
              <div className="mb-6">
                <h2 className="text-xl font-bold text-cb-text">What can your clients access?</h2>
                <p className="text-cb-text-secondary text-sm mt-1">Based on your profession, we've pre-selected the best options. Customise freely — you can always change this in Settings.</p>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-6">
                {FEATURES.map(({ key, label, desc, icon: Icon }) => (
                  <div
                    key={key}
                    onClick={() => toggleFeature(key)}
                    className={`flex items-center gap-4 p-4 rounded-xl border-2 cursor-pointer transition-all ${
                      features[key]
                        ? 'border-[var(--brand)] bg-[var(--brand)]/8'
                        : 'border-cb-border bg-cb-bg hover:border-cb-border/70'
                    }`}
                  >
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${features[key] ? 'bg-[var(--brand)]/15' : 'bg-cb-surface'}`}>
                      <Icon size={18} className={features[key] ? 'text-[var(--brand)]' : 'text-cb-text-secondary'} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-cb-text">{label}</p>
                      <p className="text-xs text-cb-text-secondary mt-0.5">{desc}</p>
                    </div>
                    {/* Toggle */}
                    <div
                      className={`relative flex-shrink-0 rounded-full transition-colors`}
                      style={{ width: 40, height: 22, backgroundColor: features[key] ? 'var(--brand)' : 'var(--cb-border, #e2e8f0)' }}
                    >
                      <span
                        className="absolute top-0.5 rounded-full bg-white shadow transition-transform"
                        style={{ width: 18, height: 18, transform: features[key] ? 'translateX(20px)' : 'translateX(2px)' }}
                      />
                    </div>
                  </div>
                ))}
              </div>
              {error && <p className="text-sm text-red-500 mb-4">{error}</p>}
              <div className="flex gap-3">
                <button onClick={() => setStep(2)} className="flex items-center gap-2 px-5 py-2.5 rounded-xl border border-cb-border text-sm font-medium text-cb-text hover:bg-cb-bg transition-colors">
                  <ChevronLeft size={16} /> Back
                </button>
                <button
                  onClick={finish}
                  disabled={loading}
                  className="flex-1 bg-[var(--brand)] hover:opacity-90 disabled:opacity-60 text-white font-semibold py-2.5 px-6 rounded-xl text-sm transition-opacity flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> Saving...</>
                  ) : (
                    <><Check size={16} /> Go to my dashboard</>
                  )}
                </button>
              </div>
            </div>
          )}
        </div>

        <p className="text-center text-xs text-cb-text-secondary mt-6">You can change any of these settings later from your Settings page.</p>
      </div>
    </div>
  )
}
