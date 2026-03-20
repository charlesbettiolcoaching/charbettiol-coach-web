'use client'

import { useState, useEffect, useRef, useMemo } from 'react'
import { format, parseISO } from 'date-fns'
import {
  Search, X, Plus, Upload, Download, Copy, Eye, Zap, Trash2,
  MoreHorizontal, ChevronDown, ChevronUp, Globe, Lock, Star,
  Dumbbell, CheckCircle2, AlertCircle, BookOpen,
} from 'lucide-react'
import clsx from 'clsx'
import { useIsDemo } from '@/lib/demo/useDemoMode'
import { DEMO_CLIENTS } from '@/lib/demo/mockData'

// ─── Types ────────────────────────────────────────────────────────────────────

interface TplExercise {
  order_index: number
  sets: number
  reps_min: number
  reps_max: number
  weight?: number | null
  weight_unit?: string
  rest_seconds?: number
  rpe?: number | null
  tempo?: string | null
  notes?: string | null
  superset_id?: string | null
  exercise: { id: string; name: string; category: string }
}

interface TplWorkout {
  week_number: number
  day_number: number
  name: string
  notes?: string
  exercises: TplExercise[]
}

interface TemplateStructure {
  notes?: string
  workouts: TplWorkout[]
}

interface ProgramTemplate {
  id: string
  coach_id: string
  name: string
  description: string | null
  duration_weeks: number
  days_per_week: number
  goal: string
  difficulty: string
  is_public: boolean
  structure: TemplateStructure
  created_at: string
  author_name?: string   // resolved for marketplace templates
}

// ─── Demo data ────────────────────────────────────────────────────────────────

function mkEx(id: string, name: string, cat: string, sets: number, rMin: number, rMax: number, rest = 90, notes?: string): TplExercise {
  return { order_index: 0, sets, reps_min: rMin, reps_max: rMax, rest_seconds: rest, notes: notes ?? null, exercise: { id, name, category: cat } }
}

function mkDay(week: number, day: number, name: string, exercises: TplExercise[]): TplWorkout {
  return { week_number: week, day_number: day, name, exercises: exercises.map((e, i) => ({ ...e, order_index: i })) }
}

