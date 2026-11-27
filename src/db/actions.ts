import type { CycleInput } from '../lib/cycle'
import { buildPowerliftingCycle, CYCLE_WORKOUTS_COUNT } from '../lib/cycle'
import { computeRecommendation } from '../lib/progression'
import type { Exercise, MuscleGroup, Workout, WorkoutSet } from '../types'
import { db } from './db'
import { getLastExerciseSession } from './queries'
import { defaultWeightStep, SEED_EXERCISES } from './seedExercises'

const DEFAULT_SET_COUNT = 3
const DEFAULT_TARGET_REPS = 5
const DEFAULT_RPE = 8

function nowIso(): string {
  return new Date().toISOString()
}

function makeId(): string {
  try {
    return crypto.randomUUID()
  } catch {
    return `cycle-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`
  }
}

function requireId(id: number | undefined, label: string): number {
  if (typeof id !== 'number') throw new Error(`Не удалось сохранить ${label}`)
  return id
}

async function getActiveWorkout(): Promise<Workout | undefined> {
  return db.workouts.where('status').equals('active').first()
}

async function ensureExerciseByName(
  name: string,
  muscleGroup: MuscleGroup,
  isCompound: boolean,
): Promise<Exercise> {
  const existing = await db.exercises.where('name').equals(name).first()
  if (existing) return existing

  const data: Exercise = {
    name,
    muscleGroup,
    isCompound,
    weightStep: defaultWeightStep(muscleGroup),
  }
  const id = await db.exercises.add(data)
  return { ...data, id }
}

export async function addExerciseToWorkout(
  workoutId: number,
  exercise: Exercise,
  order?: number,
): Promise<number> {
  if (exercise.id === undefined) throw new Error('Упражнение не найдено')

  const workout = await db.workouts.get(workoutId)
  if (!workout) throw new Error('Тренировка не найдена')
  if (workout.status !== 'active') throw new Error('Тренировка уже завершена')

  const session = await getLastExerciseSession(exercise.id, workoutId)
  const recommendation = session
    ? computeRecommendation(
        session.sets,
        exercise.weightStep,
        session.workoutExercise.targetReps,
      )
    : null

  const targetWeight = recommendation?.weight ?? null
  const targetReps = recommendation?.reps ?? DEFAULT_TARGET_REPS

  const existing = await db.workoutExercises
    .where('workoutId')
    .equals(workoutId)
    .toArray()
  const nextOrder =
    order ??
    existing.reduce((maximum, item) => Math.max(maximum, item.order), -1) + 1

  const workoutExerciseId = requireId(
    await db.workoutExercises.add({
      workoutId,
      exerciseId: exercise.id,
      order: nextOrder,
      targetWeight,
      targetReps,
      targetRpe: DEFAULT_RPE,
      planLabel: null,
    }),
    'упражнение',
  )

  const weight = targetWeight ?? 0
  for (let index = 1; index <= DEFAULT_SET_COUNT; index += 1) {
    await db.sets.add({
      workoutExerciseId,
      setNumber: index,
      weight,
      reps: targetReps,
      rpe: DEFAULT_RPE,
      isCompleted: false,
    })
  }

  return workoutExerciseId
}

export async function startEmptyWorkout(): Promise<number> {
  const active = await getActiveWorkout()
  if (active?.id !== undefined) return active.id

  const id = await db.workouts.add({
    name: 'Свободная тренировка',
    date: nowIso(),
    durationSeconds: 0,
    status: 'active',
    startedAt: Date.now(),
  })
  return requireId(id, 'тренировку')
}

export async function startBaseTemplateWorkout(): Promise<number> {
  const active = await getActiveWorkout()
  if (active?.id !== undefined) return active.id

  return db.transaction(
    'rw',
    db.exercises,
    db.workouts,
    db.workoutExercises,
    db.sets,
    async () => {
      const id = requireId(
        await db.workouts.add({
          name: 'База: Присед + Жим',
          date: nowIso(),
          durationSeconds: 0,
          status: 'active',
          startedAt: Date.now(),
        }),
        'тренировку',
      )

      const squat = await ensureExerciseByName('Присед со штангой', 'legs', true)
      const bench = await ensureExerciseByName('Жим штанги лёжа', 'chest', true)

      await addExerciseToWorkout(id, squat, 0)
      await addExerciseToWorkout(id, bench, 1)

      return id
    },
  )
}

