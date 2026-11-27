import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from 'react'
import { createPortal } from 'react-dom'
import { AlertTriangle, CheckCircle2, Info } from 'lucide-react'

type ToastKind = 'success' | 'error' | 'info'

interface ToastItem {
  id: number
  kind: ToastKind
  message: string
}

interface ToastContextValue {
  showToast: (message: string, kind?: ToastKind) => void
}

const ToastContext = createContext<ToastContextValue | null>(null)

const kindStyles: Record<ToastKind, string> = {
  success: 'border-emerald-400/25 bg-[#112017] text-emerald-50',
  error: 'border-red-400/25 bg-[#201113] text-red-50',
  info: 'border-white/10 bg-[#151a21] text-zinc-100',
}

const kindIcons = {
  success: CheckCircle2,
  error: AlertTriangle,
  info: Info,
}

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([])
  const counterRef = useRef(0)
  const timersRef = useRef<number[]>([])

  const dismiss = useCallback((id: number) => {
    setToasts((current) => current.filter((toast) => toast.id !== id))
  }, [])

  const showToast = useCallback(
    (message: string, kind: ToastKind = 'info') => {
      counterRef.current += 1
      const id = counterRef.current
      setToasts((current) => [...current.slice(-2), { id, kind, message }])
      const timer = window.setTimeout(() => dismiss(id), 3200)
      timersRef.current.push(timer)
    },
    [dismiss],
  )

  useEffect(() => {
    const timers = timersRef.current
    return () => {
      for (const timer of timers) window.clearTimeout(timer)
    }
  }, [])

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      {createPortal(
        <div className="pointer-events-none fixed inset-x-0 top-0 z-[80] flex flex-col items-center gap-2 px-4 pt-[max(env(safe-area-inset-top),12px)]">
          {toasts.map((toast) => {
            const Icon = kindIcons[toast.kind]
            return (
              <div
                key={toast.id}
                role="status"
                className={`toast-in pointer-events-none flex w-full max-w-[430px] items-start gap-2.5 rounded-2xl border px-3.5 py-3 text-left text-[13px] leading-snug shadow-2xl shadow-black/40 backdrop-blur-xl ${kindStyles[toast.kind]}`}
              >
                <Icon className="mt-0.5 size-4 shrink-0 opacity-80" />
                <span>{toast.message}</span>
              </div>
            )
          })}
        </div>,
        document.body,
      )}
    </ToastContext.Provider>
  )
}

export function useToast(): ToastContextValue {
  const context = useContext(ToastContext)
  if (!context) throw new Error('useToast must be used inside ToastProvider')
  return context
}
