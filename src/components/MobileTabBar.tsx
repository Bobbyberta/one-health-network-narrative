import { MessageSquare, Monitor } from 'lucide-react'
import type { MobileTab } from '../types/story'

const TABS: { id: MobileTab; label: string; icon: typeof MessageSquare }[] = [
  { id: 'feed', label: 'Feed', icon: MessageSquare },
  { id: 'console', label: 'Console', icon: Monitor },
]

interface MobileTabBarProps {
  activeTab: MobileTab
  onTabChange: (tab: MobileTab) => void
  unreadFeedCount?: number
  hasPendingCommand?: boolean
}

export function MobileTabBar({
  activeTab,
  onTabChange,
  unreadFeedCount = 0,
  hasPendingCommand = false,
}: MobileTabBarProps) {
  return (
    <nav
      className="flex shrink-0 border-t border-slate-700 bg-slate-900 md:hidden"
      aria-label="Panel navigation"
    >
      {TABS.map(({ id, label, icon: Icon }) => {
        const active = activeTab === id
        const showFeedBadge =
          id === 'feed' && activeTab === 'console' && unreadFeedCount > 0
        const showConsoleBadge = id === 'console' && hasPendingCommand && !active

        return (
          <button
            key={id}
            type="button"
            onClick={() => onTabChange(id)}
            className={`relative flex min-h-14 flex-1 touch-manipulation flex-col items-center justify-center gap-0.5 pb-[env(safe-area-inset-bottom)] pt-2 text-[10px] uppercase tracking-wide transition-colors ${
              active
                ? 'bg-slate-950 text-emerald-400'
                : 'text-slate-500 hover:text-slate-300'
            }`}
            aria-current={active ? 'page' : undefined}
          >
            <span className="relative">
              <Icon className="h-5 w-5" aria-hidden />
              {showFeedBadge && (
                <span
                  className="absolute -right-2.5 -top-1.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-1 text-[9px] font-bold text-white"
                  aria-label={`${unreadFeedCount} unread messages`}
                >
                  {unreadFeedCount > 9 ? '9+' : unreadFeedCount}
                </span>
              )}
              {showConsoleBadge && (
                <span
                  className="absolute -right-1 -top-1 h-2.5 w-2.5 rounded-full bg-emerald-400"
                  aria-label="Command ready to run"
                />
              )}
            </span>
            <span>{label}</span>
          </button>
        )
      })}
    </nav>
  )
}

export { TABS }
