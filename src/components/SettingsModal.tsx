import { useId, useRef, useState, type ReactNode } from 'react'
import {
  CheckCircle2,
  Database,
  Download,
  Info,
  Loader2,
  Share,
  ShieldCheck,
  Smartphone,
  Trash2,
  Upload,
  X,
  type LucideIcon,
} from 'lucide-react'
import { parseBackupFile, restoreBackup, downloadBackupFile, type BackupPayload } from '../db/backup'
import { resetAllData } from '../db/actions'
import { usePwaInstall } from '../hooks/usePwaInstall'
import { REST_TIMER_STORAGE_KEY, useRestTimer } from '../hooks/useRestTimer'
import { Modal } from './ui/Modal'
import { ConfirmDialog } from './ui/ConfirmDialog'
import { BrandMark } from './ui/Brand'
import { useToast } from './ui/Toast'

interface SettingsModalProps {
  open: boolean
  onClose: () => void
}

type BusyAction = 'backup' | 'restore' | 'install' | 'reset' | null

interface SettingsRowProps {
  icon: LucideIcon
  title: string
  subtitle: string
  onClick?: () => void
  disabled?: boolean
  danger?: boolean
  trailing?: ReactNode
  iconTone?: 'accent' | 'neutral' | 'danger'
}

function SettingsRow({
  icon: Icon,
  title,
  subtitle,
  onClick,
  disabled = false,
  danger = false,
  trailing,
  iconTone = 'neutral',
}: SettingsRowProps) {
  const iconClass =
    iconTone === 'accent'
      ? 'border-accent/15 bg-accent/[0.07] text-accent'
      : iconTone === 'danger'
        ? 'border-red-400/15 bg-red-400/[0.07] text-red-300'
        : 'border-white/[0.07] bg-white/[0.035] text-zinc-400'

  const content = (
    <>
      <span
        className={`flex size-9 shrink-0 items-center justify-center rounded-xl border ${iconClass}`}
      >
        <Icon className="size-4" />
      </span>
      <span className="min-w-0 flex-1">
        <span
          className={`block text-[12px] font-medium ${danger ? 'text-red-200' : 'text-zinc-200'}`}
        >
          {title}
        </span>
        <span className="mt-0.5 block text-[10px] leading-snug text-zinc-600">{subtitle}</span>
      </span>
      {trailing}
    </>
  )

  if (!onClick) {
    return <div className="flex items-center gap-3 px-3.5 py-3">{content}</div>
  }

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className="flex w-full items-center gap-3 px-3.5 py-3 text-left transition hover:bg-white/[0.03] disabled:opacity-50"
    >
      {content}
    </button>
  )
}

