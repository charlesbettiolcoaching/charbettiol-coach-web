import Anthropic from '@anthropic-ai/sdk'
import { NextRequest, NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  const body = await request.json()
  const {
    clientName, goal, age, sex, weightKg, heightCm, activityLevel,
    calories, protein, carbs, fats,
    planDays, mealsPerDay,
    dietType, restrictions, lovedFoods, dislikedFoods, supplements,
    cookingSkill, budget, cuisines, mealPrepStyle,
    additionalNotes,
  } = body

  if (!process.env.ANTHROPIC_API_KEY) {
    await new Promise((r) => setTimeout(r, 2200))
    return NextResponse.json({ plan: getMockMealPlan(planDays ?? 7, mealsPerDay ?? 4, calories, protein, carbs, fats) })
  }

  const client = new Anthropic()

  const goalLabels: Record<string, string> = {
    muscle_gain: 'Build muscle mass (caloric surplus)',
    fat_loss: 'Lose body fat while preserving muscle (caloric deficit)',
    recomposition: 'Body recomposition (build muscle, lose fat simultaneously)',
    performance: 'Optimise athletic performance and recovery',
    health: 'General health and longevity',
    maintenance: 'Maintain current body composition',
  }
  const activityLabels: Record<string, string> = {
    sedentary: 'Sedentary (desk job, minimal exercise)',
    light: 'Lightly active (1–3 days/week exercise)',
    moderate: 'Moderately active (3–5 days/week)',
    active: 'Very active (6–7 days/week hard exercise)',
    very_active: 'Extremely active (twice daily or physical job)',
  }
  const cookingLabels: Record<string, string> = {
    minimal: 'Minimal prep — foods that take under 10 minutes, no cooking skills needed',
    simple: 'Simple cooking — 10–30 minutes, basic kitchen skills',
    comfortable: 'Comfortable — 30–60 minutes, comfortable in the kitchen',
    advanced: 'Advanced — 60+ minutes, enjoys cooking and meal prep',
  }
  const dietLabels: Record<string, string> = {
    standard: 'Standard balanced diet',
    high_protein: 'High protein (30%+ of calories from protein)',
    low_carb: 'Low carbohydrate (under 100g carbs/day)',
    ketogenic: 'Ketogenic (under 50g carbs/day, high fat)',
    mediterranean: 'Mediterranean diet (olive oil, fish, vegetables, legumes)',
    intermittent_fasting: 'Intermittent fasting (16:8 or 18:6 eating window)',
    plant_based: 'Plant-based (vegetarian, may include eggs/dairy)',
    vegan: 'Fully vegan (no animal products)',
  }

  const prompt = `You are an expert sports dietitian creating a professional, personalised nutrition plan.

CLIENT PROFILE:
- Name: ${clientName}
- Age: ${age || 'Not provided'}, Sex: ${sex || 'Not provided'}
- Weight: ${weightKg ? `${weightKg} kg` : 'Not provided'}, Height: ${heightCm ? `${heightCm} cm` : 'Not provided'}
- Activity Level: ${activityLabels[activityLevel] ?? activityLevel}

NUTRITION TARGETS:
- Primary Goal: ${goalLabels[goal] ?? goal}
- Daily Calories: ${calories} kcal
- Daily Protein: ${protein}g
- Daily Carbohydrates: ${carbs}g
- Daily Fats: ${fats}g
- Plan Duration: ${planDays} days
- Meals Per Day: ${mealsPerDay}

DIETARY PROFILE:
- Diet Type: ${dietLabels[dietType] ?? dietType}
- Restrictions / Allergies: ${(restrictions as string[])?.join(', ') || 'None'}
- Foods They Love: ${lovedFoods || 'No preference stated'}
- Foods They Dislike or Must Avoid: ${dislikedFoods || 'None stated'}
- Supplements to Integrate: ${(supplements as string[])?.join(', ') || 'None'}

LIFESTYLE:
- Cooking Skill: ${cookingLabels[cookingSkill] ?? cookingSkill}
- Budget: ${budget === 'budget' ? 'Budget-friendly (minimise cost)' : budget === 'moderate' ? 'Moderate budget' : 'No budget constraint'}
- Cuisine Preferences: ${(cuisines as string[])?.join(', ') || 'No preference'}
- Meal Prep Style: ${mealPrepStyle === 'fresh_daily' ? 'Prefers to cook fresh each day' : mealPrepStyle === 'meal_prep' ? 'Meal preps in bulk weekly' : 'Mix of fresh cooking and batch prep'}
- Additional Notes: ${additionalNotes || 'None'}

Create a ${planDays}-day meal plan with ${mealsPerDay} meals per day. Hit macro targets within ±5% each day. Make it feel achievable for this client's cooking skill and lifestyle.

Return ONLY valid JSON — no markdown — in this exact format:

{
  "plan_name": "Descriptive plan name",
  "description": "2–3 sentence description of the plan approach and expected outcomes",
  "dietitian_notes": "Key bullet points of nutrition guidance, separated by \\n",
  "daily_calories": ${calories},
  "daily_protein": ${protein},
  "daily_carbs": ${carbs},
  "daily_fats": ${fats},
  "days": [
    {
      "day_number": 1,
      "day_name": "Monday",
      "meals": [
        {
          "meal_name": "Breakfast",
          "time": "07:30",
          "meal_notes": "Preparation tips for this meal",
          "foods": [
            {
              "name": "Food item name",
              "quantity": 80,
              "unit": "g",
              "cal100": 389,
              "pro100": 17,
              "carb100": 66,
              "fat100": 7,
              "fibre100": 10,
              "sodium100": 6
            }
          ]
        }
      ]
    }
  ]
}

CRITICAL RULES:
1. cal100, pro100, carb100, fat100, fibre100, sodium100 are ALL per 100g or 100ml of the food — NOT for the given quantity
2. Round quantities to practical amounts (e.g. 80g oats, 200g chicken, 250ml milk — not 137g or 183ml)
3. Each day must hit exactly ${calories}±50 kcal, ${protein}±5g protein
4. Vary meals significantly across all ${planDays} days — no repeated breakfasts
5. Use realistic, commonly available ingredients
6. Respect ALL dietary restrictions strictly: ${(restrictions as string[])?.join(', ') || 'none'}
7. Completely avoid: ${dislikedFoods || 'nothing stated'}
8. Incorporate loved foods where appropriate: ${lovedFoods || 'none stated'}
9. Cooking complexity must match ${cookingLabels[cookingSkill] ?? cookingSkill}
10. unit must be one of: "g", "ml", "piece", "tbsp", "tsp", "cup", "oz", "L", "kg"
11. Include ${mealsPerDay} meals per day — name them appropriately (e.g. Breakfast, Morning Snack, Lunch, Afternoon Snack, Dinner, Evening Snack)
12. If supplements are included, add them as food items (e.g. "Whey Protein" 30g in appropriate meals)`

  try {
    const message = await client.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 10000,
      messages: [{ role: 'user', content: prompt }],
    })

    const text = message.content[0].type === 'text' ? message.content[0].text : ''
    const jsonMatch = text.match(/\{[\s\S]*\}/)
    if (!jsonMatch) return NextResponse.json({ plan: getMockMealPlan(planDays, mealsPerDay, calories, protein, carbs, fats) })
    const plan = JSON.parse(jsonMatch[0])
    return NextResponse.json({ plan })
  } catch {
    return NextResponse.json({ plan: getMockMealPlan(planDays, mealsPerDay, calories, protein, carbs, fats) })
  }
}