function buildDemoTemplates(): ProgramTemplate[] {
  const ME = 'demo-coach-id'
  const now = '2026-01-01T00:00:00.000Z'

  return [
    // ── 1. Push/Pull/Legs ──────────────────────────────────────
    {
      id: 'tpl-ppl', coach_id: ME, name: 'Push / Pull / Legs',
      description: 'Classic PPL split for maximum muscle hypertrophy. High volume, 6 days per week with one rest day. Ideal for intermediate lifters who can recover from frequent training.',
      duration_weeks: 8, days_per_week: 6, goal: 'hypertrophy', difficulty: 'intermediate', is_public: false, created_at: now,
      structure: {
        notes: 'Rest 60–90s on isolation exercises, 2–3 min on compounds. Increase weight when you hit the top of the rep range for all sets.',
        workouts: [
          mkDay(1, 1, 'Push – Chest & Shoulders', [
            mkEx('ex-001', 'Bench Press', 'Chest', 4, 6, 10, 120, 'Lead compound — push for progressive overload'),
            mkEx('ex-005', 'Incline Dumbbell Press', 'Chest', 3, 8, 12, 90),
            mkEx('ex-019', 'Overhead Press', 'Shoulders', 3, 8, 12, 90),
            mkEx('ex-022', 'Lateral Raise', 'Shoulders', 4, 12, 20, 60),
            mkEx('ex-034', 'Tricep Pushdown', 'Triceps', 3, 12, 15, 60),
            mkEx('ex-037', 'Overhead Tricep Extension', 'Triceps', 3, 10, 15, 60),
          ]),
          mkDay(1, 2, 'Pull – Back & Biceps', [
            mkEx('ex-011', 'Deadlift', 'Back', 3, 5, 8, 150, 'Warm up thoroughly. Drive hips through.'),
            mkEx('ex-012', 'Pull Up', 'Back', 4, 6, 10, 90),
            mkEx('ex-015', 'Seated Cable Row', 'Back', 3, 10, 14, 90),
            mkEx('ex-018', 'Face Pull', 'Shoulders', 4, 15, 20, 60, 'External rotation focus'),
            mkEx('ex-027', 'Barbell Curl', 'Biceps', 3, 10, 14, 60),
            mkEx('ex-029', 'Hammer Curl', 'Biceps', 3, 12, 16, 60),
          ]),
          mkDay(1, 3, 'Legs', [
            mkEx('ex-041', 'Squat', 'Legs', 4, 6, 10, 150, 'Full depth, knees tracking toes'),
            mkEx('ex-048', 'Romanian Deadlift', 'Legs', 3, 10, 14, 90),
            mkEx('ex-043', 'Leg Press', 'Legs', 3, 12, 15, 90),
            mkEx('ex-044', 'Bulgarian Split Squat', 'Legs', 3, 10, 12, 90),
            mkEx('ex-049', 'Calf Raise', 'Legs', 4, 15, 20, 60),
          ]),
          mkDay(1, 4, 'Push – Volume', [
            mkEx('ex-004', 'Dumbbell Bench Press', 'Chest', 4, 10, 14, 90),
            mkEx('ex-006', 'Dumbbell Flye', 'Chest', 3, 12, 16, 60),
            mkEx('ex-020', 'Dumbbell Shoulder Press', 'Shoulders', 3, 10, 14, 90),
            mkEx('ex-022', 'Lateral Raise', 'Shoulders', 4, 15, 20, 60),
            mkEx('ex-034', 'Tricep Pushdown', 'Triceps', 3, 15, 20, 60),
            mkEx('ex-039', 'Diamond Push Up', 'Triceps', 2, 15, 20, 60),
          ]),
          mkDay(1, 5, 'Pull – Volume', [
            mkEx('ex-014', 'Lat Pulldown', 'Back', 4, 10, 14, 90),
            mkEx('ex-016', 'Single Arm Dumbbell Row', 'Back', 3, 10, 14, 90),
            mkEx('ex-010', 'Barbell Row', 'Back', 3, 8, 12, 90),
            mkEx('ex-025', 'Rear Delt Flye', 'Shoulders', 4, 15, 20, 60),
            mkEx('ex-031', 'Cable Curl', 'Biceps', 3, 12, 16, 60),
            mkEx('ex-030', 'Incline Dumbbell Curl', 'Biceps', 3, 10, 14, 60),
          ]),
          mkDay(1, 6, 'Legs – Volume', [
            mkEx('ex-041', 'Squat', 'Legs', 4, 8, 12, 120),
            mkEx('ex-051', 'Hip Thrust', 'Glutes', 4, 10, 15, 90),
            mkEx('ex-045', 'Walking Lunges', 'Legs', 3, 12, 16, 90),
            mkEx('ex-048', 'Romanian Deadlift', 'Legs', 3, 12, 15, 90),
            mkEx('ex-049', 'Calf Raise', 'Legs', 4, 20, 25, 60),
          ]),
        ],
      },
    },

    // ── 2. 5/3/1 Strength ─────────────────────────────────────
    {
      id: 'tpl-531', coach_id: ME, name: '5/3/1 Wendler Strength',
      description: 'Jim Wendler\'s famous 5/3/1 program. 4-day upper/lower split rotating through Squat, Bench, Deadlift, and OHP as the main lifts with joker sets and first set last (FSL) accessory protocol.',
      duration_weeks: 16, days_per_week: 4, goal: 'strength', difficulty: 'advanced', is_public: false, created_at: now,
      structure: {
        notes: 'Week 1: 5/5/5+. Week 2: 3/3/3+. Week 3: 5/3/1+. Week 4: Deload. Repeat. Use 90% of your true 1RM to calculate training maxes.',
        workouts: [
          mkDay(1, 1, 'Squat Day', [
            mkEx('ex-041', 'Squat', 'Legs', 3, 5, 5, 180, 'Week 1: 65/75/85%. Hit an AMRAP on the last set.'),
            mkEx('ex-041', 'Squat', 'Legs', 5, 5, 10, 120, 'FSL — First Set Last: 5×5 @ 65% weight'),
            mkEx('ex-011', 'Deadlift', 'Back', 3, 8, 10, 90, 'Accessory — controlled tempo'),
            mkEx('ex-059', 'Plank', 'Core', 3, 30, 60, 60),
          ]),
          mkDay(1, 2, 'Bench Press Day', [
            mkEx('ex-001', 'Bench Press', 'Chest', 3, 5, 5, 180, 'Week 1: 65/75/85%. AMRAP on final set.'),
            mkEx('ex-001', 'Bench Press', 'Chest', 5, 5, 10, 120, 'FSL — 5×5 @ 65%'),
            mkEx('ex-010', 'Barbell Row', 'Back', 5, 10, 10, 90, 'Antagonist work — same volume as bench'),
            mkEx('ex-027', 'Barbell Curl', 'Biceps', 3, 10, 15, 60),
          ]),
          mkDay(1, 3, 'Deadlift Day', [
            mkEx('ex-011', 'Deadlift', 'Back', 3, 5, 5, 180, 'Week 1: 65/75/85%. Pull hard on the AMRAP set.'),
            mkEx('ex-011', 'Deadlift', 'Back', 5, 5, 8, 120, 'FSL 5×5'),
            mkEx('ex-041', 'Squat', 'Legs', 3, 10, 10, 90, 'Goblet or safety squat accessory'),
            mkEx('ex-061', 'Hanging Leg Raise', 'Core', 3, 10, 15, 60),
          ]),
          mkDay(1, 4, 'OHP Day', [
            mkEx('ex-019', 'Overhead Press', 'Shoulders', 3, 5, 5, 180, 'Week 1: 65/75/85%'),
            mkEx('ex-019', 'Overhead Press', 'Shoulders', 5, 5, 10, 120, 'FSL 5×5'),
            mkEx('ex-012', 'Pull Up', 'Back', 5, 10, 10, 90, 'Chin-ups or pull-ups — match OHP volume'),
            mkEx('ex-025', 'Rear Delt Flye', 'Shoulders', 3, 15, 20, 60),
          ]),
        ],
      },
    },

    // ── 3. Starting Strength ───────────────────────────────────
    {
      id: 'tpl-ss', coach_id: ME, name: 'Starting Strength',
      description: 'Mark Rippetoe\'s linear progression program for true beginners. Three full-body sessions per week alternating between two workouts. Add weight every session.',
      duration_weeks: 12, days_per_week: 3, goal: 'strength', difficulty: 'beginner', is_public: false, created_at: now,
      structure: {
        notes: 'Add 2.5 kg to upper body lifts and 5 kg to lower body lifts every session. Train Mon/Wed/Fri. Alternate A and B workouts.',
        workouts: [
          mkDay(1, 1, 'Workout A', [
            mkEx('ex-041', 'Squat', 'Legs', 3, 5, 5, 180, 'The cornerstone of the program. 3×5 across.'),
            mkEx('ex-001', 'Bench Press', 'Chest', 3, 5, 5, 120),
            mkEx('ex-011', 'Deadlift', 'Back', 1, 5, 5, 180, 'Heavy single working set'),
          ]),
          mkDay(1, 3, 'Workout B', [
            mkEx('ex-041', 'Squat', 'Legs', 3, 5, 5, 180),
            mkEx('ex-019', 'Overhead Press', 'Shoulders', 3, 5, 5, 120),
            mkEx('ex-010', 'Barbell Row', 'Back', 3, 5, 5, 120),
          ]),
          mkDay(1, 5, 'Workout A', [
            mkEx('ex-041', 'Squat', 'Legs', 3, 5, 5, 180),
            mkEx('ex-001', 'Bench Press', 'Chest', 3, 5, 5, 120),
            mkEx('ex-011', 'Deadlift', 'Back', 1, 5, 5, 180),
          ]),
        ],
      },
    },

    // ── 4. PHUL ────────────────────────────────────────────────
    {
      id: 'tpl-phul', coach_id: ME, name: 'PHUL — Power Hypertrophy Upper/Lower',
      description: 'Brandon Lilly\'s Power Hypertrophy Upper Lower split. 4 days combining powerlifting and bodybuilding. Two power sessions focus on strength in the 3–5 rep range; two hypertrophy sessions target 8–15 reps.',
      duration_weeks: 8, days_per_week: 4, goal: 'hypertrophy', difficulty: 'intermediate', is_public: false, created_at: now,
      structure: {
        notes: 'Power days: heavy, fewer reps, longer rest. Hypertrophy days: moderate weight, higher reps, shorter rest.',
        workouts: [
          mkDay(1, 1, 'Upper Power', [
            mkEx('ex-001', 'Bench Press', 'Chest', 3, 3, 5, 180),
            mkEx('ex-010', 'Barbell Row', 'Back', 3, 3, 5, 180),
            mkEx('ex-019', 'Overhead Press', 'Shoulders', 3, 3, 5, 150),
            mkEx('ex-012', 'Pull Up', 'Back', 3, 4, 6, 120),
            mkEx('ex-027', 'Barbell Curl', 'Biceps', 2, 6, 8, 90),
            mkEx('ex-035', 'Skull Crusher', 'Triceps', 2, 6, 8, 90),
          ]),
          mkDay(1, 2, 'Lower Power', [
            mkEx('ex-041', 'Squat', 'Legs', 3, 3, 5, 180),
            mkEx('ex-011', 'Deadlift', 'Back', 3, 3, 5, 180),
            mkEx('ex-044', 'Bulgarian Split Squat', 'Legs', 2, 5, 8, 120),
            mkEx('ex-049', 'Calf Raise', 'Legs', 2, 10, 12, 60),
          ]),
          mkDay(1, 4, 'Upper Hypertrophy', [
            mkEx('ex-005', 'Incline Dumbbell Press', 'Chest', 4, 8, 12, 90),
            mkEx('ex-007', 'Cable Crossover', 'Chest', 3, 12, 15, 60),
            mkEx('ex-014', 'Lat Pulldown', 'Back', 4, 8, 12, 90),
            mkEx('ex-015', 'Seated Cable Row', 'Back', 3, 10, 14, 90),
            mkEx('ex-022', 'Lateral Raise', 'Shoulders', 4, 12, 20, 60),
            mkEx('ex-031', 'Cable Curl', 'Biceps', 3, 10, 14, 60),
            mkEx('ex-034', 'Tricep Pushdown', 'Triceps', 3, 10, 14, 60),
          ]),
          mkDay(1, 5, 'Lower Hypertrophy', [
            mkEx('ex-041', 'Squat', 'Legs', 4, 8, 12, 120),
            mkEx('ex-048', 'Romanian Deadlift', 'Legs', 3, 10, 14, 90),
            mkEx('ex-043', 'Leg Press', 'Legs', 4, 10, 15, 90),
            mkEx('ex-051', 'Hip Thrust', 'Glutes', 3, 12, 15, 90),
            mkEx('ex-049', 'Calf Raise', 'Legs', 4, 15, 20, 60),
          ]),
        ],
      },
    },

    // ── 5. Female Physique Builder ─────────────────────────────
    {
      id: 'tpl-female', coach_id: ME, name: 'Female Physique Builder',
      description: 'Glute-focused hypertrophy program designed for women. Prioritises hip dominant movements, upper body pulling, and moderate push volume. 4 days/week with high volume on legs and glutes.',
      duration_weeks: 10, days_per_week: 4, goal: 'hypertrophy', difficulty: 'intermediate', is_public: false, created_at: now,
      structure: {
        notes: 'Glutes are prioritised on every session. Progress loads on hip thrusts and squats each week.',
        workouts: [
          mkDay(1, 1, 'Lower – Glute Focus', [
            mkEx('ex-051', 'Hip Thrust', 'Glutes', 4, 8, 12, 120, 'Squeeze hard at the top'),
            mkEx('ex-041', 'Squat', 'Legs', 3, 8, 12, 120),
            mkEx('ex-044', 'Bulgarian Split Squat', 'Legs', 3, 10, 14, 90),
            mkEx('ex-048', 'Romanian Deadlift', 'Legs', 3, 10, 14, 90),
            mkEx('ex-052', 'Glute Bridge', 'Glutes', 3, 15, 20, 60),
            mkEx('ex-049', 'Calf Raise', 'Legs', 3, 15, 20, 60),
          ]),
          mkDay(1, 2, 'Upper – Pull Focus', [
            mkEx('ex-014', 'Lat Pulldown', 'Back', 4, 10, 14, 90),
            mkEx('ex-015', 'Seated Cable Row', 'Back', 3, 10, 14, 90),
            mkEx('ex-016', 'Single Arm Dumbbell Row', 'Back', 3, 10, 14, 90),
            mkEx('ex-018', 'Face Pull', 'Shoulders', 4, 15, 20, 60),
            mkEx('ex-029', 'Hammer Curl', 'Biceps', 3, 12, 16, 60),
            mkEx('ex-022', 'Lateral Raise', 'Shoulders', 3, 15, 20, 60),
          ]),
          mkDay(1, 4, 'Lower – Quad Focus', [
            mkEx('ex-041', 'Squat', 'Legs', 4, 8, 12, 120),
            mkEx('ex-043', 'Leg Press', 'Legs', 4, 12, 15, 90),
            mkEx('ex-051', 'Hip Thrust', 'Glutes', 3, 12, 15, 90),
            mkEx('ex-045', 'Walking Lunges', 'Legs', 3, 12, 16, 90),
            mkEx('ex-056', 'Resistance Band Clamshell', 'Glutes', 3, 20, 25, 60),
          ]),
          mkDay(1, 5, 'Upper – Push & Accessory', [
            mkEx('ex-005', 'Incline Dumbbell Press', 'Chest', 3, 10, 14, 90),
            mkEx('ex-020', 'Dumbbell Shoulder Press', 'Shoulders', 3, 10, 14, 90),
            mkEx('ex-022', 'Lateral Raise', 'Shoulders', 4, 15, 20, 60),
            mkEx('ex-034', 'Tricep Pushdown', 'Triceps', 3, 12, 16, 60),
            mkEx('ex-025', 'Rear Delt Flye', 'Shoulders', 3, 15, 20, 60),
            mkEx('ex-059', 'Plank', 'Core', 3, 30, 45, 60),
          ]),
        ],
      },
    },

    // ── 6. Full Body Beginner ──────────────────────────────────
    {
      id: 'tpl-beginner', coach_id: ME, name: 'Full Body Beginner — 3 Days',
      description: 'Simple, effective 3-day full body routine for complete beginners. Each session covers all major movement patterns with enough volume to drive progress without overwhelming recovery.',
      duration_weeks: 8, days_per_week: 3, goal: 'general_fitness', difficulty: 'beginner', is_public: false, created_at: now,
      structure: {
        notes: 'Rest at least one day between sessions. Focus on form before adding weight. Add 2.5 kg per session on lower body, 1.25 kg on upper body.',
        workouts: [
          mkDay(1, 1, 'Full Body A', [
            mkEx('ex-050', 'Goblet Squat', 'Legs', 3, 8, 12, 90, 'Great for learning squat pattern'),
            mkEx('ex-001', 'Bench Press', 'Chest', 3, 8, 10, 90),
            mkEx('ex-011', 'Deadlift', 'Back', 3, 6, 8, 120),
            mkEx('ex-014', 'Lat Pulldown', 'Back', 3, 10, 12, 90),
            mkEx('ex-059', 'Plank', 'Core', 3, 20, 30, 60),
          ]),
          mkDay(1, 3, 'Full Body B', [
            mkEx('ex-043', 'Leg Press', 'Legs', 3, 10, 12, 90),
            mkEx('ex-019', 'Overhead Press', 'Shoulders', 3, 8, 10, 90),
            mkEx('ex-010', 'Barbell Row', 'Back', 3, 8, 10, 90),
            mkEx('ex-028', 'Dumbbell Curl', 'Biceps', 3, 10, 14, 60),
            mkEx('ex-034', 'Tricep Pushdown', 'Triceps', 3, 10, 14, 60),
          ]),
          mkDay(1, 5, 'Full Body A', [
            mkEx('ex-050', 'Goblet Squat', 'Legs', 3, 8, 12, 90),
            mkEx('ex-001', 'Bench Press', 'Chest', 3, 8, 10, 90),
            mkEx('ex-011', 'Deadlift', 'Back', 3, 6, 8, 120),
            mkEx('ex-014', 'Lat Pulldown', 'Back', 3, 10, 12, 90),
            mkEx('ex-059', 'Plank', 'Core', 3, 20, 30, 60),
          ]),
        ],
      },
    },

    // ── 7. Marketplace: Lean & Strong ─────────────────────────
    {
      id: 'tpl-lean-strong', coach_id: 'coach-alex', name: 'Lean & Strong — 12-Week Recomp',
      description: 'A body recomposition program combining moderate strength work with metabolic conditioning finishers. Designed to simultaneously build muscle and reduce body fat over 12 weeks.',
      duration_weeks: 12, days_per_week: 5, goal: 'hypertrophy', difficulty: 'intermediate', is_public: true, created_at: now,
      author_name: 'Alex Turner',
      structure: {
        notes: 'Cardio finishers: 10 min HIIT or 20 min steady state after each session.',
        workouts: [
          mkDay(1, 1, 'Upper Push', [
            mkEx('ex-001', 'Bench Press', 'Chest', 4, 6, 8, 120),
            mkEx('ex-002', 'Incline Bench Press', 'Chest', 3, 8, 12, 90),
            mkEx('ex-019', 'Overhead Press', 'Shoulders', 3, 8, 12, 90),
            mkEx('ex-022', 'Lateral Raise', 'Shoulders', 4, 15, 20, 60),
            mkEx('ex-035', 'Skull Crusher', 'Triceps', 3, 10, 14, 60),
          ]),
          mkDay(1, 2, 'Lower', [
            mkEx('ex-041', 'Squat', 'Legs', 4, 6, 8, 150),
            mkEx('ex-048', 'Romanian Deadlift', 'Legs', 3, 10, 14, 90),
            mkEx('ex-043', 'Leg Press', 'Legs', 3, 12, 15, 90),
            mkEx('ex-051', 'Hip Thrust', 'Glutes', 3, 12, 15, 90),
            mkEx('ex-049', 'Calf Raise', 'Legs', 4, 15, 20, 60),
          ]),
          mkDay(1, 3, 'Upper Pull', [
            mkEx('ex-011', 'Deadlift', 'Back', 3, 5, 5, 180),
            mkEx('ex-012', 'Pull Up', 'Back', 4, 6, 10, 90),
            mkEx('ex-015', 'Seated Cable Row', 'Back', 3, 10, 14, 90),
            mkEx('ex-027', 'Barbell Curl', 'Biceps', 3, 10, 14, 60),
            mkEx('ex-018', 'Face Pull', 'Shoulders', 4, 15, 20, 60),
          ]),
        ],
      },
    },

    // ── 8. Marketplace: Powerlifting Base ─────────────────────
    {
      id: 'tpl-pl-base', coach_id: 'coach-jordan', name: 'Powerlifting Foundation 12 Weeks',
      description: 'A 12-week powerlifting peaking program built around the competition squat, bench, and deadlift. Progresses from 75% to 97% of 1RM across the block with volume decreasing as intensity rises.',
      duration_weeks: 12, days_per_week: 4, goal: 'strength', difficulty: 'advanced', is_public: true, created_at: now,
      author_name: 'Jordan Smith',
      structure: {
        notes: 'Use IPF-approved technique. All percentages based on your current competition 1RM. Week 12 is a mock meet.',
        workouts: [
          mkDay(1, 1, 'Squat & Accessories', [
            mkEx('ex-041', 'Squat', 'Legs', 5, 5, 5, 180, 'Competition stance. Belt from set 2.'),
            mkEx('ex-048', 'Romanian Deadlift', 'Legs', 3, 6, 8, 120),
            mkEx('ex-044', 'Bulgarian Split Squat', 'Legs', 2, 8, 10, 90),
            mkEx('ex-059', 'Plank', 'Core', 3, 45, 60, 60),
          ]),
          mkDay(1, 2, 'Bench & Accessories', [
            mkEx('ex-001', 'Bench Press', 'Chest', 5, 5, 5, 180, 'Pause last rep of each set'),
            mkEx('ex-036', 'Close Grip Bench Press', 'Triceps', 3, 6, 8, 120),
            mkEx('ex-010', 'Barbell Row', 'Back', 4, 6, 8, 90),
            mkEx('ex-018', 'Face Pull', 'Shoulders', 3, 15, 20, 60),
          ]),
          mkDay(1, 4, 'Deadlift & Accessories', [
            mkEx('ex-011', 'Deadlift', 'Back', 5, 3, 5, 180, 'Competition grip. Chalk allowed.'),
            mkEx('ex-041', 'Squat', 'Legs', 3, 3, 5, 150, 'Speed squats — 75% of squat max'),
            mkEx('ex-061', 'Hanging Leg Raise', 'Core', 3, 10, 15, 60),
          ]),
          mkDay(1, 6, 'Upper Accessory Day', [
            mkEx('ex-001', 'Bench Press', 'Chest', 3, 8, 10, 120),
            mkEx('ex-019', 'Overhead Press', 'Shoulders', 3, 8, 10, 90),
            mkEx('ex-014', 'Lat Pulldown', 'Back', 4, 10, 12, 90),
            mkEx('ex-012', 'Pull Up', 'Back', 3, 6, 10, 90),
          ]),
        ],
      },
    },
  ]
}

