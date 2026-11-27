import { useMemo, useState } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import {
  ArrowLeftRight,
  Calculator,
  ChevronUp,
  Plus,
  Trash2,
  TrendingDown,
  TrendingUp,
} from 'lucide-react'
import { db } from '../db/db'
import { addSet, deleteWorkoutExercise, updateSet } from '../db/actions'
import { getLastExerciseSession } from '../db/queries'
import {
  formatRpe,
  formatTonnage,
  formatWeight,
  pluralRu,
} from '../lib/format'
import { bestE1RM, computeRecommendation, type ProgressionScenario } from '../lib/progression'
import type { Exercise, WorkoutExercise, WorkoutSet } from '../types'
import { MUSCLE_GROUP_LABELS } from '../types'
import { useRestTimer } from '../hooks/useRestTimer'
import { useToast } from './ui/Toast'
import { ConfirmDialog } from './ui/ConfirmDialog'
import { PlateCalculatorModal } from './PlateCalculatorModal'
import { RpePicker } from './RpePicker'
import { SetRow } from './SetRow'

interface ExerciseCardProps {
  workoutId: number
  workoutExercise: WorkoutExercise
  exercise: Exercise
  sets: WorkoutSet[]
  onReplaceRequest: (workoutExercise: WorkoutExercise) => void
}

const scenarioLabels: Record<ProgressionScenario, string> = {
  progress: 'Прогресс',
  hold: 'Закрепление',
  deload: 'Откат',
}

const scenarioStyles: Record<ProgressionScenario, string> = {
  progress: 'border-emerald-400/20 bg-emerald-400/[0.08] text-emerald-300',
  hold: 'border-amber-400/20 bg-amber-400/[0.08] text-amber-300',
  deload: 'border-orange-400/20 bg-orange-400/[0.08] text-orange-300',
}

