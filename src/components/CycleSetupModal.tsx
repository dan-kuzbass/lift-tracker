import { useId, useMemo, useState } from 'react'
import { ArrowRight, Loader2, Trophy, X } from 'lucide-react'
import { createPowerliftingCycle } from '../db/actions'
import { buildPowerliftingCycle } from '../lib/cycle'
import { formatWeight, parseNumericInput } from '../lib/format'
import { Modal } from './ui/Modal'
import { useToast } from './ui/Toast'

interface CycleSetupModalProps {
  open: boolean
  onClose: () => void
}

const weekRows = [
  { week: 'Неделя 1', label: 'Втягивающая', value: '70% · 4×6' },
  { week: 'Неделя 2', label: 'Объёмная', value: '75% · 4×5' },
  { week: 'Неделя 3', label: 'Силовая', value: '82,5% · 3×3' },
  { week: 'Неделя 4', label: 'Пик', value: '87,5% · 50% · 102,5%' },
]

export function CycleSetupModal({ open, onClose }: CycleSetupModalProps) {
  const titleId = useId()
  const { showToast } = useToast()
  const [squat, setSquat] = useState('')
  const [bench, setBench] = useState('')
  const [deadlift, setDeadlift] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  const parsed = useMemo(() => {
    const squatValue = parseNumericInput(squat)
    const benchValue = parseNumericInput(bench)
    const deadliftValue = parseNumericInput(deadlift)
    if (
      squatValue === null ||
      benchValue === null ||
      deadliftValue === null ||
      squatValue <= 0 ||
      benchValue <= 0 ||
      deadliftValue <= 0
    ) {
      return null
    }
    return { squat1RM: squatValue, bench1RM: benchValue, deadlift1RM: deadliftValue }
  }, [squat, bench, deadlift])

  const firstWeek = useMemo(() => {
    if (!parsed) return null
    return buildPowerliftingCycle(parsed).slice(0, 3)
  }, [parsed])

  const handleSubmit = async () => {
    if (!parsed) {
      setError('Заполните текущие 1ПМ для всех трёх движений')
      return
    }
    setBusy(true)
    setError(null)
    try {
      await createPowerliftingCycle(parsed)
      showToast('Цикл создан: 12 тренировок добавлены в программу', 'success')
      setSquat('')
      setBench('')
      setDeadlift('')
      onClose()
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Не удалось создать цикл')
    } finally {
      setBusy(false)
    }
  }

  const inputClass =
    'w-[76px] bg-transparent text-right text-[19px] font-semibold tracking-tight text-white outline-none placeholder:text-zinc-700 tabular-nums'

  return (
    <Modal open={open} onClose={busy ? () => undefined : onClose} labelledBy={titleId}>
      <div className="flex max-h-[92dvh] flex-col">
        <div className="flex items-start justify-between gap-3 border-b border-white/[0.06] px-4 pb-3 pt-3">
          <div className="flex items-center gap-3">
            <span className="flex size-10 items-center justify-center rounded-2xl bg-accent/10 text-accent">
              <Trophy className="size-4.5" />
            </span>
            <div>
              <p className="text-[8px] font-semibold uppercase tracking-[0.2em] text-zinc-600">
                Программа
              </p>
              <h2 id={titleId} className="mt-0.5 text-[20px] font-semibold tracking-tight text-white">
                Силовой цикл
              </h2>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={busy}
            aria-label="Закрыть"
            className="flex size-8 shrink-0 items-center justify-center rounded-full border border-white/[0.08] text-zinc-500 transition hover:bg-white/5 hover:text-white disabled:opacity-40"
          >
            <X className="size-3.5" />
          </button>
        </div>

        <div className="overflow-y-auto px-4 pb-5 pt-4">
          <p className="text-[12px] leading-relaxed text-zinc-500">
            4 недели · 3 тренировки в неделю. Присед, жим и тяга идут отдельными днями,
            веса рассчитываются от ваших текущих максимумов.
          </p>

          <div className="mt-4 space-y-2">
            <label className="flex items-center justify-between gap-3 rounded-2xl border border-white/[0.07] bg-white/[0.025] px-3.5 py-3 transition focus-within:border-accent/30">
              <span>
                <span className="block text-[12px] font-medium text-zinc-200">Присед</span>
                <span className="mt-0.5 block text-[9px] text-zinc-600">Текущий 1ПМ</span>
              </span>
              <span className="flex items-baseline gap-1">
                <input
                  type="text"
                  inputMode="decimal"
                  value={squat}
                  onChange={(event) => {
                    setSquat(event.target.value)
                    setError(null)
                  }}
                  placeholder="140"
                  aria-label="Присед, текущий 1ПМ"
                  className={inputClass}
                />
                <span className="text-[10px] text-zinc-600">кг</span>
              </span>
            </label>

            <label className="flex items-center justify-between gap-3 rounded-2xl border border-white/[0.07] bg-white/[0.025] px-3.5 py-3 transition focus-within:border-accent/30">
              <span>
                <span className="block text-[12px] font-medium text-zinc-200">Жим лёжа</span>
                <span className="mt-0.5 block text-[9px] text-zinc-600">Текущий 1ПМ</span>
              </span>
              <span className="flex items-baseline gap-1">
                <input
                  type="text"
                  inputMode="decimal"
                  value={bench}
                  onChange={(event) => {
                    setBench(event.target.value)
                    setError(null)
                  }}
                  placeholder="100"
                  aria-label="Жим лёжа, текущий 1ПМ"
                  className={inputClass}
                />
                <span className="text-[10px] text-zinc-600">кг</span>
              </span>
            </label>

            <label className="flex items-center justify-between gap-3 rounded-2xl border border-white/[0.07] bg-white/[0.025] px-3.5 py-3 transition focus-within:border-accent/30">
              <span>
                <span className="block text-[12px] font-medium text-zinc-200">Становая тяга</span>
                <span className="mt-0.5 block text-[9px] text-zinc-600">Текущий 1ПМ</span>
              </span>
              <span className="flex items-baseline gap-1">
                <input
                  type="text"
                  inputMode="decimal"
                  value={deadlift}
                  onChange={(event) => {
                    setDeadlift(event.target.value)
                    setError(null)
                  }}
                  placeholder="180"
                  aria-label="Становая тяга, текущий 1ПМ"
                  className={inputClass}
                />
                <span className="text-[10px] text-zinc-600">кг</span>
              </span>
            </label>
          </div>

          {firstWeek ? (
            <div className="mt-3 rounded-xl border border-accent/10 bg-accent/[0.035] px-3 py-2.5 text-[10px] leading-relaxed text-accent/70">
              Неделя 1: {firstWeek.map((plan) => `${plan.liftName} ${formatWeight(plan.weight)} кг`).join(' · ')}
            </div>
          ) : null}

          <div className="mt-4 rounded-2xl border border-white/[0.06] bg-white/[0.02] p-3.5">
            <div className="flex items-center justify-between">
              <h3 className="text-[11px] font-semibold text-zinc-300">Сетка цикла</h3>
              <span className="text-[9px] text-zinc-600">12 тренировок</span>
            </div>
            <div className="mt-2.5 space-y-1.5">
              {weekRows.map((row) => (
                <div key={row.week} className="flex items-center justify-between text-[10px]">
                  <span className="text-zinc-500">
                    {row.week} · <span className="text-zinc-400">{row.label}</span>
                  </span>
                  <span className="font-medium tabular-nums text-zinc-500">{row.value}</span>
                </div>
              ))}
            </div>
          </div>

          {error ? (
            <p className="mt-3 rounded-xl border border-red-400/15 bg-red-400/[0.06] px-3 py-2 text-[11px] leading-relaxed text-red-200">
              {error}
            </p>
          ) : null}
        </div>

        <div className="shrink-0 border-t border-white/[0.06] px-4 pb-[max(env(safe-area-inset-bottom),14px)] pt-3">
          <button
            type="button"
            onClick={() => void handleSubmit()}
            disabled={busy}
            className="flex w-full items-center justify-center gap-2 rounded-2xl bg-accent py-3.5 text-sm font-semibold text-black transition hover:bg-accent-strong active:scale-[0.99] disabled:opacity-60"
          >
            {busy ? <Loader2 className="size-4 animate-spin" /> : null}
            Создать 12 тренировок
            {!busy ? <ArrowRight className="size-4" /> : null}
          </button>
        </div>
      </div>
    </Modal>
  )
}
