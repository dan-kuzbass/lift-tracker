import { useId } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { Check, Clock3, Dumbbell, TrendingUp } from 'lucide-react'
import { getWorkoutDetails } from '../db/queries'
import {
  formatDateTime,
  formatDurationLabel,
  formatRpe,
  formatTonnage,
  formatWeight,
  pluralRu,
} from '../lib/format'
import { bestE1RM } from '../lib/progression'
import { MUSCLE_GROUP_LABELS } from '../types'
import { Modal } from './ui/Modal'

interface WorkoutDetailsModalProps {
  workoutId: number | null
  onClose: () => void
}

export function WorkoutDetailsModal({ workoutId, onClose }: WorkoutDetailsModalProps) {
  const titleId = useId()
  const details = useLiveQuery(
    async () => (workoutId === null ? null : getWorkoutDetails(workoutId)),
    [workoutId],
  )

  return (
    <Modal open={workoutId !== null} onClose={onClose} labelledBy={titleId}>
      <div className="relative flex max-h-[92dvh] flex-col">
        <div className="shrink-0 border-b border-white/[0.06] px-4 pb-4 pt-3">
          <div className="mx-auto mb-3 h-1 w-10 rounded-full bg-white/15 sm:hidden" />
          {details ? (
            <>
              <p className="text-[9px] font-semibold uppercase tracking-[0.2em] text-zinc-500">
                {formatDateTime(details.workout.date)}
              </p>
              <h2
                id={titleId}
                className="mt-1.5 pr-8 text-[22px] font-semibold leading-tight tracking-[-0.025em] text-white"
              >
                {details.workout.name}
              </h2>
            </>
          ) : (
            <h2 id={titleId} className="pr-8 text-xl font-semibold text-white">
              Тренировка
            </h2>
          )}
          <button
            type="button"
            onClick={onClose}
            aria-label="Закрыть"
            className="absolute right-4 top-10 flex size-9 items-center justify-center rounded-full border border-white/10 text-zinc-400 transition hover:bg-white/5 hover:text-white"
          >
            <span aria-hidden="true" className="text-lg leading-none">
              ×
            </span>
          </button>
        </div>

        <div className="overflow-y-auto px-4 pb-5 pt-4">
          {details === undefined ? (
            <div className="space-y-3">
              <div className="h-20 animate-pulse rounded-2xl bg-white/[0.04]" />
              <div className="h-32 animate-pulse rounded-2xl bg-white/[0.04]" />
              <div className="h-32 animate-pulse rounded-2xl bg-white/[0.04]" />
            </div>
          ) : details === null ? (
            <p className="py-10 text-center text-sm text-zinc-500">Тренировка не найдена</p>
          ) : (
            <>
              <div className="grid grid-cols-3 gap-2">
                <div className="rounded-2xl border border-white/[0.06] bg-white/[0.025] p-3">
                  <Clock3 className="size-3.5 text-zinc-500" />
                  <div className="mt-2 text-[13px] font-semibold text-zinc-100">
                    {formatDurationLabel(details.workout.durationSeconds)}
                  </div>
                  <div className="mt-0.5 text-[9px] uppercase tracking-[0.12em] text-zinc-600">
                    время
                  </div>
                </div>
                <div className="rounded-2xl border border-white/[0.06] bg-white/[0.025] p-3">
                  <Dumbbell className="size-3.5 text-zinc-500" />
                  <div className="mt-2 text-[13px] font-semibold text-zinc-100 tabular-nums">
                    {formatTonnage(details.tonnage)}
                  </div>
                  <div className="mt-0.5 text-[9px] uppercase tracking-[0.12em] text-zinc-600">
                    кг тоннаж
                  </div>
                </div>
                <div className="rounded-2xl border border-white/[0.06] bg-white/[0.025] p-3">
                  <TrendingUp className="size-3.5 text-zinc-500" />
                  <div className="mt-2 text-[13px] font-semibold text-zinc-100 tabular-nums">
                    {details.bestE1RM > 0 ? formatWeight(details.bestE1RM) : '—'}
                  </div>
                  <div className="mt-0.5 text-[9px] uppercase tracking-[0.12em] text-zinc-600">
                    e1RM, кг
                  </div>
                </div>
              </div>

              <div className="mt-5 flex items-center justify-between">
                <h3 className="text-[13px] font-semibold text-zinc-200">Упражнения</h3>
                <span className="text-[10px] text-zinc-600">
                  {details.completedSets} из {details.totalSets}{' '}
                  {pluralRu(details.totalSets, ['подход', 'подхода', 'подходов'])}
                </span>
              </div>

              <div className="mt-2 space-y-2.5">
                {details.exercises.map((entry) => {
                  const exerciseRpeValues = entry.sets
                    .filter((set) => set.isCompleted && typeof set.rpe === 'number')
                    .map((set) => set.rpe as number)
                  const averageRpe =
                    exerciseRpeValues.length > 0
                      ? Math.round(
                          (exerciseRpeValues.reduce((sum, rpe) => sum + rpe, 0) /
                            exerciseRpeValues.length) *
                            10,
                        ) / 10
                      : null
                  return (
                    <div
                      key={entry.workoutExercise.id}
                      className="rounded-2xl border border-white/[0.06] bg-white/[0.025] p-3.5"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <h4 className="truncate text-[13px] font-semibold text-zinc-100">
                            {entry.exercise.name}
                          </h4>
                          <p className="mt-0.5 text-[9px] uppercase tracking-[0.1em] text-zinc-600">
                            {MUSCLE_GROUP_LABELS[entry.exercise.muscleGroup]} ·{' '}
                            {entry.exercise.isCompound ? 'базовое' : 'изолированное'}
                          </p>
                        </div>
                        {averageRpe !== null ? (
                          <span className="shrink-0 rounded-full border border-white/[0.06] bg-white/[0.03] px-2 py-1 text-[9px] font-medium text-zinc-400">
                            RPE {formatRpe(averageRpe)}
                          </span>
                        ) : null}
                      </div>
                      <div className="mt-2 space-y-1">
                        {entry.sets.map((set) => (
                          <div
                            key={set.id}
                            className={`flex items-center justify-between rounded-lg px-1 py-1 text-[11px] ${
                              set.isCompleted ? 'text-zinc-300' : 'text-zinc-600'
                            }`}
                          >
                            <span className="w-6 text-zinc-600">{set.setNumber}</span>
                            <span className="flex-1 text-center font-medium tabular-nums">
                              {formatWeight(set.weight)} кг × {set.reps}
                            </span>
                            <span className="w-12 text-right text-zinc-600">
                              {set.rpe ? `RPE ${formatRpe(set.rpe)}` : 'RPE —'}
                            </span>
                            <span
                              className={`ml-2 flex size-4 items-center justify-center rounded-full ${
                                set.isCompleted
                                  ? 'bg-emerald-400 text-black'
                                  : 'border border-white/10 text-transparent'
                              }`}
                            >
                              <Check className="size-2.5" strokeWidth={3.5} />
                            </span>
                          </div>
                        ))}
                      </div>
                      {bestE1RM(entry.sets) > 0 ? (
                        <div className="mt-2 border-t border-white/[0.05] pt-2 text-right text-[9px] text-zinc-600">
                          e1RM{' '}
                          <span className="font-medium text-zinc-400">
                            {formatWeight(bestE1RM(entry.sets))} кг
                          </span>
                        </div>
                      ) : null}
                    </div>
                  )
                })}
              </div>
            </>
          )}
        </div>
      </div>
    </Modal>
  )
}
