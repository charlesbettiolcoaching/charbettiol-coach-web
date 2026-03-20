'use client'

import { useState } from 'react'
import { FileText, Plus, X, ChevronDown, ChevronUp, Eye, Trash2, Send } from 'lucide-react'
import { useIsDemo } from '@/lib/demo/useDemoMode'
import clsx from 'clsx'

type QuestionType = 'short_text' | 'long_text' | 'number' | 'scale' | 'multiple_choice' | 'yes_no'

type Question = {
  id: string
  label: string
  type: QuestionType
  required: boolean
  options?: string[]
}

type Form = {
  id: string
  name: string
  questions: Question[]
  responses: number
  lastSent: string | null
  status: 'active' | 'draft'
}

type Response = {
  id: string
  formId: string
  respondent: string
  date: string
  answers: Record<string, string>
}

const QUESTION_TYPE_LABELS: Record<QuestionType, string> = {
  short_text: 'Short Text',
  long_text: 'Long Text',
  number: 'Number',
  scale: 'Scale (1-10)',
  multiple_choice: 'Multiple Choice',
  yes_no: 'Yes / No',
}

const DEMO_FORMS: Form[] = [
  {
    id: 'form-1',
    name: 'Initial Intake Form',
    questions: [
      { id: 'q1', label: 'Full name', type: 'short_text', required: true },
      { id: 'q2', label: 'Date of birth', type: 'short_text', required: true },
      { id: 'q3', label: 'What are your main fitness goals?', type: 'long_text', required: true },
      { id: 'q4', label: 'Current training frequency (days/week)', type: 'number', required: true },
      { id: 'q5', label: 'Do you have any injuries or medical conditions?', type: 'yes_no', required: true },
      { id: 'q6', label: 'Please describe any injuries or conditions', type: 'long_text', required: false },
      { id: 'q7', label: 'Dietary preferences or restrictions', type: 'short_text', required: false },
      { id: 'q8', label: 'How would you rate your current fitness level (1-10)?', type: 'scale', required: true },
    ],
    responses: 4,
    lastSent: '2026-03-01',
    status: 'active',
  },
  {
    id: 'form-2',
    name: 'Weekly Habits Check',
    questions: [
      { id: 'q1', label: 'Did you hit your daily step target every day?', type: 'yes_no', required: true },
      { id: 'q2', label: 'How many glasses of water did you average per day?', type: 'number', required: true },
      { id: 'q3', label: 'Rate your sleep quality this week (1-10)', type: 'scale', required: true },
      { id: 'q4', label: 'Did you track your meals every day?', type: 'yes_no', required: true },
      { id: 'q5', label: 'Any habits you want to focus on next week?', type: 'long_text', required: false },
    ],
    responses: 8,
    lastSent: '2026-03-08',
    status: 'active',
  },
]

const DEMO_RESPONSES: Response[] = [
  {
    id: 'resp-1',
    formId: 'form-1',
    respondent: 'Liam Carter',
    date: '2026-03-01',
    answers: {
      q1: 'Liam Carter',
      q2: '14 March 1992',
      q3: 'Lose body fat while maintaining muscle mass. Want to get to 82kg lean.',
      q4: '4',
      q5: 'Yes',
      q6: 'Minor lower back tightness — seeing physio.',
      q7: 'High protein, no dairy',
      q8: '7',
    },
  },
  {
    id: 'resp-2',
    formId: 'form-2',
    respondent: 'Sophie Nguyen',
    date: '2026-03-08',
    answers: {
      q1: 'Yes',
      q2: '9',
      q3: '8',
      q4: 'No',
      q5: 'Want to be more consistent with protein intake.',
    },
  },
]

function genId() { return 'q-' + Math.random().toString(36).slice(2) }

