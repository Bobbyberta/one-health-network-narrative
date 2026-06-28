import { INTRO_BODY, INTRO_CTA, INTRO_TITLE } from '../config/intro'
import { useGame } from '../context/GameContext'

export function IntroModal() {
  const { phase, beginSession } = useGame()

  if (phase !== 'intro') return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/95 p-4 backdrop-blur-sm">
      <div className="w-full max-w-lg border border-emerald-500/30 bg-slate-900 p-6 md:p-8">
        <h1 className="mb-4 font-mono text-lg font-bold uppercase tracking-wider text-emerald-400 md:text-xl">
          {INTRO_TITLE}
        </h1>
        <p className="mb-6 font-mono text-sm leading-relaxed text-slate-300 md:text-base">
          {INTRO_BODY}
        </p>
        <ul className="mb-6 space-y-2 font-mono text-xs text-slate-500 md:text-sm">
          <li>&gt; Time advances only when you choose an action</li>
          <li>&gt; Click terminal commands to execute them</li>
          <li>&gt; Watch the live feed — staff are counting on you</li>
        </ul>
        <button
          type="button"
          onClick={beginSession}
          className="min-h-11 w-full touch-manipulation rounded border border-emerald-500/50 bg-slate-950 px-4 py-3 font-mono text-sm text-emerald-400 transition-colors hover:bg-slate-900 active:bg-slate-800"
        >
          &gt; {INTRO_CTA}
        </button>
      </div>
    </div>
  )
}
