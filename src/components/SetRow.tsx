import { Check } from 'lucide-react'
import { formatRpe, formatWeight } from '../lib/format'
import type { WorkoutSet } from '../types'
import { NumberStepper } from './ui/NumberStepper'

interface SetRowProps {
  set: WorkoutSet
  previousSet?: WorkoutSet
  weightStep: number
  onWeightChange: (value: number) => void
  onRepsChange: (value: number) => void
  onOpenRpe: () => void
  onToggle: () => void
}

export function SetRow({
  set,
  previousSet,
  weightStep,
  onWeightChange,
  onRepsChange,
  onOpenRpe,
  onToggle,
}: SetRowProps) {
  const completed = set.isCompleted

  return (
    <div
      className={`grid grid-cols-[14px_38px_minmax(0,1fr)_74px_34px_28px] items-center gap-x-1 rounded-xl px-1 py-1 transition-colors ${
        completed ? 'bg-emerald-400/[0.055]' : ''
      }`}
    >
      <span
        className={`text-center text-[10px] font-medium tabular-nums ${
          completed ? 'text-emerald-400/80' : 'text-zinc-600'
        }`}
      >
        {set.setNumber}
      </span>

      <span className="truncate text-center text-[9px] font-medium tabular-nums text-zinc-600">
        {previousSet
          ? `${formatWeight(previousSet.weight)}×${previousSet.reps}`
          : '—'}
      </span>

      <NumberStepper
        value={set.weight}
        onChange={onWeightChange}
        step={weightStep}
        min={0}
        max={999}
        disabled={completed}
        ariaLabel={`Вес подхода ${set.setNumber}`}
        id={set.id ? `weight-${set.id}` : undefined}
      />

      <NumberStepper
        value={set.reps}
        onChange={onRepsChange}
        step={1}
        min={0}
        max={100}
        integer
        dense
        disabled={completed}
        ariaLabel={`Повторения подхода ${set.setNumber}`}
        id={set.id ? `reps-${set.id}` : undefined}
      />

      <button
        type="button"
        onClick={onOpenRpe}
        disabled={completed}
        aria-label={`RPE подхода ${set.setNumber}`}
        className={`h-9 w-full rounded-lg border text-[10px] font-semibold tabular-nums transition ${
          completed
            ? 'border-emerald-400/10 text-zinc-400'
            : set.rpe
              ? 'border-white/[0.08] bg-white/[0.045] text-zinc-200 hover:bg-white/[0.07]'
              : 'border-dashed border-white/[0.1] bg-transparent text-zinc-600'
        }`}
      >
        {set.rpe ? formatRpe(set.rpe) : '—'}
      </button>

      <button
        type="button"
        onClick={onToggle}
        aria-label={
          completed
            ? `Отменить выполнение подхода ${set.setNumber}`
            : `Завершить подход ${set.setNumber}`
        }
        className={`flex size-7 items-center justify-center justify-self-end rounded-full transition active:scale-90 ${
          completed
            ? 'bg-emerald-400 text-black shadow-[0_0_16px_rgba(74,222,128,0.22)]'
            : 'border border-white/15 bg-white/[0.02] text-transparent hover:border-accent/50'
        }`}
      >
        <Check className="size-3.5" strokeWidth={3.5} />
      </button>
    </div>
  )
}