function getMockMealPlan(days = 7, mealsPerDay = 4, targetCal = 2200, targetPro = 165, targetCarb = 230, targetFat = 75) {
  void targetPro; void targetCarb; void targetFat

  const dayNames = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']

  const breakfastOptions = [
    { meal_name: 'Breakfast', time: '07:30', meal_notes: 'Cook oats with water, stir in protein powder off heat. Top with fruit.', foods: [
      { name: 'Rolled Oats', quantity: 80, unit: 'g', cal100: 389, pro100: 17, carb100: 66, fat100: 7, fibre100: 10.6, sodium100: 6 },
      { name: 'Whey Protein', quantity: 30, unit: 'g', cal100: 380, pro100: 75, carb100: 8, fat100: 6, fibre100: 1, sodium100: 200 },
      { name: 'Blueberries', quantity: 100, unit: 'g', cal100: 57, pro100: 0.7, carb100: 14.5, fat100: 0.3, fibre100: 2.4, sodium100: 1 },
      { name: 'Almond Milk', quantity: 250, unit: 'ml', cal100: 17, pro100: 0.6, carb100: 0.7, fat100: 1.1, fibre100: 0.4, sodium100: 65 },
    ]},
    { meal_name: 'Breakfast', time: '07:00', meal_notes: 'Scramble eggs with spinach. Toast in parallel.', foods: [
      { name: 'Whole Eggs', quantity: 3, unit: 'piece', cal100: 155, pro100: 13, carb100: 1.1, fat100: 11, fibre100: 0, sodium100: 124 },
      { name: 'Egg Whites', quantity: 100, unit: 'g', cal100: 52, pro100: 11, carb100: 0.7, fat100: 0.2, fibre100: 0, sodium100: 166 },
      { name: 'Whole Grain Toast', quantity: 60, unit: 'g', cal100: 247, pro100: 9, carb100: 47, fat100: 3, fibre100: 6, sodium100: 380 },
      { name: 'Avocado', quantity: 80, unit: 'g', cal100: 160, pro100: 2, carb100: 9, fat100: 15, fibre100: 6.7, sodium100: 7 },
    ]},
    { meal_name: 'Breakfast', time: '08:00', meal_notes: 'Greek yoghurt bowl. Layer yoghurt, granola, and fruit. Add honey last.', foods: [
      { name: 'Greek Yoghurt (0% fat)', quantity: 250, unit: 'g', cal100: 59, pro100: 10, carb100: 3.6, fat100: 0.4, fibre100: 0, sodium100: 36 },
      { name: 'Granola', quantity: 50, unit: 'g', cal100: 471, pro100: 10, carb100: 64, fat100: 20, fibre100: 5, sodium100: 15 },
      { name: 'Banana', quantity: 120, unit: 'g', cal100: 89, pro100: 1.1, carb100: 23, fat100: 0.3, fibre100: 2.6, sodium100: 1 },
      { name: 'Honey', quantity: 15, unit: 'g', cal100: 304, pro100: 0.3, carb100: 82, fat100: 0, fibre100: 0.2, sodium100: 4 },
    ]},
  ]

  const lunchOptions = [
    { meal_name: 'Lunch', time: '12:30', meal_notes: 'Meal prep friendly — batch cook chicken and rice on Sunday.', foods: [
      { name: 'Chicken Breast', quantity: 200, unit: 'g', cal100: 165, pro100: 31, carb100: 0, fat100: 3.6, fibre100: 0, sodium100: 74 },
      { name: 'White Rice (cooked)', quantity: 200, unit: 'g', cal100: 130, pro100: 2.7, carb100: 28, fat100: 0.3, fibre100: 0.4, sodium100: 1 },
      { name: 'Broccoli', quantity: 150, unit: 'g', cal100: 34, pro100: 2.8, carb100: 7, fat100: 0.4, fibre100: 2.6, sodium100: 33 },
      { name: 'Olive Oil', quantity: 10, unit: 'ml', cal100: 884, pro100: 0, carb100: 0, fat100: 100, fibre100: 0, sodium100: 2 },
    ]},
    { meal_name: 'Lunch', time: '12:00', meal_notes: 'Build wrap and eat fresh. Great for on-the-go.', foods: [
      { name: 'Turkey Breast (sliced)', quantity: 150, unit: 'g', cal100: 135, pro100: 29, carb100: 0, fat100: 1, fibre100: 0, sodium100: 70 },
      { name: 'Whole Wheat Wrap', quantity: 65, unit: 'g', cal100: 292, pro100: 9, carb100: 54, fat100: 5, fibre100: 6, sodium100: 495 },
      { name: 'Baby Spinach', quantity: 50, unit: 'g', cal100: 23, pro100: 2.9, carb100: 3.6, fat100: 0.4, fibre100: 2.2, sodium100: 79 },
      { name: 'Hummus', quantity: 40, unit: 'g', cal100: 177, pro100: 8, carb100: 14, fat100: 10, fibre100: 4, sodium100: 379 },
    ]},
    { meal_name: 'Lunch', time: '13:00', meal_notes: 'Batch cook minced beef sauce and portion for the week.', foods: [
      { name: 'Lean Beef Mince (90%)', quantity: 180, unit: 'g', cal100: 215, pro100: 26, carb100: 0, fat100: 12, fibre100: 0, sodium100: 79 },
      { name: 'Pasta (dry)', quantity: 80, unit: 'g', cal100: 371, pro100: 13, carb100: 75, fat100: 1.5, fibre100: 2.7, sodium100: 6 },
      { name: 'Tomato Pasta Sauce', quantity: 100, unit: 'g', cal100: 35, pro100: 1.5, carb100: 7, fat100: 0.3, fibre100: 1.5, sodium100: 320 },
    ]},
  ]

  const dinnerOptions = [
    { meal_name: 'Dinner', time: '18:30', meal_notes: 'Bake salmon at 200°C for 18 minutes. Steam sweet potato in microwave 8 mins.', foods: [
      { name: 'Atlantic Salmon', quantity: 200, unit: 'g', cal100: 208, pro100: 20, carb100: 0, fat100: 13, fibre100: 0, sodium100: 59 },
      { name: 'Sweet Potato', quantity: 250, unit: 'g', cal100: 86, pro100: 1.6, carb100: 20, fat100: 0.1, fibre100: 3, sodium100: 55 },
      { name: 'Asparagus', quantity: 120, unit: 'g', cal100: 20, pro100: 2.2, carb100: 3.9, fat100: 0.1, fibre100: 2.1, sodium100: 2 },
      { name: 'Olive Oil', quantity: 10, unit: 'ml', cal100: 884, pro100: 0, carb100: 0, fat100: 100, fibre100: 0, sodium100: 2 },
    ]},
    { meal_name: 'Dinner', time: '19:00', meal_notes: 'Stir-fry on high heat for 6–8 minutes. Season with soy sauce and sesame oil.', foods: [
      { name: 'Chicken Breast', quantity: 200, unit: 'g', cal100: 165, pro100: 31, carb100: 0, fat100: 3.6, fibre100: 0, sodium100: 74 },
      { name: 'Brown Rice (cooked)', quantity: 180, unit: 'g', cal100: 123, pro100: 2.7, carb100: 26, fat100: 1, fibre100: 1.8, sodium100: 4 },
      { name: 'Mixed Vegetables', quantity: 200, unit: 'g', cal100: 42, pro100: 2.4, carb100: 8, fat100: 0.3, fibre100: 2.5, sodium100: 40 },
      { name: 'Olive Oil', quantity: 8, unit: 'ml', cal100: 884, pro100: 0, carb100: 0, fat100: 100, fibre100: 0, sodium100: 2 },
    ]},
    { meal_name: 'Dinner', time: '18:00', meal_notes: 'Sheet pan meal — all in the oven at 200°C for 25 min.', foods: [
      { name: 'Sirloin Steak', quantity: 200, unit: 'g', cal100: 271, pro100: 26, carb100: 0, fat100: 18, fibre100: 0, sodium100: 54 },
      { name: 'Baby Potatoes', quantity: 200, unit: 'g', cal100: 77, pro100: 2, carb100: 17, fat100: 0.1, fibre100: 1.8, sodium100: 6 },
      { name: 'Green Beans', quantity: 150, unit: 'g', cal100: 31, pro100: 1.8, carb100: 7, fat100: 0.2, fibre100: 3.4, sodium100: 6 },
      { name: 'Olive Oil', quantity: 10, unit: 'ml', cal100: 884, pro100: 0, carb100: 0, fat100: 100, fibre100: 0, sodium100: 2 },
    ]},
  ]

  const snackOptions = [
    { meal_name: 'Afternoon Snack', time: '15:30', meal_notes: 'Grab and go — perfect pre-workout if training in the evening.', foods: [
      { name: 'Cottage Cheese', quantity: 200, unit: 'g', cal100: 98, pro100: 11, carb100: 3.4, fat100: 4.3, fibre100: 0, sodium100: 364 },
      { name: 'Rice Cakes', quantity: 30, unit: 'g', cal100: 387, pro100: 8, carb100: 82, fat100: 3, fibre100: 1, sodium100: 25 },
    ]},
    { meal_name: 'Morning Snack', time: '10:30', meal_notes: 'Quick snack between breakfast and lunch.', foods: [
      { name: 'Apple', quantity: 150, unit: 'g', cal100: 52, pro100: 0.3, carb100: 14, fat100: 0.2, fibre100: 2.4, sodium100: 1 },
      { name: 'Almonds', quantity: 30, unit: 'g', cal100: 579, pro100: 21, carb100: 22, fat100: 50, fibre100: 12.5, sodium100: 1 },
    ]},
  ]

  const mealSets = [breakfastOptions, lunchOptions, dinnerOptions]

  return {
    plan_name: `${days}-Day Nutrition Plan`,
    description: `A ${days}-day balanced meal plan targeting ${targetCal} kcal/day with high protein to support your goals. Meals are practical, tasty, and designed for consistency.`,
    dietitian_notes: '• Hit your protein target every day — it\'s non-negotiable for body composition\n• Drink 2.5–3.5L of water daily\n• Eat vegetables at every main meal\n• Time carbohydrates around training for best performance\n• Track for the first 2 weeks, then trust your instincts',
    daily_calories: targetCal,
    daily_protein: targetPro,
    daily_carbs: targetCarb,
    daily_fats: targetFat,
    days: Array.from({ length: Math.min(days, 7) }, (_, di) => {
      const meals = []
      // Add breakfast, lunch, dinner
      for (let mi = 0; mi < Math.min(mealsPerDay, 3); mi++) {
        const options = mealSets[mi]
        meals.push(options[di % options.length])
      }
      // Add snacks if mealsPerDay > 3
      if (mealsPerDay > 3) meals.splice(2, 0, snackOptions[di % snackOptions.length])
      if (mealsPerDay > 4) meals.push({ meal_name: 'Evening Snack', time: '20:30', meal_notes: 'Slow-digesting protein before bed supports overnight muscle repair.', foods: [
        { name: 'Casein Protein', quantity: 30, unit: 'g', cal100: 360, pro100: 72, carb100: 8, fat100: 2, fibre100: 1, sodium100: 200 },
        { name: 'Skim Milk', quantity: 200, unit: 'ml', cal100: 34, pro100: 3.4, carb100: 5, fat100: 0.1, fibre100: 0, sodium100: 44 },
      ]})

      return {
        day_number: di + 1,
        day_name: dayNames[di % 7],
        meals,
      }
    }),
  }
}