export default function FormsPage() {
  const isDemo = useIsDemo()
  const [forms, setForms] = useState<Form[]>(isDemo ? DEMO_FORMS : [])
  const [responses] = useState<Response[]>(isDemo ? DEMO_RESPONSES : [])
  const [tab, setTab] = useState<'forms' | 'responses'>('forms')
  const [showBuilder, setShowBuilder] = useState(false)
  const [builderName, setBuilderName] = useState('')
  const [builderQuestions, setBuilderQuestions] = useState<Question[]>([])
  const [expandedResponse, setExpandedResponse] = useState<string | null>(null)
  const [showPreview, setShowPreview] = useState<Form | null>(null)

  function addQuestion() {
    setBuilderQuestions(prev => [...prev, { id: genId(), label: '', type: 'short_text', required: false }])
  }

  function updateQuestion(id: string, updates: Partial<Question>) {
    setBuilderQuestions(prev => prev.map(q => q.id === id ? { ...q, ...updates } : q))
  }

  function removeQuestion(id: string) {
    setBuilderQuestions(prev => prev.filter(q => q.id !== id))
  }

  function saveForm() {
    if (!builderName.trim()) return
    const newForm: Form = {
      id: 'form-' + Date.now(),
      name: builderName.trim(),
      questions: builderQuestions,
      responses: 0,
      lastSent: null,
      status: 'draft',
    }
    setForms(prev => [...prev, newForm])
    setShowBuilder(false)
    setBuilderName('')
    setBuilderQuestions([])
  }

  if (showBuilder) {
    return (
      <div className="p-6 max-w-3xl mx-auto">
        <button onClick={() => setShowBuilder(false)} className="text-sm text-cb-muted hover:text-cb-secondary mb-4 transition-colors">
          Cancel
        </button>
        <h1 className="text-2xl font-bold text-cb-text mb-6">Form Builder</h1>
        <div className="bg-surface border border-cb-border rounded-xl p-5 mb-4">
          <label className="block text-xs font-medium text-cb-muted mb-1">Form Name *</label>
          <input type="text" value={builderName} onChange={e => setBuilderName(e.target.value)} placeholder="e.g. Initial Intake Form"
            className="w-full px-3 py-2 bg-surface-light border border-cb-border rounded-lg text-sm text-cb-text placeholder-cb-muted focus:outline-none focus:ring-2 focus:ring-brand" />
        </div>
        <div className="space-y-3 mb-4">
          {builderQuestions.map((q, idx) => (
            <div key={q.id} className="bg-surface border border-cb-border rounded-xl p-4">
              <div className="flex items-center gap-3 mb-3">
                <span className="text-xs text-cb-muted font-medium w-5">{idx + 1}.</span>
                <input type="text" value={q.label} onChange={e => updateQuestion(q.id, { label: e.target.value })}
                  placeholder="Question label..."
                  className="flex-1 px-3 py-1.5 bg-surface-light border border-cb-border rounded-lg text-sm text-cb-text placeholder-cb-muted focus:outline-none focus:ring-2 focus:ring-brand" />
                <select value={q.type} onChange={e => updateQuestion(q.id, { type: e.target.value as QuestionType })}
                  className="px-2 py-1.5 bg-surface-light border border-cb-border rounded-lg text-xs text-cb-secondary focus:outline-none">
                  {(Object.keys(QUESTION_TYPE_LABELS) as QuestionType[]).map(t => (
                    <option key={t} value={t}>{QUESTION_TYPE_LABELS[t]}</option>
                  ))}
                </select>
              </div>
              <div className="flex items-center justify-between pl-8">
                <label className="flex items-center gap-2 text-xs text-cb-secondary cursor-pointer">
                  <input type="checkbox" checked={q.required} onChange={e => updateQuestion(q.id, { required: e.target.checked })} className="rounded" />
                  Required
                </label>
                <button onClick={() => removeQuestion(q.id)} className="text-cb-muted hover:text-cb-danger transition-colors">
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
          ))}
        </div>
        <button onClick={addQuestion}
          className="flex items-center gap-2 text-sm text-brand hover:text-brand-light mb-6 transition-colors">
          <Plus size={14} /> Add Question
        </button>
        <div className="flex items-center gap-3">
          <button onClick={() => setShowBuilder(false)}
            className="px-4 py-2 text-sm text-cb-secondary border border-cb-border rounded-lg hover:bg-surface-light transition-colors">
            Cancel
          </button>
          <button onClick={saveForm} disabled={!builderName.trim()}
            className="px-4 py-2 text-sm bg-brand hover:bg-brand-light disabled:opacity-50 text-white rounded-lg font-medium">
            Save Form
          </button>
        </div>
      </div>
    )
  }

  if (showPreview) {
    return (
      <div className="p-6 max-w-2xl mx-auto">
        <button onClick={() => setShowPreview(null)} className="text-sm text-cb-muted hover:text-cb-secondary mb-4 transition-colors">
          Back to Forms
        </button>
        <div className="bg-surface border border-cb-border rounded-xl p-6">
          <h2 className="text-xl font-bold text-cb-text mb-1">{showPreview.name}</h2>
          <p className="text-sm text-cb-muted mb-6">Preview — client-facing view</p>
          <div className="space-y-5">
            {showPreview.questions.map((q, i) => (
              <div key={q.id}>
                <label className="block text-sm font-medium text-cb-text mb-1">
                  {i + 1}. {q.label} {q.required && <span className="text-cb-danger">*</span>}
                </label>
                {q.type === 'long_text' && (
                  <textarea rows={3} placeholder="Your answer..."
                    className="w-full px-3 py-2 bg-surface-light border border-cb-border rounded-lg text-sm text-cb-text placeholder-cb-muted focus:outline-none resize-none" readOnly />
                )}
                {q.type === 'short_text' && (
                  <input type="text" placeholder="Your answer..."
                    className="w-full px-3 py-2 bg-surface-light border border-cb-border rounded-lg text-sm text-cb-text placeholder-cb-muted focus:outline-none" readOnly />
                )}
                {q.type === 'number' && (
                  <input type="number" placeholder="0"
                    className="w-32 px-3 py-2 bg-surface-light border border-cb-border rounded-lg text-sm text-cb-text focus:outline-none" readOnly />
                )}
                {q.type === 'scale' && (
                  <div className="flex gap-2">
                    {[1,2,3,4,5,6,7,8,9,10].map(n => (
                      <button key={n} className="w-9 h-9 rounded-lg border border-cb-border bg-surface-light text-sm text-cb-secondary hover:border-brand hover:text-brand transition-colors">
                        {n}
                      </button>
                    ))}
                  </div>
                )}
                {q.type === 'yes_no' && (
                  <div className="flex gap-3">
                    {['Yes', 'No'].map(opt => (
                      <button key={opt} className="px-4 py-2 border border-cb-border rounded-lg text-sm text-cb-secondary hover:border-brand hover:text-brand transition-colors">
                        {opt}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-cb-text">Forms</h1>
          <p className="text-sm text-cb-muted mt-0.5">Build forms and view client responses</p>
        </div>
        <button onClick={() => setShowBuilder(true)}
          className="flex items-center gap-2 px-4 py-2 bg-brand hover:bg-brand-light text-white rounded-lg text-sm font-medium transition-colors">
          <Plus size={15} /> New Form
        </button>
      </div>

      <div className="flex gap-1 mb-6 bg-surface-light rounded-lg p-1 w-fit">
        {(['forms', 'responses'] as const).map(t => (
          <button key={t} onClick={() => setTab(t)}
            className={clsx('px-4 py-1.5 rounded-md text-sm font-medium transition-colors capitalize',
              tab === t ? 'bg-surface text-cb-text shadow-sm' : 'text-cb-secondary hover:text-cb-text'
            )}>
            {t}
          </button>
        ))}
      </div>

      {tab === 'forms' && (
        <div className="bg-surface border border-cb-border rounded-xl overflow-hidden">
          {forms.length === 0 ? (
            <div className="p-16 text-center">
              <FileText size={40} className="mx-auto text-cb-muted mb-3" />
              <p className="text-cb-muted text-sm">No forms yet. Create your first form.</p>
            </div>
          ) : (
            <table className="w-full">
              <thead>
                <tr className="border-b border-cb-border bg-surface-light">
                  <th className="text-left text-xs font-semibold text-cb-muted uppercase tracking-wider px-4 py-3">Form</th>
                  <th className="text-left text-xs font-semibold text-cb-muted uppercase tracking-wider px-4 py-3">Questions</th>
                  <th className="text-left text-xs font-semibold text-cb-muted uppercase tracking-wider px-4 py-3">Responses</th>
                  <th className="text-left text-xs font-semibold text-cb-muted uppercase tracking-wider px-4 py-3">Last Sent</th>
                  <th className="text-left text-xs font-semibold text-cb-muted uppercase tracking-wider px-4 py-3">Status</th>
                  <th className="px-4 py-3"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-cb-border">
                {forms.map(form => (
                  <tr key={form.id} className="hover:bg-surface-light transition-colors">
                    <td className="px-4 py-3 text-sm font-medium text-cb-text">{form.name}</td>
                    <td className="px-4 py-3 text-sm text-cb-secondary">{form.questions.length}</td>
                    <td className="px-4 py-3 text-sm text-cb-secondary">{form.responses}</td>
                    <td className="px-4 py-3 text-sm text-cb-muted">
                      {form.lastSent ? new Date(form.lastSent).toLocaleDateString('en-AU', { day: 'numeric', month: 'short' }) : '—'}
                    </td>
                    <td className="px-4 py-3">
                      <span className={clsx('text-xs px-2 py-0.5 rounded-full font-medium',
                        form.status === 'active' ? 'bg-cb-success/15 text-cb-success' : 'bg-surface-light text-cb-muted'
                      )}>
                        {form.status}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2 justify-end">
                        <button onClick={() => setShowPreview(form)}
                          className="p-1.5 text-cb-muted hover:text-cb-secondary hover:bg-surface-light rounded transition-colors" title="Preview">
                          <Eye size={14} />
                        </button>
                        <button className="p-1.5 text-cb-muted hover:text-brand hover:bg-brand-bg rounded transition-colors" title="Send">
                          <Send size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {tab === 'responses' && (
        <div className="space-y-3">
          {responses.length === 0 ? (
            <div className="bg-surface border border-cb-border rounded-lg p-16 text-center">
              <p className="text-cb-muted text-sm">No responses yet.</p>
            </div>
          ) : (
            responses.map(resp => {
              const form = forms.find(f => f.id === resp.formId)
              const isExpanded = expandedResponse === resp.id
              return (
                <div key={resp.id} className="bg-surface border border-cb-border rounded-xl overflow-hidden">
                  <button
                    onClick={() => setExpandedResponse(isExpanded ? null : resp.id)}
                    className="w-full flex items-center justify-between px-5 py-4 hover:bg-surface-light transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-brand-bg flex items-center justify-center">
                        <span className="text-xs font-bold text-brand">{resp.respondent.slice(0, 2).toUpperCase()}</span>
                      </div>
                      <div className="text-left">
                        <p className="text-sm font-medium text-cb-text">{resp.respondent}</p>
                        <p className="text-xs text-cb-muted">{form?.name} · {new Date(resp.date).toLocaleDateString('en-AU', { day: 'numeric', month: 'short' })}</p>
                      </div>
                    </div>
                    {isExpanded ? <ChevronUp size={16} className="text-cb-muted" /> : <ChevronDown size={16} className="text-cb-muted" />}
                  </button>
                  {isExpanded && (
                    <div className="px-5 pb-5 border-t border-cb-border">
                      <div className="space-y-3 mt-4">
                        {form?.questions.map(q => (
                          <div key={q.id}>
                            <p className="text-xs font-medium text-cb-muted mb-0.5">{q.label}</p>
                            <p className="text-sm text-cb-text">{resp.answers[q.id] ?? '—'}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )
            })
          )}
        </div>
      )}
    </div>
  )
}
