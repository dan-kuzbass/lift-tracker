import { useState } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import {
  ArrowRight,
  ArrowUpRight,
  ChevronRight,
  CircleSlash2,
  Dumbbell,
  History,
  Loader2,
  Lock,
  Plus,
  Settings,
  Smartphone,
  Trophy,
} from 'lucide-react'
import {
  deleteCycle,
  startBaseTemplateWorkout,
  startEmptyWorkout,
  startPlannedWorkout,
} from '../db/actions'
import { getActiveCycleInfo, getRecentWorkoutSummaries } from '../db/queries'
import { CYCLE_WEEK_LABELS } from '../lib/cycle'
import {
  formatDurationLabel,
  formatHomeDate,
  formatTonnage,
  formatWeight,
  getDateBadge,
  pluralRu,
} from '../lib/format'
import { usePwaInstall } from '../hooks/usePwaInstall'
import { CycleSetupModal } from './CycleSetupModal'
import { SettingsModal } from './SettingsModal'
import { WorkoutDetailsModal } from './WorkoutDetailsModal'
import { Brand } from './ui/Brand'
import { ConfirmDialog } from './ui/ConfirmDialog'
import { useToast } from './ui/Toast'

type BusyAction = 'empty' | 'base' | 'cycle' | 'delete-cycle' | null

