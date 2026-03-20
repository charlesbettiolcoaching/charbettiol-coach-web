import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

/**
 * GET /api/clients/:clientId/meal-plans/active
 *
 * Returns the most recently published nutrition plan for a client.
 * Requires the caller to be authenticated as the coach who owns the plan,
 * or as the client themselves.
 *
 * Mobile app usage:
 *   GET /api/clients/abc-123/meal-plans/active
 *   Authorization: Bearer <supabase_jwt>
 *
 * Response shape:
 *   { plan: ActivePlan | null }
 *
 * where ActivePlan is the plan with days/meals/foods fully expanded
 * and macros pre-calculated per food item for convenience.
 */

// ── Types (mobile-friendly flat shape) ───────────────────────────────────────

type Unit = 'g' | 'kg' | 'ml' | 'L' | 'cup' | 'tbsp' | 'tsp' | 'oz' | 'piece'

const UNIT_TO_GRAMS: Record<Unit, number | null> = {
  g: 1, kg: 1000, ml: 1, L: 1000,
  cup: 240, tbsp: 15, tsp: 5, oz: 28.35,
  piece: null,
}

interface RawFoodItem {
  id: string; name: string; brand?: string
  quantity: number; unit: Unit
  cal100: number; pro100: number; carb100: number
  fat100: number; fibre100: number; sodium100: number
}

interface Macros {
  calories: number; protein_g: number; carbs_g: number
  fat_g: number; fibre_g: number; sodium_mg: number
}

function calcMacros(food: RawFoodItem): Macros {
  const toG = UNIT_TO_GRAMS[food.unit]
  const grams = toG !== null ? food.quantity * toG : food.quantity * 100
  const f = grams / 100
  return {
    calories:   Math.round(food.cal100 * f),
    protein_g:  parseFloat((food.pro100 * f).toFixed(1)),
    carbs_g:    parseFloat((food.carb100 * f).toFixed(1)),
    fat_g:      parseFloat((food.fat100 * f).toFixed(1)),
    fibre_g:    parseFloat((food.fibre100 * f).toFixed(1)),
    sodium_mg:  Math.round(food.sodium100 * f),
  }
}

function formatServing(qty: number, unit: Unit, name: string): string {
  const qtyStr = qty % 1 === 0 ? String(qty) : qty.toFixed(1)
  if (unit === 'piece') return `${qtyStr} × ${name}`
  const compact: Unit[] = ['g', 'kg', 'ml', 'L', 'oz']
  return compact.includes(unit) ? `${qtyStr}${unit} ${name}` : `${qtyStr} ${unit} ${name}`
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function transformPlan(row: any) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const days = (row.days as any[]).map((day: any) => ({
    id: day.id,
    day_number: day.dayNumber,
    day_name: day.dayName,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    meals: day.meals.map((meal: any) => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const foods = meal.foods.map((food: RawFoodItem) => {
        const macros = calcMacros(food)
        return {
          id: food.id,
          name: food.name,
          brand: food.brand ?? null,
          serving_label: formatServing(food.quantity, food.unit, food.name),
          quantity: food.quantity,
          unit: food.unit,
          macros_per_100g: {
            calories: food.cal100,
            protein_g: food.pro100,
            carbs_g: food.carb100,
            fat_g: food.fat100,
            fibre_g: food.fibre100,
            sodium_mg: food.sodium100,
          },
          macros,
        }
      })

      const mealMacros = foods.reduce(
        (acc: Macros, f: { macros: Macros }) => ({
          calories:   acc.calories + f.macros.calories,
          protein_g:  parseFloat((acc.protein_g + f.macros.protein_g).toFixed(1)),
          carbs_g:    parseFloat((acc.carbs_g + f.macros.carbs_g).toFixed(1)),
          fat_g:      parseFloat((acc.fat_g + f.macros.fat_g).toFixed(1)),
          fibre_g:    parseFloat((acc.fibre_g + f.macros.fibre_g).toFixed(1)),
          sodium_mg:  acc.sodium_mg + f.macros.sodium_mg,
        }),
        { calories: 0, protein_g: 0, carbs_g: 0, fat_g: 0, fibre_g: 0, sodium_mg: 0 }
      )

      return {
        id: meal.id,
        name: meal.name,
        time: meal.time,
        notes: meal.notes ?? null,
        tags: meal.tags ?? [],
        foods,
        total_macros: mealMacros,
      }
    }),
  }))

  const dayMacros = days.map(day => ({
    day_number: day.day_number,
    macros: day.meals.reduce(
      (acc: Macros, meal: { total_macros: Macros }) => ({
        calories:   acc.calories + meal.total_macros.calories,
        protein_g:  parseFloat((acc.protein_g + meal.total_macros.protein_g).toFixed(1)),
        carbs_g:    parseFloat((acc.carbs_g + meal.total_macros.carbs_g).toFixed(1)),
        fat_g:      parseFloat((acc.fat_g + meal.total_macros.fat_g).toFixed(1)),
        fibre_g:    parseFloat((acc.fibre_g + meal.total_macros.fibre_g).toFixed(1)),
        sodium_mg:  acc.sodium_mg + meal.total_macros.sodium_mg,
      }),
      { calories: 0, protein_g: 0, carbs_g: 0, fat_g: 0, fibre_g: 0, sodium_mg: 0 }
    ),
  }))

  return {
    id: row.id,
    name: row.name,
    status: row.status,
    published_at: row.published_at,
    created_at: row.created_at,
    updated_at: row.updated_at,
    targets: {
      calories: row.calories_target,
      protein_g: row.protein_target,
      carbs_g: row.carbs_target,
      fat_g: row.fat_target,
      fibre_g: row.fibre_target,
    },
    notes: row.notes ?? null,
    days,
    day_macros: dayMacros,
  }
}

// ── Handler ──────────────────────────────────────────────────────────────────

export async function GET(
  _req: NextRequest,
  { params }: { params: { clientId: string } }
) {
  const supabase = createClient()

  // Verify the caller is authenticated
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Only the client themselves or their coach may fetch this
  const { clientId } = params
  if (user.id !== clientId) {
    // Check if the caller is the coach for this client
    const { data: clientProfile } = await supabase
      .from('profiles')
      .select('coach_id')
      .eq('id', clientId)
      .single()

    if (!clientProfile || clientProfile.coach_id !== user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }
  }

  const { data, error } = await supabase
    .from('nutrition_plans_v2')
    .select('*')
    .eq('client_id', clientId)
    .eq('status', 'published')
    .order('published_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  if (!data) {
    return NextResponse.json({ plan: null })
  }

  return NextResponse.json({ plan: transformPlan(data) })
}
