import type { StoryData, Chapter } from '../types/story'
import storyDataJson from './story_data.json'

export const storyData = storyDataJson as StoryData

export function getChapter(index: number): Chapter | undefined {
  return storyData.chapters[index]
}

export function getChapterById(id: string): Chapter | undefined {
  return storyData.chapters.find((c) => c.id === id)
}

export function getChapterCount(): number {
  return storyData.chapters.length
}

export function isLastChapter(index: number): boolean {
  return index >= storyData.chapters.length - 1
}

export function addMinutesToTime(time: string, minutes: number): string {
  const [hours, mins] = time.split(':').map(Number)
  const totalMins = hours * 60 + mins + minutes
  const newHours = Math.floor(totalMins / 60) % 24
  const newMins = totalMins % 60
  return `${String(newHours).padStart(2, '0')}:${String(newMins).padStart(2, '0')}`
}

export function formatFeedTimestamp(
  startTime: string,
  tickOffsetMins: number
): string {
  return addMinutesToTime(startTime, tickOffsetMins)
}

export function formatSender(sender: string): string {
  return sender.replace(/_/g, ' ')
}

export function isSystemSender(sender: string): boolean {
  const upper = sender.toUpperCase()
  return (
    upper.includes('SYSTEM') ||
    upper.includes('VGD') ||
    upper.includes('BOT') ||
    upper.startsWith('IT_')
  )
}

const PLAYER_SENDERS = new Set([
  'SW_Trust_Auditor',
  'Core_Ops',
  'Core_Switch',
])

export function getPlayerFeedSender(identity: string): string {
  if (identity.includes('guest')) return 'SW_Trust_Auditor'
  if (identity.includes('admin')) return 'Core_Ops'
  if (identity.includes('root')) return 'Core_Switch'
  const local = identity.split('@')[0]?.replace(/[.#-]/g, '_') ?? 'Operator'
  return local
    .split('_')
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join('_')
}

export function isPlayerSender(sender: string): boolean {
  return PLAYER_SENDERS.has(sender)
}

export function getPlayerChoiceMessage(option: {
  text: string
  player_message?: string
}): string {
  return option.player_message ?? option.text
}

function timeToMinutes(time: string): number {
  const [hours, mins] = time.split(':').map(Number)
  return hours * 60 + mins
}

export function maxTime(a: string, b: string): string {
  return timeToMinutes(a) >= timeToMinutes(b) ? a : b
}