export async function startPlannedWorkout(workoutId: number): Promise<number> {
  const active = await getActiveWorkout()
  if (active?.id !== undefined) return active.id

  const workout = await db.workouts.get(workoutId)
  if (!workout) throw new Error('Тренировка не найдена')
  if (workout.status !== 'planned') throw new Error('Тренировка уже начата или завершена')

  await db.workouts.update(workoutId, {
    status: 'active',
    startedAt: Date.now(),
    date: nowIso(),
  })

  return workoutId
}

export async function updateSet(
  setId: number,
  patch: Partial<Pick<WorkoutSet, 'weight' | 'reps' | 'rpe' | 'isCompleted'>>,
): Promise<void> {
  await db.sets.update(setId, patch)
}

export async function addSet(workoutExerciseId: number): Promise<void> {
  const workoutExercise = await db.workoutExercises.get(workoutExerciseId)
  if (!workoutExercise) throw new Error('Упражнение не найдено')

  const sets = await db.sets
    .where('workoutExerciseId')
    .equals(workoutExerciseId)
    .sortBy('setNumber')
  const lastSet = sets[sets.length - 1]

  const weight =
    lastSet && lastSet.weight > 0 ? lastSet.weight : (workoutExercise.targetWeight ?? 0)
  const reps =
    lastSet && lastSet.reps > 0 ? lastSet.reps : (workoutExercise.targetReps ?? DEFAULT_TARGET_REPS)
  const rpe = lastSet?.rpe ?? workoutExercise.targetRpe ?? DEFAULT_RPE

  await db.sets.add({
    workoutExerciseId,
    setNumber: (lastSet?.setNumber ?? 0) + 1,
    weight,
    reps,
    rpe,
    isCompleted: false,
  })
}

export async function deleteWorkoutExercise(workoutExerciseId: number): Promise<void> {
  await db.transaction('rw', db.workoutExercises, db.sets, async () => {
    await db.sets.where('workoutExerciseId').equals(workoutExerciseId).delete()
    await db.workoutExercises.delete(workoutExerciseId)
  })
}

export async function replaceWorkoutExercise(
  workoutExerciseId: number,
  exercise: Exercise,
): Promise<void> {
  if (exercise.id === undefined) throw new Error('Упражнение не найдено')

  const workoutExercise = await db.workoutExercises.get(workoutExerciseId)
  if (!workoutExercise) throw new Error('Упражнение не найдено')

  const session = await getLastExerciseSession(exercise.id, workoutExercise.workoutId)
  const recommendation = session
    ? computeRecommendation(
        session.sets,
        exercise.weightStep,
        session.workoutExercise.targetReps,
      )
    : null

  const targetWeight = recommendation?.weight ?? null
  const targetReps = recommendation?.reps ?? DEFAULT_TARGET_REPS

  await db.transaction('rw', db.workoutExercises, db.sets, async () => {
    await db.sets.where('workoutExerciseId').equals(workoutExerciseId).delete()
    await db.workoutExercises.update(workoutExerciseId, {
      exerciseId: exercise.id,
      targetWeight,
      targetReps,
      targetRpe: DEFAULT_RPE,
      planLabel: null,
    })

    for (let index = 1; index <= DEFAULT_SET_COUNT; index += 1) {
      await db.sets.add({
        workoutExerciseId,
        setNumber: index,
        weight: targetWeight ?? 0,
        reps: targetReps,
        rpe: DEFAULT_RPE,
        isCompleted: false,
      })
    }
  })
}

