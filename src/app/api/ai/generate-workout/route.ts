import Anthropic from '@anthropic-ai/sdk'
import { NextRequest, NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  const body = await request.json()
  const {
    clientName, goal, experience, injuries,
    daysPerWeek, weeks, sessionLength, split,
    equipment, repRanges, trainingStyle, cardio,
    priorityExercises, avoidExercises,
    progressionModel, deload, includeTempo, includeRpe,
    additionalNotes,
  } = body

  if (!process.env.ANTHROPIC_API_KEY) {
    await new Promise((r) => setTimeout(r, 1800))
    return NextResponse.json({ program: getMockProgram(daysPerWeek, weeks, goal) })
  }

  const client = new Anthropic()

  const goalLabels: Record<string, string> = {
    hypertrophy: 'Maximum muscle hypertrophy',
    strength: 'Maximal strength (powerlifting-style)',
    fat_loss: 'Fat loss while preserving muscle',
    athletic_performance: 'Athletic performance and power',
    general_fitness: 'General fitness and health',
    powerlifting: 'Competitive powerlifting (Squat / Bench / Deadlift)',
  }
  const equipLabels: Record<string, string> = {
    full_gym: 'Full commercial gym (barbells, cables, machines, dumbbells)',
    home_barbell: 'Home gym with barbell and dumbbells',
    dumbbells_only: 'Dumbbells only',
    bodyweight: 'Bodyweight only (no equipment)',
  }
  const progressionLabels: Record<string, string> = {
    linear: 'Linear progression (add weight each session/week)',
    dup: 'Daily undulating periodisation (DUP)',
    wave: 'Wave loading across weeks',
    ai_decides: 'Optimal periodisation for the goal',
  }
  const deloadLabels: Record<string, string> = {
    every_4: 'Planned deload every 4th week (reduce volume 40–50%)',
    every_8: 'Planned deload every 8th week',
    auto: 'Auto-regulate — deload when performance drops',
    none: 'No deload',
  }
  const splitLabels: Record<string, string> = {
    full_body: 'Full body (each session trains all muscle groups)',
    upper_lower: 'Upper / Lower split',
    ppl: 'Push / Pull / Legs',
    bro_split: 'Body-part split',
    ai_decides: 'Optimal split for the goal',
  }

  const prompt = `You are an elite strength and conditioning coach building a professional training program.

CLIENT PROFILE:
- Name: ${clientName}
- Experience: ${experience}
- Injuries / Limitations: ${injuries || 'None'}

PROGRAM SPECS:
- Goal: ${goalLabels[goal] ?? goal}
- Split: ${splitLabels[split] ?? split}
- Duration: ${weeks} weeks, ${daysPerWeek} days/week
- Session length: ${sessionLength} min (${sessionLength === '45' ? '4–5 exercises' : sessionLength === '60' ? '5–6 exercises' : sessionLength === '75' ? '6–7 exercises' : '7–9 exercises'})
- Equipment: ${equipLabels[equipment] ?? equipment}
- Rep ranges: ${repRanges}
- Training style: ${trainingStyle}
- Cardio: ${cardio}
- Progression model: ${progressionLabels[progressionModel] ?? progressionModel}
- Deload: ${deloadLabels[deload] ?? deload}
- Include tempo: ${includeTempo ? 'Yes' : 'No'}
- Include RPE: ${includeRpe ? 'Yes' : 'No'}
- Must include: ${priorityExercises || 'none'}
- Avoid: ${avoidExercises || 'none'}
- Notes: ${additionalNotes || 'none'}

Return ONLY valid JSON in this exact format (no markdown):

{
  "name": "Program name",
  "description": "2–3 sentence professional description",
  "coaching_notes": "Bullet points separated by \\n",
  "progression_notes": "Specific week-by-week progression",
  "deload_notes": "Deload instructions or N/A",
  "goal": "${goal}",
  "difficulty": "${experience}",
  "days": [
    {
      "day_number": 1,
      "name": "Session name",
      "session_notes": "Focus for this session",
      "exercises": [
        {
          "name": "Exercise name",
          "muscle_group": "Primary muscle",
          "sets": 4,
          "reps_min": 8,
          "reps_max": 10,
          "rpe": ${includeRpe ? 7 : 'null'},
          "tempo": ${includeTempo ? '"3010"' : 'null'},
          "rest_seconds": 120,
          "notes": "Coaching cue",
          "superset_with_next": false
        }
      ]
    }
  ]
}

Generate exactly ${daysPerWeek} day objects. Equipment: ${equipLabels[equipment] ?? equipment}. Avoid: ${avoidExercises || 'nothing'}.`

  try {
    const message = await client.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 6000,
      messages: [{ role: 'user', content: prompt }],
    })

    const text = message.content[0].type === 'text' ? message.content[0].text : ''
    const jsonMatch = text.match(/\{[\s\S]*\}/)
    if (!jsonMatch) return NextResponse.json({ program: getMockProgram(daysPerWeek, weeks, goal) })
    const program = JSON.parse(jsonMatch[0])
    return NextResponse.json({ program })
  } catch {
    return NextResponse.json({ program: getMockProgram(daysPerWeek, weeks, goal) })
  }
}

