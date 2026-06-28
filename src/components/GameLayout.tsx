import { useEffect, useState } from 'react'
import { useGame } from '../context/GameContext'
import type { MobileTab } from '../types/story'
import { ActionChoices } from './ActionChoices'
import { FeedPanel } from './FeedPanel'
import { IntroModal } from './IntroModal'
import { MobileTabBar } from './MobileTabBar'
import { SystemBanner } from './SystemBanner'
import { SystemReset } from './SystemReset'
import { TerminalConsole } from './TerminalConsole'

export function GameLayout() {
  const { setFeedTabActive, unreadFeedCount, pendingCommand } = useGame()
  const [mobileTab, setMobileTab] = useState<MobileTab>('feed')
  const [scrollAlignTrigger, setScrollAlignTrigger] = useState(0)

  useEffect(() => {
    const mq = window.matchMedia('(min-width: 768px)')
    const syncFeedActive = () => {
      if (mq.matches) {
        setFeedTabActive(true)
      } else {
        setFeedTabActive(mobileTab === 'feed')
      }
    }
    syncFeedActive()
    mq.addEventListener('change', syncFeedActive)
    return () => mq.removeEventListener('change', syncFeedActive)
  }, [mobileTab, setFeedTabActive])

  const handleTabChange = (tab: MobileTab) => {
    setMobileTab(tab)
    setFeedTabActive(tab === 'feed')
    if (tab === 'feed') {
      setScrollAlignTrigger((n) => n + 1)
    }
  }

  return (
    <div className="flex h-dvh flex-col overflow-hidden bg-slate-950 text-slate-200">
      <IntroModal />
      <SystemBanner />

      {/* Desktop: console left, feed+actions right */}
      <div className="hidden min-h-0 flex-1 md:grid md:grid-cols-2">
        <div className="min-h-0 overflow-hidden border-r border-slate-700">
          <TerminalConsole />
        </div>
        <div className="min-h-0 overflow-hidden">
          <FeedPanel />
        </div>
      </div>

      {/* Mobile tabbed layout */}
      <div className="flex min-h-0 flex-1 flex-col md:hidden">
        <div className="min-h-0 flex-1 overflow-hidden">
          {mobileTab === 'feed' && (
            <FeedPanel scrollAlignTrigger={scrollAlignTrigger} />
          )}
          {mobileTab === 'console' && (
            <div className="flex h-full min-h-0 flex-col">
              <TerminalConsole />
              <ActionChoices />
            </div>
          )}
        </div>
        <MobileTabBar
          activeTab={mobileTab}
          onTabChange={handleTabChange}
          unreadFeedCount={unreadFeedCount}
          hasPendingCommand={pendingCommand !== null}
        />
      </div>

      <SystemReset />
    </div>
  )
}
