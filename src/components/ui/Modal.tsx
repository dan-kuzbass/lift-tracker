import { useEffect, useRef, type ReactNode } from 'react'
import { createPortal } from 'react-dom'

const modalStack: symbol[] = []

interface ModalProps {
  open: boolean
  onClose: () => void
  children: ReactNode
  variant?: 'sheet' | 'dialog'
  className?: string
  labelledBy?: string
}

export function Modal({
  open,
  onClose,
  children,
  variant = 'sheet',
  className = '',
  labelledBy,
}: ModalProps) {
  const panelRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return

    const token = Symbol('modal')
    modalStack.push(token)
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && modalStack[modalStack.length - 1] === token) {
        onClose()
      }
    }
    const originalOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    document.addEventListener('keydown', onKeyDown)
    const focusTimer = window.setTimeout(() => panelRef.current?.focus(), 40)

    return () => {
      const index = modalStack.indexOf(token)
      if (index >= 0) modalStack.splice(index, 1)
      document.body.style.overflow = originalOverflow
      document.removeEventListener('keydown', onKeyDown)
      window.clearTimeout(focusTimer)
    }
  }, [open, onClose])

  if (!open) return null

  const overlayClass =
    variant === 'dialog'
      ? 'items-center p-4'
      : 'items-end p-0 sm:items-center sm:p-5'
  const panelClass =
    variant === 'dialog'
      ? 'pop-in w-full max-w-sm overflow-hidden rounded-[28px] border border-white/10 bg-[#12171e] shadow-[0_32px_90px_rgba(0,0,0,0.75)]'
      : 'sheet-in max-h-[92dvh] w-full max-w-[480px] overflow-hidden rounded-t-[30px] border border-white/10 bg-[#11161d] shadow-[0_32px_90px_rgba(0,0,0,0.8)] sm:rounded-[30px]'

  return createPortal(
    <div
      className={`fixed inset-0 z-50 flex justify-center bg-black/70 backdrop-blur-[6px] ${overlayClass}`}
      onClick={onClose}
    >
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={labelledBy}
        tabIndex={-1}
        onClick={(event) => event.stopPropagation()}
        className={`${panelClass} outline-none ${className}`}
      >
        {children}
      </div>
    </div>,
    document.body,
  )
}
