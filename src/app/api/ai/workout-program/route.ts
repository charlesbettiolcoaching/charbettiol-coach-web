export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import OpenAI from 'openai';
import { SportCategory, WorkoutFormat } from '@/types/workout';
import { getSportConfig, getFormatConfig } from '@/constants/workoutConfigs';

// Lazy initialization — only evaluated at request time, not during build.
function getOpenAIClient() {
  const key = process.env.OPENAI_API_KEY
  if (!key) throw new Error("Missing OPENAI_API_KEY")
  return new OpenAI({ apiKey: key })
}


interface WorkoutProgramRequest {
  client_id: string;
  title: string;
  goal: string;
  experience_level: string;
  days_per_week: number;
  session_duration_minutes: number;
  equipment_available: string[];
  injuries_limitations: string;
  preferred_split: string;
  notes?: string;
  program_length_weeks: number;
  // Sport-specific (optional — defaults to 'strength' / 'straight_sets' for backwards compat)
  sport_category?: SportCategory;
  preferred_formats?: WorkoutFormat[];
}

const SPLIT_TEMPLATES: Record<string, Record<number, string[]>> = {
  push_pull_legs: {
    3: ['Push', 'Pull', 'Legs'],
    4: ['Push', 'Pull', 'Legs', 'Upper'],
    5: ['Push', 'Pull', 'Legs', 'Push', 'Pull'],
    6: ['Push', 'Pull', 'Legs', 'Push', 'Pull', 'Legs'],
  },
  upper_lower: {
    2: ['Upper', 'Lower'],
    3: ['Upper', 'Lower', 'Full Body'],
    4: ['Upper', 'Lower', 'Upper', 'Lower'],
    5: ['Upper', 'Lower', 'Upper', 'Lower', 'Upper'],
    6: ['Upper', 'Lower', 'Upper', 'Lower', 'Upper', 'Lower'],
  },
  full_body: {
    2: ['Full Body A', 'Full Body B'],
    3: ['Full Body A', 'Full Body B', 'Full Body C'],
    4: ['Full Body A', 'Full Body B', 'Full Body C', 'Full Body D'],
  },
  bro_split: {
    4: ['Chest/Triceps', 'Back/Biceps', 'Shoulders/Abs', 'Legs'],
    5: ['Chest', 'Back', 'Shoulders', 'Arms', 'Legs'],
    6: ['Chest', 'Back', 'Shoulders', 'Arms', 'Quads/Calves', 'Hamstrings/Glutes'],
  },
};

