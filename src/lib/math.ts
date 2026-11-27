export function roundToIncrement(value: number, increment = 2.5): number {
  if (!Number.isFinite(value) || increment <= 0) return 0
  const result = Math.round(value / increment) * increment
  return Number(result.toFixed(2))
}

export function calculateE1RM(weight: number, reps: number): number {
  if (!Number.isFinite(weight) || !Number.isFinite(reps) || weight <= 0 || reps <= 0) {
    return 0
  }
  return Math.round(weight * (1 + reps / 30) * 10) / 10
}

export function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value))
}
