import { useId } from 'react'
import { AlertTriangle, Loader2 } from 'lucide-react'
import { Modal } from './Modal'

interface ConfirmDialogProps {
  open: boolean
  title: string
  description?: string
  confirmLabel?: string
  cancelLabel?: string
  tone?: 'default' | 'danger'
  busy?: boolean
  onConfirm: () => void
  onClose: () => void
}

export function ConfirmDialog({
  open,
  title,
  description,
  confirmLabel = 'Подтвердить',
  cancelLabel = 'Отмена',
  tone = 'default',
  busy = false,
  onConfirm,
  onClose,
}: ConfirmDialogProps) {
  const titleId = useId()

  return (
    <Modal open={open} onClose={busy ? () => undefined : onClose} variant="dialog" labelledBy={titleId}>
      <div className="p-5">
        <div
          className={`mb-4 flex size-11 items-center justify-center rounded-2xl ${
            tone === 'danger'
              ? 'bg-red-500/12 text-red-300'
              : 'bg-accent/10 text-accent'
          }`}
        >
          <AlertTriangle className="size-5" />
        </div>
        <h2 id={titleId} className="text-lg font-semibold tracking-tight text-white">
          {title}
        </h2>
        {description ? (
          <p className="mt-2 text-[13px] leading-relaxed text-zinc-400">{description}</p>
        ) : null}
        <div className="mt-6 grid grid-cols-2 gap-2.5">
          <button
            type="button"
            onClick={onClose}
            disabled={busy}
            className="rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm font-medium text-zinc-200 transition hover:bg-white/[0.07] disabled:opacity-50"
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={busy}
            className={`flex items-center justify-center gap-2 rounded-2xl px-4 py-3 text-sm font-semibold transition active:scale-[0.99] disabled:opacity-60 ${
              tone === 'danger'
                ? 'bg-red-500 text-white hover:bg-red-400'
                : 'bg-accent text-black hover:bg-accent-strong'
            }`}
          >
            {busy ? <Loader2 className="size-4 animate-spin" /> : null}
            {confirmLabel}
          </button>
        </div>
      </div>
    </Modal>
  )
}
