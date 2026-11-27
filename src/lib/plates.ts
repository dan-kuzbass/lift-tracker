export const PLATE_SIZES = [25, 20, 15, 10, 5, 2.5, 1.25] as const
export const STANDARD_BAR_WEIGHT = 20

export interface PlateStackItem {
  weight: number
  count: number
}

export interface PlateBreakdown {
  targetWeight: number
  barWeight: number
  perSide: PlateStackItem[]
  loadedWeight: number
  remainder: number
  isExact: boolean
  isUnderBar: boolean
}

export function calculatePlates(
  targetWeight: number,
  barWeight = STANDARD_BAR_WEIGHT,
): PlateBreakdown {
  const normalizedTarget = Number.isFinite(targetWeight) ? Math.max(0, targetWeight) : 0

  if (normalizedTarget < barWeight) {
    return {
      targetWeight: normalizedTarget,
      barWeight,
      perSide: [],
      loadedWeight: barWeight,
      remainder: 0,
      isExact: false,
      isUnderBar: true,
    }
  }

  const perSideWeight = (normalizedTarget - barWeight) / 2
  let remainder = perSideWeight
  const perSide: PlateStackItem[] = []

  for (const plate of PLATE_SIZES) {
    const count = Math.floor((remainder + 1e-9) / plate)
    if (count > 0) {
      perSide.push({ weight: plate, count })
      remainder -= count * plate
    }
  }

  const roundedRemainder = Math.round(remainder * 100) / 100
  const loadedPerSide = perSideWeight - roundedRemainder

  return {
    targetWeight: normalizedTarget,
    barWeight,
    perSide,
    loadedWeight: Math.round((barWeight + loadedPerSide * 2) * 100) / 100,
    remainder: roundedRemainder,
    isExact: Math.abs(roundedRemainder) < 0.001,
    isUnderBar: false,
  }
}
