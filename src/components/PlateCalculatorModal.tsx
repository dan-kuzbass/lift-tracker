import { useId } from 'react'
import { AlertTriangle, Info, X } from 'lucide-react'
import { formatWeight } from '../lib/format'
import { calculatePlates, STANDARD_BAR_WEIGHT } from '../lib/plates'
import { Modal } from './ui/Modal'

interface PlateCalculatorModalProps {
  open: boolean
  weight: number
  exerciseName?: string
  onClose: () => void
}

const PLATE_COLORS: Record<number, string> = {
  25: '#f26b6b',
  20: '#5f9ff5',
  15: '#f2c94c',
  10: '#57c77a',
  5: '#e4e7ec',
  2.5: '#bd83ff',
  1.25: '#9aa5b5',
}

function plateHeight(weight: number): number {
  return 34 + weight * 4
}

export function PlateCalculatorModal({
  open,
  weight,
  exerciseName,
  onClose,
}: PlateCalculatorModalProps) {
  const titleId = useId()
  const breakdown = calculatePlates(weight, STANDARD_BAR_WEIGHT)
  const hasWeight = weight > 0
  const plates = breakdown.perSide.flatMap(({ weight: plate, count }) =>
    Array.from({ length: count }, () => plate),
  )
  const plateSummary =
    breakdown.perSide.length > 0
      ? breakdown.perSide.map(({ weight: plate, count }) => `${formatWeight(plate)} × ${count}`).join(' · ')
      : 'без блинов'
  const plateWidth = plates.length > 6 ? 8 : 10

  return (
    <Modal open={open} onClose={onClose} labelledBy={titleId}>
      <div className="flex max-h-[92dvh] flex-col">
        <div className="flex items-start justify-between gap-3 border-b border-white/[0.06] px-4 pb-3 pt-3">
          <div className="min-w-0">
            <p className="text-[9px] font-semibold uppercase tracking-[0.2em] text-zinc-500">
              Калькулятор
            </p>
            <h2 id={titleId} className="mt-1 text-xl font-semibold tracking-tight text-white">
              Блины на штангу
            </h2>
            {exerciseName ? (
              <p className="mt-1 truncate text-[11px] text-zinc-500">{exerciseName}</p>
            ) : null}
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

        <div className="overflow-y-auto px-4 pb-5 pt-4">
          <div className="flex items-end justify-between">
            <div>
              <div className="text-[9px] font-semibold uppercase tracking-[0.18em] text-zinc-500">
                Вес на штанге
              </div>
              <div className="mt-1 flex items-baseline gap-1.5">
                <span className="text-[34px] font-semibold leading-none tracking-[-0.04em] text-white tabular-nums">
                  {hasWeight ? formatWeight(weight) : '—'}
                </span>
                <span className="text-sm text-zinc-500">кг</span>
              </div>
            </div>
            <div className="rounded-xl border border-white/[0.07] bg-white/[0.035] px-3 py-2 text-right">
              <div className="text-[9px] uppercase tracking-[0.14em] text-zinc-600">Гриф</div>
              <div className="mt-0.5 text-sm font-semibold text-zinc-300">
                {STANDARD_BAR_WEIGHT} кг
              </div>
            </div>
          </div>

          <div className="relative mt-4 flex h-44 items-center justify-center overflow-hidden rounded-2xl border border-white/[0.06] bg-[radial-gradient(circle_at_50%_0%,rgba(255,255,255,0.04),transparent_60%)]">
            <div className="absolute inset-x-3 top-1/2 h-1.5 -translate-y-1/2 rounded-full bg-gradient-to-r from-zinc-800 via-zinc-500 to-zinc-800" />
            <div className="relative z-10 flex items-center gap-[3px]">
              <div className="flex items-center gap-[3px]">
                {[...plates].reverse().map((plate, index) => (
                  <div
                    key={`left-${plate}-${index}`}
                    className="rounded-[2px] border border-black/25 shadow-[inset_1px_0_rgba(255,255,255,0.25)]"
                    style={{
                      height: plateHeight(plate),
                      width: plateWidth,
                      backgroundColor: PLATE_COLORS[plate] ?? '#94a3b8',
                    }}
                  />
                ))}
              </div>
              <div className="h-9 w-14 rounded-lg border border-white/10 bg-[#20262e] shadow-[inset_0_1px_rgba(255,255,255,0.08)]" />
              <div className="flex items-center gap-[3px]">
                {plates.map((plate, index) => (
                  <div
                    key={`right-${plate}-${index}`}
                    className="rounded-[2px] border border-black/25 shadow-[inset_-1px_0_rgba(255,255,255,0.25)]"
                    style={{
                      height: plateHeight(plate),
                      width: plateWidth,
                      backgroundColor: PLATE_COLORS[plate] ?? '#94a3b8',
                    }}
                  />
                ))}
              </div>
            </div>
          </div>

          {!hasWeight ? (
            <div className="mt-4 rounded-2xl border border-white/[0.07] bg-white/[0.03] p-4 text-center text-[12px] leading-relaxed text-zinc-400">
              Укажите вес подхода, чтобы увидеть раскладку блинов.
            </div>
          ) : breakdown.isUnderBar ? (
            <div className="mt-4 flex items-start gap-2.5 rounded-2xl border border-amber-400/20 bg-amber-400/[0.07] p-3.5 text-[12px] leading-relaxed text-amber-100/90">
              <AlertTriangle className="mt-0.5 size-4 shrink-0" />
              Вес меньше грифа. Минимальный вес на штанге — {STANDARD_BAR_WEIGHT} кг.
            </div>
          ) : (
            <>
              <div className="mt-4 rounded-2xl border border-white/[0.07] bg-white/[0.025]">
                <div className="flex items-center justify-between gap-4 border-b border-white/[0.06] px-4 py-3">
                  <span className="text-[12px] text-zinc-500">На одну сторону</span>
                  <span className="text-right text-[12px] font-medium text-zinc-200">
                    {plateSummary}
                  </span>
                </div>
                <div className="flex items-center justify-between gap-4 px-4 py-3">
                  <span className="text-[12px] text-zinc-500">Итого на штанге</span>
                  <span className="text-[13px] font-semibold text-white tabular-nums">
                    {formatWeight(breakdown.loadedWeight)} кг
                  </span>
                </div>
              </div>

              <div className="mt-3 flex flex-wrap justify-center gap-1.5">
                {breakdown.perSide.map(({ weight: plate, count }) => (
                  <span
                    key={plate}
                    className="inline-flex items-center gap-1.5 rounded-full border border-white/[0.07] bg-white/[0.03] px-2.5 py-1 text-[10px] font-medium text-zinc-300"
                  >
                    <span
                      className="size-2 rounded-[2px]"
                      style={{ backgroundColor: PLATE_COLORS[plate] ?? '#94a3b8' }}
                    />
                    {formatWeight(plate)} × {count}
                  </span>
                ))}
              </div>

              {!breakdown.isExact ? (
                <div className="mt-3 flex items-start gap-2.5 rounded-2xl border border-amber-400/20 bg-amber-400/[0.07] p-3 text-[11px] leading-relaxed text-amber-100/90">
                  <AlertTriangle className="mt-0.5 size-3.5 shrink-0" />
                  Точный вес не собрать. Ближайший вариант —{' '}
                  {formatWeight(breakdown.loadedWeight)} кг, не хватает{' '}
                  {formatWeight(breakdown.remainder)} кг на сторону.
                </div>
              ) : null}
            </>
          )}

          <div className="mt-4 flex items-start gap-2 text-[10px] leading-relaxed text-zinc-600">
            <Info className="mt-0.5 size-3.5 shrink-0" />
            Стандартный набор: 25, 20, 15, 10, 5, 2,5 и 1,25 кг. Вес грифа — 20 кг.
          </div>
        </div>
      </div>
    </Modal>
  )
}