export function ExerciseCard({
  workoutId,
  workoutExercise,
  exercise,
  sets,
  onReplaceRequest,
}: ExerciseCardProps) {
  const [plateModalOpen, setPlateModalOpen] = useState(false)
  const [rpeTarget, setRpeTarget] = useState<WorkoutSet | null>(null)
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const { showToast } = useToast()
  const { start: startRest } = useRestTimer()

  const session = useLiveQuery(
    async () =>
      exercise.id === undefined
        ? null
        : getLastExerciseSession(exercise.id, workoutId),
    [exercise.id, workoutId],
  )

  const recommendation = useMemo(() => {
    if (!session) return null
    return computeRecommendation(
      session.sets,
      exercise.weightStep,
      session.workoutExercise.targetReps,
    )
  }, [session, exercise.weightStep])

  const previousByNumber = useMemo(() => {
    const map = new Map<number, WorkoutSet>()
    for (const set of session?.sets ?? []) {
      if (!map.has(set.setNumber)) map.set(set.setNumber, set)
    }
    return map
  }, [session])

  const sessionLoading = session === undefined
  const completedSets = sets.filter((set) => set.isCompleted)
  const best = bestE1RM(completedSets)
  const volume = completedSets.reduce((sum, set) => sum + set.weight * set.reps, 0)
  const targetWeight = workoutExercise.targetWeight ?? null
  const targetReps = workoutExercise.targetReps ?? sets[0]?.reps ?? 5
  const targetRpe = workoutExercise.targetRpe ?? 8

  const previousText = useMemo(() => {
    if (!session || session.sets.length === 0) return null
    const list = session.sets.slice(0, 4)
    const weights = new Set(list.map((set) => set.weight))
    if (weights.size === 1) {
      return `${formatWeight(list[0].weight)} кг × ${list.map((set) => set.reps).join(', ')}`
    }
    return list.map((set) => `${formatWeight(set.weight)}×${set.reps}`).join(' · ')
  }, [session])

  const previousRpe = useMemo(() => {
    const values =
      session?.sets
        .map((set) => set.rpe)
        .filter((rpe): rpe is number => typeof rpe === 'number' && Number.isFinite(rpe)) ??
      []
    if (values.length === 0) return null
    return Math.round((values.reduce((sum, rpe) => sum + rpe, 0) / values.length) * 10) / 10
  }, [session])

  const calculatorWeight =
    sets.find((set) => !set.isCompleted && set.weight > 0)?.weight ??
    sets.find((set) => set.weight > 0)?.weight ??
    targetWeight ??
    0

  const persistSet = async (
    id: number | undefined,
    patch: Partial<Pick<WorkoutSet, 'weight' | 'reps' | 'rpe' | 'isCompleted'>>,
  ) => {
    if (id === undefined) return
    try {
      await updateSet(id, patch)
    } catch {
      showToast('Не удалось сохранить подход', 'error')
    }
  }

  const handleToggle = async (workoutSet: WorkoutSet) => {
    if (workoutSet.id === undefined) return
    const fresh = await db.sets.get(workoutSet.id)
    if (!fresh || fresh.id === undefined) return

    if (fresh.isCompleted) {
      await persistSet(fresh.id, { isCompleted: false })
      return
    }

    if (!(fresh.weight > 0) || !(fresh.reps > 0)) {
      showToast('Укажите вес и повторения, чтобы закрыть подход', 'error')
      const inputId = !(fresh.weight > 0) ? `weight-${fresh.id}` : `reps-${fresh.id}`
      window.setTimeout(() => {
        const element = document.getElementById(inputId)
        if (element instanceof HTMLInputElement) element.focus()
      }, 50)
      return
    }

    await persistSet(fresh.id, { isCompleted: true })
    startRest(exercise.isCompound ? 180 : 90, exercise.name)
  }

  const handleAddSet = async () => {
    if (workoutExercise.id === undefined) return
    try {
      await addSet(workoutExercise.id)
    } catch {
      showToast('Не удалось добавить подход', 'error')
    }
  }

  const handleDelete = async () => {
    if (workoutExercise.id === undefined) return
    setDeleting(true)
    try {
      await deleteWorkoutExercise(workoutExercise.id)
      setDeleteOpen(false)
      showToast('Упражнение удалено из тренировки')
    } catch {
      showToast('Не удалось удалить упражнение', 'error')
    } finally {
      setDeleting(false)
    }
  }

  const scenarioDelta =
    recommendation === null ? null : recommendation.weight - recommendation.previousWeight

  return (
    <>
      <article className="rounded-3xl border border-white/[0.07] bg-[#10151c]/90 p-3 shadow-[0_18px_50px_rgba(0,0,0,0.18)] min-[400px]:p-4">
        <div className="flex items-start gap-2">
          <div className="min-w-0 flex-1">
            <h3 className="text-[16px] font-semibold leading-snug tracking-[-0.01em] text-white">
              {exercise.name}
            </h3>
            <p className="mt-1 text-[9px] font-medium uppercase tracking-[0.1em] text-zinc-600">
              {MUSCLE_GROUP_LABELS[exercise.muscleGroup]} ·{' '}
              {exercise.isCompound ? 'базовое' : 'изолированное'} · шаг{' '}
              {formatWeight(exercise.weightStep)} кг
            </p>
          </div>
          <div className="flex shrink-0 items-center gap-1">
            <button
              type="button"
              onClick={() => setPlateModalOpen(true)}
              aria-label="Калькулятор блинов"
              title="Калькулятор блинов"
              className="flex size-8 items-center justify-center rounded-xl border border-accent/15 bg-accent/[0.06] text-accent transition hover:bg-accent/[0.1]"
            >
              <Calculator className="size-3.5" />
            </button>
            <button
              type="button"
              onClick={() => onReplaceRequest(workoutExercise)}
              aria-label="Заменить упражнение"
              title="Заменить упражнение"
              className="flex size-8 items-center justify-center rounded-xl border border-white/[0.07] bg-white/[0.03] text-zinc-500 transition hover:bg-white/[0.06] hover:text-zinc-200"
            >
              <ArrowLeftRight className="size-3.5" />
            </button>
            <button
              type="button"
              onClick={() => setDeleteOpen(true)}
              aria-label="Удалить упражнение"
              title="Удалить упражнение"
              className="flex size-8 items-center justify-center rounded-xl border border-white/[0.07] bg-white/[0.03] text-zinc-600 transition hover:bg-red-400/10 hover:text-red-300"
            >
              <Trash2 className="size-3.5" />
            </button>
          </div>
        </div>

        <div className="mt-3 overflow-hidden rounded-2xl border border-white/[0.06] bg-white/[0.025]">
          <div className="grid grid-cols-2 divide-x divide-white/[0.06]">
            <div className="min-w-0 p-2.5">
              <div className="text-[8px] font-semibold uppercase tracking-[0.16em] text-zinc-600">
                Прошлый раз
              </div>
              <p
                className={`mt-1 line-clamp-2 text-[12px] font-medium leading-snug ${
                  previousText ? 'text-zinc-300' : 'text-zinc-600'
                }`}
              >
                {sessionLoading ? 'Загрузка…' : (previousText ?? 'Нет истории')}
              </p>
              <p className="mt-1 text-[9px] text-zinc-600">
                {previousRpe !== null ? `ср. RPE ${formatRpe(previousRpe)}` : 'RPE не указан'}
              </p>
            </div>
            <div className="min-w-0 p-2.5">
              <div className="text-[8px] font-semibold uppercase tracking-[0.16em] text-accent/60">
                Цель сегодня
              </div>
              <div className="mt-1 flex flex-wrap items-baseline gap-x-1">
                <span className="text-[17px] font-semibold leading-tight text-accent tabular-nums">
                  {targetWeight !== null && targetWeight > 0 ? formatWeight(targetWeight) : '—'}
                </span>
                <span className="text-[9px] text-accent/50">кг</span>
                <span className="text-[10px] text-zinc-600">×</span>
                <span className="text-[15px] font-semibold leading-tight text-zinc-100 tabular-nums">
                  {targetReps}
                </span>
              </div>
              <p className="mt-1 text-[9px] text-zinc-600">
                RPE {formatRpe(targetRpe)}
              </p>
            </div>
          </div>
          <div className="flex flex-wrap items-center justify-between gap-2 border-t border-white/[0.05] px-2.5 py-1.5">
            {workoutExercise.planLabel ? (
              <span className="rounded-full border border-accent/15 bg-accent/[0.06] px-2 py-0.5 text-[9px] font-medium text-accent/80">
                По программе · {workoutExercise.planLabel}
              </span>
            ) : sessionLoading ? (
              <span className="text-[9px] text-zinc-600">Считаем рекомендацию…</span>
            ) : recommendation ? (
              <span className="inline-flex items-center gap-1.5">
                <span
                  className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[9px] font-semibold ${scenarioStyles[recommendation.scenario]}`}
                >
                  {recommendation.scenario === 'progress' ? (
                    <TrendingUp className="size-2.5" />
                  ) : recommendation.scenario === 'deload' ? (
                    <TrendingDown className="size-2.5" />
                  ) : (
                    <ChevronUp className="size-2.5" />
                  )}
                  {scenarioLabels[recommendation.scenario]}
                </span>
                <span className="text-[9px] text-zinc-500 tabular-nums">
                  {scenarioDelta !== null && scenarioDelta > 0
                    ? `+${formatWeight(scenarioDelta)} кг`
                    : scenarioDelta !== null && scenarioDelta < 0
                      ? `${formatWeight(scenarioDelta)} кг`
                      : 'вес сохранён'}
                </span>
              </span>
            ) : (
              <span className="text-[9px] text-zinc-600">
                Первый раз — подберите рабочий вес
              </span>
            )}
            {previousText ? (
              <span className="text-[9px] text-zinc-700">
                {session?.sets.length} {pluralRu(session?.sets.length ?? 0, ['подход', 'подхода', 'подходов'])}
              </span>
            ) : null}
          </div>
        </div>

        <div className="mt-3">
          <div className="grid grid-cols-[14px_38px_minmax(0,1fr)_74px_34px_28px] items-center gap-x-1 px-1 pb-1 text-[8px] font-semibold uppercase tracking-[0.08em] text-zinc-600">
            <span className="text-center">№</span>
            <span className="text-center">Было</span>
            <span className="text-center">Вес</span>
            <span className="text-center">Повт.</span>
            <span className="text-center">RPE</span>
            <span />
          </div>
          <div className="space-y-0.5">
            {sets.map((workoutSet) => (
              <SetRow
                key={workoutSet.id ?? workoutSet.setNumber}
                set={workoutSet}
                previousSet={previousByNumber.get(workoutSet.setNumber)}
                weightStep={exercise.weightStep}
                onWeightChange={(value) => void persistSet(workoutSet.id, { weight: value })}
                onRepsChange={(value) => void persistSet(workoutSet.id, { reps: value })}
                onOpenRpe={() => setRpeTarget(workoutSet)}
                onToggle={() => void handleToggle(workoutSet)}
              />
            ))}
          </div>
          <button
            type="button"
            onClick={() => void handleAddSet()}
            className="mt-2 flex w-full items-center justify-center gap-1.5 rounded-xl border border-dashed border-white/[0.08] py-2.5 text-[11px] font-medium text-zinc-500 transition hover:border-white/[0.15] hover:bg-white/[0.02] hover:text-zinc-300"
          >
            <Plus className="size-3" />
            Добавить подход
          </button>
          {completedSets.length > 0 ? (
            <div className="mt-2 flex items-center justify-between px-1 text-[9px] text-zinc-600">
              <span>
                Лучший e1RM{' '}
                <span className="font-semibold text-zinc-400 tabular-nums">
                  {formatWeight(best)} кг
                </span>
              </span>
              <span>
                Объём{' '}
                <span className="font-semibold text-zinc-400 tabular-nums">
                  {formatTonnage(volume)} кг
                </span>
              </span>
            </div>
          ) : null}
        </div>
      </article>

      <PlateCalculatorModal
        open={plateModalOpen}
        weight={calculatorWeight}
        exerciseName={exercise.name}
        onClose={() => setPlateModalOpen(false)}
      />

      <RpePicker
        open={rpeTarget !== null}
        currentRpe={rpeTarget?.rpe ?? null}
        setNumber={rpeTarget?.setNumber ?? 1}
        onSelect={(rpe) => {
          if (rpeTarget?.id !== undefined) {
            void persistSet(rpeTarget.id, { rpe })
          }
        }}
        onClose={() => setRpeTarget(null)}
      />

      <ConfirmDialog
        open={deleteOpen}
        title="Удалить упражнение?"
        description={`«${exercise.name}» и все его подходы будут удалены из текущей тренировки.`}
        confirmLabel="Удалить"
        tone="danger"
        busy={deleting}
        onConfirm={() => void handleDelete()}
        onClose={() => setDeleteOpen(false)}
      />
    </>
  )
}
