import { RotateCcw, Timer, X } from 'lucide-react'
import { formatTimer } from '../lib/format'
import { useRestTimer } from '../hooks/useRestTimer'

export function RestTimerBar() {
  const { timer, remainingSeconds, isFinished, adjust, restart, hide } = useRestTimer()

  if (!timer) return null

  const progress = Math.min(1, Math.max(0, 1 - remainingSeconds / timer.duration))

  return (
    <div
      className={`relative overflow-hidden rounded-2xl border p-2.5 shadow-[0_18px_40px_rgba(0,0,0,0.45)] backdrop-blur-xl ${
        isFinished
          ? 'border-emerald-400/25 bg-[#101d16]/95'
          : 'border-accent/20 bg-[#151b12]/95'
      }`}
    >
      <div className="flex items-center gap-2.5">
        <div
          className={`flex size-9 shrink-0 items-center justify-center rounded-full border ${
            isFinished
              ? 'border-emerald-400/25 bg-emerald-400/10 text-emerald-300'
              : 'border-accent/25 bg-accent/[0.08] text-accent'
          }`}
        >
          <Timer className="size-4" />
        </div>

        <div className="min-w-0 flex-1">
          <div
            className={`truncate text-[8px] font-semibold uppercase tracking-[0.16em] ${
              isFinished ? 'text-emerald-300/80' : 'text-accent/70'
            }`}
          >
            {isFinished ? 'Отдых завершён' : `Отдых · ${timer.label}`}
          </div>
          <div className="flex items-baseline gap-2">
            <span
              className={`text-[21px] font-semibold leading-tight tabular-nums ${
                isFinished ? 'text-emerald-200' : 'text-white'
              }`}
              role="timer"
              aria-live="off"
            >
              {formatTimer(remainingSeconds)}
            </span>
            <span className="hidden truncate text-[9px] text-zinc-600 min-[390px]:inline">
              {isFinished ? 'можно начинать' : 'до подхода'}
            </span>
          </div>
        </div>

        <div className="flex shrink-0 items-center gap-1">
          {isFinished ? null : (
            <>
              <button
                type="button"
                onClick={() => adjust(-30)}
                className="h-7 rounded-lg border border-white/[0.07] bg-white/[0.04] px-1.5 text-[9px] font-semibold text-zinc-400 transition active:bg-white/10"
                aria-label="Уменьшить отдых на 30 секунд"
              >
                −30
              </button>
              <button
                type="button"
                onClick={() => adjust(30)}
                className="h-7 rounded-lg border border-white/[0.07] bg-white/[0.04] px-1.5 text-[9px] font-semibold text-zinc-400 transition active:bg-white/10"
                aria-label="Увеличить отдых на 30 секунд"
              >
                +30
              </button>
            </>
          )}
          <button
            type="button"
            onClick={restart}
            className="flex size-7 items-center justify-center rounded-lg border border-white/[0.07] bg-white/[0.04] text-zinc-400 transition active:bg-white/10"
            aria-label="Сбросить таймер отдыха"
          >
            <RotateCcw className="size-3" />
          </button>
          <button
            type="button"
            onClick={hide}
            className="flex size-7 items-center justify-center rounded-lg border border-white/[0.07] bg-white/[0.04] text-zinc-500 transition active:bg-white/10"
            aria-label="Скрыть таймер отдыха"
          >
            <X className="size-3" />
          </button>
        </div>
      </div>

      <div className="absolute inset-x-0 bottom-0 h-[2px] bg-white/[0.04]">
        <div
          className={`h-full transition-[width] duration-300 ease-linear ${
            isFinished ? 'bg-emerald-400/70' : 'bg-accent/70'
          }`}
          style={{ width: `${progress * 100}%` }}
        />
      </div>
    </div>
  )
}
