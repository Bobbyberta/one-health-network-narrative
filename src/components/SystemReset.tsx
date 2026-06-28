import { useEffect, useState } from 'react'
import { COMPILE_LOG_LINES } from '../config/metrics'
import { useGame } from '../context/GameContext'

type ResetStage = 'blackout' | 'compile' | 'victory'

export function SystemReset() {
  const { phase, replay } = useGame()
  const [stage, setStage] = useState<ResetStage>('blackout')
  const [compileLines, setCompileLines] = useState<string[]>([])

  useEffect(() => {
    if (phase !== 'reset') {
      setStage('blackout')
      setCompileLines([])
      return
    }

    setStage('blackout')
    setCompileLines([])

    const timers: ReturnType<typeof setTimeout>[] = []

    const compileTimer = setTimeout(() => {
      setStage('compile')

      COMPILE_LOG_LINES.forEach((line, index) => {
        const lineTimer = setTimeout(() => {
          setCompileLines((prev) => [...prev, line])
          if (index === COMPILE_LOG_LINES.length - 1) {
            const victoryTimer = setTimeout(() => setStage('victory'), 600)
            timers.push(victoryTimer)
          }
        }, index * 50)
        timers.push(lineTimer)
      })
    }, 3000)
    timers.push(compileTimer)

    return () => timers.forEach(clearTimeout)
  }, [phase])

  if (phase !== 'reset' && phase !== 'complete') {
    return null
  }

  if (stage === 'blackout') {
    return (
      <div
        className="fixed inset-0 z-50 bg-black"
        aria-live="polite"
        aria-label="System reset in progress"
      />
    )
  }

  if (stage === 'compile') {
    return (
      <div className="fixed inset-0 z-50 flex flex-col overflow-hidden bg-black p-4 font-mono text-xs text-emerald-400 md:p-8 md:text-sm">
        <p className="mb-4 animate-pulse text-amber-400">
          SCRUBBING SESSION ARTIFACTS...
        </p>
        <div className="min-h-0 flex-1 overflow-y-auto">
          {compileLines.map((line, i) => (
            <div key={i} className="mb-0.5 opacity-90">
              [{String(i).padStart(2, '0')}] {line}
            </div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950 p-4">
      <div className="w-full max-w-md border border-emerald-500/30 bg-slate-900 p-6 text-center md:p-8">
        <h2 className="mb-2 font-mono text-lg font-bold uppercase tracking-wider text-emerald-400 md:text-xl">
          Session Complete
        </h2>
        <div className="my-6 space-y-3 font-mono text-sm md:text-base">
          <p className="text-emerald-300">System Restored</p>
          <p className="text-emerald-300">Malpractice Exposed</p>
          <p className="text-slate-400">Status: Ghost</p>
        </div>
        <p className="mb-6 text-xs text-slate-500 md:text-sm">
          One Health contract telemetry overridden. Hospital vitals tracking
          restored under public scrutiny. No local trace remains on this
          terminal.
        </p>
        <button
          type="button"
          onClick={replay}
          className="min-h-11 w-full touch-manipulation rounded border border-emerald-500/50 bg-slate-950 px-4 py-3 font-mono text-sm text-emerald-400 transition-colors hover:bg-slate-900 active:bg-slate-800"
        >
          &gt; RESTART SESSION
        </button>
      </div>
    </div>
  )
}
