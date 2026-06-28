import type {
  Chapter,
  MetricsDelta,
  PressureLine,
} from '../types/story'

export interface ChapterMetrics {
  bedUtilization: number
  ambulanceQueue: number
}

const BED_MIN = 85
const BED_MAX = 99
const AMB_MIN = 0
const AMB_MAX = 15

export function clampMetrics(
  bedUtilization: number,
  ambulanceQueue: number
): ChapterMetrics {
  return {
    bedUtilization: Math.min(BED_MAX, Math.max(BED_MIN, bedUtilization)),
    ambulanceQueue: Math.min(AMB_MAX, Math.max(AMB_MIN, ambulanceQueue)),
  }
}

/** Fallback when chapter JSON omits explicit metrics. */
export function getMetricsForChapter(chapterIndex: number): ChapterMetrics {
  if (chapterIndex === 0) {
    return { bedUtilization: 98, ambulanceQueue: 4 }
  }
  if (chapterIndex === 1) {
    return { bedUtilization: 98, ambulanceQueue: 7 }
  }
  if (chapterIndex === 2) {
    return { bedUtilization: 98, ambulanceQueue: 15 }
  }
  if (chapterIndex === 3) {
    return { bedUtilization: 98, ambulanceQueue: 3 }
  }
  return { bedUtilization: 98, ambulanceQueue: 3 }
}

export function resolveChapterMetrics(
  chapter: Chapter,
  chapterIndex: number,
  current?: ChapterMetrics
): ChapterMetrics {
  const baseline = chapter.metrics ?? getMetricsForChapter(chapterIndex)
  if (!current) return baseline
  if (chapter.metrics) {
    return clampMetrics(baseline.bedUtilization, baseline.ambulanceQueue)
  }
  return clampMetrics(
    Math.max(current.bedUtilization, baseline.bedUtilization),
    Math.max(current.ambulanceQueue, baseline.ambulanceQueue)
  )
}

export function applyMetricsUpdate(
  current: ChapterMetrics,
  timeCostMins: number,
  explicitDelta?: MetricsDelta
): ChapterMetrics {
  const autoBed = Math.floor(timeCostMins / 4)
  const autoAmb = Math.floor(timeCostMins / 2)
  return clampMetrics(
    current.bedUtilization + autoBed + (explicitDelta?.bedUtilization ?? 0),
    current.ambulanceQueue + autoAmb + (explicitDelta?.ambulanceQueue ?? 0)
  )
}

export function meetsPressureThreshold(
  metrics: ChapterMetrics,
  when: PressureLine['when']
): boolean {
  if (
    when.bedUtilization != null &&
    metrics.bedUtilization < when.bedUtilization
  ) {
    return false
  }
  if (
    when.ambulanceQueue != null &&
    metrics.ambulanceQueue < when.ambulanceQueue
  ) {
    return false
  }
  if (
    when.bedUtilizationMax != null &&
    metrics.bedUtilization > when.bedUtilizationMax
  ) {
    return false
  }
  if (
    when.ambulanceQueueMax != null &&
    metrics.ambulanceQueue > when.ambulanceQueueMax
  ) {
    return false
  }
  return true
}

export function getNewlyTriggeredPressureLines(
  chapter: Chapter,
  prevMetrics: ChapterMetrics,
  newMetrics: ChapterMetrics,
  firedIds: Set<string>
): PressureLine[] {
  if (!chapter.pressure_lines?.length) return []

  return chapter.pressure_lines.filter((line) => {
    if (firedIds.has(line.id)) return false
    const meetsNow = meetsPressureThreshold(newMetrics, line.when)
    const metBefore = meetsPressureThreshold(prevMetrics, line.when)
    return meetsNow && !metBefore
  })
}

export function interpolateMetricsText(
  text: string,
  metrics: ChapterMetrics
): string {
  const occupancy = String(metrics.bedUtilization)
  return text
    .replace(/\{bedUtilization\}/g, occupancy)
    .replace(/\{occupancy\}/g, occupancy)
    .replace(/\{ambulanceQueue\}/g, String(metrics.ambulanceQueue))
}

function formatSignedDelta(value: number, unit: string): string {
  if (value === 0) return ''
  const sign = value > 0 ? '+' : ''
  return `${sign}${value}${unit}`
}

export function formatChoiceMetricsHint(
  timeCostMins: number,
  explicitDelta?: MetricsDelta
): string {
  const bed =
    Math.floor(timeCostMins / 4) + (explicitDelta?.bedUtilization ?? 0)
  const amb =
    Math.floor(timeCostMins / 2) + (explicitDelta?.ambulanceQueue ?? 0)

  const parts = [`+${timeCostMins}m`]
  const bedHint = formatSignedDelta(bed, '% occ')
  const ambHint = formatSignedDelta(amb, ' amb')
  if (bedHint) parts.push(bedHint)
  if (ambHint) parts.push(ambHint)
  return parts.join(' · ')
}

