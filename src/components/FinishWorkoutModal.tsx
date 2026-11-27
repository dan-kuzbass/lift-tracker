import { useId } from 'react'
import { AlertTriangle, Flag, Loader2 } from 'lucide-react'
import { formatTonnage, formatTimer } from '../lib/format'
import { useNow } from '../hooks/useNow'
import type { Workout } from '../types'
import { Modal } from './ui/Modal'

interface FinishWorkoutModalProps {
  open: boolean
  workout: Workout
  tonnage: number
  completedSets: number
  totalSets: number
  exerciseCount: number
  busy?: boolean
  onClose: () => void
  onConfirm: () => void
}

export function FinishWorkoutModal({
  open,
  workout,
  tonnage,
  completedSets,
  totalSets,
  exerciseCount,
  busy = false,
  onClose,
  onConfirm,
}: FinishWorkoutModalProps) {
  const titleId = useId()
  const now = useNow(1000)
  const parsedStart = workout.startedAt ?? Date.parse(workout.date)
  const startedAt = Number.isFinite(parsedStart) ? parsedStart : now
  const elapsed = Math.max(0, Math.round((now - startedAt) / 1000))

  const stats = [
    { label: 'Время', value: formatTimer(elapsed) },
    { label: 'Тоннаж', value: `${formatTonnage(tonnage)} кг` },
    { label: 'Подходы', value: `${completedSets} / ${totalSets}` },
    { label: 'Упражнения', value: String(exerciseCount) },
  ]

  return (
    <Modal open={open} onClose={busy ? () => undefined : onClose} labelledBy={titleId}>
      <div className="p-5">
        <div className="mx-auto mb-4 h-1 w-10 rounded-full bg-white/15 sm:hidden" />
        <div className="flex items-start gap-3">
          <div className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-accent/10 text-accent">
            <Flag className="size-5" />
          </div>
          <div className="min-w-0">
            <h2 id={titleId} className="text-xl font-semibold tracking-tight text-white">
              Завершить тренировку?
            </h2>
            <p className="mt-1 line-clamp-2 text-[12px] leading-relaxed text-zinc-500">
              {workout.name}
            </p>
          </div>
        </div>

        <div className="mt-5 grid grid-cols-2 gap-2">
          {stats.map((stat) => (
            <div
              key={stat.label}
              className="rounded-2xl border border-white/[0.06] bg-white/[0.025] px-3 py-2.5"
            >
              <div className="text-[9px] font-medium uppercase tracking-[0.15em] text-zinc-600">
                {stat.label}
              </div>
              <div className="mt-1 text-[15px] font-semibold text-zinc-100 tabular-nums">
                {stat.value}
              </div>
            </div>
          ))}
        </div>

        {completedSets < totalSets ? (
          <div className="mt-3 flex items-start gap-2 rounded-xl border border-amber-400/15 bg-amber-400/[0.06] px-3 py-2.5 text-[11px] leading-relaxed text-amber-100/80">
            <AlertTriangle className="mt-0.5 size-3.5 shrink-0" />
            {completedSets === 0
              ? 'Нет завершённых подходов — прогрессия не обновится.'
              : 'Незавершённые подходы не повлияют на расчёт следующей тренировки.'}
          </div>
        ) : (
          <p className="mt-3 rounded-xl border border-emerald-400/15 bg-emerald-400/[0.06] px-3 py-2.5 text-[11px] leading-relaxed text-emerald-100/80">
            Все подходы закрыты. Следующий вес будет рассчитан автоматически.
          </p>
        )}

        <div className="mt-5 grid grid-cols-2 gap-2.5">
          <button
            type="button"
            onClick={onClose}
            disabled={busy}
            className="rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3.5 text-sm font-medium text-zinc-200 transition hover:bg-white/[0.07] disabled:opacity-50"
          >
            Продолжить
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={busy}
            className="flex items-center justify-center gap-2 rounded-2xl bg-accent px-4 py-3.5 text-sm font-semibold text-black transition hover:bg-accent-strong active:scale-[0.99] disabled:opacity-60"
          >
            {busy ? <Loader2 className="size-4 animate-spin" /> : null}
            Завершить
          </button>
        </div>
        <p className="mt-3 text-center text-[10px] text-zinc-600">
          Тренировка сохранится в истории на этом устройстве
        </p>
      </div>
    </Modal>
  )
}
