import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react'
import {
  applyBannerTick,
  applyMetricsUpdate,
  EPILOGUE_METRICS,
  getNewlyTriggeredPressureLines,
  initBannerState,
  interpolateMetricsText,
  resolveChapterMetrics,
  type BannerState,
  type ChapterMetrics,
} from '../config/metrics'
import { computeFeedDelay } from '../config/timing'
import {
  addMinutesToTime,
  formatFeedTimestamp,
  getChapter,
  getPlayerChoiceMessage,
  getPlayerFeedSender,
  isLastChapter,
  maxTime,
  storyData,
} from '../data/story'
import {
  isConsoleCommand,
  isProgressBarLine,
  parseProgressBar,
  shouldAnimateProgress,
  splitConsoleBlocks,
} from '../utils/console'
import type {
  Chapter,
  ConsoleLine,
  FeedItemRaw,
  FeedStep,
  GamePhase,
  RevealedConsoleLine,
  RevealedFeedItem,
} from '../types/story'

interface GameState {
  phase: GamePhase
  chapterIndex: number
  currentGameTime: string
  bedUtilization: number
  ambulanceQueue: number
  quarantineSeconds: number | null
  mirrorProgress: number | null
  purgeProgress: number | null
  identity: string
  channel: string
  consoleLines: RevealedConsoleLine[]
  feedItems: RevealedFeedItem[]
  pendingCommand: string | null
  isFeedRevealing: boolean
  isConsoleRevealing: boolean
  unreadFeedCount: number
  hasPendingFeedSteps: boolean
  lastReadFeedIndex: number
  firstUnreadIndex: number | null
  nextFeedTimeAdvanceMins: number | null
}

interface GameContextValue extends GameState {
  title: string
  currentChapter: Chapter | undefined
  isRevealing: boolean
  canShowChoices: boolean
  beginSession: () => void
  selectOption: (optionIndex: number) => void
  runPendingCommand: () => void
  advanceFeed: () => void
  setFeedTabActive: (active: boolean) => void
  markUnreadSeen: () => void
  onProgressLineComplete: (lineId: string) => void
  replay: () => void
}

const GameContext = createContext<GameContextValue | null>(null)

let lineIdCounter = 0
function nextLineId(): string {
  lineIdCounter += 1
  return `line-${lineIdCounter}`
}

function createInitialState(): GameState {
  const firstChapter = getChapter(0)
  const startMetrics = firstChapter?.metrics ?? {
    bedUtilization: 98,
    ambulanceQueue: 4,
  }
  return {
    phase: 'intro',
    chapterIndex: 0,
    currentGameTime: firstChapter?.start_time ?? '09:00',
    bedUtilization: startMetrics.bedUtilization,
    ambulanceQueue: startMetrics.ambulanceQueue,
    quarantineSeconds: null,
    mirrorProgress: null,
    purgeProgress: null,
    identity: '',
    channel: '',
    consoleLines: [],
    feedItems: [],
    pendingCommand: null,
    isFeedRevealing: false,
    isConsoleRevealing: false,
    unreadFeedCount: 0,
    hasPendingFeedSteps: false,
    lastReadFeedIndex: -1,
    firstUnreadIndex: null,
    nextFeedTimeAdvanceMins: null,
  }
}

function enrichFeedItems(
  items: FeedItemRaw[],
  metrics: ChapterMetrics
): FeedItemRaw[] {
  return items.map((item) => ({
    ...item,
    text: interpolateMetricsText(item.text, metrics),
  }))
}

function buildFeedSteps(
  items: FeedItemRaw[],
  chapterStartTime: string
): FeedStep[] {
  let prevTick: number | null = null
  return items.map((item) => {
    const delay_ms = computeFeedDelay(
      item.delay_ms,
      item.tick_offset_mins,
      prevTick
    )
    const timeAdvanceMins = item.tick_offset_mins - (prevTick ?? 0)
    prevTick = item.tick_offset_mins
    return {
      tick_offset_mins: item.tick_offset_mins,
      sender: item.sender,
      text: item.text,
      delay_ms,
      chapterStartTime,
      timeAdvanceMins,
    }
  })
}

