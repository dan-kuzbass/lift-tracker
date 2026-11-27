import { calculateE1RM, roundToIncrement } from './math'

export type ProgressionScenario = 'progress' | 'hold' | 'deload'

export interface ProgressionSetInput {
  weight: number
  reps: number
  rpe?: number | null
  isCompleted?: boolean
}

export interface ProgressionRecommendation {
  weight: number
  reps: number
  rpe: number
  scenario: ProgressionScenario
  previousWeight: number
  averageRpe: number | null
  targetReps: number
  hadMissedReps: boolean
  hadFailure: boolean
  weightStep: number
}

function mostCommon(values: number[]): number | null {
  if (values.length === 0) return null
  const counts = new Map<number, number>()
  for (const value of values) {
    counts.set(value, (counts.get(value) ?? 0) + 1)
  }
  let bestValue: number | null = null
  let bestCount = 0
  for (const [value, count] of counts) {
    if (count > bestCount || (count === bestCount && bestValue !== null && value > bestValue)) {
      bestValue = value
      bestCount = count
    }
  }
  return bestValue
}

export function computeRecommendation(
  sets: ProgressionSetInput[],
  weightStep: number,
  previousTargetReps?: number | null,
): ProgressionRecommendation | null {
  const workingSets = sets.filter(
    (set) =>
      set.isCompleted !== false &&
      Number.isFinite(set.weight) &&
      Number.isFinite(set.reps) &&
      set.weight > 0 &&
      set.reps > 0,
  )

  if (workingSets.length === 0) return null

  const step = weightStep > 0 ? weightStep : 2.5
  const previousWeight = Math.max(...workingSets.map((set) => set.weight))
  const targetReps =
    previousTargetReps && previousTargetReps > 0
      ? Math.round(previousTargetReps)
      : mostCommon(workingSets.map((set) => set.reps)) ?? workingSets[0].reps

  const rpeValues = workingSets
    .map((set) => set.rpe)
    .filter((rpe): rpe is number => typeof rpe === 'number' && Number.isFinite(rpe))

  const averageRpe =
    rpeValues.length > 0
      ? Math.round((rpeValues.reduce((sum, rpe) => sum + rpe, 0) / rpeValues.length) * 10) / 10
      : null

  const hadMissedReps = workingSets.some((set) => set.reps < targetReps)
  const hadFailure = rpeValues.some((rpe) => rpe >= 10)

  let scenario: ProgressionScenario
  if (hadMissedReps || hadFailure) {
    scenario = 'deload'
  } else if (averageRpe !== null && averageRpe > 8.5) {
    scenario = 'hold'
  } else {
    scenario = 'progress'
  }

  let weight: number
  if (scenario === 'progress') {
    weight = Number((previousWeight + step).toFixed(2))
  } else if (scenario === 'hold') {
    weight = previousWeight
  } else {
    weight = roundToIncrement(previousWeight * 0.95, 2.5)
  }

  return {
    weight,
    reps: targetReps,
    rpe: 8,
    scenario,
    previousWeight,
    averageRpe,
    targetReps,
    hadMissedReps,
    hadFailure,
    weightStep: step,
  }
}

export function bestE1RM(
  sets: Array<{ weight: number; reps: number; isCompleted?: boolean }>,
): number {
  let best = 0
  for (const set of sets) {
    if (set.isCompleted === false) continue
    const value = calculateE1RM(set.weight, set.reps)
    if (value > best) best = value
  }
  return best
}