export const EPILOGUE_METRICS: ChapterMetrics = {
  bedUtilization: 88,
  ambulanceQueue: 0,
}

export interface PressureTier {
  level: number
  label: string
}

export function getPressureTier(metrics: ChapterMetrics): PressureTier {
  if (metrics.bedUtilization >= 96 || metrics.ambulanceQueue >= 9) {
    return { level: 4, label: 'METRIC LOCK' }
  }
  if (metrics.bedUtilization >= 94 || metrics.ambulanceQueue >= 7) {
    return { level: 3, label: 'CRITICAL' }
  }
  if (metrics.bedUtilization >= 92 || metrics.ambulanceQueue >= 4) {
    return { level: 2, label: 'ELEVATED' }
  }
  return { level: 1, label: 'STABLE' }
}

export interface BannerState {
  quarantineSeconds: number | null
  mirrorProgress: number | null
  purgeProgress: number | null
}

export function initBannerState(chapter: Chapter): BannerState {
  const banner = chapter.banner
  if (!banner || banner.mode === 'standard') {
    return {
      quarantineSeconds: null,
      mirrorProgress: null,
      purgeProgress: null,
    }
  }
  if (banner.mode === 'quarantine') {
    return {
      quarantineSeconds: banner.quarantine_seconds ?? 90,
      mirrorProgress: null,
      purgeProgress: null,
    }
  }
  return {
    quarantineSeconds: null,
    mirrorProgress: banner.mirror_progress ?? 4,
    purgeProgress: banner.purge_progress ?? 12,
  }
}

export function applyBannerTick(
  chapter: Chapter | undefined,
  banner: BannerState,
  timeAdvanceMins: number
): BannerState {
  if (!chapter?.banner || timeAdvanceMins <= 0) return banner

  if (
    chapter.banner.mode === 'quarantine' &&
    banner.quarantineSeconds != null
  ) {
    return {
      ...banner,
      quarantineSeconds: Math.max(
        0,
        banner.quarantineSeconds - timeAdvanceMins * 15
      ),
    }
  }

  if (chapter.banner.mode === 'race') {
    return {
      quarantineSeconds: null,
      mirrorProgress: Math.min(
        100,
        (banner.mirrorProgress ?? 0) + timeAdvanceMins * 4
      ),
      purgeProgress: Math.min(
        100,
        (banner.purgeProgress ?? 0) + timeAdvanceMins * 5
      ),
    }
  }

  return banner
}

export function formatQuarantineSeconds(seconds: number): string {
  const mins = Math.floor(seconds / 60)
  const secs = seconds % 60
  return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`
}

export const EMPTY_BANNER: BannerState = {
  quarantineSeconds: null,
  mirrorProgress: null,
  purgeProgress: null,
}

export const COMPILE_LOG_LINES = [
  'INIT ghost_session_v1.0.bin',
  'LOAD kernel_modules [0.000000ms]',
  'VERIFY checksum 0xB8E3F102 [0.000000ms]',
  'MOUNT /sys/firmware/open_health [0.000000ms]',
  'PURGE omnic_telemetry_agent.bin [0.000000ms]',
  'REMAP bed_occupancy_partitions [0.000000ms]',
  'RESTORE cad_sync_routing_tables [0.000000ms]',
  'ENABLE pas_override_bus [0.000000ms]',
  'DISABLE row_lock_eviction_daemon [0.000000ms]',
  'RELINK cad_pre_alert_endpoints [0.000000ms]',
  'RESTORE wristband_print_engine [0.000000ms]',
  'UNMASK live_intake_queue_weights [0.000000ms]',
  'RECONNECT ambulance_bay_gateway [0.000000ms]',
  'VALIDATE pas_assign_bed_handlers [0.000000ms]',
  'SYNC nhs_trust_grid_4_mesh [0.000000ms]',
  'APPLY whistleblower_audit_layer [0.000000ms]',
  'REGISTER press_secure_drop_sink [0.000000ms]',
  'FLUSH omnic_forensics_flags [0.000000ms]',
  'COMMIT force_unlock_pas.sql [0.000000ms]',
  'START network_heartbeat [0.000000ms]',
  'ASSERT occupancy_cap=HUMAN_SAFE [0.000000ms]',
  'ASSERT cad_sync=LIVE_TELEMETRY [0.000000ms]',
  'BOOT userland_services [0.000000ms]',
  'TRACE CLEARED · STATUS GHOST [0.000000ms]',
]
