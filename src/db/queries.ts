import { bestE1RM } from '../lib/progression'
import type { Exercise, Workout, WorkoutExercise, WorkoutSet } from '../types'
import { db } from './db'

export interface ExerciseSession {
  workout: Workout
  workoutExercise: WorkoutExercise
  sets: WorkoutSet[]
}

export interface WorkoutSummary {
  workout: Workout
  tonnage: number
  completedSets: number
  exerciseCount: number
}

export interface WorkoutExerciseDetails {
  workoutExercise: WorkoutExercise
  exercise: Exercise
  sets: WorkoutSet[]
}

export interface WorkoutDetails {
  workout: Workout
  exercises: WorkoutExerciseDetails[]
  tonnage: number
  completedSets: number
  totalSets: number
  bestE1RM: number
}

export interface ActiveCycleInfo {
  cycleId: string
  plannedCount: number
  completedCount: number
  total: number
  nextWorkout: Workout | null
  nextSets: WorkoutSet[]
  nextPlanLabel: string | null
}

function workoutTimestamp(workout: Workout): number {
  if (typeof workout.completedAt === 'number') return workout.completedAt
  const parsed = Date.parse(workout.date)
  return Number.isFinite(parsed) ? parsed : 0
}

export async function getLastExerciseSession(
  exerciseId: number,
  excludeWorkoutId?: number,
): Promise<ExerciseSession | null> {
  const links = await db.workoutExercises.where('exerciseId').equals(exerciseId).toArray()
  if (links.length === 0) return null

  const workoutIds = [...new Set(links.map((link) => link.workoutId))]
  const loadedWorkouts = await db.workouts.bulkGet(workoutIds)
  const completedWorkouts = loadedWorkouts
    .filter(
      (workout): workout is Workout =>
        !!workout && workout.status === 'completed' && workout.id !== excludeWorkoutId,
    )
    .sort((a, b) => workoutTimestamp(b) - workoutTimestamp(a))

  for (const workout of completedWorkouts) {
    const candidates = links.filter((link) => link.workoutId === workout.id)
    for (const link of candidates) {
      if (link.id === undefined) continue
      const sets = await db.sets
        .where('workoutExerciseId')
        .equals(link.id)
        .sortBy('setNumber')
      const completedSets = sets.filter(
        (set) => set.isCompleted && set.weight > 0 && set.reps > 0,
      )
      if (completedSets.length > 0) {
        return { workout, workoutExercise: link, sets: completedSets }
      }
    }
  }

  return null
}

export async function getRecentWorkoutSummaries(limit = 5): Promise<WorkoutSummary[]> {
  const completed = (
    await db.workouts.where('status').equals('completed').toArray()
  )
    .sort((a, b) => workoutTimestamp(b) - workoutTimestamp(a))
    .slice(0, limit)

  if (completed.length === 0) return []

  const workoutIds = completed
    .map((workout) => workout.id)
    .filter((id): id is number => typeof id === 'number')
  if (workoutIds.length === 0) return []

  const links = await db.workoutExercises.where('workoutId').anyOf(workoutIds).toArray()
  const linkIds = links
    .map((link) => link.id)
    .filter((id): id is number => typeof id === 'number')

  const sets =
    linkIds.length > 0
      ? await db.sets.where('workoutExerciseId').anyOf(linkIds).toArray()
      : []

  return completed.map((workout) => {
    const workoutLinks = links.filter((link) => link.workoutId === workout.id)
    const linkIdSet = new Set(
      workoutLinks.map((link) => link.id).filter((id): id is number => id !== undefined),
    )
    const workoutSets = sets.filter(
      (set) => linkIdSet.has(set.workoutExerciseId) && set.isCompleted,
    )
    return {
      workout,
      tonnage: workoutSets.reduce((sum, set) => sum + set.weight * set.reps, 0),
      completedSets: workoutSets.length,
      exerciseCount: new Set(workoutLinks.map((link) => link.exerciseId)).size,
    }
  })
}

export async function getWorkoutDetails(workoutId: number): Promise<WorkoutDetails | null> {
  const workout = await db.workouts.get(workoutId)
  if (!workout) return null

  const links = await db.workoutExercises.where('workoutId').equals(workoutId).toArray()
  links.sort((a, b) => a.order - b.order)

  const exerciseIds = [...new Set(links.map((link) => link.exerciseId))]
  const exerciseRows = await db.exercises.bulkGet(exerciseIds)
  const exerciseMap = new Map<number, Exercise>()
  for (const exercise of exerciseRows) {
    if (exercise?.id !== undefined) exerciseMap.set(exercise.id, exercise)
  }

  const linkIds = links
    .map((link) => link.id)
    .filter((id): id is number => typeof id === 'number')
  const allSets =
    linkIds.length > 0
      ? await db.sets.where('workoutExerciseId').anyOf(linkIds).toArray()
      : []

  const exercises: WorkoutExerciseDetails[] = []
  for (const link of links) {
    const exercise = exerciseMap.get(link.exerciseId)
    if (!exercise) continue
    const sets = allSets
      .filter((set) => set.workoutExerciseId === link.id)
      .sort((a, b) => a.setNumber - b.setNumber)
    exercises.push({ workoutExercise: link, exercise, sets })
  }

  const completedSets = allSets.filter((set) => set.isCompleted)

  return {
    workout,
    exercises,
    tonnage: completedSets.reduce((sum, set) => sum + set.weight * set.reps, 0),
    completedSets: completedSets.length,
    totalSets: allSets.length,
    bestE1RM: bestE1RM(completedSets),
  }
}

export async function getActiveCycleInfo(): Promise<ActiveCycleInfo | null> {
  const planned = (await db.workouts.where('status').equals('planned').toArray()).filter(
    (workout) => typeof workout.cycleId === 'string' && workout.cycleId.length > 0,
  )
  if (planned.length === 0) return null

  planned.sort((a, b) => (a.cycleOrder ?? 0) - (b.cycleOrder ?? 0))
  const cycleId = planned[0].cycleId
  if (!cycleId) return null

  const allCycleWorkouts = await db.workouts.where('cycleId').equals(cycleId).toArray()
  const plannedForCycle = allCycleWorkouts
    .filter((workout) => workout.status === 'planned')
    .sort((a, b) => (a.cycleOrder ?? 0) - (b.cycleOrder ?? 0))
  const nextWorkout = plannedForCycle[0] ?? null

  let nextSets: WorkoutSet[] = []
  let nextPlanLabel: string | null = null

  if (nextWorkout?.id !== undefined) {
    const links = await db.workoutExercises
      .where('workoutId')
      .equals(nextWorkout.id)
      .toArray()
    links.sort((a, b) => a.order - b.order)
    const firstLink = links[0]
    if (firstLink) {
      nextPlanLabel = firstLink.planLabel ?? null
      if (firstLink.id !== undefined) {
        nextSets = await db.sets
          .where('workoutExerciseId')
          .equals(firstLink.id)
          .sortBy('setNumber')
      }
    }
  }

  return {
    cycleId,
    plannedCount: plannedForCycle.length,
    completedCount: allCycleWorkouts.filter((workout) => workout.status === 'completed').length,
    total: allCycleWorkouts.length,
    nextWorkout,
    nextSets,
    nextPlanLabel,
  }
}