function getMockProgram(daysPerWeek: number, weeks: number, goal = 'hypertrophy') {
  const isStrength = goal === 'strength' || goal === 'powerlifting'
  const templates = [
    {
      name: 'Upper A — Strength Focus',
      session_notes: 'Lead with heavy compounds. Control the eccentric on every rep.',
      exercises: [
        { name: 'Barbell Bench Press', muscle_group: 'Chest', sets: 4, reps_min: isStrength ? 3 : 8, reps_max: isStrength ? 5 : 10, rest_seconds: isStrength ? 180 : 120, notes: 'Retract scapulae, drive through the bar' },
        { name: 'Barbell Row', muscle_group: 'Back', sets: 4, reps_min: isStrength ? 4 : 8, reps_max: isStrength ? 6 : 10, rest_seconds: isStrength ? 180 : 120, notes: 'Pull elbows back, squeeze at the top' },
        { name: 'Overhead Press', muscle_group: 'Shoulders', sets: 3, reps_min: 8, reps_max: 10, rest_seconds: 90, notes: 'Brace core, press in a slight arc' },
        { name: 'Lat Pulldown', muscle_group: 'Back', sets: 3, reps_min: 10, reps_max: 12, rest_seconds: 75, notes: 'Initiate with elbows, think elbows to hips' },
        { name: 'Tricep Pushdown', muscle_group: 'Triceps', sets: 3, reps_min: 12, reps_max: 15, rest_seconds: 60, notes: 'Lock upper arms, squeeze at lockout' },
      ],
    },
    {
      name: 'Lower A — Squat Focus',
      session_notes: 'Squat depth and bracing are the priority today.',
      exercises: [
        { name: 'Barbell Back Squat', muscle_group: 'Legs', sets: 4, reps_min: isStrength ? 3 : 6, reps_max: isStrength ? 5 : 8, rest_seconds: isStrength ? 210 : 150, notes: 'Full depth, knees tracking toes' },
        { name: 'Romanian Deadlift', muscle_group: 'Hamstrings', sets: 3, reps_min: 10, reps_max: 12, rest_seconds: 90, notes: 'Hinge at hips, feel the hamstring stretch' },
        { name: 'Leg Press', muscle_group: 'Legs', sets: 3, reps_min: 12, reps_max: 15, rest_seconds: 90, notes: 'Drive through heels, avoid knee cave' },
        { name: 'Walking Lunges', muscle_group: 'Legs', sets: 3, reps_min: 12, reps_max: 14, rest_seconds: 75, notes: 'Keep torso upright, long strides' },
        { name: 'Calf Raise', muscle_group: 'Calves', sets: 4, reps_min: 15, reps_max: 20, rest_seconds: 60, notes: 'Full range, pause at top' },
      ],
    },
    {
      name: 'Upper B — Volume Focus',
      session_notes: 'Higher volume. Push quality reps even when fatigued.',
      exercises: [
        { name: 'Incline Dumbbell Press', muscle_group: 'Chest', sets: 4, reps_min: 10, reps_max: 12, rest_seconds: 90, notes: 'Elbows at 45°, controlled eccentric' },
        { name: 'Pull Up', muscle_group: 'Back', sets: 4, reps_min: 6, reps_max: 10, rest_seconds: 90, notes: 'Full hang, chin over bar' },
        { name: 'Dumbbell Lateral Raise', muscle_group: 'Shoulders', sets: 4, reps_min: 15, reps_max: 20, rest_seconds: 60, notes: 'Slight forward lean, lead with elbows' },
        { name: 'Seated Cable Row', muscle_group: 'Back', sets: 3, reps_min: 12, reps_max: 14, rest_seconds: 75, notes: 'Squeeze shoulder blades at finish' },
        { name: 'Barbell Curl', muscle_group: 'Biceps', sets: 3, reps_min: 10, reps_max: 14, rest_seconds: 60, notes: 'Control the negative, no swinging' },
      ],
    },
    {
      name: 'Lower B — Hip Hinge Focus',
      session_notes: 'Deadlift is king today. Treat accessory work seriously.',
      exercises: [
        { name: 'Deadlift', muscle_group: 'Back', sets: 4, reps_min: isStrength ? 3 : 5, reps_max: isStrength ? 5 : 6, rest_seconds: 210, notes: 'Bar over mid-foot, push the floor away' },
        { name: 'Hip Thrust', muscle_group: 'Glutes', sets: 4, reps_min: 10, reps_max: 12, rest_seconds: 90, notes: 'Drive to full hip extension' },
        { name: 'Bulgarian Split Squat', muscle_group: 'Legs', sets: 3, reps_min: 10, reps_max: 12, rest_seconds: 90, notes: 'Front foot placement is key' },
        { name: 'Leg Curl', muscle_group: 'Hamstrings', sets: 3, reps_min: 12, reps_max: 15, rest_seconds: 75, notes: 'Full range, squeeze at the top' },
        { name: 'Plank', muscle_group: 'Core', sets: 3, reps_min: 30, reps_max: 45, rest_seconds: 60, notes: 'Straight line head to heel' },
      ],
    },
    {
      name: 'Push — Chest, Shoulders & Triceps',
      session_notes: 'Attack the shoulders after the heavy press.',
      exercises: [
        { name: 'Barbell Bench Press', muscle_group: 'Chest', sets: 4, reps_min: 8, reps_max: 10, rest_seconds: 120, notes: 'Arch maintained, drive from chest' },
        { name: 'Incline Dumbbell Press', muscle_group: 'Chest', sets: 3, reps_min: 10, reps_max: 12, rest_seconds: 90, notes: 'Upper chest focus' },
        { name: 'Overhead Press', muscle_group: 'Shoulders', sets: 3, reps_min: 8, reps_max: 10, rest_seconds: 90, notes: 'Brace core throughout' },
        { name: 'Lateral Raise', muscle_group: 'Shoulders', sets: 4, reps_min: 15, reps_max: 20, rest_seconds: 60, notes: 'Raise to shoulder height only' },
        { name: 'Skull Crusher', muscle_group: 'Triceps', sets: 3, reps_min: 10, reps_max: 14, rest_seconds: 60, notes: 'Lower to forehead, press up and back' },
      ],
    },
    {
      name: 'Pull — Back & Biceps',
      session_notes: 'Deadlift starts the session heavy.',
      exercises: [
        { name: 'Deadlift', muscle_group: 'Back', sets: 3, reps_min: 5, reps_max: 6, rest_seconds: 180, notes: 'Lat engagement throughout' },
        { name: 'Pull Up', muscle_group: 'Back', sets: 4, reps_min: 6, reps_max: 10, rest_seconds: 90, notes: 'Full hang, lead with elbows' },
        { name: 'Barbell Row', muscle_group: 'Back', sets: 3, reps_min: 8, reps_max: 10, rest_seconds: 90, notes: 'Horizontal pull — elbow path matters' },
        { name: 'Face Pull', muscle_group: 'Rear Delts', sets: 4, reps_min: 15, reps_max: 20, rest_seconds: 60, notes: 'External rotation emphasis' },
        { name: 'Hammer Curl', muscle_group: 'Biceps', sets: 3, reps_min: 12, reps_max: 15, rest_seconds: 60, notes: 'Neutral grip, slow the descent' },
      ],
    },
  ]

  const days = Array.from({ length: Math.min(daysPerWeek, 6) }, (_, i) => ({
    day_number: i + 1,
    name: templates[i % templates.length].name,
    session_notes: templates[i % templates.length].session_notes,
    exercises: templates[i % templates.length].exercises.map((ex) => ({
      ...ex, rpe: 7, tempo: null, superset_with_next: false,
    })),
  }))

  return {
    name: `${weeks}-Week ${daysPerWeek}×/Week ${goal === 'hypertrophy' ? 'Hypertrophy' : goal === 'strength' ? 'Strength' : 'Fitness'} Program`,
    description: `A professionally designed ${weeks}-week program built around ${daysPerWeek} sessions per week. Progressive overload is baked in week-over-week to drive continuous adaptation.`,
    coaching_notes: '• Quality reps over ego weight — technique first\n• Log every session — data drives progress\n• Eat 1.6–2.2g protein per kg bodyweight\n• Sleep 7–9 hours — where adaptation happens\n• Tell your coach immediately if anything causes pain',
    progression_notes: `Add 2.5 kg to main compound lifts weekly. On isolation exercises, increase reps by 1 each session until hitting the top of the range, then add weight and reset. From week ${Math.ceil(weeks / 2)}: shift to heavier loads.`,
    deload_notes: 'Deload week: keep sets and reps the same but reduce load 40–50%. Focus on movement quality.',
    goal,
    difficulty: 'intermediate',
    days,
  }
}