function buildResponseFeedSteps(
  items: FeedItemRaw[],
  responseStartTime: string
): FeedStep[] {
  if (items.length === 0) return []
  const firstTick = items[0].tick_offset_mins
  const normalized = items.map((item) => ({
    ...item,
    tick_offset_mins: item.tick_offset_mins - firstTick,
  }))
  return buildFeedSteps(normalized, responseStartTime)
}

function mergePressureFeedItems(
  chapter: Chapter,
  prevMetrics: ChapterMetrics,
  newMetrics: ChapterMetrics,
  firedIds: Set<string>,
  items: FeedItemRaw[]
): FeedItemRaw[] {
  const triggered = getNewlyTriggeredPressureLines(
    chapter,
    prevMetrics,
    newMetrics,
    firedIds
  )
  if (triggered.length === 0) return items

  for (const line of triggered) {
    firedIds.add(line.id)
  }

  const lastTick = items.reduce(
    (max, item) => Math.max(max, item.tick_offset_mins),
    0
  )

  const pressureItems: FeedItemRaw[] = triggered.map((line, i) => ({
    tick_offset_mins: lastTick + 1 + i,
    sender: line.sender,
    text: interpolateMetricsText(line.text, newMetrics),
    delay_ms: line.delay_ms,
  }))

  return [...items, ...pressureItems]
}