// ─── Constants ────────────────────────────────────────────────────────────────

const GOAL_CONFIG: Record<string, { label: string; color: string; bg: string }> = {
  hypertrophy:         { label: 'Hypertrophy',  color: 'text-blue-500',   bg: 'bg-blue-500/10' },
  strength:            { label: 'Strength',     color: 'text-red-500',    bg: 'bg-red-500/10' },
  fat_loss:            { label: 'Fat Loss',     color: 'text-orange-500', bg: 'bg-orange-500/10' },
  general_fitness:     { label: 'General',      color: 'text-green-500',  bg: 'bg-green-500/10' },
  athletic_performance:{ label: 'Athletic',     color: 'text-purple-500', bg: 'bg-purple-500/10' },
}

const DIFF_CONFIG: Record<string, { label: string; color: string }> = {
  beginner:     { label: 'Beginner',     color: 'text-green-500' },
  intermediate: { label: 'Intermediate', color: 'text-amber-500' },
  advanced:     { label: 'Advanced',     color: 'text-red-500' },
}

// ─── Toast ────────────────────────────────────────────────────────────────────

function Toast({ msg, ok = true }: { msg: string; ok?: boolean }) {
  return (
    <div className={clsx(
      'fixed bottom-6 right-6 z-[200] flex items-center gap-2 px-4 py-3 rounded-xl shadow-lg text-sm font-medium text-white',
      ok ? 'bg-cb-teal' : 'bg-red-500'
    )}>
      {ok ? <CheckCircle2 size={15} /> : <AlertCircle size={15} />}
      {msg}
    </div>
  )
}

