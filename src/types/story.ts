export interface ConsoleLine {
  text: string
  delay_ms: number
}

export interface FeedItemRaw {
  tick_offset_mins: number
  sender: string
  text: string
  delay_ms: number
}

export interface ChapterMetrics {
  bedUtilization: number
  ambulanceQueue: number
}

export interface MetricsDelta {
  bedUtilization?: number
  ambulanceQueue?: number
}

export interface PressureLine {
  id: string
  when: {
    bedUtilization?: number
    ambulanceQueue?: number
    bedUtilizationMax?: number
    ambulanceQueueMax?: number
  }
  sender: string
  text: string
  delay_ms: number
}

export type BannerMode = 'standard' | 'quarantine' | 'race'

export interface ChapterBanner {
  mode: BannerMode
  quarantine_seconds?: number
  mirror_progress?: number
  purge_progress?: number
}

export interface Option {
  text: string
  player_message?: string
  time_cost_mins: number
  metrics_delta?: MetricsDelta
  console_response: ConsoleLine[]
  feed_update: FeedItemRaw[]
}

export interface Chapter {
  id: string
  identity: string
  channel: string
  start_time: string
  metrics?: ChapterMetrics
  banner?: ChapterBanner
  pressure_lines?: PressureLine[]
  console_init: ConsoleLine[]
  feed_init: FeedItemRaw[]
  options: Option[]
}

export interface Epilogue {
  feed: FeedItemRaw[]
  logout_command: string
  logout_output: ConsoleLine[]
}

export interface StoryData {
  title: string
  chapters: Chapter[]
  epilogue: Epilogue
}

export interface RevealedConsoleLine {
  id: string
  text: string
  isProgress?: boolean
  progressComplete?: boolean
}

export interface RevealedFeedItem {
  timestamp: string
  sender: string
  text: string
  isPlayer?: boolean
}

export type GamePhase =
  | 'intro'
  | 'init'
  | 'choice'
  | 'response'
  | 'epilogue'
  | 'reset'
  | 'complete'

export type MobileTab = 'feed' | 'console'

export interface FeedStep {
  tick_offset_mins: number
  sender: string
  text: string
  delay_ms: number
  chapterStartTime: string
  timeAdvanceMins: number
}
