import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from 'react'
import { playRestEndSound, primeAudio, vibrateRestEnd } from '../lib/sound'

export const REST_TIMER_STORAGE_KEY = 'podhod.rest-timer.v1'

interface RestTimerState {
  targetEnd: number
  duration: number
  label: string
}

interface RestTimerContextValue {
  timer: RestTimerState | null
  remainingSeconds: number
  isFinished: boolean
  start: (durationSeconds: number, label: string) => void
  adjust: (deltaSeconds: number) => void
  restart: () => void
  hide: () => void
}

const RestTimerContext = createContext<RestTimerContextValue | null>(null)

function readStoredTimer(): RestTimerState | null {
  try {
    const raw = window.localStorage.getItem(REST_TIMER_STORAGE_KEY)
    if (!raw) return null
    const parsed: unknown = JSON.parse(raw)
    if (
      typeof parsed !== 'object' ||
      parsed === null ||
      !('targetEnd' in parsed) ||
      !('duration' in parsed) ||
      !('label' in parsed)
    ) {
      return null
    }
    const candidate = parsed as Partial<RestTimerState>
    if (
      typeof candidate.targetEnd !== 'number' ||
      typeof candidate.duration !== 'number' ||
      typeof candidate.label !== 'string' ||
      candidate.targetEnd <= Date.now()
    ) {
      window.localStorage.removeItem(REST_TIMER_STORAGE_KEY)
      return null
    }
    return {
      targetEnd: candidate.targetEnd,
      duration: candidate.duration,
      label: candidate.label,
    }
  } catch {
    return null
  }
}

export function RestTimerProvider({ children }: { children: ReactNode }) {
  const [timer, setTimer] = useState<RestTimerState | null>(() => readStoredTimer())
  const [now, setNow] = useState(() => Date.now())
  const firedRef = useRef(false)

  useEffect(() => {
    if (!timer) return
    const tick = () => setNow(Date.now())
    tick()
    const interval = window.setInterval(tick, 250)
    const onVisibilityChange = () => {
      if (document.visibilityState === 'visible') tick()
    }
    document.addEventListener('visibilitychange', onVisibilityChange)
    return () => {
      window.clearInterval(interval)
      document.removeEventListener('visibilitychange', onVisibilityChange)
    }
  }, [timer?.targetEnd, timer])

  useEffect(() => {
    if (!timer) return
    if (timer.targetEnd <= now && !firedRef.current) {
      firedRef.current = true
      vibrateRestEnd()
      playRestEndSound()
    }
  }, [timer, now])

  useEffect(() => {
    try {
      if (timer) {
        window.localStorage.setItem(REST_TIMER_STORAGE_KEY, JSON.stringify(timer))
      } else {
        window.localStorage.removeItem(REST_TIMER_STORAGE_KEY)
      }
    } catch {
      return
    }
  }, [timer])

  const start = useCallback((durationSeconds: number, label: string) => {
    const duration = Math.max(5, Math.round(durationSeconds))
    firedRef.current = false
    setNow(Date.now())
    setTimer({ targetEnd: Date.now() + duration * 1000, duration, label })
    primeAudio()
  }, [])

  const adjust = useCallback((deltaSeconds: number) => {
    setNow(Date.now())
    setTimer((previous) => {
      if (!previous) return previous
      const currentTime = Date.now()
      const base = Math.max(currentTime, previous.targetEnd)
      const targetEnd = Math.max(currentTime, base + deltaSeconds * 1000)
      if (targetEnd > currentTime) firedRef.current = false
      return { ...previous, targetEnd }
    })
  }, [])

  const restart = useCallback(() => {
    firedRef.current = false
    setNow(Date.now())
    setTimer((previous) =>
      previous
        ? { ...previous, targetEnd: Date.now() + previous.duration * 1000 }
        : previous,
    )
  }, [])

  const hide = useCallback(() => {
    firedRef.current = false
    setTimer(null)
    try {
      window.localStorage.removeItem(REST_TIMER_STORAGE_KEY)
    } catch {
      return
    }
  }, [])

  const remainingSeconds = timer
    ? Math.max(0, Math.ceil((timer.targetEnd - now) / 1000))
    : 0
  const isFinished = timer !== null && timer.targetEnd <= now

  return (
    <RestTimerContext.Provider
      value={{
        timer,
        remainingSeconds,
        isFinished,
        start,
        adjust,
        restart,
        hide,
      }}
    >
      {children}
    </RestTimerContext.Provider>
  )
}

export function useRestTimer(): RestTimerContextValue {
  const context = useContext(RestTimerContext)
  if (!context) {
    throw new Error('useRestTimer must be used inside RestTimerProvider')
  }
  return context
}