// ─── Preview Modal ────────────────────────────────────────────────────────────

function PreviewModal({
  template,
  onClose,
  onQuickAssign,
  onDuplicate,
}: {
  template: ProgramTemplate
  onClose: () => void
  onQuickAssign: () => void
  onDuplicate: () => void
}) {
  const [openWeeks, setOpenWeeks] = useState<Set<number>>(new Set([1]))

  const weeks = useMemo(() => {
    const map = new Map<number, TplWorkout[]>()
    for (const wo of template.structure.workouts ?? []) {
      if (!map.has(wo.week_number)) map.set(wo.week_number, [])
      map.get(wo.week_number)!.push(wo)
    }
    return Array.from(map.entries()).sort((a, b) => a[0] - b[0])
  }, [template])

  const goalCfg = GOAL_CONFIG[template.goal] ?? GOAL_CONFIG.general_fitness
  const diffCfg = DIFF_CONFIG[template.difficulty] ?? DIFF_CONFIG.intermediate

  return (
    <div className="fixed inset-0 z-[100] flex items-start justify-center pt-16 px-4 pb-8 bg-black/50 backdrop-blur-sm overflow-y-auto">
      <div className="relative w-full max-w-3xl bg-surface rounded-2xl border border-cb-border shadow-2xl">
        {/* Header */}
        <div className="px-6 py-5 border-b border-cb-border">
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 flex-wrap mb-1">
                <h2 className="text-lg font-bold text-cb-text">{template.name}</h2>
                {template.is_public && (
                  <span className="flex items-center gap-1 px-2 py-0.5 bg-amber-500/10 text-amber-500 text-xs font-medium rounded-full">
                    <Globe size={10} /> Marketplace
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className={clsx('px-2 py-0.5 rounded-full text-xs font-medium', goalCfg.bg, goalCfg.color)}>{goalCfg.label}</span>
                <span className={clsx('text-xs font-medium', diffCfg.color)}>{diffCfg.label}</span>
                <span className="text-xs text-cb-muted">{template.duration_weeks} weeks · {template.days_per_week} days/week</span>
                {template.author_name && <span className="text-xs text-cb-muted">by {template.author_name}</span>}
              </div>
            </div>
            <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-surface-light text-cb-muted shrink-0"><X size={18} /></button>
          </div>
          {template.description && (
            <p className="mt-3 text-sm text-cb-secondary leading-relaxed">{template.description}</p>
          )}
          {template.structure.notes && (
            <div className="mt-3 px-3 py-2 bg-surface-light rounded-lg">
              <p className="text-xs text-cb-secondary leading-relaxed"><span className="font-semibold text-cb-text">Coach notes: </span>{template.structure.notes}</p>
            </div>
          )}
        </div>

        {/* Week accordion */}
        <div className="divide-y divide-cb-border max-h-[50vh] overflow-y-auto">
          {weeks.map(([weekNum, workouts]) => {
            const isOpen = openWeeks.has(weekNum)
            const toggle = () => setOpenWeeks((prev) => {
              const next = new Set(prev)
              isOpen ? next.delete(weekNum) : next.add(weekNum)
              return next
            })
            return (
              <div key={weekNum}>
                <button
                  className="w-full px-6 py-3 flex items-center justify-between hover:bg-surface-light transition-colors"
                  onClick={toggle}
                >
                  <span className="text-sm font-semibold text-cb-text">Week {weekNum}</span>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-cb-muted">{workouts.length} sessions</span>
                    {isOpen ? <ChevronUp size={15} className="text-cb-muted" /> : <ChevronDown size={15} className="text-cb-muted" />}
                  </div>
                </button>
                {isOpen && (
                  <div className="px-6 pb-4 grid gap-3 sm:grid-cols-2">
                    {workouts.sort((a, b) => a.day_number - b.day_number).map((wo, i) => (
                      <div key={i} className="bg-surface-light border border-cb-border rounded-xl p-3">
                        <p className="text-xs font-semibold text-cb-text mb-2">{wo.name}</p>
                        {wo.notes && <p className="text-[10px] text-cb-muted mb-2 italic">{wo.notes}</p>}
                        <div className="space-y-1">
                          {wo.exercises.map((ex, ei) => {
                            const reps = ex.reps_min === ex.reps_max ? `${ex.reps_min}` : `${ex.reps_min}–${ex.reps_max}`
                            return (
                              <div key={ei} className="flex items-center justify-between text-xs">
                                <span className="text-cb-secondary truncate mr-2">{ex.exercise.name}</span>
                                <span className="text-cb-muted shrink-0">{ex.sets}×{reps}</span>
                              </div>
                            )
                          })}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )
          })}
        </div>

        {/* Footer actions */}
        <div className="px-6 py-4 border-t border-cb-border flex items-center gap-3 flex-wrap">
          <button
            onClick={onDuplicate}
            className="flex items-center gap-1.5 px-3 py-2 border border-cb-border rounded-lg text-sm text-cb-secondary hover:bg-surface-light transition-colors"
          >
            <Copy size={14} /> Duplicate
          </button>
          <button
            onClick={onQuickAssign}
            className="ml-auto flex items-center gap-1.5 px-4 py-2 bg-cb-teal hover:bg-cb-teal/90 text-white rounded-lg text-sm font-medium transition-colors"
          >
            <Zap size={14} /> Quick Assign
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── Quick Assign Modal ───────────────────────────────────────────────────────

type DemoClient = { id: string; name: string }

function QuickAssignModal({
  template,
  clients,
  onClose,
  onAssign,
}: {
  template: ProgramTemplate
  clients: DemoClient[]
  onClose: () => void
  onAssign: (clientId: string, startDate: string, programName: string) => Promise<void>
}) {
  const [search, setSearch] = useState('')
  const [selected, setSelected] = useState<string | null>(null)
  const [startDate, setStartDate] = useState(new Date().toISOString().slice(0, 10))
  const [programName, setProgramName] = useState(template.name)
  const [loading, setLoading] = useState(false)

  const filtered = clients.filter((c) => c.name.toLowerCase().includes(search.toLowerCase()))
  const selectedClient = clients.find((c) => c.id === selected)

  const handleAssign = async () => {
    if (!selected) return
    setLoading(true)
    await onAssign(selected, startDate, programName)
    setLoading(false)
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="w-full max-w-md bg-surface rounded-2xl border border-cb-border shadow-2xl">
        <div className="px-5 py-4 border-b border-cb-border flex items-center justify-between">
          <h3 className="font-semibold text-cb-text">Quick Assign</h3>
          <button onClick={onClose} className="p-1 rounded text-cb-muted hover:text-cb-text"><X size={16} /></button>
        </div>
        <div className="p-5 space-y-4">
          {/* Template summary */}
          <div className="px-3 py-2 bg-surface-light rounded-lg text-sm">
            <span className="font-medium text-cb-text">{template.name}</span>
            <span className="text-cb-muted ml-2">{template.duration_weeks}wk · {template.days_per_week}d/wk</span>
          </div>

          {/* Client search */}
          <div>
            <label className="text-xs font-medium text-cb-secondary mb-1.5 block">Select client</label>
            <div className="relative mb-2">
              <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-cb-muted" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search clients…"
                className="w-full pl-8 pr-3 py-2 bg-surface border border-cb-border rounded-lg text-sm text-cb-text placeholder:text-cb-muted focus:outline-none focus:border-cb-teal"
              />
            </div>
            <div className="max-h-36 overflow-y-auto space-y-1 border border-cb-border rounded-lg p-1">
              {filtered.map((c) => (
                <button
                  key={c.id}
                  onClick={() => setSelected(c.id)}
                  className={clsx(
                    'w-full text-left px-3 py-2 rounded-lg text-sm transition-colors',
                    selected === c.id ? 'bg-cb-teal text-white' : 'text-cb-text hover:bg-surface-light'
                  )}
                >
                  {c.name}
                </button>
              ))}
              {filtered.length === 0 && <p className="text-xs text-cb-muted text-center py-3">No clients found</p>}
            </div>
          </div>

          {/* Program name */}
          <div>
            <label className="text-xs font-medium text-cb-secondary mb-1.5 block">Program name</label>
            <input
              value={programName}
              onChange={(e) => setProgramName(e.target.value)}
              className="w-full px-3 py-2 bg-surface border border-cb-border rounded-lg text-sm text-cb-text focus:outline-none focus:border-cb-teal"
            />
          </div>

          {/* Start date */}
          <div>
            <label className="text-xs font-medium text-cb-secondary mb-1.5 block">Start date</label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full px-3 py-2 bg-surface border border-cb-border rounded-lg text-sm text-cb-text focus:outline-none focus:border-cb-teal"
            />
          </div>

          {selected && (
            <div className="px-3 py-2 bg-cb-teal/10 border border-cb-teal/30 rounded-lg text-sm text-cb-teal">
              Assigning <strong>{programName}</strong> to <strong>{selectedClient?.name}</strong> starting {startDate}
            </div>
          )}
        </div>
        <div className="px-5 py-4 border-t border-cb-border flex gap-3">
          <button onClick={onClose} className="flex-1 py-2 border border-cb-border rounded-lg text-sm text-cb-secondary hover:bg-surface-light transition-colors">Cancel</button>
          <button
            onClick={handleAssign}
            disabled={!selected || loading}
            className="flex-1 py-2 bg-cb-teal hover:bg-cb-teal/90 disabled:opacity-50 text-white rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-1.5"
          >
            {loading ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Zap size={14} />}
            Assign Program
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── Duplicate Modal ──────────────────────────────────────────────────────────

function DuplicateModal({
  template,
  onClose,
  onDuplicate,
}: {
  template: ProgramTemplate
  onClose: () => void
  onDuplicate: (name: string) => Promise<void>
}) {
  const [name, setName] = useState(`Copy of ${template.name}`)
  const [loading, setLoading] = useState(false)

  const handleSubmit = async () => {
    if (!name.trim()) return
    setLoading(true)
    await onDuplicate(name.trim())
    setLoading(false)
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="w-full max-w-sm bg-surface rounded-2xl border border-cb-border shadow-2xl">
        <div className="px-5 py-4 border-b border-cb-border flex items-center justify-between">
          <h3 className="font-semibold text-cb-text">Duplicate Template</h3>
          <button onClick={onClose} className="p-1 rounded text-cb-muted hover:text-cb-text"><X size={16} /></button>
        </div>
        <div className="p-5 space-y-3">
          <p className="text-sm text-cb-secondary">A private copy will be added to your templates library.</p>
          <div>
            <label className="text-xs font-medium text-cb-secondary mb-1.5 block">New name</label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
              className="w-full px-3 py-2 bg-surface border border-cb-border rounded-lg text-sm text-cb-text focus:outline-none focus:border-cb-teal"
              autoFocus
            />
          </div>
        </div>
        <div className="px-5 py-4 border-t border-cb-border flex gap-3">
          <button onClick={onClose} className="flex-1 py-2 border border-cb-border rounded-lg text-sm text-cb-secondary hover:bg-surface-light">Cancel</button>
          <button
            onClick={handleSubmit}
            disabled={!name.trim() || loading}
            className="flex-1 py-2 bg-cb-teal hover:bg-cb-teal/90 disabled:opacity-50 text-white rounded-lg text-sm font-medium flex items-center justify-center gap-1.5"
          >
            {loading ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Copy size={14} />}
            Duplicate
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── Import Modal ─────────────────────────────────────────────────────────────

function ImportModal({
  onClose,
  onImport,
}: {
  onClose: () => void
  onImport: (json: string) => Promise<void>
}) {
  const [json, setJson] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = (ev) => setJson(ev.target?.result as string ?? '')
    reader.readAsText(file)
  }

  const handleSubmit = async () => {
    setError(null)
    let parsed: unknown
    try { parsed = JSON.parse(json) } catch { setError('Invalid JSON — please check the file format'); return }
    if (typeof parsed !== 'object' || parsed === null || !('name' in parsed)) {
      setError('Missing required field: name')
      return
    }
    setLoading(true)
    await onImport(json)
    setLoading(false)
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="w-full max-w-lg bg-surface rounded-2xl border border-cb-border shadow-2xl">
        <div className="px-5 py-4 border-b border-cb-border flex items-center justify-between">
          <h3 className="font-semibold text-cb-text">Import Template</h3>
          <button onClick={onClose} className="p-1 rounded text-cb-muted hover:text-cb-text"><X size={16} /></button>
        </div>
        <div className="p-5 space-y-4">
          <button
            onClick={() => fileRef.current?.click()}
            className="w-full border-2 border-dashed border-cb-border rounded-xl py-6 text-center text-sm text-cb-muted hover:border-cb-teal hover:text-cb-teal transition-colors"
          >
            <Upload size={20} className="mx-auto mb-2" />
            Click to upload .json file
          </button>
          <input ref={fileRef} type="file" accept=".json" className="hidden" onChange={handleFile} />
          <div>
            <label className="text-xs font-medium text-cb-secondary mb-1.5 block">Or paste JSON</label>
            <textarea
              value={json}
              onChange={(e) => setJson(e.target.value)}
              placeholder='{"name": "My Template", "structure": {...}}'
              rows={6}
              className="w-full px-3 py-2 bg-surface border border-cb-border rounded-lg text-xs font-mono text-cb-text focus:outline-none focus:border-cb-teal resize-none"
            />
          </div>
          {error && <p className="text-xs text-red-500 flex items-center gap-1.5"><AlertCircle size={12} />{error}</p>}
        </div>
        <div className="px-5 py-4 border-t border-cb-border flex gap-3">
          <button onClick={onClose} className="flex-1 py-2 border border-cb-border rounded-lg text-sm text-cb-secondary hover:bg-surface-light">Cancel</button>
          <button
            onClick={handleSubmit}
            disabled={!json.trim() || loading}
            className="flex-1 py-2 bg-cb-teal hover:bg-cb-teal/90 disabled:opacity-50 text-white rounded-lg text-sm font-medium flex items-center justify-center gap-1.5"
          >
            {loading ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Upload size={14} />}
            Import
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── Create Template Modal ────────────────────────────────────────────────────

function CreateTemplateModal({
  onClose,
  onCreate,
}: {
  onClose: () => void
  onCreate: (data: Partial<ProgramTemplate>) => Promise<void>
}) {
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [goal, setGoal] = useState('hypertrophy')
  const [difficulty, setDifficulty] = useState('intermediate')
  const [weeks, setWeeks] = useState(8)
  const [days, setDays] = useState(4)
  const [loading, setLoading] = useState(false)

  const handleSubmit = async () => {
    if (!name.trim()) return
    setLoading(true)
    await onCreate({ name: name.trim(), description: description || null, goal, difficulty, duration_weeks: weeks, days_per_week: days })
    setLoading(false)
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="w-full max-w-md bg-surface rounded-2xl border border-cb-border shadow-2xl">
        <div className="px-5 py-4 border-b border-cb-border flex items-center justify-between">
          <h3 className="font-semibold text-cb-text">New Template</h3>
          <button onClick={onClose} className="p-1 rounded text-cb-muted hover:text-cb-text"><X size={16} /></button>
        </div>
        <div className="p-5 space-y-4">
          <div>
            <label className="text-xs font-medium text-cb-secondary mb-1.5 block">Template name *</label>
            <input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. 12-Week Hypertrophy" className="w-full px-3 py-2 bg-surface border border-cb-border rounded-lg text-sm text-cb-text focus:outline-none focus:border-cb-teal" autoFocus />
          </div>
          <div>
            <label className="text-xs font-medium text-cb-secondary mb-1.5 block">Description</label>
            <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={3} placeholder="Brief overview of the program goals and structure…" className="w-full px-3 py-2 bg-surface border border-cb-border rounded-lg text-sm text-cb-text focus:outline-none focus:border-cb-teal resize-none" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium text-cb-secondary mb-1.5 block">Goal</label>
              <select value={goal} onChange={(e) => setGoal(e.target.value)} className="w-full px-3 py-2 bg-surface border border-cb-border rounded-lg text-sm text-cb-text focus:outline-none focus:border-cb-teal">
                {Object.entries(GOAL_CONFIG).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs font-medium text-cb-secondary mb-1.5 block">Difficulty</label>
              <select value={difficulty} onChange={(e) => setDifficulty(e.target.value)} className="w-full px-3 py-2 bg-surface border border-cb-border rounded-lg text-sm text-cb-text focus:outline-none focus:border-cb-teal">
                {Object.entries(DIFF_CONFIG).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
              </select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium text-cb-secondary mb-1.5 block">Duration (weeks)</label>
              <input type="number" value={weeks} onChange={(e) => setWeeks(Number(e.target.value))} min={1} max={52} className="w-full px-3 py-2 bg-surface border border-cb-border rounded-lg text-sm text-cb-text focus:outline-none focus:border-cb-teal" />
            </div>
            <div>
              <label className="text-xs font-medium text-cb-secondary mb-1.5 block">Days per week</label>
              <input type="number" value={days} onChange={(e) => setDays(Number(e.target.value))} min={1} max={7} className="w-full px-3 py-2 bg-surface border border-cb-border rounded-lg text-sm text-cb-text focus:outline-none focus:border-cb-teal" />
            </div>
          </div>
          <p className="text-xs text-cb-muted">Exercises are added from the Program Builder after creating the shell template.</p>
        </div>
        <div className="px-5 py-4 border-t border-cb-border flex gap-3">
          <button onClick={onClose} className="flex-1 py-2 border border-cb-border rounded-lg text-sm text-cb-secondary hover:bg-surface-light">Cancel</button>
          <button onClick={handleSubmit} disabled={!name.trim() || loading} className="flex-1 py-2 bg-cb-teal hover:bg-cb-teal/90 disabled:opacity-50 text-white rounded-lg text-sm font-medium flex items-center justify-center gap-1.5">
            {loading ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Plus size={14} />}
            Create Template
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── Template Card ────────────────────────────────────────────────────────────

function TemplateCard({
  template,
  isOwn,
  onPreview,
  onQuickAssign,
  onDuplicate,
  onDelete,
  onExport,
  onTogglePublic,
}: {
  template: ProgramTemplate
  isOwn: boolean
  onPreview: () => void
  onQuickAssign: () => void
  onDuplicate: () => void
  onDelete: () => void
  onExport: () => void
  onTogglePublic: () => void
}) {
  const [menuOpen, setMenuOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setMenuOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const goalCfg = GOAL_CONFIG[template.goal] ?? GOAL_CONFIG.general_fitness
  const diffCfg = DIFF_CONFIG[template.difficulty] ?? DIFF_CONFIG.intermediate
  const week1 = (template.structure.workouts ?? []).filter((w) => w.week_number === 1).sort((a, b) => a.day_number - b.day_number)

  return (
    <div className="bg-surface border border-cb-border rounded-2xl overflow-hidden hover:border-cb-teal/40 hover:shadow-sm transition-all group flex flex-col">
      {/* Card header */}
      <div className="px-4 pt-4 pb-3">
        <div className="flex items-start justify-between gap-2 mb-2">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="text-sm font-semibold text-cb-text leading-snug">{template.name}</h3>
              {template.is_public && (
                <span className="flex items-center gap-0.5 text-[10px] font-medium text-amber-500 bg-amber-500/10 px-1.5 py-0.5 rounded-full">
                  <Globe size={9} /> Published
                </span>
              )}
            </div>
            {template.author_name && (
              <p className="text-xs text-cb-muted mt-0.5">by {template.author_name}</p>
            )}
          </div>
          {/* 3-dot menu */}
          <div className="relative" ref={menuRef}>
            <button
              onClick={(e) => { e.stopPropagation(); setMenuOpen(!menuOpen) }}
              className="p-1.5 rounded-lg text-cb-muted hover:bg-surface-light opacity-0 group-hover:opacity-100 transition-opacity"
            >
              <MoreHorizontal size={14} />
            </button>
            {menuOpen && (
              <div className="absolute right-0 top-7 z-50 w-44 bg-surface border border-cb-border rounded-xl shadow-lg py-1 text-sm">
                <button onClick={() => { onExport(); setMenuOpen(false) }} className="w-full text-left px-3 py-2 hover:bg-surface-light text-cb-secondary flex items-center gap-2"><Download size={13} /> Export JSON</button>
                {isOwn && <>
                  <button onClick={() => { onTogglePublic(); setMenuOpen(false) }} className="w-full text-left px-3 py-2 hover:bg-surface-light text-cb-secondary flex items-center gap-2">
                    {template.is_public ? <><Lock size={13} /> Unpublish</> : <><Globe size={13} /> Publish to Library</>}
                  </button>
                  <div className="border-t border-cb-border my-1" />
                  <button onClick={() => { onDelete(); setMenuOpen(false) }} className="w-full text-left px-3 py-2 hover:bg-surface-light text-red-500 flex items-center gap-2"><Trash2 size={13} /> Delete</button>
                </>}
              </div>
            )}
          </div>
        </div>

        {/* Tags */}
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className={clsx('px-2 py-0.5 rounded-full text-[10px] font-medium', goalCfg.bg, goalCfg.color)}>{goalCfg.label}</span>
          <span className={clsx('text-[10px] font-medium', diffCfg.color)}>{diffCfg.label}</span>
          <span className="text-[10px] text-cb-muted">{template.duration_weeks}wk · {template.days_per_week}d/wk</span>
        </div>

        {/* Description */}
        {template.description && (
          <p className="mt-2 text-xs text-cb-secondary leading-relaxed line-clamp-2">{template.description}</p>
        )}
      </div>

      {/* Week 1 preview */}
      {week1.length > 0 && (
        <div className="mx-4 mb-3 p-3 bg-surface-light rounded-xl border border-cb-border/50">
          <p className="text-[10px] font-semibold text-cb-muted mb-2 uppercase tracking-wide">Week 1 preview</p>
          <div className="space-y-1.5">
            {week1.slice(0, 3).map((wo, i) => (
              <div key={i}>
                <p className="text-[10px] font-semibold text-cb-secondary">{wo.name}</p>
                <p className="text-[10px] text-cb-muted truncate">
                  {wo.exercises.slice(0, 3).map((e) => e.exercise.name).join(' · ')}
                  {wo.exercises.length > 3 ? ` +${wo.exercises.length - 3}` : ''}
                </p>
              </div>
            ))}
            {week1.length > 3 && (
              <p className="text-[10px] text-cb-muted">+{week1.length - 3} more sessions</p>
            )}
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="mt-auto px-4 pb-4 flex items-center gap-2">
        <button
          onClick={onPreview}
          className="flex items-center gap-1 px-2.5 py-1.5 border border-cb-border rounded-lg text-xs text-cb-secondary hover:bg-surface-light hover:text-cb-text transition-colors"
        >
          <Eye size={12} /> Preview
        </button>
        <button
          onClick={onDuplicate}
          className="flex items-center gap-1 px-2.5 py-1.5 border border-cb-border rounded-lg text-xs text-cb-secondary hover:bg-surface-light hover:text-cb-text transition-colors"
        >
          <Copy size={12} /> Duplicate
        </button>
        <button
          onClick={onQuickAssign}
          className="ml-auto flex items-center gap-1 px-3 py-1.5 bg-cb-teal/10 hover:bg-cb-teal/20 text-cb-teal rounded-lg text-xs font-medium transition-colors"
        >
          <Zap size={12} /> Quick Assign
        </button>
      </div>
    </div>
  )
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function ProgramTemplatesTab() {
  const isDemo = useIsDemo()

  const [templates, setTemplates] = useState<ProgramTemplate[]>([])
  const [loading, setLoading] = useState(true)
  const [toast, setToast] = useState<{ msg: string; ok?: boolean } | null>(null)

  // Filters
  const [search, setSearch] = useState('')
  const [filterGoal, setFilterGoal] = useState<string | null>(null)
  const [filterDiff, setFilterDiff] = useState<string | null>(null)
  const [filterDuration, setFilterDuration] = useState<string | null>(null) // 'short'|'medium'|'long'
  const [view, setView] = useState<'mine' | 'marketplace'>('mine')

  // Modals
  const [previewTpl, setPreviewTpl]     = useState<ProgramTemplate | null>(null)
  const [assignTpl, setAssignTpl]       = useState<ProgramTemplate | null>(null)
  const [duplicateTpl, setDuplicateTpl] = useState<ProgramTemplate | null>(null)
  const [showImport, setShowImport]     = useState(false)
  const [showCreate, setShowCreate]     = useState(false)

  const demoCoachId = 'demo-coach-id'

  // Demo clients
  const clients = useMemo<DemoClient[]>(() => {
    if (isDemo) {
      return (DEMO_CLIENTS as unknown as { id: string; name: string }[]).map((c) => ({ id: c.id, name: c.name }))
    }
    return []
  }, [isDemo])

  // Load templates
  useEffect(() => {
    if (isDemo) {
      setTemplates(buildDemoTemplates())
      setLoading(false)
      return
    }
    const params = new URLSearchParams()
    if (view === 'marketplace') params.set('is_public', 'true')
    fetch(`/api/program-templates?${params}`)
      .then((r) => r.json())
      .then((d) => { setTemplates(d.templates ?? []); setLoading(false) })
      .catch(() => setLoading(false))
  }, [isDemo, view])

  const showToast = (msg: string, ok = true) => {
    setToast({ msg, ok })
    setTimeout(() => setToast(null), 3000)
  }

  // Filtered list
  const filtered = useMemo(() => {
    return templates.filter((t) => {
      if (view === 'mine' && t.coach_id !== demoCoachId && isDemo) return false
      if (view === 'marketplace' && !t.is_public) return false
      if (search && !t.name.toLowerCase().includes(search.toLowerCase()) && !(t.description ?? '').toLowerCase().includes(search.toLowerCase())) return false
      if (filterGoal && t.goal !== filterGoal) return false
      if (filterDiff && t.difficulty !== filterDiff) return false
      if (filterDuration) {
        if (filterDuration === 'short' && t.duration_weeks > 6) return false
        if (filterDuration === 'medium' && (t.duration_weeks < 7 || t.duration_weeks > 12)) return false
        if (filterDuration === 'long' && t.duration_weeks < 13) return false
      }
      return true
    })
  }, [templates, view, search, filterGoal, filterDiff, filterDuration, isDemo])

  // ── Handlers ───────────────────────────────────────────────────

  const handleDuplicate = async (template: ProgramTemplate, name: string) => {
    if (isDemo) {
      const copy: ProgramTemplate = {
        ...template,
        id: `tpl-copy-${Date.now()}`,
        name,
        coach_id: demoCoachId,
        is_public: false,
        created_at: new Date().toISOString(),
        author_name: undefined,
      }
      setTemplates((prev) => [copy, ...prev])
      setDuplicateTpl(null)
      showToast(`"${name}" added to your templates`)
      return
    }
    const res = await fetch(`/api/program-templates/${template.id}/duplicate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name }),
    })
    if (res.ok) {
      const { template: t } = await res.json()
      setTemplates((prev) => [t, ...prev])
      setDuplicateTpl(null)
      showToast(`"${name}" added to your templates`)
    } else {
      showToast('Failed to duplicate', false)
    }
  }

  const handleQuickAssign = async (template: ProgramTemplate, clientId: string, startDate: string, programName: string) => {
    if (isDemo) {
      setAssignTpl(null)
      showToast(`Program assigned to ${clients.find((c) => c.id === clientId)?.name ?? 'client'} — starting ${startDate}`)
      return
    }
    const res = await fetch(`/api/program-templates/${template.id}/assign`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ clientId, startDate, programName }),
    })
    if (res.ok) {
      setAssignTpl(null)
      showToast(`Program assigned — starting ${startDate}`)
    } else {
      showToast('Failed to assign', false)
    }
  }

  const handleDelete = async (template: ProgramTemplate) => {
    if (!confirm(`Delete "${template.name}"? This cannot be undone.`)) return
    if (isDemo) {
      setTemplates((prev) => prev.filter((t) => t.id !== template.id))
      showToast(`"${template.name}" deleted`)
      return
    }
    await fetch(`/api/program-templates/${template.id}`, { method: 'DELETE' })
    setTemplates((prev) => prev.filter((t) => t.id !== template.id))
    showToast(`"${template.name}" deleted`)
  }

  const handleExport = async (template: ProgramTemplate) => {
    if (isDemo) {
      const payload = {
        _export_meta: { version: '1.0', exported_at: new Date().toISOString(), source: 'openclaw' },
        name: template.name, description: template.description,
        duration_weeks: template.duration_weeks, days_per_week: template.days_per_week,
        goal: template.goal, difficulty: template.difficulty, structure: template.structure,
      }
      const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' })
      const a = document.createElement('a')
      a.href = URL.createObjectURL(blob)
      a.download = `${template.name.replace(/[^a-z0-9]/gi, '_').toLowerCase()}_template.json`
      a.click()
      URL.revokeObjectURL(a.href)
      showToast('Template exported')
      return
    }
    window.open(`/api/program-templates/${template.id}/export`, '_blank')
  }

  const handleTogglePublic = async (template: ProgramTemplate) => {
    const next = !template.is_public
    if (isDemo) {
      setTemplates((prev) => prev.map((t) => t.id === template.id ? { ...t, is_public: next } : t))
      showToast(next ? 'Published to marketplace' : 'Unpublished from marketplace')
      return
    }
    await fetch(`/api/program-templates/${template.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ is_public: next }),
    })
    setTemplates((prev) => prev.map((t) => t.id === template.id ? { ...t, is_public: next } : t))
    showToast(next ? 'Published to marketplace' : 'Unpublished from marketplace')
  }

  const handleImport = async (json: string) => {
    if (isDemo) {
      try {
        const parsed = JSON.parse(json) as Partial<ProgramTemplate>
        const tpl: ProgramTemplate = {
          id: `tpl-import-${Date.now()}`,
          coach_id: demoCoachId,
          name: parsed.name ?? 'Imported Template',
          description: parsed.description ?? null,
          duration_weeks: parsed.duration_weeks ?? 8,
          days_per_week: parsed.days_per_week ?? 4,
          goal: parsed.goal ?? 'general_fitness',
          difficulty: parsed.difficulty ?? 'intermediate',
          is_public: false,
          structure: parsed.structure ?? { workouts: [] },
          created_at: new Date().toISOString(),
        }
        setTemplates((prev) => [tpl, ...prev])
        setShowImport(false)
        showToast('Template imported successfully')
      } catch {
        showToast('Import failed — invalid JSON', false)
      }
      return
    }
    const res = await fetch('/api/program-templates/import', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: json,
    })
    if (res.ok) {
      const { template } = await res.json()
      setTemplates((prev) => [template, ...prev])
      setShowImport(false)
      showToast('Template imported successfully')
    } else {
      showToast('Import failed', false)
    }
  }

  const handleCreate = async (data: Partial<ProgramTemplate>) => {
    if (isDemo) {
      const tpl: ProgramTemplate = {
        id: `tpl-new-${Date.now()}`,
        coach_id: demoCoachId,
        name: data.name ?? 'New Template',
        description: data.description ?? null,
        duration_weeks: data.duration_weeks ?? 8,
        days_per_week: data.days_per_week ?? 4,
        goal: data.goal ?? 'hypertrophy',
        difficulty: data.difficulty ?? 'intermediate',
        is_public: false,
        structure: { workouts: [] },
        created_at: new Date().toISOString(),
      }
      setTemplates((prev) => [tpl, ...prev])
      setShowCreate(false)
      showToast(`"${tpl.name}" created`)
      return
    }
    const res = await fetch('/api/program-templates', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    })
    if (res.ok) {
      const { template } = await res.json()
      setTemplates((prev) => [template, ...prev])
      setShowCreate(false)
      showToast(`"${template.name}" created`)
    } else {
      showToast('Failed to create template', false)
    }
  }

  // ── Render ────────────────────────────────────────────────────

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Top bar */}
      <div className="flex-shrink-0 px-5 py-3 border-b border-cb-border bg-surface space-y-2">
        {/* Row 1: search + view toggle + actions */}
        <div className="flex items-center gap-2 flex-wrap">
          <div className="relative flex-1 min-w-[180px] max-w-xs">
            <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-cb-muted" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search templates…"
              className="w-full pl-8 pr-3 py-1.5 bg-surface-light border border-cb-border rounded-lg text-sm text-cb-text placeholder:text-cb-muted focus:outline-none focus:border-cb-teal"
            />
            {search && <button onClick={() => setSearch('')} className="absolute right-2 top-1/2 -translate-y-1/2 text-cb-muted hover:text-cb-text"><X size={13} /></button>}
          </div>

          {/* View toggle: My Templates / Marketplace */}
          <div className="flex rounded-lg border border-cb-border overflow-hidden">
            {(['mine', 'marketplace'] as const).map((v) => (
              <button
                key={v}
                onClick={() => setView(v)}
                className={clsx(
                  'flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium transition-colors',
                  view === v ? 'bg-cb-teal text-white' : 'text-cb-secondary hover:bg-surface-light'
                )}
              >
                {v === 'mine' ? <><Dumbbell size={12} /> My Templates</> : <><Globe size={12} /> Marketplace</>}
              </button>
            ))}
          </div>

          <div className="ml-auto flex items-center gap-2">
            <button
              onClick={() => setShowImport(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 border border-cb-border rounded-lg text-xs font-medium text-cb-secondary hover:bg-surface-light transition-colors"
            >
              <Upload size={13} /> Import JSON
            </button>
            <button
              onClick={() => setShowCreate(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-cb-teal hover:bg-cb-teal/90 text-white rounded-lg text-xs font-medium transition-colors"
            >
              <Plus size={13} /> New Template
            </button>
          </div>
        </div>

        {/* Row 2: filter pills */}
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-xs text-cb-muted">Filter:</span>
          {/* Goal */}
          {Object.entries(GOAL_CONFIG).map(([k, v]) => (
            <button
              key={k}
              onClick={() => setFilterGoal(filterGoal === k ? null : k)}
              className={clsx(
                'px-2.5 py-1 rounded-full text-xs font-medium border transition-colors',
                filterGoal === k ? `${v.bg} ${v.color} border-transparent` : 'border-cb-border text-cb-muted hover:border-cb-teal/50'
              )}
            >
              {v.label}
            </button>
          ))}
          <div className="w-px h-4 bg-cb-border mx-1" />
          {/* Difficulty */}
          {Object.entries(DIFF_CONFIG).map(([k, v]) => (
            <button
              key={k}
              onClick={() => setFilterDiff(filterDiff === k ? null : k)}
              className={clsx(
                'px-2.5 py-1 rounded-full text-xs font-medium border transition-colors',
                filterDiff === k ? `bg-surface-light border-cb-teal/50 ${v.color}` : 'border-cb-border text-cb-muted hover:border-cb-teal/50'
              )}
            >
              {v.label}
            </button>
          ))}
          <div className="w-px h-4 bg-cb-border mx-1" />
          {/* Duration */}
          {[['short', '≤ 6 wks'], ['medium', '7–12 wks'], ['long', '13+ wks']].map(([k, label]) => (
            <button
              key={k}
              onClick={() => setFilterDuration(filterDuration === k ? null : k)}
              className={clsx(
                'px-2.5 py-1 rounded-full text-xs font-medium border transition-colors',
                filterDuration === k ? 'bg-surface-light border-cb-teal/50 text-cb-teal' : 'border-cb-border text-cb-muted hover:border-cb-teal/50'
              )}
            >
              {label}
            </button>
          ))}
          {(filterGoal || filterDiff || filterDuration) && (
            <button
              onClick={() => { setFilterGoal(null); setFilterDiff(null); setFilterDuration(null) }}
              className="flex items-center gap-1 text-xs text-cb-muted hover:text-cb-text ml-1"
            >
              <X size={11} /> Clear
            </button>
          )}
        </div>
      </div>

      {/* Grid */}
      <div className="flex-1 overflow-y-auto p-5">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="w-5 h-5 border-2 border-cb-teal border-t-transparent rounded-full animate-spin" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-cb-muted">
            <BookOpen size={32} className="mb-3 opacity-40" />
            <p className="text-base font-medium text-cb-text mb-1">
              {view === 'marketplace' ? 'No marketplace templates' : 'No templates yet'}
            </p>
            <p className="text-sm">
              {view === 'marketplace'
                ? 'Coaches publish templates here. Check back soon.'
                : 'Create your first template or import a JSON file.'}
            </p>
            {view === 'mine' && (
              <button
                onClick={() => setShowCreate(true)}
                className="mt-4 flex items-center gap-1.5 px-4 py-2 bg-cb-teal text-white rounded-lg text-sm font-medium"
              >
                <Plus size={14} /> New Template
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {filtered.map((t) => (
              <TemplateCard
                key={t.id}
                template={t}
                isOwn={t.coach_id === demoCoachId || (!isDemo && true)}
                onPreview={() => setPreviewTpl(t)}
                onQuickAssign={() => setAssignTpl(t)}
                onDuplicate={() => setDuplicateTpl(t)}
                onDelete={() => handleDelete(t)}
                onExport={() => handleExport(t)}
                onTogglePublic={() => handleTogglePublic(t)}
              />
            ))}
          </div>
        )}

        {/* Marketplace info banner */}
        {view === 'marketplace' && filtered.length > 0 && (
          <div className="mt-6 flex items-start gap-2.5 p-4 bg-surface-light border border-cb-border rounded-xl text-sm text-cb-secondary">
            <Star size={16} className="text-amber-500 shrink-0 mt-0.5" />
            <div>
              <p className="font-medium text-cb-text mb-0.5">Community Library</p>
              <p className="text-xs">Templates published by coaches in the OpenClaw network. Duplicate any template to add it to your library and customise it for your clients.</p>
            </div>
          </div>
        )}
      </div>

      {/* Modals */}
      {previewTpl && (
        <PreviewModal
          template={previewTpl}
          onClose={() => setPreviewTpl(null)}
          onQuickAssign={() => { setPreviewTpl(null); setAssignTpl(previewTpl) }}
          onDuplicate={() => { setPreviewTpl(null); setDuplicateTpl(previewTpl) }}
        />
      )}
      {assignTpl && (
        <QuickAssignModal
          template={assignTpl}
          clients={clients}
          onClose={() => setAssignTpl(null)}
          onAssign={(clientId, startDate, programName) => handleQuickAssign(assignTpl, clientId, startDate, programName)}
        />
      )}
      {duplicateTpl && (
        <DuplicateModal
          template={duplicateTpl}
          onClose={() => setDuplicateTpl(null)}
          onDuplicate={(name) => handleDuplicate(duplicateTpl, name)}
        />
      )}
      {showImport && (
        <ImportModal onClose={() => setShowImport(false)} onImport={handleImport} />
      )}
      {showCreate && (
        <CreateTemplateModal onClose={() => setShowCreate(false)} onCreate={handleCreate} />
      )}

      {/* Toast */}
      {toast && <Toast msg={toast.msg} ok={toast.ok} />}
    </div>
  )
}
