import { describe, expect, it } from 'vitest'
import { formatRpe, formatTimer, formatWeight, parseNumericInput, pluralRu } from './format'

describe('formatWeight', () => {
  it('использует запятую как десятичный разделитель', () => {
    expect(formatWeight(62.5)).toBe('62,5')
    expect(formatWeight(1.25)).toBe('1,25')
    expect(formatWeight(100)).toBe('100')
  })

  it('защищает от некорректных значений', () => {
    expect(formatWeight(Number.NaN)).toBe('0')
    expect(formatRpe(null)).toBe('—')
    expect(formatRpe(8.5)).toBe('8,5')
  })
})

describe('formatTimer', () => {
  it('показывает минуты и секунды', () => {
    expect(formatTimer(0)).toBe('00:00')
    expect(formatTimer(90)).toBe('01:30')
    expect(formatTimer(3599)).toBe('59:59')
  })

  it('добавляет часы для длинных тренировок', () => {
    expect(formatTimer(3661)).toBe('1:01:01')
  })
})

describe('pluralRu', () => {
  it('выбирает форму по правилам русского языка', () => {
    const forms = ['подход', 'подхода', 'подходов'] as const
    expect(pluralRu(1, [...forms])).toBe('подход')
    expect(pluralRu(2, [...forms])).toBe('подхода')
    expect(pluralRu(5, [...forms])).toBe('подходов')
    expect(pluralRu(11, [...forms])).toBe('подходов')
    expect(pluralRu(21, [...forms])).toBe('подход')
    expect(pluralRu(24, [...forms])).toBe('подхода')
  })
})

describe('parseNumericInput', () => {
  it('принимает точку, запятую и пробелы', () => {
    expect(parseNumericInput('62,5')).toBe(62.5)
    expect(parseNumericInput('1 234.5')).toBe(1234.5)
    expect(parseNumericInput('')).toBeNull()
    expect(parseNumericInput('abc')).toBeNull()
  })
})
