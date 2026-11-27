import { useEffect } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { db } from './db/db'
import { HomeScreen } from './components/HomeScreen'
import { WorkoutScreen } from './components/WorkoutScreen'
import { PwaInstallProvider } from './hooks/usePwaInstall'
import { RestTimerProvider } from './hooks/useRestTimer'
import { ToastProvider } from './components/ui/Toast'
import { BrandMark } from './components/ui/Brand'

function App() {
  const activeWorkout = useLiveQuery(async () => {
    const workouts = await db.workouts.where('status').equals('active').toArray()
    return workouts.sort((a, b) => (b.startedAt ?? 0) - (a.startedAt ?? 0))[0] ?? null
  }, [])

  const activeWorkoutId = activeWorkout?.id ?? null

  useEffect(() => {
    window.scrollTo({ top: 0 })
  }, [activeWorkoutId])

  return (
    <PwaInstallProvider>
      <ToastProvider>
        <RestTimerProvider>
          <div className="relative mx-auto min-h-dvh w-full max-w-[480px] bg-[#0a0e13] shadow-[0_0_80px_rgba(0,0,0,0.4)] min-[500px]:border-x min-[500px]:border-white/[0.055]">
            {activeWorkout === undefined ? (
              <div className="flex min-h-dvh flex-col items-center justify-center gap-4">
                <BrandMark className="size-12" />
                <div className="flex items-center gap-1">
                  <span className="size-1 animate-pulse rounded-full bg-accent" />
                  <span
                    className="size-1 animate-pulse rounded-full bg-accent/60"
                    style={{ animationDelay: '120ms' }}
                  />
                  <span
                    className="size-1 animate-pulse rounded-full bg-accent/30"
                    style={{ animationDelay: '240ms' }}
                  />
                </div>
                <span className="text-[9px] font-medium uppercase tracking-[0.2em] text-zinc-700">
                  Загрузка
                </span>
              </div>
            ) : activeWorkout ? (
              <WorkoutScreen workout={activeWorkout} />
            ) : (
              <HomeScreen />
            )}
          </div>
        </RestTimerProvider>
      </ToastProvider>
    </PwaInstallProvider>
  )
}

export default App
