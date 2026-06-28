import { ChatFeed } from './ChatFeed'
import { ActionChoices } from './ActionChoices'
import { SpeedUpControl } from './SpeedUpControl'

interface FeedPanelProps {
  scrollAlignTrigger?: number
}

export function FeedPanel({ scrollAlignTrigger = 0 }: FeedPanelProps) {
  return (
    <div className="flex h-full min-h-0 flex-col overflow-hidden">
      <ChatFeed scrollAlignTrigger={scrollAlignTrigger} />
      <SpeedUpControl />
      <ActionChoices />
    </div>
  )
}
