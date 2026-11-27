import Dexie, { type EntityTable } from 'dexie'
import type { Exercise, Workout, WorkoutExercise, WorkoutSet } from '../types'
import { SEED_EXERCISES } from './seedExercises'

export type LiftDatabase = Dexie & {
  exercises: EntityTable<Exercise, 'id'>
  workouts: EntityTable<Workout, 'id'>
  workoutExercises: EntityTable<WorkoutExercise, 'id'>
  sets: EntityTable<WorkoutSet, 'id'>
}

export const db = new Dexie('podhod') as LiftDatabase

db.version(1).stores({
  exercises: '++id, name, muscleGroup',
  workouts: '++id, status, date, cycleId',
  workoutExercises: '++id, workoutId, exerciseId',
  sets: '++id, workoutExerciseId',
})

db.on('populate', () => {
  void db.exercises.bulkAdd(SEED_EXERCISES)
})

export async function ensureSeedData(): Promise<void> {
  await db.open()
  const count = await db.exercises.count()
  if (count === 0) {
    await db.exercises.bulkAdd(SEED_EXERCISES)
  }
}
