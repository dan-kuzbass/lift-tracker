import { useId, useMemo, useState } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import {
  ArrowLeft,
  Check,
  ChevronRight,
  Dumbbell,
  Loader2,
  Plus,
  Search,
  X,
} from 'lucide-react'
import { db } from '../db/db'
import { defaultWeightStep } from '../db/seedExercises'
import type { Exercise, MuscleGroup } from '../types'
import { MUSCLE_GROUP_LABELS, MUSCLE_GROUP_OPTIONS } from '../types'
import { Modal } from './ui/Modal'

interface ExercisePickerModalProps {
  open: boolean
  title?: string
  excludeExerciseIds?: number[]
  onSelect: (exercise: Exercise) => void | Promise<void>
  onClose: () => void
}

const groupOrder = new Map(MUSCLE_GROUP_OPTIONS.map((option, index) => [option.value, index]))

export function ExercisePickerModal({
  open,
  title = 'Добавить упражнение',
  excludeExerciseIds = [],
  onSelect,
  onClose,
}: ExercisePickerModalProps) {
  const titleId = useId()
  const [view, setView] = useState<'list' | 'create'>('list')
  const [search, setSearch] = useState('')
  const [group, setGroup] = useState<'all' | MuscleGroup>('all')
  const [pendingId, setPendingId] = useState<number | null>(null)
  const [creating, setCreating] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)
  const [listError, setListError] = useState<string | null>(null)
  const [newName, setNewName] = useState('')
  const [newGroup, setNewGroup] = useState<MuscleGroup>('chest')
  const [newCompound, setNewCompound] = useState(true)

  const exercises = useLiveQuery(async () => {
    const rows = await db.exercises.toArray()
    return rows.sort((a, b) => {
      const groupDifference =
        (groupOrder.get(a.muscleGroup) ?? 99) - (groupOrder.get(b.muscleGroup) ?? 99)
      if (groupDifference !== 0) return groupDifference
      return a.name.localeCompare(b.name, 'ru')
    })
  }, [])

  const excluded = useMemo(() => new Set(excludeExerciseIds), [excludeExerciseIds])

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase()
    return (exercises ?? []).filter((exercise) => {
      if (group !== 'all' && exercise.muscleGroup !== group) return false
      if (query && !exercise.name.toLowerCase().includes(query)) return false
      return true
    })
  }, [exercises, group, search])

  const handlePick = async (exercise: Exercise) => {
    if (exercise.id !== undefined && excluded.has(exercise.id)) return
    if (pendingId !== null) return
    setPendingId(exercise.id ?? null)
    setListError(null)
    try {
      await onSelect(exercise)
    } catch (caught) {
      setListError(
        caught instanceof Error ? caught.message : 'Не удалось добавить упражнение',
      )
    } finally {
      setPendingId(null)
    }
  }

  const handleCreate = async () => {
    const name = newName.trim()
    if (name.length < 2) {
      setFormError('Введите название упражнения')
      return
    }
    if (name.length > 60) {
      setFormError('Слишком длинное название')
      return
    }
    const duplicate = (exercises ?? []).some(
      (exercise) => exercise.name.trim().toLowerCase() === name.toLowerCase(),
    )
    if (duplicate) {
      setFormError('Упражнение с таким названием уже есть')
      return
    }

    setCreating(true)
    setFormError(null)
    try {
      const data: Exercise = {
        name,
        muscleGroup: newGroup,
        isCompound: newCompound,
        weightStep: defaultWeightStep(newGroup),
      }
      const id = await db.exercises.add(data)
      await onSelect({ ...data, id })
    } catch {
      setFormError('Не удалось создать упражнение')
    } finally {
      setCreating(false)
    }
  }

  const resetToCreate = () => {
    setFormError(null)
    setListError(null)
    setNewName('')
    setNewGroup('chest')
    setNewCompound(true)
    setView('create')
  }

  const chipBase =
    'shrink-0 rounded-full border px-3 py-1.5 text-[10px] font-medium transition whitespace-nowrap'
  const activeChip = 'border-accent/30 bg-accent/[0.1] text-accent'
  const idleChip = 'border-white/[0.07] bg-white/[0.025] text-zinc-500 hover:text-zinc-300'

  return (
    <Modal open={open} onClose={onClose} labelledBy={titleId}>
      <div className="flex max-h-[92dvh] flex-col">
        <div className="shrink-0 border-b border-white/[0.06] px-3.5 pb-3 pt-3">
          <div className="mx-auto mb-3 h-1 w-10 rounded-full bg-white/15 sm:hidden" />

          <div className="flex items-start justify-between gap-3">
            <div className="flex min-w-0 items-center gap-2">
              {view === 'create' ? (
                <button
                  type="button"
                  onClick={() => {
                    setFormError(null)
                    setView('list')
                  }}
                  aria-label="Назад к списку"
                  className="flex size-8 shrink-0 items-center justify-center rounded-full border border-white/[0.08] text-zinc-400 transition hover:bg-white/5 hover:text-white"
                >
                  <ArrowLeft className="size-3.5" />
                </button>
              ) : null}
              <div className="min-w-0">
                <p className="text-[8px] font-semibold uppercase tracking-[0.2em] text-zinc-600">
                  Справочник
                </p>
                <h2
                  id={titleId}
                  className="mt-0.5 truncate text-[19px] font-semibold tracking-tight text-white"
                >
                  {view === 'create' ? 'Своё упражнение' : title}
                </h2>
              </div>
            </div>
            <button
              type="button"
              onClick={onClose}
              aria-label="Закрыть"
              className="flex size-8 shrink-0 items-center justify-center rounded-full border border-white/[0.08] text-zinc-500 transition hover:bg-white/5 hover:text-white"
            >
              <X className="size-3.5" />
            </button>
          </div>

          {view === 'list' ? (
            <>
              <div className="relative mt-3">
                <Search className="pointer-events-none absolute left-3 top-1/2 size-3.5 -translate-y-1/2 text-zinc-600" />
                <input
                  type="search"
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="Поиск по названию"
                  aria-label="Поиск упражнения"
                  className="h-10 w-full rounded-xl border border-white/[0.07] bg-white/[0.035] pl-9 pr-9 text-[13px] text-zinc-100 outline-none transition placeholder:text-zinc-600 focus:border-accent/35"
                />
                {search ? (
                  <button
                    type="button"
                    onClick={() => setSearch('')}
                    aria-label="Очистить поиск"
                    className="absolute right-2 top-1/2 flex size-6 -translate-y-1/2 items-center justify-center rounded-full text-zinc-500 hover:bg-white/5 hover:text-white"
                  >
                    <X className="size-3" />
                  </button>
                ) : null}
              </div>
              <div className="no-scrollbar -mx-1 mt-2.5 flex gap-1.5 overflow-x-auto px-1 pb-0.5">
                <button
                  type="button"
                  onClick={() => setGroup('all')}
                  className={`${chipBase} ${group === 'all' ? activeChip : idleChip}`}
                >
                  Все
                </button>
                {MUSCLE_GROUP_OPTIONS.map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => setGroup(option.value)}
                    className={`${chipBase} ${group === option.value ? activeChip : idleChip}`}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            </>
          ) : null}
        </div>

        {view === 'list' ? (
          <>
            <div className="flex-1 overflow-y-auto px-2 py-1.5">
              {exercises === undefined ? (
                <div className="space-y-2 p-1">
                  {Array.from({ length: 6 }).map((_, index) => (
                    <div
                      key={index}
                      className="h-[58px] animate-pulse rounded-2xl bg-white/[0.035]"
                    />
                  ))}
                </div>
              ) : filtered.length === 0 ? (
                <div className="flex flex-col items-center px-6 py-10 text-center">
                  <div className="flex size-12 items-center justify-center rounded-2xl border border-white/[0.06] bg-white/[0.025] text-zinc-600">
                    <Search className="size-5" />
                  </div>
                  <p className="mt-3 text-sm font-medium text-zinc-300">Ничего не найдено</p>
                  <p className="mt-1 text-[11px] text-zinc-600">
                    Попробуйте другой запрос или добавьте своё упражнение
                  </p>
                </div>
              ) : (
                <div className="space-y-0.5">
                  {filtered.map((exercise) => {
                    const isAdded = exercise.id !== undefined && excluded.has(exercise.id)
                    const isPending = pendingId !== null && pendingId === exercise.id
                    return (
                      <button
                        key={exercise.id}
                        type="button"
                        disabled={isAdded || pendingId !== null}
                        onClick={() => void handlePick(exercise)}
                        className="flex w-full items-center gap-2.5 rounded-2xl px-2 py-2.5 text-left transition hover:bg-white/[0.035] disabled:opacity-45"
                      >
                        <span
                          className={`flex size-9 shrink-0 items-center justify-center rounded-xl border ${
                            exercise.isCompound
                              ? 'border-accent/15 bg-accent/[0.06] text-accent/80'
                              : 'border-white/[0.07] bg-white/[0.03] text-zinc-500'
                          }`}
                        >
                          <Dumbbell className="size-4" />
                        </span>
                        <span className="min-w-0 flex-1">
                          <span className="block truncate text-[13px] font-medium text-zinc-100">
                            {exercise.name}
                          </span>
                          <span className="mt-0.5 block text-[9px] text-zinc-600">
                            {MUSCLE_GROUP_LABELS[exercise.muscleGroup]} ·{' '}
                            {exercise.isCompound ? 'базовое' : 'изолированное'} · шаг{' '}
                            {exercise.weightStep === 5 ? '5' : '2,5'} кг
                          </span>
                        </span>
                        {isAdded ? (
                          <span className="flex shrink-0 items-center gap-1 rounded-full border border-white/[0.06] px-2 py-1 text-[8px] font-medium uppercase tracking-wide text-zinc-600">
                            <Check className="size-2.5" />
                            В тренировке
                          </span>
                        ) : isPending ? (
                          <Loader2 className="size-4 shrink-0 animate-spin text-accent" />
                        ) : (
                          <Plus className="size-4 shrink-0 text-zinc-600" />
                        )}
                      </button>
                    )
                  })}
                </div>
              )}
            </div>

            <div className="shrink-0 border-t border-white/[0.06] px-3.5 pb-[max(env(safe-area-inset-bottom),12px)] pt-3">
              {listError ? (
                <p className="mb-2 rounded-lg border border-red-400/15 bg-red-400/[0.06] px-3 py-2 text-[10px] leading-relaxed text-red-200">
                  {listError}
                </p>
              ) : null}
              <button
                type="button"
                onClick={resetToCreate}
                className="flex w-full items-center justify-between rounded-2xl border border-white/[0.08] bg-white/[0.025] px-3.5 py-3 text-left transition hover:bg-white/[0.05]"
              >
                <span className="flex items-center gap-2.5">
                  <span className="flex size-8 items-center justify-center rounded-xl bg-accent/10 text-accent">
                    <Plus className="size-3.5" />
                  </span>
                  <span>
                    <span className="block text-[12px] font-medium text-zinc-200">
                      Создать своё упражнение
                    </span>
                    <span className="mt-0.5 block text-[9px] text-zinc-600">
                      Название, группа мышц и тип
                    </span>
                  </span>
                </span>
                <ChevronRight className="size-4 text-zinc-600" />
              </button>
            </div>
          </>
        ) : (
          <>
            <div className="flex-1 overflow-y-auto px-3.5 py-4">
              <label className="block">
                <span className="text-[10px] font-medium uppercase tracking-[0.12em] text-zinc-500">
                  Название
                </span>
                <input
                  type="text"
                  autoFocus
                  value={newName}
                  onChange={(event) => {
                    setNewName(event.target.value)
                    setFormError(null)
                  }}
                  placeholder="Например, Жим в хаммере"
                  maxLength={60}
                  className="mt-2 h-11 w-full rounded-xl border border-white/[0.08] bg-white/[0.035] px-3 text-[14px] text-zinc-100 outline-none transition placeholder:text-zinc-600 focus:border-accent/35"
                />
              </label>

              <div className="mt-4">
                <span className="text-[10px] font-medium uppercase tracking-[0.12em] text-zinc-500">
                  Группа мышц
                </span>
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {MUSCLE_GROUP_OPTIONS.map((option) => (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() => setNewGroup(option.value)}
                      className={`rounded-full border px-3 py-2 text-[11px] font-medium transition ${
                        newGroup === option.value
                          ? 'border-accent/30 bg-accent/[0.1] text-accent'
                          : 'border-white/[0.07] bg-white/[0.025] text-zinc-500'
                      }`}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="mt-4">
                <span className="text-[10px] font-medium uppercase tracking-[0.12em] text-zinc-500">
                  Тип упражнения
                </span>
                <div className="mt-2 grid grid-cols-2 gap-2 rounded-xl border border-white/[0.07] bg-white/[0.02] p-1">
                  <button
                    type="button"
                    onClick={() => setNewCompound(true)}
                    className={`rounded-lg px-3 py-2 text-[11px] font-medium transition ${
                      newCompound
                        ? 'bg-white/[0.08] text-white shadow-sm'
                        : 'text-zinc-500 hover:text-zinc-300'
                    }`}
                  >
                    Базовое
                  </button>
                  <button
                    type="button"
                    onClick={() => setNewCompound(false)}
                    className={`rounded-lg px-3 py-2 text-[11px] font-medium transition ${
                      !newCompound
                        ? 'bg-white/[0.08] text-white shadow-sm'
                        : 'text-zinc-500 hover:text-zinc-300'
                    }`}
                  >
                    Изолированное
                  </button>
                </div>
              </div>

              <div className="mt-4 flex items-start gap-2 rounded-xl border border-white/[0.06] bg-white/[0.02] p-3 text-[10px] leading-relaxed text-zinc-500">
                <Dumbbell className="mt-0.5 size-3.5 shrink-0 text-zinc-600" />
                Шаг веса — {defaultWeightStep(newGroup) === 5 ? '5' : '2,5'} кг. Для ног и
                спины прогрессия идёт по 5 кг, для остальных групп — по 2,5 кг.
              </div>

              {formError ? (
                <p className="mt-3 rounded-lg border border-red-400/15 bg-red-400/[0.06] px-3 py-2 text-[11px] text-red-200">
                  {formError}
                </p>
              ) : null}
            </div>

            <div className="shrink-0 border-t border-white/[0.06] px-3.5 pb-[max(env(safe-area-inset-bottom),12px)] pt-3">
              <button
                type="button"
                onClick={() => void handleCreate()}
                disabled={creating}
                className="flex w-full items-center justify-center gap-2 rounded-2xl bg-accent py-3.5 text-sm font-semibold text-black transition hover:bg-accent-strong active:scale-[0.99] disabled:opacity-60"
              >
                {creating ? <Loader2 className="size-4 animate-spin" /> : <Plus className="size-4" />}
                Создать и добавить
              </button>
            </div>
          </>
        )}
      </div>
    </Modal>
  )
}
