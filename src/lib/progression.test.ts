import { describe, expect, it } from 'vitest'
import { bestE1RM, computeRecommendation, type ProgressionSetInput } from './progression'
import { calculateE1RM, roundToIncrement } from './math'

const workingSets = (reps: number, rpe: number, count = 3): ProgressionSetInput[] =>
  Array.from({ length: count }, () => ({ weight: 100, reps, rpe }))

describe('roundToIncrement', () => {
  it('округляет до ближайших 2.5 кг', () => {
    expect(roundToIncrement(91.25, 2.5)).toBe(92.5)
    expect(roundToIncrement(91.1, 2.5)).toBe(90)
    expect(roundToIncrement(93.8, 5)).toBe(95)
  })

  it('возвращает 0 для некорректных значений', () => {
    expect(roundToIncrement(Number.NaN)).toBe(0)
    expect(roundToIncrement(100, 0)).toBe(0)
  })
})

describe('calculateE1RM', () => {
  it('считает оценку 1ПМ по формуле Эпли', () => {
    expect(calculateE1RM(100, 5)).toBe(116.7)
    expect(calculateE1RM(100, 1)).toBe(103.3)
  })

  it('игнорирует нулевые и некорректные значения', () => {
    expect(calculateE1RM(0, 5)).toBe(0)
    expect(calculateE1RM(100, 0)).toBe(0)
    expect(calculateE1RM(Number.NaN, 5)).toBe(0)
  })
})

describe('computeRecommendation', () => {
  it('добавляет шаг, если все повторы выполнены при RPE не выше 8.5', () => {
    const result = computeRecommendation(workingSets(5, 8), 2.5)

    expect(result).toMatchObject({
      weight: 102.5,
      reps: 5,
      rpe: 8,
      scenario: 'progress',
      previousWeight: 100,
    })
  })

  it('удерживает вес при среднем RPE выше 8.5', () => {
    const result = computeRecommendation(workingSets(5, 9), 2.5)

    expect(result).toMatchObject({
      weight: 100,
      scenario: 'hold',
      averageRpe: 9,
    })
  })

  it('снижает вес на 5% при недоборе повторов', () => {
    const result = computeRecommendation(
      [
        { weight: 100, reps: 6, rpe: 8 },
        { weight: 100, reps: 4, rpe: 8.5 },
        { weight: 100, reps: 5, rpe: 8 },
      ],
      2.5,
      5,
    )

    expect(result).toMatchObject({
      weight: 95,
      scenario: 'deload',
      hadMissedReps: true,
      targetReps: 5,
    })
  })

  it('снижает вес при отказе RPE 10', () => {
    const result = computeRecommendation(workingSets(5, 10), 2.5)

    expect(result).toMatchObject({
      weight: 95,
      scenario: 'deload',
      hadFailure: true,
    })
  })

  it('использует целевые повторы прошлой тренировки', () => {
    const result = computeRecommendation(workingSets(8, 8, 2), 5, 8)

    expect(result).toMatchObject({
      weight: 105,
      reps: 8,
      targetReps: 8,
      scenario: 'progress',
      weightStep: 5,
    })
  })

  it('игнорирует незавершённые подходы и возвращает null без рабочих подходов', () => {
    expect(
      computeRecommendation([{ weight: 100, reps: 5, rpe: 8, isCompleted: false }], 2.5),
    ).toBeNull()
    expect(computeRecommendation([], 2.5)).toBeNull()
  })

  it('выбирает лучший e1RM только среди завершённых подходов', () => {
    expect(
      bestE1RM([
        { weight: 100, reps: 5, isCompleted: true },
        { weight: 120, reps: 1, isCompleted: false },
      ]),
    ).toBe(116.7)
  })
})