export async function finishWorkout(workoutId: number): Promise<number> {
  const workout = await db.workouts.get(workoutId)
  if (!workout) throw new Error('Тренировка не найдена')

  if (workout.status === 'completed') return workout.durationSeconds

  const finishedAt = Date.now()
  const parsedDate = Date.parse(workout.date)
  const startedAt =
    workout.startedAt ?? (Number.isFinite(parsedDate) ? parsedDate : finishedAt)
  const durationSeconds = Math.max(0, Math.round((finishedAt - startedAt) / 1000))

  await db.workouts.update(workoutId, {
    status: 'completed',
    completedAt: finishedAt,
    durationSeconds,
    date: new Date(finishedAt).toISOString(),
  })

  return durationSeconds
}

export async function createPowerliftingCycle(input: CycleInput): Promise<string> {
  const values = [input.squat1RM, input.bench1RM, input.deadlift1RM]
  if (values.some((value) => !Number.isFinite(value) || value <= 0)) {
    throw new Error('Укажите корректные значения 1ПМ')
  }

  const planned = await db.workouts.where('status').equals('planned').toArray()
  if (planned.some((workout) => workout.cycleId)) {
    throw new Error('У вас уже есть активный цикл')
  }

  const cyclePlans = buildPowerliftingCycle(input)
  if (cyclePlans.length !== CYCLE_WORKOUTS_COUNT) {
    throw new Error('Не удалось построить цикл')
  }

  const cycleId = makeId()
  const createdAt = nowIso()

  await db.transaction(
    'rw',
    db.exercises,
    db.workouts,
    db.workoutExercises,
    db.sets,
    async () => {
      for (const plan of cyclePlans) {
        const muscleGroup: MuscleGroup =
          plan.lift === 'squat' ? 'legs' : plan.lift === 'bench' ? 'chest' : 'back'
        const exercise = await ensureExerciseByName(plan.exerciseName, muscleGroup, true)

        const workoutId = requireId(
          await db.workouts.add({
            name: plan.name,
            date: createdAt,
            durationSeconds: 0,
            status: 'planned',
            cycleId,
            cycleOrder: plan.cycleOrder,
            week: plan.week,
            day: plan.day,
          }),
          'тренировку цикла',
        )

        const workoutExerciseId = requireId(
          await db.workoutExercises.add({
            workoutId,
            exerciseId: requireId(exercise.id, 'упражнение'),
            order: 0,
            targetWeight: plan.weight,
            targetReps: plan.reps,
            targetRpe: DEFAULT_RPE,
            planLabel: plan.planLabel,
          }),
          'упражнение цикла',
        )

        for (let index = 1; index <= plan.sets; index += 1) {
          await db.sets.add({
            workoutExerciseId,
            setNumber: index,
            weight: plan.weight,
            reps: plan.reps,
            rpe: DEFAULT_RPE,
            isCompleted: false,
          })
        }
      }
    },
  )

  return cycleId
}

export async function deleteCycle(cycleId: string): Promise<void> {
  await db.transaction(
    'rw',
    db.workouts,
    db.workoutExercises,
    db.sets,
    async () => {
      const workouts = await db.workouts.where('cycleId').equals(cycleId).toArray()
      const plannedWorkouts = workouts.filter((workout) => workout.status === 'planned')
      const workoutIds = plannedWorkouts
        .map((workout) => workout.id)
        .filter((id): id is number => typeof id === 'number')
      if (workoutIds.length === 0) return

      const links = await db.workoutExercises
        .where('workoutId')
        .anyOf(workoutIds)
        .toArray()
      const linkIds = links
        .map((link) => link.id)
        .filter((id): id is number => typeof id === 'number')

      if (linkIds.length > 0) {
        await db.sets.where('workoutExerciseId').anyOf(linkIds).delete()
      }
      await db.workoutExercises.where('workoutId').anyOf(workoutIds).delete()
      await db.workouts.where('id').anyOf(workoutIds).delete()
    },
  )
}

export async function resetAllData(): Promise<void> {
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
      await db.exercises.bulkAdd(SEED_EXERCISES)
    },
  )
}
