import { describe, expect, it } from 'vitest'
import {
  buildPowerliftingCycle,
  CYCLE_WEEKS_COUNT,
  CYCLE_WORKOUTS_COUNT,
} from './cycle'

describe('buildPowerliftingCycle', () => {
  const plans = buildPowerliftingCycle({
    squat1RM: 100,
    bench1RM: 80,
    deadlift1RM: 140,
  })

  it('создаёт 12 тренировок с последовательным порядком', () => {
    expect(plans).toHaveLength(CYCLE_WORKOUTS_COUNT)
    expect(plans.map((plan) => plan.cycleOrder)).toEqual(
      Array.from({ length: CYCLE_WORKOUTS_COUNT }, (_, index) => index),
    )
  })

  it('распределяет по 3 тренировки на каждую из 4 недель', () => {
    expect(new Set(plans.map((plan) => plan.week)).size).toBe(CYCLE_WEEKS_COUNT)
    for (let week = 1; week <= CYCLE_WEEKS_COUNT; week += 1) {
      expect(plans.filter((plan) => plan.week === week)).toHaveLength(3)
    }
  })

  it('применяет проценты и объёмы базовых недель', () => {
    const squatWeek1 = plans[0]
    expect(squatWeek1).toMatchObject({
      lift: 'squat',
      percent: 70,
      sets: 4,
      reps: 6,
      weight: 70,
      name: 'Неделя 1 · Присед',
    })

    const benchWeek2 = plans[4]
    expect(benchWeek2).toMatchObject({
      lift: 'bench',
      percent: 75,
      sets: 4,
      reps: 5,
      weight: 60,
    })
  })

  it('создаёт пиковую неделю с разгрузочным жимом и тягой на рекорд', () => {
    const peak = plans.filter((plan) => plan.week === 4)
    expect(peak.map((plan) => plan.lift)).toEqual(['squat', 'bench', 'deadlift'])

    const [squat, bench, deadlift] = peak
    expect(squat).toMatchObject({ percent: 87.5, sets: 2, reps: 2, weight: 87.5 })
    expect(bench).toMatchObject({ percent: 50, sets: 3, reps: 3, weight: 40 })
    expect(bench.planLabel).toContain('разгрузка')
    expect(deadlift).toMatchObject({ percent: 102.5, sets: 1, reps: 1, weight: 142.5 })
    expect(deadlift.planLabel).toContain('попытка рекорда')
  })

  it('округляет веса до 2.5 кг', () => {
    const customPlans = buildPowerliftingCycle({
      squat1RM: 137,
      bench1RM: 93,
      deadlift1RM: 181,
    })

    for (const plan of customPlans) {
      expect(plan.weight % 2.5).toBeCloseTo(0, 5)
    }
  })
})
