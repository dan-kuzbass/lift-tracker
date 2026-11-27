import { useId } from 'react'
import { X } from 'lucide-react'
import { RPE_OPTIONS } from '../types'
import { formatRpe } from '../lib/format'
import { Modal } from './ui/Modal'

interface RpePickerProps {
  open: boolean
  currentRpe: number | null | undefined
  setNumber: number
  onSelect: (rpe: number | null) => void
  onClose: () => void
}

function rpeTone(rpe: number): string {
  if (rpe <= 7) return 'border-emerald-400/20 bg-emerald-400/[0.08] text-emerald-200'
  if (rpe <= 8) return 'border-lime-400/20 bg-lime-400/[0.08] text-lime-200'
  if (rpe <= 9) return 'border-amber-400/20 bg-amber-400/[0.08] text-amber-200'
  if (rpe <= 9.5) return 'border-orange-400/20 bg-orange-400/[0.08] text-orange-200'
  return 'border-red-400/20 bg-red-400/[0.08] text-red-200'
}

export function RpePicker({
  open,
  currentRpe,
  setNumber,
  onSelect,
  onClose,
}: RpePickerProps) {
  const titleId = useId()

  return (
    <Modal open={open} onClose={onClose} labelledBy={titleId}>
      <div className="px-4 pb-4 pt-3">
        <div className="mx-auto mb-3 h-1 w-10 rounded-full bg-white/15 sm:hidden" />
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-[9px] font-semibold uppercase tracking-[0.2em] text-zinc-500">
              Оценка усилия
            </p>
            <h2 id={titleId} className="mt-1 text-xl font-semibold tracking-tight text-white">
              RPE · подход {setNumber}
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Закрыть"
            className="flex size-9 shrink-0 items-center justify-center rounded-full border border-white/10 text-zinc-400 transition hover:bg-white/5 hover:text-white"
          >
            <X className="size-4" />
          </button>
        </div>

        <p className="mt-2 text-[12px] leading-relaxed text-zinc-500">
          Насколько тяжело был подход. 10 — последний повтор на пределе.
        </p>

        <div className="mt-4 grid grid-cols-4 gap-2">
          {RPE_OPTIONS.map((rpe) => {
            const active = currentRpe === rpe
            return (
              <button
                key={rpe}
                type="button"
                onClick={() => {
                  onSelect(rpe)
                  onClose()
                }}
                className={`flex h-14 items-center justify-center rounded-2xl border text-base font-semibold tabular-nums transition active:scale-95 ${
                  active
                    ? 'border-accent bg-accent text-black shadow-[0_0_24px_rgba(211,249,95,0.18)]'
                    : rpeTone(rpe)
                }`}
              >
                {formatRpe(rpe)}
              </button>
            )
          })}
        </div>

        <div className="mt-3 flex items-center justify-between">
          <span className="text-[10px] text-zinc-600">6 — легко · 10 — отказ</span>
          <button
            type="button"
            onClick={() => {
              onSelect(null)
              onClose()
            }}
            className="text-[11px] font-medium text-zinc-500 underline-offset-4 transition hover:text-zinc-200 hover:underline"
          >
            Без RPE
          </button>
        </div>
      </div>
    </Modal>
  )
}
