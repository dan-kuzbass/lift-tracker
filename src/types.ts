export type MuscleGroup = 'legs' | 'chest' | 'back' | 'shoulders' | 'arms'

export const MUSCLE_GROUP_LABELS: Record<MuscleGroup, string> = {
  legs: 'Ноги',
  chest: 'Грудь',
  back: 'Спина',
  shoulders: 'Плечи',
  arms: 'Руки',
}

export const MUSCLE_GROUP_OPTIONS: Array<{ value: MuscleGroup; label: string }> = [
  { value: 'legs', label: 'Ноги' },
  { value: 'chest', label: 'Грудь' },
  { value: 'back', label: 'Спина' },
  { value: 'shoulders', label: 'Плечи' },
  { value: 'arms', label: 'Руки' },
]

export const RPE_OPTIONS = [6, 7, 7.5, 8, 8.5, 9, 9.5, 10] as const

export interface Exercise {
  id?: number
  name: string
  muscleGroup: MuscleGroup
  isCompound: boolean
  weightStep: number
}

export type WorkoutStatus = 'planned' | 'active' | 'completed'

export interface Workout {
  id?: number
  name: string
  date: string
  durationSeconds: number
  status: WorkoutStatus
  startedAt?: number
  completedAt?: number
  cycleId?: string
  cycleOrder?: number
  week?: number
  day?: number
}

export interface WorkoutExercise {
  id?: number
  workoutId: number
  exerciseId: number
  order: number
  targetWeight?: number | null
  targetReps?: number | null
  targetRpe?: number | null
  planLabel?: string | null
}

export interface WorkoutSet {
  id?: number
  workoutExerciseId: number
  setNumber: number
  weight: number
  reps: number
  rpe?: number | null
  isCompleted: boolean
}
