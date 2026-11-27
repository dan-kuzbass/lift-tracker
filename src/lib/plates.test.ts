import { describe, expect, it } from 'vitest'
import { calculatePlates, STANDARD_BAR_WEIGHT } from './plates'

describe('calculatePlates', () => {
  it('возвращает пустой набор для веса штанги', () => {
    const result = calculatePlates(20)

    expect(result).toMatchObject({
      barWeight: STANDARD_BAR_WEIGHT,
      perSide: [],
      loadedWeight: 20,
      isExact: true,
      isUnderBar: false,
    })
  })

  it('раскладывает 100 кг на 25 и 15 кг с каждой стороны', () => {
    const result = calculatePlates(100)

    expect(result.perSide).toEqual([
      { weight: 25, count: 1 },
      { weight: 15, count: 1 },
    ])
    expect(result.loadedWeight).toBe(100)
    expect(result.isExact).toBe(true)
  })

  it('использует дробные блины для точного веса', () => {
    const result = calculatePlates(132.5)

    expect(result.perSide).toEqual([
      { weight: 25, count: 2 },
      { weight: 5, count: 1 },
      { weight: 1.25, count: 1 },
    ])
    expect(result.loadedWeight).toBe(132.5)
    expect(result.isExact).toBe(true)
  })

  it('показывает остаток, если вес не раскладывается блинами', () => {
    const result = calculatePlates(101.1)

    expect(result.loadedWeight).toBe(100)
    expect(result.remainder).toBe(0.55)
    expect(result.isExact).toBe(false)
  })

  it('обрабатывает вес меньше штанги', () => {
    const result = calculatePlates(15)

    expect(result).toMatchObject({
      isUnderBar: true,
      perSide: [],
      loadedWeight: 20,
      isExact: false,
    })
  })

  it('поддерживает нестандартную штангу', () => {
    const result = calculatePlates(60, 10)

    expect(result.barWeight).toBe(10)
    expect(result.loadedWeight).toBe(60)
    expect(result.perSide.reduce((sum, plate) => sum + plate.weight * plate.count, 0)).toBe(25)
  })
})
