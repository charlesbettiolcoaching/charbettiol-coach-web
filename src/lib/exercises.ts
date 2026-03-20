export type Exercise = {
  id: string
  name: string
  muscle_group: 'Chest' | 'Back' | 'Shoulders' | 'Biceps' | 'Triceps' | 'Legs' | 'Glutes' | 'Core' | 'Cardio' | 'Full Body'
  equipment: 'Barbell' | 'Dumbbell' | 'Cable' | 'Machine' | 'Bodyweight' | 'Kettlebell' | 'Resistance Band' | 'Cardio'
  movement_pattern: string
}

export const EXERCISES: Exercise[] = [
  // ── Chest ──
  { id: 'ex-001', name: 'Bench Press', muscle_group: 'Chest', equipment: 'Barbell', movement_pattern: 'Horizontal Push' },
  { id: 'ex-002', name: 'Incline Bench Press', muscle_group: 'Chest', equipment: 'Barbell', movement_pattern: 'Incline Push' },
  { id: 'ex-003', name: 'Decline Bench Press', muscle_group: 'Chest', equipment: 'Barbell', movement_pattern: 'Decline Push' },
  { id: 'ex-004', name: 'Dumbbell Bench Press', muscle_group: 'Chest', equipment: 'Dumbbell', movement_pattern: 'Horizontal Push' },
  { id: 'ex-005', name: 'Incline Dumbbell Press', muscle_group: 'Chest', equipment: 'Dumbbell', movement_pattern: 'Incline Push' },
  { id: 'ex-006', name: 'Dumbbell Flye', muscle_group: 'Chest', equipment: 'Dumbbell', movement_pattern: 'Horizontal Fly' },
  { id: 'ex-007', name: 'Cable Crossover', muscle_group: 'Chest', equipment: 'Cable', movement_pattern: 'Horizontal Fly' },
  { id: 'ex-008', name: 'Push Up', muscle_group: 'Chest', equipment: 'Bodyweight', movement_pattern: 'Horizontal Push' },
  { id: 'ex-009', name: 'Chest Dip', muscle_group: 'Chest', equipment: 'Bodyweight', movement_pattern: 'Decline Push' },

  // ── Back ──
  { id: 'ex-010', name: 'Barbell Row', muscle_group: 'Back', equipment: 'Barbell', movement_pattern: 'Horizontal Pull' },
  { id: 'ex-011', name: 'Deadlift', muscle_group: 'Back', equipment: 'Barbell', movement_pattern: 'Hip Hinge' },
  { id: 'ex-012', name: 'Pull Up', muscle_group: 'Back', equipment: 'Bodyweight', movement_pattern: 'Vertical Pull' },
  { id: 'ex-013', name: 'Chin Up', muscle_group: 'Back', equipment: 'Bodyweight', movement_pattern: 'Vertical Pull' },
  { id: 'ex-014', name: 'Lat Pulldown', muscle_group: 'Back', equipment: 'Cable', movement_pattern: 'Vertical Pull' },
  { id: 'ex-015', name: 'Seated Cable Row', muscle_group: 'Back', equipment: 'Cable', movement_pattern: 'Horizontal Pull' },
  { id: 'ex-016', name: 'Single Arm Dumbbell Row', muscle_group: 'Back', equipment: 'Dumbbell', movement_pattern: 'Horizontal Pull' },
  { id: 'ex-017', name: 'T-Bar Row', muscle_group: 'Back', equipment: 'Barbell', movement_pattern: 'Horizontal Pull' },
  { id: 'ex-018', name: 'Face Pull', muscle_group: 'Back', equipment: 'Cable', movement_pattern: 'Horizontal Pull' },

  // ── Shoulders ──
  { id: 'ex-019', name: 'Overhead Press', muscle_group: 'Shoulders', equipment: 'Barbell', movement_pattern: 'Vertical Push' },
  { id: 'ex-020', name: 'Dumbbell Shoulder Press', muscle_group: 'Shoulders', equipment: 'Dumbbell', movement_pattern: 'Vertical Push' },
  { id: 'ex-021', name: 'Arnold Press', muscle_group: 'Shoulders', equipment: 'Dumbbell', movement_pattern: 'Vertical Push' },
  { id: 'ex-022', name: 'Lateral Raise', muscle_group: 'Shoulders', equipment: 'Dumbbell', movement_pattern: 'Lateral Raise' },
  { id: 'ex-023', name: 'Cable Lateral Raise', muscle_group: 'Shoulders', equipment: 'Cable', movement_pattern: 'Lateral Raise' },
  { id: 'ex-024', name: 'Front Raise', muscle_group: 'Shoulders', equipment: 'Dumbbell', movement_pattern: 'Front Raise' },
  { id: 'ex-025', name: 'Rear Delt Flye', muscle_group: 'Shoulders', equipment: 'Dumbbell', movement_pattern: 'Rear Delt' },
  { id: 'ex-026', name: 'Upright Row', muscle_group: 'Shoulders', equipment: 'Barbell', movement_pattern: 'Vertical Pull' },

  // ── Biceps ──
  { id: 'ex-027', name: 'Barbell Curl', muscle_group: 'Biceps', equipment: 'Barbell', movement_pattern: 'Elbow Flexion' },
  { id: 'ex-028', name: 'Dumbbell Curl', muscle_group: 'Biceps', equipment: 'Dumbbell', movement_pattern: 'Elbow Flexion' },
  { id: 'ex-029', name: 'Hammer Curl', muscle_group: 'Biceps', equipment: 'Dumbbell', movement_pattern: 'Elbow Flexion' },
  { id: 'ex-030', name: 'Incline Dumbbell Curl', muscle_group: 'Biceps', equipment: 'Dumbbell', movement_pattern: 'Elbow Flexion' },
  { id: 'ex-031', name: 'Cable Curl', muscle_group: 'Biceps', equipment: 'Cable', movement_pattern: 'Elbow Flexion' },
  { id: 'ex-032', name: 'Preacher Curl', muscle_group: 'Biceps', equipment: 'Machine', movement_pattern: 'Elbow Flexion' },
  { id: 'ex-033', name: 'Concentration Curl', muscle_group: 'Biceps', equipment: 'Dumbbell', movement_pattern: 'Elbow Flexion' },

  // ── Triceps ──
  { id: 'ex-034', name: 'Tricep Pushdown', muscle_group: 'Triceps', equipment: 'Cable', movement_pattern: 'Elbow Extension' },
  { id: 'ex-035', name: 'Skull Crusher', muscle_group: 'Triceps', equipment: 'Barbell', movement_pattern: 'Elbow Extension' },
  { id: 'ex-036', name: 'Close Grip Bench Press', muscle_group: 'Triceps', equipment: 'Barbell', movement_pattern: 'Horizontal Push' },
  { id: 'ex-037', name: 'Overhead Tricep Extension', muscle_group: 'Triceps', equipment: 'Dumbbell', movement_pattern: 'Elbow Extension' },
  { id: 'ex-038', name: 'Tricep Dip', muscle_group: 'Triceps', equipment: 'Bodyweight', movement_pattern: 'Elbow Extension' },
  { id: 'ex-039', name: 'Diamond Push Up', muscle_group: 'Triceps', equipment: 'Bodyweight', movement_pattern: 'Elbow Extension' },
  { id: 'ex-040', name: 'Cable Overhead Extension', muscle_group: 'Triceps', equipment: 'Cable', movement_pattern: 'Elbow Extension' },

  // ── Legs ──
  { id: 'ex-041', name: 'Squat', muscle_group: 'Legs', equipment: 'Barbell', movement_pattern: 'Knee Dominant' },
  { id: 'ex-042', name: 'Front Squat', muscle_group: 'Legs', equipment: 'Barbell', movement_pattern: 'Knee Dominant' },
  { id: 'ex-043', name: 'Leg Press', muscle_group: 'Legs', equipment: 'Machine', movement_pattern: 'Knee Dominant' },
  { id: 'ex-044', name: 'Bulgarian Split Squat', muscle_group: 'Legs', equipment: 'Dumbbell', movement_pattern: 'Knee Dominant' },
  { id: 'ex-045', name: 'Walking Lunges', muscle_group: 'Legs', equipment: 'Dumbbell', movement_pattern: 'Knee Dominant' },
  { id: 'ex-046', name: 'Leg Extension', muscle_group: 'Legs', equipment: 'Machine', movement_pattern: 'Knee Extension' },
  { id: 'ex-047', name: 'Leg Curl', muscle_group: 'Legs', equipment: 'Machine', movement_pattern: 'Knee Flexion' },
  { id: 'ex-048', name: 'Romanian Deadlift', muscle_group: 'Legs', equipment: 'Barbell', movement_pattern: 'Hip Hinge' },
  { id: 'ex-049', name: 'Calf Raise', muscle_group: 'Legs', equipment: 'Machine', movement_pattern: 'Plantar Flexion' },
  { id: 'ex-050', name: 'Goblet Squat', muscle_group: 'Legs', equipment: 'Kettlebell', movement_pattern: 'Knee Dominant' },

  // ── Glutes ──
  { id: 'ex-051', name: 'Hip Thrust', muscle_group: 'Glutes', equipment: 'Barbell', movement_pattern: 'Hip Extension' },
  { id: 'ex-052', name: 'Glute Bridge', muscle_group: 'Glutes', equipment: 'Bodyweight', movement_pattern: 'Hip Extension' },
  { id: 'ex-053', name: 'Cable Kickback', muscle_group: 'Glutes', equipment: 'Cable', movement_pattern: 'Hip Extension' },
  { id: 'ex-054', name: 'Sumo Deadlift', muscle_group: 'Glutes', equipment: 'Barbell', movement_pattern: 'Hip Hinge' },
  { id: 'ex-055', name: 'Step Up', muscle_group: 'Glutes', equipment: 'Dumbbell', movement_pattern: 'Knee Dominant' },
  { id: 'ex-056', name: 'Resistance Band Clamshell', muscle_group: 'Glutes', equipment: 'Resistance Band', movement_pattern: 'Hip Abduction' },
  { id: 'ex-057', name: 'Lateral Band Walk', muscle_group: 'Glutes', equipment: 'Resistance Band', movement_pattern: 'Hip Abduction' },
  { id: 'ex-058', name: 'Abductor Machine', muscle_group: 'Glutes', equipment: 'Machine', movement_pattern: 'Hip Abduction' },

  // ── Core ──
  { id: 'ex-059', name: 'Plank', muscle_group: 'Core', equipment: 'Bodyweight', movement_pattern: 'Anti-Extension' },
  { id: 'ex-060', name: 'Ab Crunch', muscle_group: 'Core', equipment: 'Bodyweight', movement_pattern: 'Spinal Flexion' },
  { id: 'ex-061', name: 'Hanging Leg Raise', muscle_group: 'Core', equipment: 'Bodyweight', movement_pattern: 'Hip Flexion' },
  { id: 'ex-062', name: 'Cable Crunch', muscle_group: 'Core', equipment: 'Cable', movement_pattern: 'Spinal Flexion' },
  { id: 'ex-063', name: 'Russian Twist', muscle_group: 'Core', equipment: 'Dumbbell', movement_pattern: 'Rotation' },
  { id: 'ex-064', name: 'Dead Bug', muscle_group: 'Core', equipment: 'Bodyweight', movement_pattern: 'Anti-Extension' },
  { id: 'ex-065', name: 'Pallof Press', muscle_group: 'Core', equipment: 'Cable', movement_pattern: 'Anti-Rotation' },
  { id: 'ex-066', name: 'Side Plank', muscle_group: 'Core', equipment: 'Bodyweight', movement_pattern: 'Anti-Lateral Flexion' },

  // ── Cardio ──
  { id: 'ex-067', name: 'Treadmill Run', muscle_group: 'Cardio', equipment: 'Cardio', movement_pattern: 'Locomotion' },
  { id: 'ex-068', name: 'Stationary Bike', muscle_group: 'Cardio', equipment: 'Cardio', movement_pattern: 'Cyclical' },
  { id: 'ex-069', name: 'Rowing Machine', muscle_group: 'Cardio', equipment: 'Cardio', movement_pattern: 'Pull' },
  { id: 'ex-070', name: 'Stairmaster', muscle_group: 'Cardio', equipment: 'Cardio', movement_pattern: 'Locomotion' },
  { id: 'ex-071', name: 'Battle Ropes', muscle_group: 'Cardio', equipment: 'Bodyweight', movement_pattern: 'Cyclical' },
  { id: 'ex-072', name: 'Jump Rope', muscle_group: 'Cardio', equipment: 'Bodyweight', movement_pattern: 'Cyclical' },

  // ── Full Body ──
  { id: 'ex-073', name: 'Kettlebell Swing', muscle_group: 'Full Body', equipment: 'Kettlebell', movement_pattern: 'Hip Hinge' },
  { id: 'ex-074', name: 'Clean and Press', muscle_group: 'Full Body', equipment: 'Barbell', movement_pattern: 'Olympic Lift' },
  { id: 'ex-075', name: 'Burpee', muscle_group: 'Full Body', equipment: 'Bodyweight', movement_pattern: 'Locomotion' },
  { id: 'ex-076', name: 'Thruster', muscle_group: 'Full Body', equipment: 'Barbell', movement_pattern: 'Knee Dominant + Vertical Push' },
  { id: 'ex-077', name: 'Farmer Carry', muscle_group: 'Full Body', equipment: 'Dumbbell', movement_pattern: 'Carry' },
  { id: 'ex-078', name: 'Sled Push', muscle_group: 'Full Body', equipment: 'Machine', movement_pattern: 'Locomotion' },
  { id: 'ex-079', name: 'Turkish Get Up', muscle_group: 'Full Body', equipment: 'Kettlebell', movement_pattern: 'Multi-Plane' },
  { id: 'ex-080', name: 'Box Jump', muscle_group: 'Full Body', equipment: 'Bodyweight', movement_pattern: 'Plyometric' },
]
