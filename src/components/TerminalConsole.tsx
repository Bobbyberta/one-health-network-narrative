import { useEffect, useRef, type KeyboardEvent } from 'react'
import { useGame } from '../context/GameContext'
import {
  formatProgressBar,
  isProgressBarLine,
  parseProgressBar,
  shouldAnimateProgress,
} from '../utils/console'
import { scrollToBottom } from '../utils/scroll'
import { ProgressBarLine } from './ProgressBarLine'

function getLineClass(text: string): string {
  const upper = text.toUpperCase()
  if (
    upper.includes('ERROR') ||
    upper.includes('DENIED') ||
    upper.includes('VETOED') ||
    upper.includes('CANCELED') ||
    upper.includes('CANCELLED')
  ) {
    return 'text-red-400'
  }
  if (upper.includes('WARNING') || upper.includes('ALERT')) {
    return 'text-amber-400'
  }
  if (upper.includes('SUCCESS') || upper.includes('CREDENTIAL FOUND')) {
    return 'text-emerald-300'
  }
  return 'text-emerald-400/90'
}

function renderLineText(
  line: {
    id: string
    text: string
    isProgress?: boolean
    progressComplete?: boolean
  },
  onProgressComplete: (id: string) => void
) {
  if (line.progressComplete) {
    const parts = parseProgressBar(line.text)
    if (parts) {
      return formatProgressBar(
        parts.prefix,
        parts.targetPercent,
        parts.barWidth,
        parts.suffix
      )
    }
    return line.text
  }

  if (line.isProgress && isProgressBarLine(line.text)) {
    const parts = parseProgressBar(line.text)
    if (parts && !shouldAnimateProgress(parts)) {
      return formatProgressBar(
        parts.prefix,
        parts.targetPercent,
        parts.barWidth,
        parts.suffix
      )
    }
    return (
      <ProgressBarLine
        lineId={line.id}
        text={line.text}
        onComplete={() => onProgressComplete(line.id)}
      />
    )
  }

  return line.text
}

export function TerminalConsole() {
  const {
    consoleLines,
    pendingCommand,
    runPendingCommand,
    onProgressLineComplete,
  } = useGame()
  const outputRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (outputRef.current) {
      scrollToBottom(outputRef.current)
    }
  }, [consoleLines.length, pendingCommand])

  useEffect(() => {
    if (pendingCommand && inputRef.current) {
      inputRef.current.focus()
    }
  }, [pendingCommand])

  const handleRun = () => {
    if (pendingCommand) runPendingCommand()
  }

  const handleKeyDown = (e: KeyboardEvent) => {
    if (e.key === 'Enter' && pendingCommand) {
      e.preventDefault()
      runPendingCommand()
    }
  }

  return (
    <div className="flex h-full min-h-0 flex-col overflow-hidden border-t border-slate-700 bg-slate-950 md:border-t-0">
      <div className="shrink-0 border-b border-slate-800 px-3 py-1.5 text-[10px] uppercase tracking-widest text-slate-500 md:text-xs">
        Console Output
      </div>

      <div
        ref={outputRef}
        className="min-h-0 flex-1 overflow-y-auto overflow-x-hidden px-3 py-2 font-mono text-xs leading-relaxed md:text-sm"
      >
        {consoleLines.length === 0 && !pendingCommand && (
          <p className="text-slate-600">Awaiting session input...</p>
        )}
        {consoleLines.map((line) => (
          <div key={line.id} className={`mb-1 ${getLineClass(line.text)}`}>
            {renderLineText(line, onProgressLineComplete)}
          </div>
        ))}
      </div>

      <div className="shrink-0 border-t border-slate-800 bg-slate-900/80 px-3 py-2">
        {pendingCommand ? (
          <div
            ref={inputRef}
            role="button"
            tabIndex={0}
            onClick={handleRun}
            onKeyDown={handleKeyDown}
            className="flex touch-manipulation cursor-pointer items-center font-mono text-xs text-emerald-300 outline-none focus:ring-1 focus:ring-emerald-500/50 md:text-sm"
          >
            <span className="break-all">{pendingCommand}</span>
            <span
              className="ml-0.5 inline-block h-4 w-2 shrink-0 animate-blink-cursor bg-emerald-400"
              aria-hidden
            />
          </div>
        ) : (
          <p className="font-mono text-xs text-slate-600 md:text-sm">Ready.</p>
        )}
      </div>
    </div>
  )
}
