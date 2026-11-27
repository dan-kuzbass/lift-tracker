import { roundToIncrement } from './math'

export type CycleLiftKey = 'squat' | 'bench' | 'deadlift'

export interface CycleInput {
  squat1RM: number
  bench1RM: number
  deadlift1RM: number
}

export interface CycleWorkoutPlan {
  cycleOrder: number
  week: number
  day: number
  weekLabel: string
  lift: CycleLiftKey
  exerciseName: string
  liftName: string
  percent: number
  sets: number
  reps: number
  weight: number
  name: string
  planLabel: string
}

export const CYCLE_WEEK_LABELS: Record<number, string> = {
  1: 'Втягивающая',
  2: 'Объёмная',
  3: 'Силовая',
  4: 'Пик',
}

export const CYCLE_WEEKS_COUNT = 4
export const CYCLE_WORKOUTS_COUNT = 12

const LIFTS: Array<{
  key: CycleLiftKey
  exerciseName: string
  liftName: string
  shortName: string
}> = [
  {
    key: 'squat',
    exerciseName: 'Присед со штангой',
    liftName: 'Присед',
    shortName: 'Присед',
  },
  {
    key: 'bench',
    exerciseName: 'Жим штанги лёжа',
    liftName: 'Жим',
    shortName: 'Жим',
  },
  {
    key: 'deadlift',
    exerciseName: 'Становая тяга',
    liftName: 'Тяга',
    shortName: 'Тяга',
  },
]

const BASE_WEEKS: Array<{ week: number; percent: number; sets: number; reps: number }> = [
  { week: 1, percent: 70, sets: 4, reps: 6 },
  { week: 2, percent: 75, sets: 4, reps: 5 },
  { week: 3, percent: 82.5, sets: 3, reps: 3 },
]

const PEAK_WEEK: Array<{
  day: number
  lift: CycleLiftKey
  percent: number
  sets: number
  reps: number
  note: string
}> = [
  { day: 1, lift: 'squat', percent: 87.5, sets: 2, reps: 2, note: '' },
  { day: 2, lift: 'bench', percent: 50, sets: 3, reps: 3, note: 'разгрузка' },
  {
    day: 3,
    lift: 'deadlift',
    percent: 102.5,
    sets: 1,
    reps: 1,
    note: 'попытка рекорда',
  },
]

function oneRepMaxForLift(input: CycleInput, lift: CycleLiftKey): number {
  if (lift === 'squat') return input.squat1RM
  if (lift === 'bench') return input.bench1RM
  return input.deadlift1RM
}

function planLabel(percent: number, note?: string): string {
  const base = `${percent}% от 1ПМ`
  return note ? `${base} · ${note}` : base
}

export function buildPowerliftingCycle(input: CycleInput): CycleWorkoutPlan[] {
  const plans: CycleWorkoutPlan[] = []
  let order = 0

  for (const week of BASE_WEEKS) {
    for (const lift of LIFTS) {
      const oneRepMax = oneRepMaxForLift(input, lift.key)
      plans.push({
        cycleOrder: order,
        week: week.week,
        day: LIFTS.findIndex((item) => item.key === lift.key) + 1,
        weekLabel: CYCLE_WEEK_LABELS[week.week],
        lift: lift.key,
        exerciseName: lift.exerciseName,
        liftName: lift.liftName,
        percent: week.percent,
        sets: week.sets,
        reps: week.reps,
        weight: roundToIncrement((oneRepMax * week.percent) / 100, 2.5),
        name: `Неделя ${week.week} · ${lift.shortName}`,
        planLabel: planLabel(week.percent),
      })
      order += 1
    }
  }

  for (const day of PEAK_WEEK) {
    const lift = LIFTS.find((item) => item.key === day.lift)
    if (!lift) continue
    const oneRepMax = oneRepMaxForLift(input, day.lift)
    plans.push({
      cycleOrder: order,
      week: 4,
      day: day.day,
      weekLabel: CYCLE_WEEK_LABELS[4],
      lift: day.lift,
      exerciseName: lift.exerciseName,
      liftName: lift.liftName,
      percent: day.percent,
      sets: day.sets,
      reps: day.reps,
      weight: roundToIncrement((oneRepMax * day.percent) / 100, 2.5),
      name: `Неделя 4 · ${lift.shortName}`,
      planLabel: planLabel(day.percent, day.note),
    })
    order += 1
  }

  return plans
}
