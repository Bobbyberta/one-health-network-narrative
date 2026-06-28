import { useEffect, useRef, useState } from 'react'
import {
  formatProgressBar,
  parseProgressBar,
  shouldAnimateProgress,
} from '../utils/console'

interface ProgressBarLineProps {
  lineId: string
  text: string
  onComplete: () => void
}

export function ProgressBarLine({
  lineId,
  text,
  onComplete,
}: ProgressBarLineProps) {
  const parts = parseProgressBar(text)
  const [display, setDisplay] = useState(text)
  const completedRef = useRef(false)
  const onCompleteRef = useRef(onComplete)
  onCompleteRef.current = onComplete

  useEffect(() => {
    if (!parts || completedRef.current) return

    if (!shouldAnimateProgress(parts)) {
      setDisplay(
        formatProgressBar(
          parts.prefix,
          parts.targetPercent,
          parts.barWidth,
          parts.suffix
        )
      )
      completedRef.current = true
      onCompleteRef.current()
      return
    }

    const duration = 2000
    const stepMs = 100
    const start = parts.startPercent
    const target = parts.targetPercent
    let elapsed = 0

    const interval = setInterval(() => {
      elapsed += stepMs
      const t = Math.min(elapsed / duration, 1)
      const current = start + (target - start) * t

      setDisplay(
        formatProgressBar(
          parts.prefix,
          current,
          parts.barWidth,
          parts.suffix
        )
      )

      if (t >= 1 && !completedRef.current) {
        completedRef.current = true
        clearInterval(interval)
        setDisplay(
          formatProgressBar(
            parts.prefix,
            target,
            parts.barWidth,
            parts.suffix
          )
        )
        onCompleteRef.current()
      }
    }, stepMs)

    return () => clearInterval(interval)
  }, [parts, lineId, text])

  return <span className="text-emerald-400/90">{display}</span>
}
