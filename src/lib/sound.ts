let audioContext: AudioContext | null = null

function getAudioContext(): AudioContext | null {
  if (typeof window === 'undefined') return null
  if (audioContext) return audioContext
  const AudioContextClass =
    window.AudioContext ??
    (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext
  if (!AudioContextClass) return null
  audioContext = new AudioContextClass()
  return audioContext
}

export function primeAudio(): void {
  const context = getAudioContext()
  if (!context) return
  if (context.state === 'suspended') {
    void context.resume().catch(() => undefined)
  }
}

function scheduleTone(
  context: AudioContext,
  frequency: number,
  offset: number,
  duration: number,
): void {
  const start = context.currentTime + offset
  const oscillator = context.createOscillator()
  const gain = context.createGain()

  oscillator.type = 'sine'
  oscillator.frequency.setValueAtTime(frequency, start)
  gain.gain.setValueAtTime(0.0001, start)
  gain.gain.exponentialRampToValueAtTime(0.22, start + 0.02)
  gain.gain.exponentialRampToValueAtTime(0.0001, start + duration)

  oscillator.connect(gain)
  gain.connect(context.destination)
  oscillator.start(start)
  oscillator.stop(start + duration + 0.02)
}

export function playRestEndSound(): void {
  const context = getAudioContext()
  if (!context) return

  const play = () => {
    scheduleTone(context, 880, 0, 0.18)
    scheduleTone(context, 1108.73, 0.2, 0.18)
    scheduleTone(context, 880, 0.4, 0.26)
  }

  if (context.state === 'suspended') {
    void context
      .resume()
      .then(play)
      .catch(() => undefined)
  } else {
    play()
  }
}

export function vibrateRestEnd(): void {
  try {
    if (typeof navigator.vibrate === 'function') {
      navigator.vibrate([180, 90, 180, 90, 320])
    }
  } catch {
    return
  }
}
