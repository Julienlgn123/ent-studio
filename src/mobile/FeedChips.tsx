import { useState } from 'react'
import { Plus } from 'lucide-react'
import { useStore } from '../renderer/src/store'
import AddFeedModal from '../renderer/src/components/AddFeedModal'

export default function FeedChips(): JSX.Element {
  const { feeds, activeFeedId, setActiveFeed, changesByFeed, errorByFeed } = useStore()
  const [showAdd, setShowAdd] = useState(false)

  return (
    <div className="feed-chips-row">
      {feeds.map((f) => {
        const changeCount = changesByFeed[f.id]?.length ?? 0
        const hasError = !!errorByFeed[f.id]
        return (
          <button
            key={f.id}
            className={`feed-chip ${activeFeedId === f.id ? 'active' : ''}`}
            onClick={() => setActiveFeed(f.id)}
          >
            {f.name}
            {hasError && <span className="feed-chip-dot error" />}
            {!hasError && changeCount > 0 && <span className="feed-chip-badge">{changeCount}</span>}
          </button>
        )
      })}
      <button className="feed-chip feed-chip-add" onClick={() => setShowAdd(true)}>
        <Plus size={13} /> Ajouter
      </button>
      {showAdd && <AddFeedModal onClose={() => setShowAdd(false)} />}
    </div>
  )
}
