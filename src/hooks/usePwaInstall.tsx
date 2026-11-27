import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'

type InstallOutcome = 'accepted' | 'dismissed' | 'unavailable'

interface PwaInstallContextValue {
  canInstall: boolean
  isInstalled: boolean
  isIos: boolean
  promptInstall: () => Promise<InstallOutcome>
}

const PwaInstallContext = createContext<PwaInstallContextValue | null>(null)

function detectStandalone(): boolean {
  if (typeof window === 'undefined') return false
  return (
    window.matchMedia('(display-mode: standalone)').matches ||
    window.navigator.standalone === true
  )
}

function detectIos(): boolean {
  if (typeof navigator === 'undefined') return false
  return (
    /iphone|ipad|ipod/i.test(navigator.userAgent) ||
    (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1)
  )
}

export function PwaInstallProvider({ children }: { children: ReactNode }) {
  const [installEvent, setInstallEvent] = useState<BeforeInstallPromptEvent | null>(null)
  const [isInstalled, setIsInstalled] = useState(() => detectStandalone())
  const isIos = useMemo(() => detectIos(), [])

  useEffect(() => {
    const onBeforeInstallPrompt = (event: Event) => {
      const promptEvent = event as BeforeInstallPromptEvent
      promptEvent.preventDefault()
      setInstallEvent(promptEvent)
    }
    const onInstalled = () => {
      setIsInstalled(true)
      setInstallEvent(null)
    }
    const media = window.matchMedia('(display-mode: standalone)')
    const onDisplayModeChange = () => setIsInstalled(detectStandalone())

    window.addEventListener('beforeinstallprompt', onBeforeInstallPrompt)
    window.addEventListener('appinstalled', onInstalled)
    media.addEventListener('change', onDisplayModeChange)

    return () => {
      window.removeEventListener('beforeinstallprompt', onBeforeInstallPrompt)
      window.removeEventListener('appinstalled', onInstalled)
      media.removeEventListener('change', onDisplayModeChange)
    }
  }, [])

  const promptInstall = useCallback(async (): Promise<InstallOutcome> => {
    if (!installEvent) return 'unavailable'
    await installEvent.prompt()
    const choice = await installEvent.userChoice
    if (choice.outcome === 'accepted') setIsInstalled(true)
    setInstallEvent(null)
    return choice.outcome
  }, [installEvent])

  const value = useMemo(
    () => ({
      canInstall: installEvent !== null,
      isInstalled,
      isIos,
      promptInstall,
    }),
    [installEvent, isInstalled, isIos, promptInstall],
  )

  return <PwaInstallContext.Provider value={value}>{children}</PwaInstallContext.Provider>
}

export function usePwaInstall(): PwaInstallContextValue {
  const context = useContext(PwaInstallContext)
  if (!context) throw new Error('usePwaInstall must be used inside PwaInstallProvider')
  return context
}
