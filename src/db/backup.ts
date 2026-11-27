import type { Exercise, MuscleGroup, Workout, WorkoutExercise, WorkoutSet, WorkoutStatus } from '../types'
import { MUSCLE_GROUP_LABELS } from '../types'
import { db } from './db'

export interface BackupPayload {
  app: 'podhod'
  version: 1
  exportedAt: string
  exercises: Exercise[]
  workouts: Workout[]
  workoutExercises: WorkoutExercise[]
  sets: WorkoutSet[]
}

const muscleGroups = Object.keys(MUSCLE_GROUP_LABELS) as MuscleGroup[]
const statuses: WorkoutStatus[] = ['planned', 'active', 'completed']

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null
}

function isNumber(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value)
}

function isOptionalNumber(value: unknown): boolean {
  return value === undefined || value === null || isNumber(value)
}

function isExercise(value: unknown): value is Exercise {
  if (!isRecord(value)) return false
  return (
    isNumber(value.id) &&
    typeof value.name === 'string' &&
    value.name.trim().length > 0 &&
    typeof value.muscleGroup === 'string' &&
    muscleGroups.includes(value.muscleGroup as MuscleGroup) &&
    typeof value.isCompound === 'boolean' &&
    isNumber(value.weightStep)
  )
}

function isWorkout(value: unknown): value is Workout {
  if (!isRecord(value)) return false
  return (
    isNumber(value.id) &&
    typeof value.name === 'string' &&
    typeof value.date === 'string' &&
    isNumber(value.durationSeconds) &&
    typeof value.status === 'string' &&
    statuses.includes(value.status as WorkoutStatus) &&
    isOptionalNumber(value.startedAt) &&
    isOptionalNumber(value.completedAt) &&
    (value.cycleId === undefined || typeof value.cycleId === 'string') &&
    isOptionalNumber(value.cycleOrder) &&
    isOptionalNumber(value.week) &&
    isOptionalNumber(value.day)
  )
}

function isWorkoutExercise(value: unknown): value is WorkoutExercise {
  if (!isRecord(value)) return false
  return (
    isNumber(value.id) &&
    isNumber(value.workoutId) &&
    isNumber(value.exerciseId) &&
    isNumber(value.order) &&
    isOptionalNumber(value.targetWeight) &&
    isOptionalNumber(value.targetReps) &&
    isOptionalNumber(value.targetRpe) &&
    (value.planLabel === undefined || value.planLabel === null || typeof value.planLabel === 'string')
  )
}

function isWorkoutSet(value: unknown): value is WorkoutSet {
  if (!isRecord(value)) return false
  return (
    isNumber(value.id) &&
    isNumber(value.workoutExerciseId) &&
    isNumber(value.setNumber) &&
    isNumber(value.weight) &&
    isNumber(value.reps) &&
    isOptionalNumber(value.rpe) &&
    typeof value.isCompleted === 'boolean'
  )
}

export async function createBackupPayload(): Promise<BackupPayload> {
  const [exercises, workouts, workoutExercises, sets] = await Promise.all([
    db.exercises.toArray(),
    db.workouts.toArray(),
    db.workoutExercises.toArray(),
    db.sets.toArray(),
  ])

  return {
    app: 'podhod',
    version: 1,
    exportedAt: new Date().toISOString(),
    exercises,
    workouts,
    workoutExercises,
    sets,
  }
}

export function parseBackupFile(text: string): BackupPayload {
  let parsed: unknown
  try {
    parsed = JSON.parse(text)
  } catch {
    throw new Error('Файл не похож на JSON-бэкап')
  }

  if (!isRecord(parsed)) throw new Error('Некорректная структура бэкапа')
  if (parsed.app !== 'podhod' || parsed.version !== 1) {
    throw new Error('Это не файл бэкапа «Подход»')
  }
  if (!Array.isArray(parsed.exercises) || !parsed.exercises.every(isExercise)) {
    throw new Error('В бэкапе повреждён справочник упражнений')
  }
  if (!Array.isArray(parsed.workouts) || !parsed.workouts.every(isWorkout)) {
    throw new Error('В бэкапе повреждены тренировки')
  }
  if (
    !Array.isArray(parsed.workoutExercises) ||
    !parsed.workoutExercises.every(isWorkoutExercise)
  ) {
    throw new Error('В бэкапе повреждены упражнения тренировок')
  }
  if (!Array.isArray(parsed.sets) || !parsed.sets.every(isWorkoutSet)) {
    throw new Error('В бэкапе повреждены подходы')
  }
  if (parsed.exercises.length === 0) {
    throw new Error('Бэкап пуст')
  }

  return {
    app: 'podhod',
    version: 1,
    exportedAt: typeof parsed.exportedAt === 'string' ? parsed.exportedAt : new Date().toISOString(),
    exercises: parsed.exercises as Exercise[],
    workouts: parsed.workouts as Workout[],
    workoutExercises: parsed.workoutExercises as WorkoutExercise[],
    sets: parsed.sets as WorkoutSet[],
  }
}

export async function restoreBackup(payload: BackupPayload): Promise<void> {
  await db.transaction(
    'rw',
    db.exercises,
    db.workouts,
    db.workoutExercises,
    db.sets,
    async () => {
      await Promise.all([
        db.sets.clear(),
        db.workoutExercises.clear(),
        db.workouts.clear(),
        db.exercises.clear(),
      ])
      await db.exercises.bulkAdd(payload.exercises)
      await db.workouts.bulkAdd(payload.workouts)
      await db.workoutExercises.bulkAdd(payload.workoutExercises)
      await db.sets.bulkAdd(payload.sets)
    },
  )
}

export async function downloadBackupFile(): Promise<void> {
  const payload = await createBackupPayload()
  const blob = new Blob([JSON.stringify(payload, null, 2)], {
    type: 'application/json',
  })
  const url = URL.createObjectURL(blob)
  const date = new Date().toISOString().slice(0, 10)
  const link = document.createElement('a')
  link.href = url
  link.download = `podhod-backup-${date}.json`
  document.body.appendChild(link)
  link.click()
  link.remove()
  window.setTimeout(() => URL.revokeObjectURL(url), 1000)
}
