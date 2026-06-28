import { useEffect, useRef, useState } from 'react'
import { formatSender, isPlayerSender, isSystemSender } from '../data/story'
import { useGame } from '../context/GameContext'
import { scrollToBottom, scrollToFeedIndex } from '../utils/scroll'

interface UnreadMarkerProps {
  visible: boolean
  onSeen: () => void
}

function UnreadMarker({ visible, onSeen }: UnreadMarkerProps) {
  const ref = useRef<HTMLSpanElement>(null)
  const [fading, setFading] = useState(false)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    if (!visible || !ref.current) return

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && entry.intersectionRatio >= 0.5) {
          timerRef.current = setTimeout(() => {
            setFading(true)
            setTimeout(onSeen, 300)
          }, 2000)
        } else if (timerRef.current) {
          clearTimeout(timerRef.current)
          timerRef.current = null
        }
      },
      { threshold: 0.5 }
    )

    observer.observe(ref.current)
    return () => {
      observer.disconnect()
      if (timerRef.current) clearTimeout(timerRef.current)
    }
  }, [visible, onSeen])

  if (!visible) return null

  return (
    <span
      ref={ref}
      className={`mr-2 inline-flex items-center gap-1 rounded bg-amber-500/20 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wide text-amber-400 transition-opacity duration-300 ${
        fading ? 'opacity-0' : 'opacity-100'
      }`}
    >
      <span className="h-1.5 w-1.5 rounded-full bg-amber-400" aria-hidden />
      New
    </span>
  )
}

interface ChatFeedProps {
  scrollAlignTrigger?: number
}

export function ChatFeed({ scrollAlignTrigger = 0 }: ChatFeedProps) {
  const {
    feedItems,
    lastReadFeedIndex,
    firstUnreadIndex,
    markUnreadSeen,
  } = useGame()
  const scrollRef = useRef<HTMLDivElement>(null)
  const messageRefs = useRef<Map<number, HTMLElement>>(new Map())

  useEffect(() => {
    const container = scrollRef.current
    if (!container) return

    if (firstUnreadIndex !== null && firstUnreadIndex >= 0) {
      const el = messageRefs.current.get(lastReadFeedIndex)
      if (el && lastReadFeedIndex >= 0) {
        scrollToFeedIndex(container, el, 'end')
      } else {
        scrollToBottom(container)
      }
    } else if (feedItems.length > 0) {
      scrollToBottom(container)
    }
  }, [scrollAlignTrigger, lastReadFeedIndex, firstUnreadIndex, feedItems.length])

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-hidden bg-slate-950">
      <div className="shrink-0 border-b border-slate-800 px-3 py-1.5 text-[10px] uppercase tracking-widest text-slate-500 md:text-xs">
        Live Feed
      </div>
      <div
        ref={scrollRef}
        className="min-h-0 flex-1 overflow-y-auto overflow-x-hidden px-3 py-2"
      >
        {feedItems.length === 0 && (
          <p className="font-mono text-xs text-slate-600 md:text-sm">
            No messages yet...
          </p>
        )}
        {feedItems.map((item, i) => {
          const player = item.isPlayer ?? isPlayerSender(item.sender)
          const system = !player && isSystemSender(item.sender)
          const isOldestUnread = i === firstUnreadIndex

          return (
            <article
              key={`${i}-${item.timestamp}-${item.sender}`}
              ref={(el) => {
                if (el) messageRefs.current.set(i, el)
                else messageRefs.current.delete(i)
              }}
              className={`mb-3 font-mono text-xs leading-relaxed md:text-sm ${
                player
                  ? 'border-l-2 border-cyan-500/60 pl-3'
                  : system
                    ? 'border-l-2 border-amber-500/60 pl-3'
                    : 'pl-4'
              }`}
            >
              <header className="mb-0.5 flex flex-wrap items-baseline gap-x-2 gap-y-0">
                {isOldestUnread && (
                  <UnreadMarker visible onSeen={markUnreadSeen} />
                )}
                <time className="text-slate-500">{item.timestamp}</time>
                <span
                  className={
                    player
                      ? 'font-semibold text-cyan-400'
                      : system
                        ? 'font-bold uppercase tracking-wide text-amber-400'
                        : 'text-emerald-400/70'
                  }
                >
                  {player ? 'You' : formatSender(item.sender)}
                </span>
              </header>
              <p
                className={
                  player
                    ? 'text-cyan-100/90'
                    : system
                      ? 'font-semibold text-amber-300/90'
                      : 'text-slate-300'
                }
              >
                {item.text}
              </p>
            </article>
          )
        })}
      </div>
    </div>
  )
}