export async function POST(req: NextRequest) {
  const openai = getOpenAIClient()
  try {
    const supabase = createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body: WorkoutProgramRequest = await req.json();
    const {
      client_id,
      title,
      goal,
      experience_level,
      days_per_week,
      session_duration_minutes = 60,
      equipment_available = [],
      injuries_limitations = '',
      preferred_split = 'auto',
      notes,
      program_length_weeks = 4,
      sport_category = 'strength',
      preferred_formats = [],
    } = body;

    if (!client_id || !goal || !days_per_week) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Verify client belongs to this coach
    const { data: clientCheck, error: clientCheckError } = await supabase
      .from('profiles')
      .select('id')
      .eq('id', client_id)
      .eq('coach_id', user.id)
      .single();

    if (clientCheckError || !clientCheck) {
      return NextResponse.json({ error: 'Client not found' }, { status: 403 });
    }

    // Build AI prompt
    const prompt = buildWorkoutPrompt({
      goal,
      experience_level,
      days_per_week,
      session_duration_minutes,
      equipment_available,
      injuries_limitations,
      preferred_split,
      notes,
      program_length_weeks,
      sport_category,
      preferred_formats,
    });

    const sportCfg = getSportConfig(sport_category)
    const systemPrompt = sport_category === 'strength'
      ? `You are an expert strength & conditioning coach and exercise scientist. You design periodized, evidence-based training programs. Always return valid JSON matching the exact schema requested. Use proper exercise names, prescribe appropriate set/rep ranges for the goal, and include warm-up sets where appropriate.`
      : `You are an expert ${sportCfg.label} coach and exercise scientist specialising in ${sportCfg.description}. You design periodized, evidence-based training programs for ${sportCfg.label}. Always return valid JSON matching the exact schema requested. Use sport-appropriate terminology, prescribe correct training parameters (${Object.entries(sportCfg.exerciseFields).filter(([,v]) => v).map(([k]) => k).join(', ')}), and structure workouts for the specified format.`

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: prompt },
      ],
      response_format: { type: 'json_object' },
      temperature: 0.7,
      max_tokens: 12000,
    });

    const aiResponse = JSON.parse(completion.choices[0].message.content || '{}');

    if (!aiResponse.days || !Array.isArray(aiResponse.days)) {
      return NextResponse.json({ error: 'AI returned invalid format' }, { status: 500 });
    }

    // Save program to existing workout_programs / workout_days / workout_exercises tables
    const { data: program, error: progError } = await supabase
      .from('workout_programs')
      .insert({
        coach_id: user.id,
        client_id,
        title: title || `${goal.replace('_', ' ')} Program`,
        description: aiResponse.program_description || '',
        status: 'draft',
        goal,
        experience_level,
        days_per_week,
        session_duration_minutes,
        equipment_available,
        injuries_limitations,
        preferred_split,
        program_length_weeks,
        ai_generated: true,
        notes,
      })
      .select()
      .single();

    if (progError) {
      console.error('Error creating program:', progError);
      return NextResponse.json({ error: 'Failed to save program' }, { status: 500 });
    }

    // Insert days and exercises
    for (const day of aiResponse.days) {
      const { data: dayRow, error: dayError } = await supabase
        .from('workout_days')
        .insert({
          program_id: program.id,
          day_number: day.day_number,
          name: day.name,
          focus: day.focus,
          notes: day.notes || '',
          estimated_duration_minutes: day.estimated_duration_minutes || session_duration_minutes,
        })
        .select()
        .single();

      if (dayError) {
        console.error('Error creating workout day:', dayError);
        continue;
      }

      if (day.exercises && day.exercises.length > 0) {
        await supabase.from('workout_exercises').insert(
          day.exercises.map((ex: any, i: number) => ({
            day_id: dayRow.id,
            order_index: i,
            name: ex.exercise_name,
            muscle_group: ex.muscle_group,
            sets: ex.sets,
            reps: ex.reps,
            rpe: ex.rpe || null,
            rest_seconds: ex.rest_seconds,
            tempo: ex.tempo || null,
            notes: ex.notes || '',
            superset_group: ex.superset_group || null,
            is_warmup: ex.is_warmup || false,
          }))
        );
      }
    }

    // Fetch complete program
    const { data: completeProgram } = await supabase
      .from('workout_programs')
      .select(`
        *,
        client:profiles!workout_programs_client_id_fkey(full_name),
        workout_days(*, workout_exercises(*))
      `)
      .eq('id', program.id)
      .single();

    return NextResponse.json({ program: completeProgram });
  } catch (error) {
    console.error('Workout program generation error:', error);
    return NextResponse.json({ error: 'Failed to generate program' }, { status: 500 });
  }
}

