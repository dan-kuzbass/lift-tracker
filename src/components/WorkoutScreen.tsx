import { useMemo, useState } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { Dumbbell, Flag, Plus } from 'lucide-react'
import { addExerciseToWorkout, finishWorkout, replaceWorkoutExercise } from '../db/actions'
import { db } from '../db/db'
import {
  formatTimer,
  formatTonnage,
  pluralRu,
} from '../lib/format'
import { useNow } from '../hooks/useNow'
import { useRestTimer } from '../hooks/useRestTimer'
import type {
  Exercise,
  Workout,
  WorkoutExercise,
  WorkoutSet,
} from '../types'
import { ExerciseCard } from './ExerciseCard'
import { ExercisePickerModal } from './ExercisePickerModal'
import { FinishWorkoutModal } from './FinishWorkoutModal'
import { RestTimerBar } from './RestTimerBar'
import { ConfirmDialog } from './ui/ConfirmDialog'
import { useToast } from './ui/Toast'

interface WorkoutScreenProps {
  workout: Workout
}

interface ExerciseEntry {
  workoutExercise: WorkoutExercise
  exercise: Exercise
  sets: WorkoutSet[]
}

export function WorkoutScreen({ workout }: WorkoutScreenProps) {
  const { showToast } = useToast()
  const { hide: hideRestTimer } = useRestTimer()
  const now = useNow(1000)
  const [pickerMode, setPickerMode] = useState<'add' | 'replace' | null>(null)
  const [replaceLink, setReplaceLink] = useState<WorkoutExercise | null>(null)
  const [pendingReplacement, setPendingReplacement] = useState<Exercise | null>(null)
  const [replacing, setReplacing] = useState(false)
  const [finishOpen, setFinishOpen] = useState(false)
  const [finishing, setFinishing] = useState(false)

  const entries = useLiveQuery(async () => {
    if (workout.id === undefined) return []
    const links = await db.workoutExercises
      .where('workoutId')
      .equals(workout.id)
      .toArray()
    links.sort((a, b) => a.order - b.order)

    const exerciseIds = [...new Set(links.map((link) => link.exerciseId))]
    const linkIds = links
      .map((link) => link.id)
      .filter((id): id is number => typeof id === 'number')

    const [exerciseRows, sets] = await Promise.all([
      db.exercises.bulkGet(exerciseIds),
      linkIds.length > 0
        ? db.sets.where('workoutExerciseId').anyOf(linkIds).toArray()
        : Promise.resolve([] as WorkoutSet[]),
    ])

    const exerciseMap = new Map<number, Exercise>()
    for (const exercise of exerciseRows) {
      if (exercise?.id !== undefined) exerciseMap.set(exercise.id, exercise)
    }

    const result: ExerciseEntry[] = []
    for (const link of links) {
      if (link.id === undefined) continue
      const exercise = exerciseMap.get(link.exerciseId)
      if (!exercise) continue
      const linkSets = sets
        .filter((set) => set.workoutExerciseId === link.id)
        .sort((a, b) => a.setNumber - b.setNumber)
      result.push({ workoutExercise: link, exercise, sets: linkSets })
    }
    return result
  }, [workout.id])

  const allSets = useMemo(
    () => (entries ?? []).flatMap((entry) => entry.sets),
    [entries],
  )
  const completedSets = allSets.filter((set) => set.isCompleted)
  const tonnage = completedSets.reduce((sum, set) => sum + set.weight * set.reps, 0)
  const exerciseCount = entries?.length ?? 0
  const excludeExerciseIds = useMemo(
    () =>
      (entries ?? [])
        .map((entry) => entry.exercise.id)
        .filter((id): id is number => typeof id === 'number'),
    [entries],
  )

  const parsedStart = workout.startedAt ?? Date.parse(workout.date)
  const startedAt = Number.isFinite(parsedStart) ? parsedStart : now
  const elapsedSeconds = Math.max(0, Math.floor((now - startedAt) / 1000))

  const handleAddExercise = async (exercise: Exercise) => {
    if (workout.id === undefined) return
    try {
      await addExerciseToWorkout(workout.id, exercise)
      setPickerMode(null)
      showToast('Упражнение добавлено', 'success')
    } catch (caught) {
      showToast(
        caught instanceof Error ? caught.message : 'Не удалось добавить упражнение',
        'error',
      )
      throw caught
    }
  }

  const handlePickerSelect = async (exercise: Exercise) => {
    if (pickerMode === 'replace') {
      setPickerMode(null)
      setPendingReplacement(exercise)
      return
    }
    await handleAddExercise(exercise)
  }

  const openReplace = (link: WorkoutExercise) => {
    setReplaceLink(link)
    setPickerMode('replace')
  }

  const handleReplaceConfirm = async () => {
    if (replaceLink?.id === undefined || !pendingReplacement) return
    setReplacing(true)
    try {
      await replaceWorkoutExercise(replaceLink.id, pendingReplacement)
      setPendingReplacement(null)
      setReplaceLink(null)
      showToast('Упражнение заменено', 'success')
    } catch {
      showToast('Не удалось заменить упражнение', 'error')
    } finally {
      setReplacing(false)
    }
  }

  const handleFinish = async () => {
    if (workout.id === undefined) return
    setFinishing(true)
    try {
      await finishWorkout(workout.id)
      hideRestTimer()
      setFinishOpen(false)
      showToast('Тренировка сохранена', 'success')
    } catch {
      showToast('Не удалось завершить тренировку', 'error')
    } finally {
      setFinishing(false)
    }
  }

  const loaded = entries !== undefined

  return (
    <div className="min-h-dvh bg-[#0a0e13] pb-[200px]">
      <header className="sticky top-0 z-30 border-b border-white/[0.055] bg-[#0a0e13]/92 backdrop-blur-xl">
        <div className="safe-top px-3 pb-3 min-[400px]:px-4">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <span className="live-dot size-1.5 rounded-full bg-accent" />
              <span className="text-[8px] font-semibold uppercase tracking-[0.18em] text-accent/70">
                Тренировка идёт
              </span>
            </div>
            <button
              type="button"
              onClick={() => setFinishOpen(true)}
              disabled={!loaded}
              className="flex items-center gap-1.5 rounded-full border border-accent/20 bg-accent/[0.08] px-3 py-1.5 text-[10px] font-semibold text-accent transition hover:bg-accent/[0.13] disabled:opacity-50"
            >
              <Flag className="size-3" />
              Завершить
            </button>
          </div>

          <div className="mt-3 flex items-end justify-between gap-4">
            <h1 className="min-w-0 flex-1 text-[21px] font-semibold leading-[1.15] tracking-[-0.03em] text-white">
              {workout.name}
            </h1>
            <div className="shrink-0 text-right">
              <div className="mono text-[19px] font-semibold leading-none tracking-tight text-white tabular-nums">
                {formatTimer(elapsedSeconds)}
              </div>
              <div className="mt-1 text-[8px] font-medium uppercase tracking-[0.16em] text-zinc-600">
                длительность
              </div>
            </div>
          </div>

          <div className="mt-3 grid grid-cols-3 divide-x divide-white/[0.055] overflow-hidden rounded-2xl border border-white/[0.06] bg-white/[0.022]">
            <div className="px-3 py-2">
              <div className="text-[8px] font-medium uppercase tracking-[0.13em] text-zinc-600">
                Тоннаж
              </div>
              <div className="mt-0.5 text-[13px] font-semibold text-zinc-200 tabular-nums">
                {formatTonnage(tonnage)} <span className="text-[9px] text-zinc-600">кг</span>
              </div>
            </div>
            <div className="px-3 py-2">
              <div className="text-[8px] font-medium uppercase tracking-[0.13em] text-zinc-600">
                Подходы
              </div>
              <div className="mt-0.5 text-[13px] font-semibold text-zinc-200 tabular-nums">
                {completedSets.length}
                <span className="text-zinc-600"> / {allSets.length}</span>
              </div>
            </div>
            <div className="px-3 py-2">
              <div className="text-[8px] font-medium uppercase tracking-[0.13em] text-zinc-600">
                Упражнения
              </div>
              <div className="mt-0.5 text-[13px] font-semibold text-zinc-200 tabular-nums">
                {exerciseCount}
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="px-3 pt-3.5 min-[400px]:px-4">
        {!loaded ? (
          <div className="space-y-3">
            {Array.from({ length: 2 }).map((_, index) => (
              <div
                key={index}
                className="h-[300px] animate-pulse rounded-3xl border border-white/[0.05] bg-white/[0.025]"
              />
            ))}
          </div>
        ) : exerciseCount === 0 ? (
          <div className="flex flex-col items-center rounded-3xl border border-dashed border-white/[0.09] bg-white/[0.018] px-6 py-12 text-center">
            <div className="flex size-14 items-center justify-center rounded-2xl border border-accent/15 bg-accent/[0.06] text-accent">
              <Dumbbell className="size-6" />
            </div>
            <h2 className="mt-4 text-lg font-semibold tracking-tight text-white">
              Соберите тренировку
            </h2>
            <p className="mt-1.5 max-w-[260px] text-[12px] leading-relaxed text-zinc-500">
              Добавьте упражнения из справочника. Система подставит рекомендованный вес и
              число повторений.
            </p>
            <button
              type="button"
              onClick={() => setPickerMode('add')}
              className="mt-5 flex items-center gap-2 rounded-xl bg-accent px-4 py-2.5 text-[12px] font-semibold text-black transition hover:bg-accent-strong"
            >
              <Plus className="size-3.5" />
              Добавить упражнение
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {(entries ?? []).map((entry) => (
              <ExerciseCard
                key={entry.workoutExercise.id ?? entry.workoutExercise.order}
                workoutId={workout.id!}
                workoutExercise={entry.workoutExercise}
                exercise={entry.exercise}
                sets={entry.sets}
                onReplaceRequest={openReplace}
              />
            ))}
            <p className="px-1 pt-1 text-center text-[9px] text-zinc-700">
              {completedSets.length > 0
                ? `${completedSets.length} ${pluralRu(completedSets.length, ['подход', 'подхода', 'подходов'])} закрыто`
                : 'Отметьте выполненный подход — запустится таймер отдыха'}
            </p>
          </div>
        )}
      </main>

      <div className="fixed inset-x-0 bottom-0 z-40 mx-auto w-full max-w-[480px] border-t border-white/[0.06] bg-[#0a0e13]/95 px-3 pt-2.5 backdrop-blur-xl dock-safe min-[400px]:px-4">
        <div className="space-y-2.5">
          <RestTimerBar />
          <button
            type="button"
            onClick={() => setPickerMode('add')}
            disabled={!loaded}
            className="flex h-[50px] w-full items-center justify-center gap-2 rounded-2xl bg-accent text-[13px] font-semibold text-black shadow-[0_14px_40px_rgba(211,249,95,0.12)] transition hover:bg-accent-strong active:scale-[0.995] disabled:opacity-50"
          >
            <Plus className="size-4" strokeWidth={2.5} />
            Добавить упражнение
          </button>
        </div>
      </div>

      {pickerMode !== null ? (
        <ExercisePickerModal
          open
          title={pickerMode === 'replace' ? 'Заменить упражнение' : 'Добавить упражнение'}
          excludeExerciseIds={excludeExerciseIds}
          onSelect={handlePickerSelect}
          onClose={() => {
            setPickerMode(null)
            setReplaceLink(null)
          }}
        />
      ) : null}

      <ConfirmDialog
        open={pendingReplacement !== null}
        title="Заменить упражнение?"
        description={
          pendingReplacement && replaceLink
            ? `Подходы карточки будут сброшены. Новое упражнение: «${pendingReplacement.name}».`
            : 'Подходы карточки будут сброшены.'
        }
        confirmLabel="Заменить"
        busy={replacing}
        onConfirm={() => void handleReplaceConfirm()}
        onClose={() => {
          setPendingReplacement(null)
          setReplaceLink(null)
        }}
      />

      <FinishWorkoutModal
        open={finishOpen}
        workout={workout}
        tonnage={tonnage}
        completedSets={completedSets.length}
        totalSets={allSets.length}
        exerciseCount={exerciseCount}
        busy={finishing}
        onClose={() => setFinishOpen(false)}
        onConfirm={() => void handleFinish()}
      />
    </div>
  )
}
