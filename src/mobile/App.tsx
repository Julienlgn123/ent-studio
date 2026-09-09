import { useEffect, useState } from 'react'
import { Bell, CalendarDays, RefreshCw } from 'lucide-react'
import { useStore } from '../renderer/src/store'
import FeedChips from './FeedChips'
import ScheduleArea from '../renderer/src/components/ScheduleArea'
import ChangesPanel from '../renderer/src/components/ChangesPanel'
import Toast from '../renderer/src/components/Toast'

export default function App(): JSX.Element {
  const { feeds, loadAll, refreshAll, refreshing, changesByFeed, activeFeedId } = useStore()
  const [showChanges, setShowChanges] = useState(false)

  useEffect(() => {
    loadAll().then(() => refreshAll())
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const changeCount = (activeFeedId && changesByFeed[activeFeedId]?.length) || 0

  return (
    <div className="mobile-shell">
      <div className="mobile-header">
        <CalendarDays size={18} />
        <span className="mobile-header-title">ENT Studio</span>
        <div className="titlebar-spacer" />
        <button className="icon-btn" onClick={() => refreshAll()} disabled={refreshing} data-tooltip="Rafraichir">
          <RefreshCw size={16} className={refreshing ? 'spin' : ''} />
        </button>
        <button className="icon-btn" onClick={() => setShowChanges(true)} data-tooltip="Changements">
          <Bell size={16} />
          {changeCount > 0 && <span className="mobile-bell-badge">{changeCount}</span>}
        </button>
      </div>

      {feeds.length > 0 && <FeedChips />}

      <ScheduleArea />

      {feeds.length === 0 && <FeedChips />}

      {showChanges && (
        <div className="modal-backdrop" onClick={() => setShowChanges(false)}>
          <div className="mobile-changes-sheet" onClick={(e) => e.stopPropagation()}>
            <ChangesPanel />
          </div>
        </div>
      )}

      <Toast />
    </div>
  )
}
