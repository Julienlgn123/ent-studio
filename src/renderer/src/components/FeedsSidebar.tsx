import { useState } from 'react'
import { CalendarDays, Plus, Trash2 } from 'lucide-react'
import { useStore } from '../store'
import AddFeedModal from './AddFeedModal'

export default function FeedsSidebar(): JSX.Element {
  const { feeds, activeFeedId, setActiveFeed, changesByFeed, errorByFeed, removeFeed } = useStore()
  const [showAdd, setShowAdd] = useState(false)

  return (
    <div className="feeds-panel">
      <div className="feeds-panel-header">
        <span>Emplois du temps</span>
        <button className="icon-btn" onClick={() => setShowAdd(true)} data-tooltip="Ajouter un flux">
          <Plus size={14} />
        </button>
      </div>

      {feeds.length === 0 && (
        <div className="empty-state">
          <CalendarDays size={26} style={{ opacity: 0.35 }} />
          <div className="empty-state-title">Aucun flux</div>
          <div className="empty-state-desc">
            Ajoute le lien ICS/iCal de ton emploi du temps fourni par ton ENT.
          </div>
          <button className="btn btn-primary btn-sm" onClick={() => setShowAdd(true)}>
            <Plus size={13} /> Ajouter un flux
          </button>
        </div>
      )}

      {feeds.map((f) => {
        const changeCount = changesByFeed[f.id]?.length ?? 0
        const hasError = !!errorByFeed[f.id]
        return (
          <div
            key={f.id}
            className={`feed-item ${activeFeedId === f.id ? 'active' : ''}`}
            onClick={() => setActiveFeed(f.id)}
          >
            <span className="feed-item-name" title={f.name}>{f.name}</span>
            {hasError && <span style={{ color: 'var(--danger)', fontSize: 11 }} data-tooltip={errorByFeed[f.id] ?? ''}>⚠</span>}
            {!hasError && changeCount > 0 && <span className="feed-item-badge">{changeCount}</span>}
            <button
              className="icon-btn"
              style={{ width: 20, height: 20 }}
              onClick={(e) => { e.stopPropagation(); if (window.confirm(`Retirer « ${f.name} » ?`)) removeFeed(f.id) }}
              data-tooltip="Retirer"
            >
              <Trash2 size={12} />
            </button>
          </div>
        )
      })}

      {showAdd && <AddFeedModal onClose={() => setShowAdd(false)} />}
    </div>
  )
}
