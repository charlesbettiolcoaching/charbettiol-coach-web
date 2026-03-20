'use client'

import { useState } from 'react'
import { Plus, BookOpen, Search, ChevronRight, Sparkles, X, MoreHorizontal, Clock, Flame, Beef, Wheat, Droplets, Users } from 'lucide-react'
import clsx from 'clsx'

type Recipe = {
  id: string
  name: string
  description: string
  prepTime: number
  calories: number
  protein: number
  carbs: number
  fats: number
  ingredients: string[]
  steps: string[]
  tags: string[]
  image?: string
}

type RecipeBook = {
  id: string
  name: string
  description: string
  recipes: Recipe[]
  assignedTo: string[]
  createdAt: string
  dietType: string
}

const MOCK_BOOKS: RecipeBook[] = [
  {
    id: '1',
    name: 'High Protein Meals',
    description: 'Lean, high-protein recipes perfect for muscle building and fat loss phases.',
    dietType: 'High Protein',
    assignedTo: ['Liam Carter', 'Jake Wilson'],
    createdAt: '2026-01-20',
    recipes: [
      {
        id: 'r1', name: 'Chicken & Rice Power Bowl', description: 'A simple, filling meal with lean protein and complex carbs.',
        prepTime: 25, calories: 520, protein: 48, carbs: 52, fats: 9,
        ingredients: ['200g chicken breast', '150g jasmine rice (dry)', '1 cup broccoli', '1 tbsp olive oil', 'Salt, pepper, garlic powder'],
        steps: ['Cook rice as per packet instructions.', 'Season chicken and cook in pan with olive oil for 6–7 mins per side.', 'Steam broccoli until tender.', 'Slice chicken and assemble bowl.'],
        tags: ['meal prep', 'high protein', 'gluten-free'],
      },
      {
        id: 'r2', name: 'Tuna Avocado Salad', description: 'Quick no-cook meal with healthy fats and lean protein.',
        prepTime: 10, calories: 380, protein: 36, carbs: 12, fats: 22,
        ingredients: ['1 can tuna in water', '1/2 avocado', '1/4 red onion', 'Lemon juice', 'Mixed leaves', 'Salt & pepper'],
        steps: ['Drain tuna and place in bowl.', 'Dice avocado and red onion.', 'Mix together with lemon juice.', 'Serve over mixed leaves.'],
        tags: ['quick', 'no-cook', 'keto-friendly'],
      },
    ],
  },
  {
    id: '2',
    name: 'Healthy Breakfast Ideas',
    description: 'Nutrient-dense breakfast options to fuel your morning training sessions.',
    dietType: 'Balanced',
    assignedTo: ['Sophie Nguyen', 'Emma Thompson'],
    createdAt: '2026-02-05',
    recipes: [
      {
        id: 'r3', name: 'Greek Yogurt Parfait', description: 'Layered protein-rich breakfast ready in minutes.',
        prepTime: 5, calories: 310, protein: 24, carbs: 38, fats: 6,
        ingredients: ['200g Greek yogurt (0% fat)', '80g mixed berries', '30g granola', '1 tsp honey'],
        steps: ['Layer yogurt in a glass or bowl.', 'Add berries and granola.', 'Drizzle honey on top.'],
        tags: ['quick', 'no-cook', 'vegetarian'],
      },
      {
        id: 'r4', name: 'Protein Oats', description: 'Classic oats boosted with protein powder for a satisfying start.',
        prepTime: 8, calories: 420, protein: 32, carbs: 55, fats: 7,
        ingredients: ['80g rolled oats', '1 scoop vanilla protein powder', '250ml almond milk', '1 banana', 'Cinnamon'],
        steps: ['Combine oats and almond milk in a saucepan.', 'Cook over medium heat, stirring, for 5 mins.', 'Remove from heat, stir in protein powder.', 'Top with sliced banana and cinnamon.'],
        tags: ['meal prep', 'high protein', 'vegetarian'],
      },
    ],
  },
  {
    id: '3',
    name: 'Cutting Phase Meals',
    description: 'Low-calorie, high-volume meals to stay full during a calorie deficit.',
    dietType: 'Low Calorie',
    assignedTo: [],
    createdAt: '2026-02-28',
    recipes: [
      {
        id: 'r5', name: 'Zucchini Noodle Bolognese', description: 'All the satisfaction of pasta with a fraction of the carbs.',
        prepTime: 30, calories: 290, protein: 28, carbs: 14, fats: 12,
        ingredients: ['2 large zucchinis', '250g lean beef mince', '1 can crushed tomatoes', '1 onion', '2 garlic cloves', 'Italian herbs'],
        steps: ['Spiralise zucchinis and set aside.', 'Brown mince with onion and garlic.', 'Add tomatoes and herbs, simmer 15 mins.', 'Serve bolognese over zucchini noodles.'],
        tags: ['low carb', 'high protein', 'gluten-free'],
      },
    ],
  },
]

