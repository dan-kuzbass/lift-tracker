import { useEffect, useRef, useState } from 'react'
import { Minus, Plus } from 'lucide-react'
import { parseNumericInput } from '../../lib/format'
import { clamp } from '../../lib/math'

interface NumberStepperProps {
  value: number
  onChange: (value: number) => void
  step: number
  min?: number
  max?: number
  integer?: boolean
  disabled?: boolean
  ariaLabel: string
  dense?: boolean
  id?: string
}

function toText(value: number): string {
  return value > 0 ? String(value).replace('.', ',') : ''
}

export function NumberStepper({
  value,
  onChange,
  step,
  min = 0,
  max = 999,
  integer = false,
  disabled = false,
  ariaLabel,
  dense = false,
  id,
}: NumberStepperProps) {
  const [draft, setDraft] = useState(() => toText(value))
  const focusedRef = useRef(false)

  useEffect(() => {
    if (!focusedRef.current) {
      setDraft(toText(value))
    }
  }, [value])

  const normalize = (raw: string): number | null => {
    const parsed = parseNumericInput(raw)
    if (parsed === null) return null
    const normalized = integer ? Math.trunc(parsed) : parsed
    return clamp(normalized, min, max)
  }

  const commitDraft = () => {
    const normalized = normalize(draft)
    if (normalized === null) {
      setDraft(toText(value))
      return
    }
    setDraft(toText(normalized))
    if (normalized !== value) onChange(normalized)
  }

  const adjust = (direction: -1 | 1) => {
    if (disabled) return
    const parsed = parseNumericInput(draft)
    const base = parsed === null ? value : parsed
    const next = clamp(
      integer ? Math.trunc(base) + direction * step : Number((base + direction * step).toFixed(2)),
      min,
      max,
    )
    setDraft(toText(next))
    onChange(next)
  }

  const buttonClass = dense
    ? 'flex h-full w-5 shrink-0 items-center justify-center text-zinc-500 transition active:text-white disabled:opacity-40'
    : 'flex h-full w-7 shrink-0 items-center justify-center text-zinc-500 transition active:text-white disabled:opacity-40'

  return (
    <div
      className={`flex h-10 items-center overflow-hidden rounded-xl border transition ${
        disabled
          ? 'border-emerald-400/10 bg-emerald-400/[0.06]'
          : 'border-white/[0.07] bg-white/[0.035] focus-within:border-accent/45 focus-within:bg-white/[0.05]'
      }`}
    >
      <button
        type="button"
        onClick={() => adjust(-1)}
        disabled={disabled}
        aria-label={`Уменьшить ${ariaLabel} на ${step}`}
        className={buttonClass}
      >
        <Minus className={dense ? 'size-2.5' : 'size-3'} strokeWidth={3} />
      </button>
      <input
        id={id}
        type="text"
        inputMode={integer ? 'numeric' : 'decimal'}
        enterKeyHint="done"
        autoComplete="off"
        spellCheck={false}
        aria-label={ariaLabel}
        value={draft}
        disabled={disabled}
        onFocus={(event) => {
          focusedRef.current = true
          event.currentTarget.select()
        }}
        onBlur={() => {
          focusedRef.current = false
          commitDraft()
        }}
        onChange={(event) => {
          const next = event.target.value
          setDraft(next)
          if (!next.trim()) {
            onChange(0)
            return
          }
          const parsed = parseNumericInput(next)
          if (parsed !== null) {
            const normalized = integer ? Math.trunc(parsed) : parsed
            onChange(clamp(normalized, min, max))
          }
        }}
        onKeyDown={(event) => {
          if (event.key === 'Enter') event.currentTarget.blur()
          if (event.key === 'ArrowUp') {
            event.preventDefault()
            adjust(1)
          }
          if (event.key === 'ArrowDown') {
            event.preventDefault()
            adjust(-1)
          }
        }}
        className="h-full min-w-0 flex-1 bg-transparent text-center text-[14px] font-semibold tabular-nums text-white outline-none placeholder:text-zinc-700 disabled:text-zinc-300"
        placeholder="—"
      />
      <button
        type="button"
        onClick={() => adjust(1)}
        disabled={disabled}
        aria-label={`Увеличить ${ariaLabel} на ${step}`}
        className={buttonClass}
      >
        <Plus className={dense ? 'size-2.5' : 'size-3'} strokeWidth={3} />
      </button>
    </div>
  )
}
