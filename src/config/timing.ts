export const FEED_DELAY_MULTIPLIER = 2.5
export const MS_PER_GAME_MINUTE = 1500
export const POST_FEED_MESSAGE_PAUSE_MS = 400

export function computeFeedDelay(
  delayMs: number,
  tickOffsetMins: number,
  prevTickOffsetMins: number | null
): number {
  let total =
    delayMs * FEED_DELAY_MULTIPLIER + POST_FEED_MESSAGE_PAUSE_MS

  if (prevTickOffsetMins !== null && tickOffsetMins > prevTickOffsetMins) {
    total += (tickOffsetMins - prevTickOffsetMins) * MS_PER_GAME_MINUTE
  }

  return total
}