export function GameProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<GameState>(createInitialState)
  const stateRef = useRef(state)
  stateRef.current = state

  const feedTabActiveRef = useRef(false)
  const feedCancelRef = useRef<(() => void) | null>(null)
  const consoleCancelRef = useRef<(() => void) | null>(null)
  const pendingFeedStepsRef = useRef<FeedStep[]>([])
  const feedIndexRef = useRef(0)
  const onFeedCompleteRef = useRef<(() => void) | null>(null)

  const consoleBlocksRef = useRef<ConsoleLine[][]>([])
  const consoleBlockIndexRef = useRef(0)
  const outputQueueRef = useRef<ConsoleLine[]>([])
  const outputIndexRef = useRef(0)
  const onConsoleCompleteRef = useRef<(() => void) | null>(null)
  const waitingForProgressRef = useRef(false)
  const isLogoutEpilogueRef = useRef(false)
  const logoutOutputRef = useRef<ConsoleLine[]>([])
  const epilogueStartTimeRef = useRef('21:33')
  const firedPressureRef = useRef<Set<string>>(new Set())

  const feedCompleteRef = useRef(false)
  const consoleCompleteRef = useRef(false)
  const responseChapterIndexRef = useRef(0)
  const feedPausedForCommandRef = useRef(false)

  const cancelFeed = useCallback(() => {
    feedCancelRef.current?.()
    feedCancelRef.current = null
  }, [])

  const cancelConsole = useCallback(() => {
    consoleCancelRef.current?.()
    consoleCancelRef.current = null
    waitingForProgressRef.current = false
  }, [])

  const syncNextFeedPreview = useCallback((steps: FeedStep[]) => {
    setState((prev) => ({
      ...prev,
      nextFeedTimeAdvanceMins: steps[0]?.timeAdvanceMins ?? null,
    }))
  }, [])

  const revealFeedStep = useCallback((step: FeedStep) => {
    setState((prev) => {
      const chapter = getChapter(prev.chapterIndex)
      const banner = applyBannerTick(
        chapter,
        {
          quarantineSeconds: prev.quarantineSeconds,
          mirrorProgress: prev.mirrorProgress,
          purgeProgress: prev.purgeProgress,
        },
        step.timeAdvanceMins
      )
      const newIndex = prev.feedItems.length
      const onFeedTab = feedTabActiveRef.current
      return {
        ...prev,
        feedItems: [
          ...prev.feedItems,
          {
            timestamp: formatFeedTimestamp(
              step.chapterStartTime,
              step.tick_offset_mins
            ),
            sender: step.sender,
            text: step.text,
          },
        ],
        currentGameTime: addMinutesToTime(
          prev.currentGameTime,
          step.timeAdvanceMins
        ),
        quarantineSeconds: banner.quarantineSeconds,
        mirrorProgress: banner.mirrorProgress,
        purgeProgress: banner.purgeProgress,
        unreadFeedCount: onFeedTab
          ? prev.unreadFeedCount
          : prev.unreadFeedCount + 1,
        lastReadFeedIndex: onFeedTab ? newIndex : prev.lastReadFeedIndex,
        firstUnreadIndex: onFeedTab
          ? prev.firstUnreadIndex
          : (prev.firstUnreadIndex ?? newIndex),
      }
    })
  }, [])

  const appendFeedItem = useCallback((item: RevealedFeedItem) => {
    setState((prev) => {
      const newIndex = prev.feedItems.length
      const onFeedTab = feedTabActiveRef.current
      return {
        ...prev,
        feedItems: [...prev.feedItems, item],
        unreadFeedCount: onFeedTab
          ? prev.unreadFeedCount
          : prev.unreadFeedCount + 1,
        lastReadFeedIndex: onFeedTab ? newIndex : prev.lastReadFeedIndex,
        firstUnreadIndex: onFeedTab
          ? prev.firstUnreadIndex
          : (prev.firstUnreadIndex ?? newIndex),
      }
    })
  }, [])

  const appendConsoleLine = useCallback((line: RevealedConsoleLine) => {
    setState((prev) => ({
      ...prev,
      consoleLines: [...prev.consoleLines, line],
    }))
  }, [])

  const tryCompleteInit = useCallback(() => {
    if (!feedCompleteRef.current || !consoleCompleteRef.current) return
    if (stateRef.current.pendingCommand !== null) return
    if (pendingFeedStepsRef.current.length > 0) return
    setState((prev) => {
      if (prev.phase !== 'init') return prev
      return {
        ...prev,
        phase: 'choice',
        isFeedRevealing: false,
        isConsoleRevealing: false,
        hasPendingFeedSteps: false,
        nextFeedTimeAdvanceMins: null,
      }
    })
  }, [])

  const startChapterInitRef = useRef<(chapterIndex: number) => void>(() => {})
  const startEpilogueFeedRef = useRef<() => void>(() => {})

  const tryAdvanceAfterResponse = useCallback(() => {
    if (!feedCompleteRef.current || !consoleCompleteRef.current) return
    if (stateRef.current.pendingCommand !== null) return
    if (pendingFeedStepsRef.current.length > 0) return

    const chapterIndex = responseChapterIndexRef.current

    if (isLastChapter(chapterIndex)) {
      if (storyData.epilogue.feed.length === 0) {
        setState((prev) => ({
          ...prev,
          phase: 'reset',
          quarantineSeconds: null,
          mirrorProgress: null,
          purgeProgress: null,
          isFeedRevealing: false,
          isConsoleRevealing: false,
          hasPendingFeedSteps: false,
        }))
        return
      }
      epilogueStartTimeRef.current = addMinutesToTime(
        getChapter(chapterIndex)!.start_time,
        5
      )
      setState((prev) => ({
        ...prev,
        phase: 'epilogue',
        bedUtilization: EPILOGUE_METRICS.bedUtilization,
        ambulanceQueue: EPILOGUE_METRICS.ambulanceQueue,
        quarantineSeconds: null,
        mirrorProgress: null,
        purgeProgress: null,
        isFeedRevealing: true,
        isConsoleRevealing: false,
        hasPendingFeedSteps: true,
      }))
      startEpilogueFeedRef.current()
    } else {
      startChapterInitRef.current(chapterIndex + 1)
    }
  }, [])

  const scheduleNextFeedRevealRef = useRef<() => void>(() => {})

  const pauseFeedForCommand = useCallback(() => {
    if (pendingFeedStepsRef.current.length === 0) return
    cancelFeed()
    feedPausedForCommandRef.current = true
  }, [cancelFeed])

  const resumeFeedIfPaused = useCallback(() => {
    if (
      !feedPausedForCommandRef.current ||
      stateRef.current.pendingCommand !== null
    ) {
      return
    }
    feedPausedForCommandRef.current = false
    if (pendingFeedStepsRef.current.length > 0) {
      scheduleNextFeedRevealRef.current()
    }
  }, [])

  scheduleNextFeedRevealRef.current = () => {
    if (stateRef.current.pendingCommand !== null) {
      pauseFeedForCommand()
      return
    }

    const remaining = pendingFeedStepsRef.current
    if (remaining.length === 0) {
      setState((prev) => ({
        ...prev,
        isFeedRevealing: false,
        hasPendingFeedSteps: false,
        nextFeedTimeAdvanceMins: null,
      }))
      onFeedCompleteRef.current?.()
      return
    }

    syncNextFeedPreview(remaining)

    const step = remaining[0]
    const timeout = setTimeout(() => {
      if (stateRef.current.pendingCommand !== null) {
        pauseFeedForCommand()
        return
      }

      feedIndexRef.current += 1
      pendingFeedStepsRef.current = remaining.slice(1)
      revealFeedStep(step)
      syncNextFeedPreview(pendingFeedStepsRef.current)

      if (pendingFeedStepsRef.current.length === 0) {
        setState((prev) => ({
          ...prev,
          isFeedRevealing: false,
          hasPendingFeedSteps: false,
          nextFeedTimeAdvanceMins: null,
        }))
        onFeedCompleteRef.current?.()
      } else {
        scheduleNextFeedRevealRef.current()
      }
    }, step.delay_ms)

    feedCancelRef.current = () => clearTimeout(timeout)
  }

  const runFeedSequence = useCallback(
    (steps: FeedStep[], onComplete: () => void) => {
      cancelFeed()
      feedPausedForCommandRef.current = false
      pendingFeedStepsRef.current = steps
      feedIndexRef.current = 0
      onFeedCompleteRef.current = onComplete
      syncNextFeedPreview(steps)

      setState((prev) => ({
        ...prev,
        isFeedRevealing: steps.length > 0,
        hasPendingFeedSteps: steps.length > 0,
      }))

      if (steps.length === 0) {
        onComplete()
        return
      }

      if (stateRef.current.pendingCommand !== null) {
        pauseFeedForCommand()
        return
      }

      const timeout = setTimeout(() => {
        if (stateRef.current.pendingCommand !== null) {
          pauseFeedForCommand()
          return
        }

        const step = steps[0]
        feedIndexRef.current = 1
        pendingFeedStepsRef.current = steps.slice(1)
        revealFeedStep(step)
        syncNextFeedPreview(pendingFeedStepsRef.current)

        if (pendingFeedStepsRef.current.length === 0) {
          setState((prev) => ({
            ...prev,
            isFeedRevealing: false,
            hasPendingFeedSteps: false,
            nextFeedTimeAdvanceMins: null,
          }))
          onFeedCompleteRef.current?.()
        } else {
          scheduleNextFeedRevealRef.current()
        }
      }, steps[0].delay_ms)

      feedCancelRef.current = () => clearTimeout(timeout)
    },
    [cancelFeed, pauseFeedForCommand, revealFeedStep, syncNextFeedPreview]
  )

  const advanceConsoleBlockRef = useRef<() => void>(() => {})

  const drainNextOutputRef = useRef<(() => void) | null>(null)

  drainNextOutputRef.current = () => {
    if (waitingForProgressRef.current) return

    const queue = outputQueueRef.current
    const index = outputIndexRef.current

    if (index >= queue.length) {
      advanceConsoleBlockRef.current()
      return
    }

    const line = queue[index]
    outputIndexRef.current = index + 1

    if (isProgressBarLine(line.text)) {
      const parts = parseProgressBar(line.text)
      if (parts && shouldAnimateProgress(parts)) {
        waitingForProgressRef.current = true
        const id = nextLineId()
        appendConsoleLine({
          id,
          text: line.text,
          isProgress: true,
          progressComplete: false,
        })
        setState((prev) => ({ ...prev, isConsoleRevealing: true }))
      } else {
        appendConsoleLine({ id: nextLineId(), text: line.text })
        const timeoutId = setTimeout(() => {
          drainNextOutputRef.current?.()
        }, line.delay_ms)
        consoleCancelRef.current = () => clearTimeout(timeoutId)
      }
    } else {
      appendConsoleLine({ id: nextLineId(), text: line.text })
      const timeoutId = setTimeout(() => {
        drainNextOutputRef.current?.()
      }, line.delay_ms)
      consoleCancelRef.current = () => clearTimeout(timeoutId)
    }
  }

  advanceConsoleBlockRef.current = () => {
    const blocks = consoleBlocksRef.current
    const nextIndex = consoleBlockIndexRef.current + 1

    if (nextIndex >= blocks.length) {
      setState((prev) => ({
        ...prev,
        isConsoleRevealing: false,
        pendingCommand: null,
      }))
      onConsoleCompleteRef.current?.()
      return
    }

    consoleBlockIndexRef.current = nextIndex
    const block = blocks[nextIndex]

    if (block.length > 0 && isConsoleCommand(block[0].text)) {
      outputQueueRef.current = block.slice(1)
      outputIndexRef.current = 0
      setState((prev) => ({
        ...prev,
        pendingCommand: block[0].text,
        isConsoleRevealing: block.slice(1).length > 0,
      }))
      pauseFeedForCommand()
    } else {
      outputQueueRef.current = block
      outputIndexRef.current = 0
      setState((prev) => ({ ...prev, pendingCommand: null }))
      drainNextOutputRef.current?.()
    }
  }

  const setupConsoleSequence = useCallback(
    (lines: ConsoleLine[], onComplete: () => void) => {
      cancelConsole()
      onConsoleCompleteRef.current = onComplete
      consoleBlocksRef.current = splitConsoleBlocks(lines)
      consoleBlockIndexRef.current = -1

      if (consoleBlocksRef.current.length === 0) {
        onComplete()
        return
      }

      advanceConsoleBlockRef.current()
    },
    [cancelConsole]
  )

  const startChapterInit = useCallback(
    (chapterIndex: number) => {
      const chapter = getChapter(chapterIndex)
      if (!chapter) return

      cancelFeed()
      cancelConsole()
      feedCompleteRef.current = false
      consoleCompleteRef.current = false
      isLogoutEpilogueRef.current = false

      const prevMetrics = {
        bedUtilization: stateRef.current.bedUtilization,
        ambulanceQueue: stateRef.current.ambulanceQueue,
      }
      const metrics = resolveChapterMetrics(chapter, chapterIndex, prevMetrics)
      const feedItems = mergePressureFeedItems(
        chapter,
        prevMetrics,
        metrics,
        firedPressureRef.current,
        enrichFeedItems(chapter.feed_init, metrics)
      )
      const feedStartTime = maxTime(
        stateRef.current.currentGameTime,
        chapter.start_time
      )
      const banner = initBannerState(chapter)

      setState((prev) => ({
        ...prev,
        chapterIndex,
        phase: 'init',
        currentGameTime: feedStartTime,
        bedUtilization: metrics.bedUtilization,
        ambulanceQueue: metrics.ambulanceQueue,
        quarantineSeconds: banner.quarantineSeconds,
        mirrorProgress: banner.mirrorProgress,
        purgeProgress: banner.purgeProgress,
        identity: chapter.identity,
        channel: chapter.channel,
        pendingCommand: null,
        isFeedRevealing: true,
        isConsoleRevealing: true,
        hasPendingFeedSteps: true,
      }))

      const feedSteps = buildFeedSteps(feedItems, feedStartTime)

      runFeedSequence(feedSteps, () => {
        feedCompleteRef.current = true
        tryCompleteInit()
      })

      setupConsoleSequence(chapter.console_init, () => {
        consoleCompleteRef.current = true
        tryCompleteInit()
      })
    },
    [cancelFeed, cancelConsole, runFeedSequence, setupConsoleSequence, tryCompleteInit]
  )

  startChapterInitRef.current = startChapterInit

  const startEpilogueFeed = useCallback(() => {
    isLogoutEpilogueRef.current = false
    const steps = buildFeedSteps(
      enrichFeedItems(storyData.epilogue.feed, EPILOGUE_METRICS),
      epilogueStartTimeRef.current
    )

    runFeedSequence(steps, () => {
      isLogoutEpilogueRef.current = true
      logoutOutputRef.current = storyData.epilogue.logout_output
      setState((prev) => ({
        ...prev,
        pendingCommand: storyData.epilogue.logout_command,
        isFeedRevealing: false,
        hasPendingFeedSteps: false,
        nextFeedTimeAdvanceMins: null,
      }))
    })
  }, [runFeedSequence])

  startEpilogueFeedRef.current = startEpilogueFeed

  const beginSession = useCallback(() => {
    lineIdCounter = 0
    feedTabActiveRef.current = false
    firedPressureRef.current.clear()
    setState({
      ...createInitialState(),
      phase: 'init',
      identity: getChapter(0)!.identity,
      channel: getChapter(0)!.channel,
      isFeedRevealing: true,
      isConsoleRevealing: true,
      hasPendingFeedSteps: true,
    })
    startChapterInit(0)
  }, [startChapterInit])

  const selectOption = useCallback(
    (optionIndex: number) => {
      const s = stateRef.current
      const chapter = getChapter(s.chapterIndex)
      if (!chapter || s.phase !== 'choice') return
      if (s.isFeedRevealing || s.isConsoleRevealing || s.pendingCommand) return
      if (s.hasPendingFeedSteps) return

      const option = chapter.options[optionIndex]
      if (!option) return

      cancelFeed()
      cancelConsole()
      feedCompleteRef.current = false
      consoleCompleteRef.current = false
      responseChapterIndexRef.current = s.chapterIndex

      const newGameTime = addMinutesToTime(
        s.currentGameTime,
        option.time_cost_mins
      )

      const prevMetrics = {
        bedUtilization: s.bedUtilization,
        ambulanceQueue: s.ambulanceQueue,
      }

      const newMetrics = applyMetricsUpdate(
        prevMetrics,
        option.time_cost_mins,
        option.metrics_delta
      )

      const responseFeedItems = mergePressureFeedItems(
        chapter,
        prevMetrics,
        newMetrics,
        firedPressureRef.current,
        enrichFeedItems(option.feed_update, newMetrics)
      )

      const bannerBefore: BannerState = {
        quarantineSeconds: s.quarantineSeconds,
        mirrorProgress: s.mirrorProgress,
        purgeProgress: s.purgeProgress,
      }
      let bannerAfter = applyBannerTick(
        chapter,
        bannerBefore,
        option.time_cost_mins
      )
      if (chapter.id === '3.2') {
        bannerAfter = {
          ...bannerAfter,
          mirrorProgress: 100,
        }
      }

      setState((prev) => ({
        ...prev,
        phase: 'response',
        currentGameTime: newGameTime,
        bedUtilization: newMetrics.bedUtilization,
        ambulanceQueue: newMetrics.ambulanceQueue,
        quarantineSeconds: bannerAfter.quarantineSeconds,
        mirrorProgress: bannerAfter.mirrorProgress,
        purgeProgress: bannerAfter.purgeProgress,
        isFeedRevealing: responseFeedItems.length > 0,
        isConsoleRevealing: option.console_response.length > 0,
        hasPendingFeedSteps: responseFeedItems.length > 0,
      }))

      appendFeedItem({
        timestamp: s.currentGameTime,
        sender: getPlayerFeedSender(chapter.identity),
        text: getPlayerChoiceMessage(option),
        isPlayer: true,
      })

      runFeedSequence(
        buildResponseFeedSteps(responseFeedItems, s.currentGameTime),
        () => {
          feedCompleteRef.current = true
          tryAdvanceAfterResponse()
        }
      )

      setupConsoleSequence(option.console_response, () => {
        consoleCompleteRef.current = true
        tryAdvanceAfterResponse()
      })
    },
    [cancelFeed, cancelConsole, runFeedSequence, setupConsoleSequence, tryAdvanceAfterResponse, appendFeedItem]
  )

  const runPendingCommand = useCallback(() => {
    const cmd = stateRef.current.pendingCommand
    if (!cmd) return

    appendConsoleLine({ id: nextLineId(), text: cmd })
    setState((prev) => ({
      ...prev,
      pendingCommand: null,
      isConsoleRevealing: true,
    }))

    if (isLogoutEpilogueRef.current) {
      outputQueueRef.current = logoutOutputRef.current
      outputIndexRef.current = 0
      onConsoleCompleteRef.current = () => {
        setState((prev) => ({
          ...prev,
          phase: 'reset',
          isConsoleRevealing: false,
        }))
        isLogoutEpilogueRef.current = false
      }
      waitingForProgressRef.current = false
      drainNextOutputRef.current?.()
      return
    }

    waitingForProgressRef.current = false
    drainNextOutputRef.current?.()
    resumeFeedIfPaused()
  }, [appendConsoleLine, resumeFeedIfPaused])

  const onProgressLineComplete = useCallback((lineId: string) => {
    waitingForProgressRef.current = false
    setState((prev) => ({
      ...prev,
      consoleLines: prev.consoleLines.map((l) =>
        l.id === lineId ? { ...l, progressComplete: true } : l
      ),
    }))
    drainNextOutputRef.current?.()
  }, [])

  const advanceFeed = useCallback(() => {
    const remaining = pendingFeedStepsRef.current
    if (remaining.length === 0) return
    if (stateRef.current.pendingCommand !== null) return

    cancelFeed()

    const step = remaining[0]
    feedIndexRef.current += 1
    pendingFeedStepsRef.current = remaining.slice(1)
    revealFeedStep(step)
    syncNextFeedPreview(pendingFeedStepsRef.current)

    if (pendingFeedStepsRef.current.length === 0) {
      setState((prev) => ({
        ...prev,
        isFeedRevealing: false,
        hasPendingFeedSteps: false,
        nextFeedTimeAdvanceMins: null,
      }))
      onFeedCompleteRef.current?.()
    } else {
      scheduleNextFeedRevealRef.current()
    }
  }, [cancelFeed, revealFeedStep, syncNextFeedPreview])

  const setFeedTabActive = useCallback((active: boolean) => {
    feedTabActiveRef.current = active
    if (active) {
      setState((prev) => ({
        ...prev,
        unreadFeedCount: 0,
        lastReadFeedIndex: prev.feedItems.length - 1,
        firstUnreadIndex: null,
      }))
    }
  }, [])

  const markUnreadSeen = useCallback(() => {
    setState((prev) => ({ ...prev, firstUnreadIndex: null }))
  }, [])

  const replay = useCallback(() => {
    cancelFeed()
    cancelConsole()
    lineIdCounter = 0
    isLogoutEpilogueRef.current = false
    feedTabActiveRef.current = false
    firedPressureRef.current.clear()
    setState(createInitialState())
  }, [cancelFeed, cancelConsole])

  const currentChapter = getChapter(state.chapterIndex)

  const canShowChoices =
    state.phase === 'choice' &&
    !state.isFeedRevealing &&
    !state.isConsoleRevealing &&
    !state.pendingCommand &&
    !state.hasPendingFeedSteps

  const value = useMemo<GameContextValue>(
    () => ({
      ...state,
      title: storyData.title,
      currentChapter: state.phase === 'epilogue' ? undefined : currentChapter,
      isRevealing: state.isFeedRevealing || state.isConsoleRevealing,
      canShowChoices,
      beginSession,
      selectOption,
      runPendingCommand,
      advanceFeed,
      setFeedTabActive,
      markUnreadSeen,
      onProgressLineComplete,
      replay,
    }),
    [
      state,
      currentChapter,
      canShowChoices,
      beginSession,
      selectOption,
      runPendingCommand,
      advanceFeed,
      setFeedTabActive,
      markUnreadSeen,
      onProgressLineComplete,
      replay,
    ]
  )

  return <GameContext.Provider value={value}>{children}</GameContext.Provider>
}

export function useGame(): GameContextValue {
  const ctx = useContext(GameContext)
  if (!ctx) {
    throw new Error('useGame must be used within GameProvider')
  }
  return ctx
}