function buildWorkoutPrompt(params: {
  goal: string;
  experience_level: string;
  days_per_week: number;
  session_duration_minutes: number;
  equipment_available: string[];
  injuries_limitations: string;
  preferred_split: string;
  notes?: string;
  program_length_weeks: number;
  sport_category: SportCategory;
  preferred_formats: WorkoutFormat[];
}): string {
  const sportCfg = getSportConfig(params.sport_category)
  const isStrength = params.sport_category === 'strength'

  const splitHint = isStrength && params.preferred_split !== 'auto'
    ? `USE THIS SPLIT: ${params.preferred_split.replace(/_/g, ' ')} — ${
        SPLIT_TEMPLATES[params.preferred_split]?.[params.days_per_week]?.join(', ') || 'assign appropriate focus per day'
      }`
    : isStrength
    ? `Choose the optimal training split for ${params.days_per_week} days/week given the goal.`
    : `Structure ${params.days_per_week} sessions appropriate for ${sportCfg.label}.`

  const formatHint = params.preferred_formats.length > 0
    ? `PREFERRED WORKOUT FORMATS: ${params.preferred_formats.map(f => getFormatConfig(f).label).join(', ')}`
    : `Default format: ${getFormatConfig(sportCfg.defaultFormat).label}`

  // Sport-specific field mapping
  const fields = sportCfg.exerciseFields
  const fieldList = Object.entries(fields).filter(([,v]) => v).map(([k]) => k)

  const sportInstructions: Record<SportCategory, string> = {
    strength: `Focus on resistance training. Include sets, reps, weight, rest periods, and RPE. Use supersets and compound movements.`,
    running: `Design running/endurance sessions. Include distance (meters), target pace (min/km), duration, HR zones, and RPE. No sets/reps/weight — use segments with distance and pace.`,
    cycling: `Design cycling sessions. Include duration, distance, power zones or HR zones, pace, and RPE. Structure as timed blocks or intervals.`,
    swimming: `Design swimming sessions. Include sets, distance per set, stroke type, pace per 100m, and rest intervals. Use lane terminology.`,
    functional: `Design functional fitness/CrossFit workouts. Can include AMRAPs, EMOMs, For Time, circuits. Use reps, weight, calories, and distance for appropriate movements.`,
    sports_specific: `Design sport conditioning sessions. Include agility drills, SAQ work, conditioning circuits. Use reps, duration, distance, and HR zones.`,
    rehab: `Design rehabilitation exercises. ALWAYS include tempo notation (e.g. "3-1-2-0" = eccentric-pause-concentric-pause), sets, reps, and detailed coaching cues. Prioritise controlled movement quality.`,
    hiit: `Design HIIT sessions. Include work/rest ratios, duration of each interval, HR zones, and calories where appropriate. Use tabata, interval, or AMRAP formats.`,
    yoga_pilates: `Design yoga/Pilates sessions. Include pose/exercise name, hold duration (seconds), breath cues, and modifications. Use timed blocks — no weight or distance.`,
  }

  const exerciseSchema = isStrength ? `{
          "exercise_name": "<full exercise name>",
          "muscle_group": "<primary muscle group>",
          "sets": <number>,
          "reps": "<rep range as string, e.g. '8-12'>",
          "rpe": <number or null>,
          "rest_seconds": <number>,
          "tempo": "<tempo string or null>",
          "notes": "<form cues>",
          "superset_group": "<letter or null>",
          "is_warmup": <boolean>
        }` : `{
          "exercise_name": "<movement/segment name>",
          "sets": ${fields.sets ? '<number or null>' : 'null'},
          "reps": ${fields.reps ? '"<reps or null>"' : 'null'},
          "weight": ${fields.weight ? '"<weight or null>"' : 'null'},
          "duration_seconds": ${fields.duration ? '<number or null>' : 'null'},
          "distance_meters": ${fields.distance ? '<number or null>' : 'null'},
          "pace": ${fields.pace ? '"<e.g. 5:30/km or null>"' : 'null'},
          "heart_rate_zone": ${fields.heartRateZone ? '<1-5 or null>' : 'null'},
          "calories": ${fields.calories ? '<number or null>' : 'null'},
          "tempo": ${fields.tempo ? '"<e.g. 3-1-2-0 or null>"' : 'null'},
          "rpe": ${fields.rpe ? '<1-10 or null>' : 'null'},
          "notes": "<coaching cues, form reminders>"
        }`

  return `Design a complete ${params.program_length_weeks}-week ${sportCfg.label} training program (output week 1 as the template):

SPORT CATEGORY: ${sportCfg.label} — ${sportCfg.description}
GOAL: ${params.goal.replace(/_/g, ' ')}
EXPERIENCE LEVEL: ${params.experience_level}
TRAINING DAYS PER WEEK: ${params.days_per_week}
SESSION DURATION: ~${params.session_duration_minutes} minutes
${params.equipment_available.length > 0 ? `EQUIPMENT AVAILABLE: ${params.equipment_available.join(', ')}` : ''}
${params.injuries_limitations ? `INJURIES/LIMITATIONS: ${params.injuries_limitations}` : ''}
${splitHint}
${formatHint}
${params.notes ? `ADDITIONAL NOTES: ${params.notes}` : ''}

SPORT-SPECIFIC INSTRUCTIONS:
${sportInstructions[params.sport_category]}

ACTIVE FIELDS FOR THIS SPORT (only populate these, set others to null):
${fieldList.join(', ')}

- Include progressive overload notes
- ${params.experience_level === 'beginner' ? 'Keep movements simple and foundational' : ''}
- ${params.experience_level === 'advanced' ? 'Include advanced techniques appropriate for this sport' : ''}
${isStrength ? '- Mark warm-up sets explicitly with is_warmup: true' : ''}
${isStrength ? '- Group supersets with matching superset_group letters (A, B, C...)' : ''}

Return JSON with this EXACT structure:
{
  "program_description": "<2-3 sentence overview>",
  "progression_notes": "<how to progress week over week>",
  "days": [
    {
      "day_number": 1,
      "name": "<session name>",
      "focus": "<primary focus/goal>",
      "estimated_duration_minutes": <number>,
      "format": "<workout format, e.g. ${sportCfg.defaultFormat}>",
      "notes": "<day-level coaching notes>",
      "exercises": [
        ${exerciseSchema}
      ]
    }
  ]
}

RULES:
- Day numbers go from 1 to ${params.days_per_week}
- Each day must have 4-10 exercises/segments appropriate for the sport
- All values must match the JSON types specified
- Only populate the fields relevant for ${sportCfg.label}
- Use null for irrelevant fields`
}