export function SettingsModal({ open, onClose }: SettingsModalProps) {
  const titleId = useId()
  const { showToast } = useToast()
  const { hide: hideRestTimer } = useRestTimer()
  const { canInstall, isInstalled, isIos, promptInstall } = usePwaInstall()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [busy, setBusy] = useState<BusyAction>(null)
  const [pendingRestore, setPendingRestore] = useState<{
    backup: BackupPayload
    fileName: string
  } | null>(null)
  const [restoreConfirmOpen, setRestoreConfirmOpen] = useState(false)
  const [resetConfirmOpen, setResetConfirmOpen] = useState(false)

  const clearRestTimer = () => {
    try {
      window.localStorage.removeItem(REST_TIMER_STORAGE_KEY)
    } catch {
      return
    }
    hideRestTimer()
  }

  const handleBackup = async () => {
    setBusy('backup')
    try {
      await downloadBackupFile()
      showToast('Бэкап скачан', 'success')
    } catch {
      showToast('Не удалось создать бэкап', 'error')
    } finally {
      setBusy(null)
    }
  }

  const handleFile = async (file: File | undefined) => {
    if (!file) return
    if (file.size > 20 * 1024 * 1024) {
      showToast('Файл слишком большой', 'error')
      return
    }
    try {
      const text = await file.text()
      const backup = parseBackupFile(text)
      setPendingRestore({ backup, fileName: file.name })
      setRestoreConfirmOpen(true)
    } catch (caught) {
      showToast(caught instanceof Error ? caught.message : 'Некорректный файл', 'error')
    }
  }

  const handleRestore = async () => {
    if (!pendingRestore) return
    setBusy('restore')
    try {
      await restoreBackup(pendingRestore.backup)
      clearRestTimer()
      setRestoreConfirmOpen(false)
      setPendingRestore(null)
      onClose()
      showToast('Данные восстановлены из бэкапа', 'success')
    } catch {
      showToast('Не удалось восстановить бэкап', 'error')
    } finally {
      setBusy(null)
    }
  }

  const handleReset = async () => {
    setBusy('reset')
    try {
      await resetAllData()
      clearRestTimer()
      setResetConfirmOpen(false)
      onClose()
      showToast('Все данные удалены', 'success')
    } catch {
      showToast('Не удалось удалить данные', 'error')
    } finally {
      setBusy(null)
    }
  }

  const handleInstall = async () => {
    if (!canInstall) return
    setBusy('install')
    try {
      const outcome = await promptInstall()
      if (outcome === 'accepted') {
        showToast('Приложение установлено', 'success')
      } else if (outcome === 'dismissed') {
        showToast('Установка отменена', 'info')
      }
    } catch {
      showToast('Не удалось открыть установку', 'error')
    } finally {
      setBusy(null)
    }
  }

  const installSubtitle = isInstalled
    ? 'Приложение открыто с экрана Домой'
    : canInstall
      ? 'Добавьте «Подход» на главный экран'
      : isIos
        ? 'Safari → «Поделиться» → «На экран Домой»'
        : 'Доступно в Chrome и Safari на смартфоне'

  return (
    <>
      <Modal open={open} onClose={onClose} labelledBy={titleId}>
        <div className="flex max-h-[92dvh] flex-col">
          <div className="flex shrink-0 items-center justify-between gap-3 border-b border-white/[0.06] px-4 pb-3 pt-3">
            <div className="flex items-center gap-3">
              <BrandMark className="size-9 rounded-xl" />
              <div>
                <p className="text-[8px] font-semibold uppercase tracking-[0.2em] text-zinc-600">
                  Подход
                </p>
                <h2 id={titleId} className="mt-0.5 text-[20px] font-semibold tracking-tight text-white">
                  Настройки
                </h2>
              </div>
            </div>
            <button
              type="button"
              onClick={onClose}
              aria-label="Закрыть"
              className="flex size-8 items-center justify-center rounded-full border border-white/[0.08] text-zinc-500 transition hover:bg-white/5 hover:text-white"
            >
              <X className="size-3.5" />
            </button>
          </div>

          <div className="overflow-y-auto px-4 pb-5 pt-4">
            <div>
              <h3 className="mb-2 px-1 text-[9px] font-semibold uppercase tracking-[0.16em] text-zinc-600">
                Данные
              </h3>
              <div className="divide-y divide-white/[0.05] overflow-hidden rounded-2xl border border-white/[0.06] bg-white/[0.02]">
                <SettingsRow
                  icon={Download}
                  iconTone="accent"
                  title="Скачать бэкап (JSON)"
                  subtitle="История, упражнения и настройки цикла"
                  onClick={() => void handleBackup()}
                  disabled={busy !== null}
                  trailing={
                    busy === 'backup' ? (
                      <Loader2 className="size-4 animate-spin text-zinc-500" />
                    ) : (
                      <Download className="size-4 text-zinc-600" />
                    )
                  }
                />
                <SettingsRow
                  icon={Upload}
                  title="Восстановить из файла"
                  subtitle="Заменить все данные из JSON-бэкапа"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={busy !== null}
                  trailing={<Upload className="size-4 text-zinc-600" />}
                />
              </div>
              <p className="mt-2 flex items-start gap-1.5 px-1 text-[9px] leading-relaxed text-zinc-600">
                <ShieldCheck className="mt-0.5 size-3 shrink-0" />
                Данные хранятся только в этом браузере. Регулярный бэкап защитит историю при
                очистке кэша.
              </p>
            </div>

            <div className="mt-5">
              <h3 className="mb-2 px-1 text-[9px] font-semibold uppercase tracking-[0.16em] text-zinc-600">
                Приложение
              </h3>
              <div className="divide-y divide-white/[0.05] overflow-hidden rounded-2xl border border-white/[0.06] bg-white/[0.02]">
                <SettingsRow
                  icon={isInstalled ? CheckCircle2 : Smartphone}
                  iconTone={isInstalled ? 'accent' : 'neutral'}
                  title={isInstalled ? 'Установлено на экран Домой' : 'Установить на экран Домой'}
                  subtitle={installSubtitle}
                  onClick={
                    canInstall && !isInstalled && busy === null
                      ? () => void handleInstall()
                      : undefined
                  }
                  disabled={busy !== null}
                  trailing={
                    busy === 'install' ? (
                      <Loader2 className="size-4 animate-spin text-zinc-500" />
                    ) : isInstalled ? (
                      <CheckCircle2 className="size-4 text-emerald-400" />
                    ) : canInstall ? (
                      <Smartphone className="size-4 text-zinc-600" />
                    ) : (
                      <Info className="size-4 text-zinc-600" />
                    )
                  }
                />
                {isIos && !isInstalled ? (
                  <SettingsRow
                    icon={Share}
                    title="Как установить на iPhone"
                    subtitle="Откройте сайт в Safari, нажмите «Поделиться» и выберите «На экран Домой»."
                  />
                ) : null}
                <SettingsRow
                  icon={Database}
                  title="Локальное хранилище"
                  subtitle="IndexedDB · без аккаунта и сервера"
                  trailing={<span className="text-[9px] text-zinc-700">local-only</span>}
                />
              </div>
            </div>

            <div className="mt-5">
              <h3 className="mb-2 px-1 text-[9px] font-semibold uppercase tracking-[0.16em] text-zinc-600">
                Опасная зона
              </h3>
              <div className="overflow-hidden rounded-2xl border border-red-400/10 bg-red-400/[0.02]">
                <SettingsRow
                  icon={Trash2}
                  iconTone="danger"
                  title="Стереть все данные"
                  subtitle="Тренировки, история и упражнения будут удалены"
                  danger
                  onClick={() => setResetConfirmOpen(true)}
                  disabled={busy !== null}
                />
              </div>
            </div>

            <div className="mt-6 flex items-center justify-between px-1 text-[9px] text-zinc-700">
              <span>Подход · MVP</span>
              <span>данные не покидают устройство</span>
            </div>
          </div>
        </div>
      </Modal>

      <input
        ref={fileInputRef}
        type="file"
        accept="application/json,.json"
        className="hidden"
        onChange={(event) => {
          const file = event.target.files?.[0]
          event.target.value = ''
          void handleFile(file)
        }}
      />

      <ConfirmDialog
        open={restoreConfirmOpen}
        title="Восстановить из файла?"
        description={
          pendingRestore
            ? `Все текущие данные будут заменены содержимым «${pendingRestore.fileName}». Скачайте актуальный бэкап, если не уверены.`
            : 'Все текущие данные будут заменены.'
        }
        confirmLabel="Восстановить"
        tone="danger"
        busy={busy === 'restore'}
        onConfirm={() => void handleRestore()}
        onClose={() => {
          setRestoreConfirmOpen(false)
          setPendingRestore(null)
        }}
      />

      <ConfirmDialog
        open={resetConfirmOpen}
        title="Стереть все данные?"
        description="Будут удалены все тренировки, история, цикл и созданные упражнения. Это действие нельзя отменить."
        confirmLabel="Стереть"
        tone="danger"
        busy={busy === 'reset'}
        onConfirm={() => void handleReset()}
        onClose={() => setResetConfirmOpen(false)}
      />
    </>
  )
}