export function HomeScreen() {
  const { showToast } = useToast()
  const { canInstall, isInstalled, isIos, promptInstall } = usePwaInstall()
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [cycleSetupOpen, setCycleSetupOpen] = useState(false)
  const [detailsWorkoutId, setDetailsWorkoutId] = useState<number | null>(null)
  const [cycleDeleteOpen, setCycleDeleteOpen] = useState(false)
  const [busy, setBusy] = useState<BusyAction>(null)
  const [installing, setInstalling] = useState(false)

  const recentWorkouts = useLiveQuery(() => getRecentWorkoutSummaries(5), [])
  const cycle = useLiveQuery(() => getActiveCycleInfo(), [])

  const handleStartEmpty = async () => {
    if (busy !== null) return
    setBusy('empty')
    try {
      await startEmptyWorkout()
    } catch {
      showToast('Не удалось начать тренировку', 'error')
    } finally {
      setBusy(null)
    }
  }

  const handleStartBase = async () => {
    if (busy !== null) return
    setBusy('base')
    try {
      await startBaseTemplateWorkout()
    } catch {
      showToast('Не удалось запустить шаблон', 'error')
    } finally {
      setBusy(null)
    }
  }

  const handleStartCycleWorkout = async () => {
    if (busy !== null || cycle?.nextWorkout?.id === undefined) return
    setBusy('cycle')
    try {
      await startPlannedWorkout(cycle.nextWorkout.id)
    } catch {
      showToast('Не удалось начать тренировку цикла', 'error')
    } finally {
      setBusy(null)
    }
  }

  const handleDeleteCycle = async () => {
    if (!cycle || busy !== null) return
    setBusy('delete-cycle')
    try {
      await deleteCycle(cycle.cycleId)
      setCycleDeleteOpen(false)
      showToast('Цикл прерван. Завершённые тренировки остались в истории.')
    } catch {
      showToast('Не удалось прервать цикл', 'error')
    } finally {
      setBusy(null)
    }
  }

  const handleInstall = async () => {
    if (isInstalled) return
    if (canInstall) {
      setInstalling(true)
      try {
        const outcome = await promptInstall()
        if (outcome === 'accepted') showToast('Приложение установлено', 'success')
      } catch {
        showToast('Не удалось установить приложение', 'error')
      } finally {
        setInstalling(false)
      }
      return
    }
    setSettingsOpen(true)
  }

  const firstSet = cycle?.nextSets[0]
  const cycleSetsInfo =
    firstSet && cycle
      ? `${cycle.nextSets.length} × ${firstSet.reps} · ${formatWeight(firstSet.weight)} кг`
      : null
  const nextWeekLabel =
    cycle?.nextWorkout?.week !== undefined ? CYCLE_WEEK_LABELS[cycle.nextWorkout.week] : null
  const showInstallBanner = !isInstalled && (canInstall || isIos) && !settingsOpen

  return (
    <div className="min-h-dvh bg-[#0a0e13]">
      <header className="sticky top-0 z-30 bg-[#0a0e13]/88 backdrop-blur-xl">
        <div className="safe-top flex items-center justify-between px-3 pb-2 min-[400px]:px-4">
          <Brand />
          <button
            type="button"
            onClick={() => setSettingsOpen(true)}
            aria-label="Настройки"
            className="flex size-10 items-center justify-center rounded-full border border-white/[0.07] bg-white/[0.025] text-zinc-500 transition hover:bg-white/[0.05] hover:text-zinc-200"
          >
            <Settings className="size-[17px]" />
          </button>
        </div>
      </header>

      <main className="px-3 pt-4 min-[400px]:px-4">
        <p className="text-[8px] font-semibold uppercase tracking-[0.2em] text-zinc-600">
          {formatHomeDate()}
        </p>
        <h1 className="mt-2 text-[31px] font-semibold leading-none tracking-[-0.045em] text-white">
          Тренировка
        </h1>
        <p className="mt-2.5 max-w-[300px] text-[12px] leading-relaxed text-zinc-500">
          Записывай подходы. Следующий вес посчитается сам — по двойной прогрессии и RPE.
        </p>

        <button
          type="button"
          onClick={() => void handleStartEmpty()}
          disabled={busy !== null}
          className="group relative mt-5 flex w-full items-center gap-3 overflow-hidden rounded-[26px] bg-accent p-3.5 text-left text-black shadow-[0_18px_50px_rgba(211,249,95,0.13)] transition hover:bg-accent-strong active:scale-[0.995] disabled:opacity-70"
        >
          <span className="pointer-events-none absolute -right-8 -top-12 size-36 rounded-full border border-black/[0.06]" />
          <span className="pointer-events-none absolute -right-3 -top-5 size-20 rounded-full border border-black/[0.05]" />
          <span className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-black/[0.1] text-black">
            {busy === 'empty' ? (
              <Loader2 className="size-5 animate-spin" />
            ) : (
              <Plus className="size-5" strokeWidth={2.6} />
            )}
          </span>
          <span className="min-w-0 flex-1">
            <span className="block text-[14px] font-semibold leading-tight">
              Начать пустую тренировку
            </span>
            <span className="mt-1 block text-[10px] font-medium text-black/55">
              Свободный режим · любые упражнения
            </span>
          </span>
          <ArrowUpRight className="size-4 shrink-0 text-black/55 transition group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
        </button>

        {cycle ? (
          <section className="mt-5">
            <div className="relative overflow-hidden rounded-[28px] border border-accent/20 bg-[linear-gradient(140deg,rgba(211,249,95,0.09),rgba(211,249,95,0.02)_52%,transparent)] p-4">
              <div className="pointer-events-none absolute -right-14 -top-16 size-40 rounded-full bg-accent/[0.07] blur-2xl" />
              <div className="relative">
                <div className="flex items-center justify-between gap-3">
                  <span className="inline-flex items-center gap-1.5 text-[8px] font-semibold uppercase tracking-[0.18em] text-accent/80">
                    <span className="live-dot size-1.5 rounded-full bg-accent" />
                    Активный цикл
                  </span>
                  <button
                    type="button"
                    onClick={() => setCycleDeleteOpen(true)}
                    disabled={busy !== null}
                    className="text-[9px] font-medium text-zinc-600 underline-offset-4 transition hover:text-zinc-400 hover:underline disabled:opacity-50"
                  >
                    Прервать
                  </button>
                </div>

                <div className="mt-2.5 flex items-start justify-between gap-3">
                  <div>
                    <h2 className="text-[18px] font-semibold tracking-[-0.02em] text-white">
                      Пауэрлифтинг
                    </h2>
                    <p className="mt-0.5 text-[10px] text-zinc-500">
                      4-недельный силовой цикл
                    </p>
                  </div>
                  <div className="shrink-0 text-right">
                    <div className="text-[19px] font-semibold leading-none text-zinc-200 tabular-nums">
                      {cycle.completedCount}
                      <span className="text-[11px] text-zinc-600"> / {cycle.total}</span>
                    </div>
                    <div className="mt-1 text-[8px] uppercase tracking-[0.12em] text-zinc-600">
                      завершено
                    </div>
                  </div>
                </div>

                <div className="mt-3 flex gap-1">
                  {Array.from({ length: cycle.total }).map((_, index) => (
                    <span
                      key={index}
                      className={`h-1 flex-1 rounded-full ${
                        index < cycle.completedCount
                          ? 'bg-accent/80'
                          : index === cycle.completedCount
                            ? 'bg-accent/25'
                            : 'bg-white/[0.06]'
                      }`}
                    />
                  ))}
                </div>

                {cycle.nextWorkout ? (
                  <div className="mt-3 flex items-center gap-2.5 rounded-2xl border border-white/[0.07] bg-[#080c10]/50 p-2.5">
                    <span className="flex size-9 shrink-0 items-center justify-center rounded-xl border border-white/[0.07] bg-white/[0.03] text-zinc-400">
                      <Trophy className="size-4" />
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="text-[8px] font-medium uppercase tracking-[0.15em] text-zinc-600">
                        Следующая тренировка
                      </div>
                      <div className="mt-0.5 truncate text-[12px] font-semibold text-zinc-200">
                        {cycle.nextWorkout.name}
                      </div>
                      <div className="mt-0.5 flex items-center gap-1.5 text-[9px] text-zinc-500">
                        {cycleSetsInfo ? <span>{cycleSetsInfo}</span> : null}
                        {nextWeekLabel ? (
                          <>
                            <span className="text-zinc-700">·</span>
                            <span>{nextWeekLabel}</span>
                          </>
                        ) : null}
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => void handleStartCycleWorkout()}
                      disabled={busy !== null}
                      aria-label="Начать тренировку цикла"
                      className="flex h-8 shrink-0 items-center gap-1 rounded-xl bg-accent px-2.5 text-[10px] font-semibold text-black transition hover:bg-accent-strong disabled:opacity-60"
                    >
                      {busy === 'cycle' ? (
                        <Loader2 className="size-3 animate-spin" />
                      ) : (
                        <ArrowRight className="size-3" />
                      )}
                      Начать
                    </button>
                  </div>
                ) : (
                  <div className="mt-3 flex items-center gap-2 rounded-2xl border border-white/[0.07] bg-[#080c10]/50 p-3 text-[11px] text-zinc-500">
                    <CircleSlash2 className="size-4" />
                    В цикле не осталось запланированных тренировок
                  </div>
                )}
              </div>
            </div>
          </section>
        ) : null}

        <section className="mt-6">
          <div className="flex items-end justify-between px-0.5">
            <div>
              <p className="text-[8px] font-semibold uppercase tracking-[0.18em] text-zinc-600">
                Программы
              </p>
              <h2 className="mt-1 text-[15px] font-semibold tracking-tight text-zinc-100">
                Шаблоны
              </h2>
            </div>
            <span className="pb-0.5 text-[9px] text-zinc-700">
              {cycle ? '1 доступен' : '2 доступны'}
            </span>
          </div>

          <div className="mt-2.5 space-y-2">
            <button
              type="button"
              onClick={() => void handleStartBase()}
              disabled={busy !== null}
              className="group flex w-full items-center gap-3 rounded-3xl border border-white/[0.07] bg-white/[0.025] p-3 text-left transition hover:border-white/[0.12] hover:bg-white/[0.04] active:scale-[0.997] disabled:opacity-60"
            >
              <span className="flex size-11 shrink-0 items-center justify-center rounded-2xl border border-accent/15 bg-accent/[0.06] text-accent">
                <Dumbbell className="size-5" />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block text-[12px] font-semibold text-zinc-100">
                  База: Присед + Жим
                </span>
                <span className="mt-0.5 block text-[9.5px] leading-snug text-zinc-500">
                  Свободный режим · двойная прогрессия
                </span>
              </span>
              <span className="flex size-8 shrink-0 items-center justify-center rounded-full border border-white/[0.07] text-zinc-600 transition group-hover:border-white/[0.12] group-hover:text-zinc-300">
                {busy === 'base' ? (
                  <Loader2 className="size-3.5 animate-spin" />
                ) : (
                  <ChevronRight className="size-3.5" />
                )}
              </span>
            </button>

            {cycle === null ? (
              <button
                type="button"
                onClick={() => setCycleSetupOpen(true)}
                disabled={busy !== null}
                className="group flex w-full items-center gap-3 rounded-3xl border border-white/[0.07] bg-white/[0.025] p-3 text-left transition hover:border-white/[0.12] hover:bg-white/[0.04] active:scale-[0.997] disabled:opacity-60"
              >
                <span className="flex size-11 shrink-0 items-center justify-center rounded-2xl border border-white/[0.07] bg-white/[0.035] text-zinc-400">
                  <Trophy className="size-5" />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block text-[12px] font-semibold text-zinc-100">
                    Пауэрлифтинг
                  </span>
                  <span className="mt-0.5 block text-[9.5px] leading-snug text-zinc-500">
                    4-недельный цикл · 12 тренировок от 1ПМ
                  </span>
                </span>
                <span className="flex size-8 shrink-0 items-center justify-center rounded-full border border-white/[0.07] text-zinc-600 transition group-hover:border-white/[0.12] group-hover:text-zinc-300">
                  <ChevronRight className="size-3.5" />
                </span>
              </button>
            ) : null}
          </div>
        </section>

        <section className="mt-6">
          <div className="flex items-end justify-between px-0.5">
            <div>
              <p className="text-[8px] font-semibold uppercase tracking-[0.18em] text-zinc-600">
                Журнал
              </p>
              <h2 className="mt-1 text-[15px] font-semibold tracking-tight text-zinc-100">
                Последние тренировки
              </h2>
            </div>
            {recentWorkouts && recentWorkouts.length > 0 ? (
              <span className="pb-0.5 text-[9px] text-zinc-700">
                {recentWorkouts.length} из истории
              </span>
            ) : null}
          </div>

          <div className="mt-2.5 space-y-1.5">
            {recentWorkouts === undefined ? (
              <>
                {Array.from({ length: 3 }).map((_, index) => (
                  <div
                    key={index}
                    className="h-[62px] animate-pulse rounded-2xl border border-white/[0.05] bg-white/[0.02]"
                  />
                ))}
              </>
            ) : recentWorkouts.length === 0 ? (
              <div className="flex flex-col items-center rounded-2xl border border-dashed border-white/[0.08] bg-white/[0.012] px-5 py-8 text-center">
                <History className="size-5 text-zinc-700" />
                <p className="mt-2 text-[12px] font-medium text-zinc-400">История пока пуста</p>
                <p className="mt-1 text-[10px] leading-relaxed text-zinc-600">
                  Завершённые тренировки появятся здесь. Начните с пустой сессии или шаблона.
                </p>
              </div>
            ) : (
              recentWorkouts.map((summary) => {
                const badge = getDateBadge(summary.workout.date)
                return (
                  <button
                    key={summary.workout.id}
                    type="button"
                    onClick={() =>
                      summary.workout.id !== undefined && setDetailsWorkoutId(summary.workout.id)
                    }
                    className="group flex w-full items-center gap-2.5 rounded-2xl border border-white/[0.055] bg-white/[0.02] p-2.5 text-left transition hover:border-white/[0.1] hover:bg-white/[0.035]"
                  >
                    <span className="flex w-10 shrink-0 flex-col items-center rounded-xl border border-white/[0.06] bg-white/[0.025] py-1.5">
                      <span className="text-[16px] font-semibold leading-none text-zinc-300 tabular-nums">
                        {badge.day}
                      </span>
                      <span className="mt-0.5 text-[7px] font-semibold uppercase tracking-[0.08em] text-zinc-600">
                        {badge.month}
                      </span>
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-[11.5px] font-medium text-zinc-200">
                        {summary.workout.name}
                      </span>
                      <span className="mt-0.5 block truncate text-[9px] text-zinc-600">
                        {summary.exerciseCount}{' '}
                        {pluralRu(summary.exerciseCount, [
                          'упражнение',
                          'упражнения',
                          'упражнений',
                        ])}{' '}
                        · {summary.completedSets}{' '}
                        {pluralRu(summary.completedSets, ['подход', 'подхода', 'подходов'])} ·{' '}
                        {formatDurationLabel(summary.workout.durationSeconds)}
                      </span>
                    </span>
                    <span className="shrink-0 text-right">
                      <span className="block text-[11.5px] font-semibold text-zinc-300 tabular-nums">
                        {formatTonnage(summary.tonnage)}
                      </span>
                      <span className="block text-[7px] font-medium uppercase tracking-[0.08em] text-zinc-600">
                        кг
                      </span>
                    </span>
                    <ChevronRight className="size-3 shrink-0 text-zinc-700" />
                  </button>
                )
              })
            )}
          </div>
        </section>

        {showInstallBanner ? (
          <button
            type="button"
            onClick={() => void handleInstall()}
            disabled={installing}
            className="mt-5 flex w-full items-center gap-3 rounded-2xl border border-white/[0.07] bg-white/[0.02] p-3 text-left transition hover:bg-white/[0.035] disabled:opacity-60"
          >
            <span className="flex size-9 shrink-0 items-center justify-center rounded-xl border border-white/[0.07] bg-white/[0.03] text-zinc-400">
              {installing ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <Smartphone className="size-4" />
              )}
            </span>
            <span className="min-w-0 flex-1">
              <span className="block text-[11px] font-medium text-zinc-300">
                Установить «Подход» на экран Домой
              </span>
              <span className="mt-0.5 block text-[9px] text-zinc-600">
                Открывайте без интернета как обычное приложение
              </span>
            </span>
            <span className="rounded-full border border-accent/20 bg-accent/[0.06] px-2 py-1 text-[8px] font-semibold uppercase tracking-wide text-accent/70">
              PWA
            </span>
          </button>
        ) : null}

        <div className="mt-7 flex items-center justify-center gap-1.5 pb-8 text-[9px] text-zinc-700">
          <Lock className="size-3" />
          Данные хранятся только на этом устройстве
        </div>
      </main>

      <SettingsModal open={settingsOpen} onClose={() => setSettingsOpen(false)} />
      <CycleSetupModal open={cycleSetupOpen} onClose={() => setCycleSetupOpen(false)} />
      <WorkoutDetailsModal
        workoutId={detailsWorkoutId}
        onClose={() => setDetailsWorkoutId(null)}
      />

      <ConfirmDialog
        open={cycleDeleteOpen}
        title="Прервать силовой цикл?"
        description="Запланированные тренировки будут удалены. Завершённые — останутся в истории. Текущий прогресс цикла остановится."
        confirmLabel="Прервать"
        tone="danger"
        busy={busy === 'delete-cycle'}
        onConfirm={() => void handleDeleteCycle()}
        onClose={() => setCycleDeleteOpen(false)}
      />
    </div>
  )
}
