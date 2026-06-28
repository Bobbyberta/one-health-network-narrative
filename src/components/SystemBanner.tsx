import {
  Activity,
  Ambulance,
  BedDouble,
  Clock,
  HardDrive,
  MapPin,
  ShieldAlert,
  Trash2,
  User,
} from 'lucide-react'
import { formatQuarantineSeconds, getPressureTier } from '../config/metrics'
import { useGame } from '../context/GameContext'

function MetricChip({
  icon: Icon,
  value,
  alert,
  label,
}: {
  icon: typeof Clock
  value: string
  alert?: boolean
  label: string
}) {
  return (
    <div
      className="flex items-center gap-1 rounded border border-slate-700/80 bg-slate-950/60 px-1.5 py-0.5 md:gap-1.5 md:px-2 md:py-1"
      title={label}
    >
      <Icon className="h-3 w-3 shrink-0 text-slate-500 md:h-3.5 md:w-3.5" aria-hidden />
      <span
        className={`font-mono text-[10px] font-semibold md:text-xs ${
          alert ? 'text-red-400' : 'text-emerald-400'
        }`}
      >
        {value}
      </span>
    </div>
  )
}

function PressureBadge({ label, level }: { label: string; level: number }) {
  const colors: Record<number, string> = {
    1: 'border-slate-600 text-slate-400',
    2: 'border-amber-600/60 text-amber-400',
    3: 'border-orange-600/60 text-orange-400',
    4: 'border-red-600/60 text-red-400',
  }
  return (
    <span
      className={`hidden rounded border px-1.5 py-0.5 font-mono text-[9px] font-bold uppercase tracking-wider sm:inline ${colors[level] ?? colors[1]}`}
      title="Ward pressure tier"
    >
      {label}
    </span>
  )
}

export function SystemBanner() {
  const {
    title,
    identity,
    channel,
    currentChapter,
    currentGameTime,
    bedUtilization,
    ambulanceQueue,
    quarantineSeconds,
    mirrorProgress,
    purgeProgress,
  } = useGame()

  const pressureTier = getPressureTier({ bedUtilization, ambulanceQueue })
  const inRace = mirrorProgress != null && purgeProgress != null
  const purgeWinning = inRace && purgeProgress > mirrorProgress

  return (
    <header className="flex shrink-0 flex-wrap items-center gap-x-3 gap-y-1.5 border-b border-slate-700 bg-slate-900 px-3 py-2 text-xs md:gap-x-4 md:px-4 md:text-sm">
      <div className="flex items-center gap-2 font-bold uppercase tracking-wider text-emerald-400">
        <Activity className="h-4 w-4 shrink-0" aria-hidden />
        <span className="max-w-[140px] truncate sm:max-w-none">{title}</span>
      </div>

      <div className="hidden h-4 w-px bg-slate-700 sm:block" aria-hidden />

      <div className="flex items-center gap-1.5 text-slate-400">
        <User className="h-3.5 w-3.5 shrink-0" aria-hidden />
        <span className="max-w-[120px] truncate font-mono text-emerald-300/80 sm:max-w-none">
          {identity}
        </span>
      </div>

      <div className="hidden items-center gap-1.5 text-slate-400 sm:flex">
        <span className="text-slate-600">|</span>
        <span className="font-mono text-amber-400/90">{channel}</span>
      </div>

      <div className="ml-auto flex flex-wrap items-center justify-end gap-1.5 md:gap-2">
        <PressureBadge label={pressureTier.label} level={pressureTier.level} />
        <MetricChip icon={Clock} value={currentGameTime} label="System Clock" />

        {quarantineSeconds != null ? (
          <MetricChip
            icon={ShieldAlert}
            value={formatQuarantineSeconds(quarantineSeconds)}
            alert={quarantineSeconds <= 30}
            label="Port Quarantine Countdown"
          />
        ) : inRace ? (
          <>
            <MetricChip
              icon={HardDrive}
              value={`M ${mirrorProgress}%`}
              alert={purgeWinning}
              label="Data Mirror Progress"
            />
            <MetricChip
              icon={Trash2}
              value={`P ${purgeProgress}%`}
              alert={purgeWinning}
              label="Vanguard Purge Progress"
            />
          </>
        ) : (
          <>
            <MetricChip
              icon={BedDouble}
              value={`${bedUtilization}%`}
              alert={bedUtilization >= 95}
              label="Occupancy"
            />
            <MetricChip
              icon={Ambulance}
              value={String(ambulanceQueue)}
              alert={ambulanceQueue >= 7}
              label="Ambulance Queue"
            />
          </>
        )}

        <div className="hidden items-center gap-1.5 text-slate-500 lg:flex">
          <MapPin className="h-3.5 w-3.5" aria-hidden />
          <span>Bath, UK</span>
          {currentChapter && (
            <>
              <span className="text-slate-600">//</span>
              <span className="font-mono text-slate-400">
                CH-{currentChapter.id}
              </span>
            </>
          )}
        </div>
      </div>
    </header>
  )
}