const MOCK_CLIENTS = ['Liam Carter', 'Sophie Nguyen', 'Jake Wilson', 'Emma Thompson']
const DIET_TYPES = ['All', 'High Protein', 'Balanced', 'Low Calorie', 'Keto', 'Vegan']

function MacroBadge({ value, label, color }: { value: number; label: string; color: string }) {
  return (
    <div className={clsx('flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium', color)}>
      <span>{value}g</span>
      <span className="opacity-60">{label}</span>
    </div>
  )
}

function RecipeCard({ recipe, onDelete }: { recipe: Recipe; onDelete: () => void }) {
  const [expanded, setExpanded] = useState(false)
  const [showMenu, setShowMenu] = useState(false)

  return (
    <div className="bg-surface-light rounded-xl border border-cb-border overflow-hidden">
      <div className="p-4">
        <div className="flex items-start justify-between gap-2 mb-2">
          <h4 className="font-semibold text-cb-text text-sm">{recipe.name}</h4>
          <div className="relative">
            <button onClick={() => setShowMenu(!showMenu)} className="p-1 rounded-lg text-cb-muted hover:text-cb-text hover:bg-surface transition-colors">
              <MoreHorizontal size={14} />
            </button>
            {showMenu && (
              <div className="absolute right-0 top-6 z-20 bg-surface border border-cb-border rounded-xl shadow-2xl w-36 py-1">
                <button className="w-full flex items-center gap-2 px-3 py-2 text-sm text-cb-text hover:bg-surface-light transition-colors">Edit</button>
                <div className="h-px bg-cb-border mx-2 my-1" />
                <button onClick={() => { onDelete(); setShowMenu(false) }} className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-400 hover:bg-surface-light transition-colors">
                  <X size={12} /> Delete
                </button>
              </div>
            )}
          </div>
        </div>
        <p className="text-xs text-cb-secondary mb-3">{recipe.description}</p>
        <div className="flex items-center gap-3 mb-3">
          <div className="flex items-center gap-1 text-xs text-cb-muted">
            <Clock size={12} /> {recipe.prepTime} min
          </div>
          <div className="flex items-center gap-1 text-xs text-cb-muted">
            <Flame size={12} /> {recipe.calories} kcal
          </div>
        </div>
        <div className="flex flex-wrap gap-1.5 mb-3">
          <MacroBadge value={recipe.protein} label="P" color="bg-brand/10 text-brand" />
          <MacroBadge value={recipe.carbs} label="C" color="bg-amber-500/10 text-amber-400" />
          <MacroBadge value={recipe.fats} label="F" color="bg-red-500/10 text-red-400" />
        </div>
        <button onClick={() => setExpanded(!expanded)} className="flex items-center gap-1 text-xs text-brand hover:underline">
          {expanded ? 'Hide details' : 'View recipe'}
          <ChevronRight size={12} className={clsx('transition-transform', expanded ? 'rotate-90' : '')} />
        </button>
      </div>
      {expanded && (
        <div className="border-t border-cb-border p-4 space-y-3">
          <div>
            <p className="text-xs font-semibold text-cb-secondary mb-1.5">Ingredients</p>
            <ul className="space-y-1">
              {recipe.ingredients.map((ing, i) => (
                <li key={i} className="flex items-center gap-2 text-xs text-cb-text">
                  <span className="w-1.5 h-1.5 rounded-full bg-brand shrink-0" />
                  {ing}
                </li>
              ))}
            </ul>
          </div>
          <div>
            <p className="text-xs font-semibold text-cb-secondary mb-1.5">Method</p>
            <ol className="space-y-1">
              {recipe.steps.map((step, i) => (
                <li key={i} className="flex items-start gap-2 text-xs text-cb-text">
                  <span className="text-cb-muted shrink-0 w-4">{i + 1}.</span>
                  {step}
                </li>
              ))}
            </ol>
          </div>
          {recipe.tags.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {recipe.tags.map(tag => <span key={tag} className="px-2 py-0.5 rounded-full bg-surface text-cb-muted text-xs">{tag}</span>)}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

type NewBookModalProps = { onClose: () => void; onAdd: (b: Partial<RecipeBook>) => void }
function NewBookModal({ onClose, onAdd }: NewBookModalProps) {
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [dietType, setDietType] = useState('Balanced')
  const [selectedClients, setSelectedClients] = useState<string[]>([])

  function submit() {
    if (!name.trim()) return
    onAdd({ name, description, dietType, assignedTo: selectedClients, recipes: [] })
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="bg-surface rounded-2xl shadow-2xl w-full max-w-md mx-4">
        <div className="flex items-center justify-between p-6 border-b border-cb-border">
          <h2 className="text-lg font-semibold text-cb-text">New Recipe Book</h2>
          <button onClick={onClose} className="text-cb-muted hover:text-cb-text transition-colors"><X size={20} /></button>
        </div>
        <div className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-cb-secondary mb-1">Name</label>
            <input className="w-full bg-surface-light border border-cb-border rounded-xl px-3 py-2 text-cb-text text-sm focus:outline-none focus:border-brand" placeholder="e.g. High Protein Meals" value={name} onChange={e => setName(e.target.value)} />
          </div>
          <div>
            <label className="block text-sm font-medium text-cb-secondary mb-1">Description</label>
            <textarea className="w-full bg-surface-light border border-cb-border rounded-xl px-3 py-2 text-cb-text text-sm focus:outline-none focus:border-brand resize-none h-16" placeholder="What is this recipe book for?" value={description} onChange={e => setDescription(e.target.value)} />
          </div>
          <div>
            <label className="block text-sm font-medium text-cb-secondary mb-1">Diet Type</label>
            <select className="w-full bg-surface-light border border-cb-border rounded-xl px-3 py-2 text-cb-text text-sm focus:outline-none focus:border-brand" value={dietType} onChange={e => setDietType(e.target.value)}>
              {['High Protein', 'Balanced', 'Low Calorie', 'Keto', 'Vegan'].map(t => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-cb-secondary mb-2">Assign to Clients</label>
            <div className="flex flex-wrap gap-2">
              {MOCK_CLIENTS.map(c => (
                <button key={c} onClick={() => setSelectedClients(prev => prev.includes(c) ? prev.filter(x => x !== c) : [...prev, c])} className={clsx('px-3 py-1 rounded-full text-xs font-medium border transition-colors', selectedClients.includes(c) ? 'bg-brand text-white border-brand' : 'bg-surface-light border-cb-border text-cb-secondary hover:border-brand')}>
                  {c}
                </button>
              ))}
            </div>
          </div>
        </div>
        <div className="flex justify-end gap-3 p-6 pt-0">
          <button onClick={onClose} className="px-4 py-2 text-sm text-cb-secondary hover:text-cb-text transition-colors">Cancel</button>
          <button onClick={submit} disabled={!name.trim()} className="px-4 py-2 bg-brand text-white rounded-xl text-sm font-medium hover:bg-brand-light transition-colors disabled:opacity-50">Create Book</button>
        </div>
      </div>
    </div>
  )
}

type AIRecipeModalProps = { bookId: string; onClose: () => void; onAdd: (bookId: string, recipe: Recipe) => void }
function AIRecipeModal({ bookId, onClose, onAdd }: AIRecipeModalProps) {
  const [prompt, setPrompt] = useState('')
  const [generating, setGenerating] = useState(false)

  async function generate() {
    if (!prompt.trim()) return
    setGenerating(true)
    await new Promise(r => setTimeout(r, 1800))
    const mockRecipe: Recipe = {
      id: Date.now().toString(),
      name: 'AI-Generated: ' + prompt.split(' ').slice(0, 4).join(' '),
      description: `A nutritious recipe generated based on: "${prompt}"`,
      prepTime: 20,
      calories: 440,
      protein: 40,
      carbs: 45,
      fats: 10,
      ingredients: ['200g lean protein', '1 cup vegetables of choice', '1 cup complex carbs', '1 tbsp healthy oil', 'Seasoning to taste'],
      steps: ['Prepare all ingredients.', 'Cook protein in pan with oil until cooked through.', 'Add vegetables and cook 3–4 mins.', 'Serve with carbs.'],
      tags: ['ai-generated'],
    }
    onAdd(bookId, mockRecipe)
    setGenerating(false)
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="bg-surface rounded-2xl shadow-2xl w-full max-w-md mx-4">
        <div className="flex items-center justify-between p-6 border-b border-cb-border">
          <div className="flex items-center gap-2">
            <Sparkles size={18} className="text-brand" />
            <h2 className="text-lg font-semibold text-cb-text">AI Recipe Generator</h2>
          </div>
          <button onClick={onClose} className="text-cb-muted hover:text-cb-text transition-colors"><X size={20} /></button>
        </div>
        <div className="p-6">
          <p className="text-sm text-cb-secondary mb-4">Describe what you want and Claude will generate a recipe with macro breakdown.</p>
          <textarea
            className="w-full bg-surface-light border border-cb-border rounded-xl px-3 py-3 text-cb-text text-sm focus:outline-none focus:border-brand resize-none h-24"
            placeholder='e.g. "High protein lunch under 500 calories, no dairy, suitable for meal prep..."'
            value={prompt}
            onChange={e => setPrompt(e.target.value)}
          />
        </div>
        <div className="flex justify-end gap-3 p-6 pt-0">
          <button onClick={onClose} className="px-4 py-2 text-sm text-cb-secondary hover:text-cb-text transition-colors">Cancel</button>
          <button onClick={generate} disabled={!prompt.trim() || generating} className="flex items-center gap-2 px-4 py-2 bg-brand text-white rounded-xl text-sm font-medium hover:bg-brand-light transition-colors disabled:opacity-50">
            {generating ? (
              <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Generating...</>
            ) : (
              <><Sparkles size={14} /> Generate Recipe</>
            )}
          </button>
        </div>
      </div>
    </div>
  )
}

export default function RecipeBooksPage() {
  const [books, setBooks] = useState<RecipeBook[]>(MOCK_BOOKS)
  const [search, setSearch] = useState('')
  const [dietFilter, setDietFilter] = useState('All')
  const [selectedBook, setSelectedBook] = useState<string | null>(books[0]?.id ?? null)
  const [showNewModal, setShowNewModal] = useState(false)
  const [aiBookId, setAiBookId] = useState<string | null>(null)
  const [openMenu, setOpenMenu] = useState<string | null>(null)

  const filteredBooks = books.filter(b => {
    const matchSearch = b.name.toLowerCase().includes(search.toLowerCase())
    const matchDiet = dietFilter === 'All' || b.dietType === dietFilter
    return matchSearch && matchDiet
  })

  const activeBook = books.find(b => b.id === selectedBook)

  function handleAddBook(data: Partial<RecipeBook>) {
    const newBook: RecipeBook = { id: Date.now().toString(), name: data.name!, description: data.description || '', dietType: data.dietType || 'Balanced', assignedTo: data.assignedTo || [], recipes: [], createdAt: new Date().toISOString().split('T')[0] }
    setBooks(prev => [...prev, newBook])
    setSelectedBook(newBook.id)
  }

  function handleAddRecipe(bookId: string, recipe: Recipe) {
    setBooks(prev => prev.map(b => b.id === bookId ? { ...b, recipes: [...b.recipes, recipe] } : b))
  }

  function handleDeleteRecipe(bookId: string, recipeId: string) {
    setBooks(prev => prev.map(b => b.id === bookId ? { ...b, recipes: b.recipes.filter(r => r.id !== recipeId) } : b))
  }

  return (
    <div className="flex h-full">
      {/* Left panel */}
      <div className="w-72 shrink-0 border-r border-cb-border bg-surface h-full overflow-y-auto flex flex-col">
        <div className="p-4 border-b border-cb-border">
          <div className="flex items-center justify-between mb-3">
            <h1 className="font-bold text-cb-text">Recipe Books</h1>
            <button onClick={() => setShowNewModal(true)} className="p-1.5 rounded-lg bg-brand text-white hover:bg-brand-light transition-colors">
              <Plus size={16} />
            </button>
          </div>
          <div className="relative mb-3">
            <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-cb-muted" />
            <input className="w-full bg-surface-light border border-cb-border rounded-xl pl-8 pr-3 py-1.5 text-xs text-cb-text placeholder-cb-muted focus:outline-none focus:border-brand" placeholder="Search books..." value={search} onChange={e => setSearch(e.target.value)} />
          </div>
          <div className="flex flex-wrap gap-1">
            {DIET_TYPES.map(t => (
              <button key={t} onClick={() => setDietFilter(t)} className={clsx('px-2 py-0.5 rounded-full text-xs font-medium border transition-colors', dietFilter === t ? 'bg-brand text-white border-brand' : 'bg-surface-light border-cb-border text-cb-secondary hover:border-brand')}>
                {t}
              </button>
            ))}
          </div>
        </div>
        <div className="flex-1 p-2">
          {filteredBooks.map(b => (
            <button
              key={b.id}
              onClick={() => setSelectedBook(b.id)}
              className={clsx('w-full text-left p-3 rounded-xl mb-1 transition-colors', selectedBook === b.id ? 'bg-brand/10 border border-brand/30' : 'hover:bg-surface-light border border-transparent')}
            >
              <div className="flex items-center gap-2 mb-1">
                <BookOpen size={14} className={selectedBook === b.id ? 'text-brand' : 'text-cb-muted'} />
                <span className={clsx('text-sm font-medium truncate', selectedBook === b.id ? 'text-brand' : 'text-cb-text')}>{b.name}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-cb-muted">{b.recipes.length} recipe{b.recipes.length !== 1 ? 's' : ''}</span>
                {b.assignedTo.length > 0 && (
                  <div className="flex items-center gap-1 text-xs text-cb-muted">
                    <Users size={10} /> {b.assignedTo.length}
                  </div>
                )}
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Right panel */}
      <div className="flex-1 overflow-y-auto">
        {activeBook ? (
          <div className="p-6">
            <div className="flex items-start justify-between mb-6">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <h2 className="text-xl font-bold text-cb-text">{activeBook.name}</h2>
                  <span className="px-2 py-0.5 rounded-full bg-surface-light border border-cb-border text-cb-secondary text-xs">{activeBook.dietType}</span>
                </div>
                <p className="text-cb-secondary text-sm">{activeBook.description}</p>
                {activeBook.assignedTo.length > 0 && (
                  <div className="flex items-center gap-1.5 mt-2">
                    <Users size={13} className="text-cb-muted" />
                    <div className="flex flex-wrap gap-1">
                      {activeBook.assignedTo.map(n => <span key={n} className="px-2 py-0.5 rounded-full bg-brand/10 text-brand text-xs">{n}</span>)}
                    </div>
                  </div>
                )}
              </div>
              <div className="flex items-center gap-2">
                <button onClick={() => setAiBookId(activeBook.id)} className="flex items-center gap-2 px-3 py-2 bg-surface border border-cb-border rounded-xl text-sm text-cb-secondary hover:text-brand hover:border-brand transition-colors">
                  <Sparkles size={14} /> AI Generate
                </button>
                <button className="flex items-center gap-2 px-3 py-2 bg-brand text-white rounded-xl text-sm font-medium hover:bg-brand-light transition-colors">
                  <Plus size={14} /> Add Recipe
                </button>
              </div>
            </div>

            {activeBook.recipes.length === 0 ? (
              <div className="text-center py-16 text-cb-muted">
                <BookOpen size={40} className="mx-auto mb-3 opacity-40" />
                <p className="font-medium">No recipes yet</p>
                <p className="text-sm mt-1">Add recipes manually or use AI to generate them</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {activeBook.recipes.map(recipe => (
                  <RecipeCard key={recipe.id} recipe={recipe} onDelete={() => handleDeleteRecipe(activeBook.id, recipe.id)} />
                ))}
              </div>
            )}
          </div>
        ) : (
          <div className="flex items-center justify-center h-full text-cb-muted">
            <div className="text-center">
              <BookOpen size={40} className="mx-auto mb-3 opacity-40" />
              <p>Select a recipe book</p>
            </div>
          </div>
        )}
      </div>

      {showNewModal && <NewBookModal onClose={() => setShowNewModal(false)} onAdd={handleAddBook} />}
      {aiBookId && <AIRecipeModal bookId={aiBookId} onClose={() => setAiBookId(null)} onAdd={handleAddRecipe} />}
    </div>
  )
}
