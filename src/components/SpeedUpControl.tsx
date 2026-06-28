import { FastForward } from 'lucide-react'
import { useGame } from '../context/GameContext'

export function SpeedUpControl() {
  const {
    isFeedRevealing,
    hasPendingFeedSteps,
    nextFeedTimeAdvanceMins,
    advanceFeed,
    pendingCommand,
  } = useGame()

  if (!isFeedRevealing && !hasPendingFeedSteps) return null

  const timeLabel =
    nextFeedTimeAdvanceMins !== null && nextFeedTimeAdvanceMins > 0
      ? ` (+${nextFeedTimeAdvanceMins}m)`
      : ''

  return (
    <div className="shrink-0 border-t border-slate-800 bg-slate-900/60 px-3 py-2">
      <button
        type="button"
        onClick={advanceFeed}
        disabled={pendingCommand !== null}
        className="flex min-h-10 w-full touch-manipulation items-center justify-center gap-2 rounded border border-slate-700 bg-slate-950 font-mono text-xs text-amber-400/90 transition-colors hover:border-amber-500/40 hover:bg-slate-900 active:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-40 md:text-sm"
      >
        <FastForward className="h-4 w-4" aria-hidden />
        <span>&gt;&gt; Next message{timeLabel}</span>
      </button>
    </div>
  )
}
