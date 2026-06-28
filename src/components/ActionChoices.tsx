import { ChevronRight } from 'lucide-react'
import { formatChoiceMetricsHint } from '../config/metrics'
import { useGame } from '../context/GameContext'

export function ActionChoices() {
  const { currentChapter, phase, isRevealing, canShowChoices, selectOption } =
    useGame()

  const options = currentChapter?.options ?? []

  return (
    <div className="shrink-0 border-t border-slate-700 bg-slate-900/80">
      <div className="border-b border-slate-800 px-3 py-1.5 text-[10px] uppercase tracking-widest text-slate-500 md:text-xs">
        Action Console
      </div>
      <div className="space-y-2 px-3 py-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] md:px-4">
        {!canShowChoices && (
          <p className="font-mono text-xs text-slate-600 md:text-sm">
            {isRevealing
              ? '> Processing stream... stand by.'
              : phase === 'response'
                ? '> Executing command sequence...'
                : '> Session locked.'}
          </p>
        )}
        {canShowChoices &&
          options.map((option, index) => (
            <button
              key={option.text}
              type="button"
              onClick={() => selectOption(index)}
              className="group flex min-h-11 w-full touch-manipulation items-center gap-3 rounded border border-slate-700 bg-slate-950 px-3 py-2.5 text-left font-mono text-xs text-emerald-300 transition-colors hover:border-emerald-500/50 hover:bg-slate-900 active:bg-slate-800 md:min-h-10 md:text-sm"
            >
              <ChevronRight
                className="h-4 w-4 shrink-0 text-emerald-500 transition-transform group-hover:translate-x-0.5"
                aria-hidden
              />
              <span className="flex-1">{option.text}</span>
              <span className="shrink-0 text-[10px] text-slate-500 md:text-xs">
                {formatChoiceMetricsHint(
                  option.time_cost_mins,
                  option.metrics_delta
                )}
              </span>
            </button>
          ))}
      </div>
    </div>
  )
}
