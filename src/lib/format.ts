export function formatWeight(value: number): string {
  if (!Number.isFinite(value)) return '0'
  const rounded = Math.round(value * 100) / 100
  return String(rounded).replace('.', ',')
}

export function formatRpe(value: number | null | undefined): string {
  if (value === null || value === undefined || !Number.isFinite(value)) return '—'
  return formatWeight(value)
}

export function formatTonnage(value: number): string {
  if (!Number.isFinite(value)) return '0'
  return new Intl.NumberFormat('ru-RU', {
    maximumFractionDigits: 0,
  }).format(Math.round(value))
}

function pad(value: number): string {
  return String(value).padStart(2, '0')
}

export function formatTimer(totalSeconds: number): string {
  const seconds = Math.max(0, Math.floor(totalSeconds))
  const hours = Math.floor(seconds / 3600)
  const minutes = Math.floor((seconds % 3600) / 60)
  const rest = seconds % 60
  if (hours > 0) return `${hours}:${pad(minutes)}:${pad(rest)}`
  return `${pad(minutes)}:${pad(rest)}`
}

export function formatDurationLabel(totalSeconds: number): string {
  const seconds = Math.max(0, Math.round(totalSeconds))
  if (seconds < 60) return `${seconds} сек`
  const minutes = Math.floor(seconds / 60)
  if (minutes < 60) return `${minutes} мин`
  const hours = Math.floor(minutes / 60)
  const restMinutes = minutes % 60
  return restMinutes > 0 ? `${hours} ч ${restMinutes} мин` : `${hours} ч`
}

function toDate(iso: string): Date {
  const date = new Date(iso)
  return Number.isNaN(date.getTime()) ? new Date() : date
}

export function formatDateShort(iso: string): string {
  return new Intl.DateTimeFormat('ru-RU', {
    day: 'numeric',
    month: 'short',
  })
    .format(toDate(iso))
    .replace('.', '')
}

export function formatDateTitle(iso: string): string {
  return new Intl.DateTimeFormat('ru-RU', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(toDate(iso))
}

export function formatDateTime(iso: string): string {
  const date = toDate(iso)
  const day = new Intl.DateTimeFormat('ru-RU', {
    day: 'numeric',
    month: 'short',
  })
    .format(date)
    .replace('.', '')
  const time = new Intl.DateTimeFormat('ru-RU', {
    hour: '2-digit',
    minute: '2-digit',
  }).format(date)
  return `${day}, ${time}`
}

export function formatHomeDate(date = new Date()): string {
  const weekday = new Intl.DateTimeFormat('ru-RU', { weekday: 'long' }).format(date)
  const day = new Intl.DateTimeFormat('ru-RU', {
    day: 'numeric',
    month: 'long',
  }).format(date)
  return `${weekday} · ${day}`.toUpperCase()
}

export function getDateBadge(iso: string): { day: string; month: string } {
  const date = toDate(iso)
  return {
    day: new Intl.DateTimeFormat('ru-RU', { day: 'numeric' }).format(date),
    month: new Intl.DateTimeFormat('ru-RU', { month: 'short' })
      .format(date)
      .replace('.', '')
      .toUpperCase(),
  }
}

export function pluralRu(
  count: number,
  forms: [one: string, few: string, many: string],
): string {
  const abs = Math.abs(count) % 100
  const last = abs % 10
  if (abs > 10 && abs < 20) return forms[2]
  if (last === 1) return forms[0]
  if (last >= 2 && last <= 4) return forms[1]
  return forms[2]
}

export function parseNumericInput(raw: string): number | null {
  const normalized = raw.trim().replace(',', '.').replace(/\s/g, '')
  if (!normalized) return null
  const value = Number(normalized)
  return Number.isFinite(value) ? value : null
}
