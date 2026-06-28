import type { ConsoleLine } from '../types/story'

export function isConsoleCommand(text: string): boolean {
  return /(?:~\$|#)\s+\S/.test(text)
}

export function splitConsoleBlocks(lines: ConsoleLine[]): ConsoleLine[][] {
  const blocks: ConsoleLine[][] = []
  let current: ConsoleLine[] = []

  for (const line of lines) {
    if (isConsoleCommand(line.text) && current.length > 0) {
      blocks.push(current)
      current = [line]
    } else {
      current.push(line)
    }
  }

  if (current.length > 0) {
    blocks.push(current)
  }

  return blocks
}

const PROGRESS_BAR_REGEX =
  /^(.*?)(\[)([=\->\.]+)(\]\s*)(\d+)%?(.*)$/

export interface ProgressBarParts {
  prefix: string
  targetPercent: number
  startPercent: number
  suffix: string
  barWidth: number
}

function parseStartPercent(barChars: string, barWidth: number): number {
  const equals = (barChars.match(/=/g) || []).length
  const hasArrow = barChars.includes('>')
  if (equals > 0) {
    return Math.round((equals / barWidth) * 100)
  }
  if (hasArrow) {
    return Math.max(1, Math.round((1 / barWidth) * 100))
  }
  return 0
}

export function parseProgressBar(text: string): ProgressBarParts | null {
  const match = text.match(PROGRESS_BAR_REGEX)
  if (!match) return null

  const [, prefix, , barChars, , percentStr, suffix] = match
  const targetPercent = parseInt(percentStr, 10)
  if (Number.isNaN(targetPercent)) return null

  const barWidth = Math.max(barChars.length, 10)

  return {
    prefix,
    targetPercent,
    startPercent: parseStartPercent(barChars, barWidth),
    suffix: suffix ?? '',
    barWidth,
  }
}

export function isProgressBarLine(text: string): boolean {
  return PROGRESS_BAR_REGEX.test(text)
}

export function shouldAnimateProgress(parts: ProgressBarParts): boolean {
  return parts.targetPercent >= 100
}

export function formatProgressBar(
  prefix: string,
  percent: number,
  barWidth: number,
  suffix: string
): string {
  const filled = Math.round((percent / 100) * barWidth)
  const bar =
    filled >= barWidth
      ? '='.repeat(barWidth)
      : '>'.repeat(Math.max(1, filled)) +
        '.'.repeat(barWidth - Math.max(1, filled))
  return `${prefix}[${bar}] ${Math.round(percent)}%${suffix}`
}
