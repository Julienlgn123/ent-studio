import { useMemo } from 'react'
import { format, isSameDay } from 'date-fns'
import { fr } from 'date-fns/locale'
import { CalendarDays, MapPin } from 'lucide-react'
import { useStore } from '../store'
import type { ScheduleChange, ScheduleEvent } from '../../../shared/types'

function capitalize(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1)
}

function changeFor(changes: ScheduleChange[], uid: string): ScheduleChange | undefined {
  return changes.find((c) => c.uid === uid)
}

export default function ScheduleArea(): JSX.Element {
  const { feeds, activeFeedId, eventsByFeed, changesByFeed, errorByFeed, loading } = useStore()
  const activeFeed = feeds.find((f) => f.id === activeFeedId)
  const events = (activeFeedId && eventsByFeed[activeFeedId]) || []
  const changes = (activeFeedId && changesByFeed[activeFeedId]) || []
  const error = activeFeedId ? errorByFeed[activeFeedId] : null

  const days = useMemo(() => {
    const now = Date.now()
    const upcoming = events.filter((e) => e.end >= now - 60 * 60 * 1000)
    const groups: { date: Date; events: ScheduleEvent[] }[] = []
    for (const ev of upcoming) {
      const d = new Date(ev.start)
      const group = groups.find((g) => isSameDay(g.date, d))
      if (group) group.events.push(ev)
      else groups.push({ date: d, events: [ev] })
    }
    return groups.sort((a, b) => a.date.getTime() - b.date.getTime())
  }, [events])

  if (loading) {
    return <div className="schedule-area" />
  }

  if (!activeFeed) {
    return (
      <div className="empty-state">
        <CalendarDays size={30} style={{ opacity: 0.3 }} />
        <div className="empty-state-title">Aucun emploi du temps selectionne</div>
        <div className="empty-state-desc">Ajoute un flux depuis le panneau de gauche pour voir tes cours ici.</div>
      </div>
    )
  }

  return (
    <div className="schedule-area">
      {error && (
        <div style={{ background: 'var(--danger-dim)', color: 'var(--danger)', padding: '10px 14px', borderRadius: 'var(--radius-md)', fontSize: 12.5, marginBottom: 16 }}>
          Derniere recuperation en echec : {error}. Affichage du dernier emploi du temps connu.
        </div>
      )}
      {days.length === 0 && (
        <div className="empty-state">
          <CalendarDays size={26} style={{ opacity: 0.3 }} />
          <div className="empty-state-title">Rien a venir dans ce flux</div>
          <div className="empty-state-desc">Le flux ne contient aucun evenement futur pour le moment.</div>
        </div>
      )}
      {days.map((group) => (
        <div className="schedule-day" key={group.date.toISOString()}>
          <div className="schedule-day-title">{capitalize(format(group.date, 'EEEE d MMMM', { locale: fr }))}</div>
          {group.events.map((ev) => {
            const change = changeFor(changes, ev.uid)
            const cancelled = ev.status === 'CANCELLED'
            return (
              <div key={ev.uid} className={`schedule-event ${cancelled ? 'cancelled' : ''}`}>
                <div className="schedule-event-time">
                  {format(new Date(ev.start), 'HH:mm')} - {format(new Date(ev.end), 'HH:mm')}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div className="schedule-event-summary">{ev.summary}</div>
                  {ev.location && (
                    <div className="schedule-event-location">
                      <MapPin size={10} style={{ verticalAlign: -1 }} /> {ev.location}
                    </div>
                  )}
                </div>
                {change && change.kind === 'added' && <span className="schedule-event-flag added">Nouveau</span>}
                {change && change.kind === 'changed' && !cancelled && <span className="schedule-event-flag changed">Modifie</span>}
                {cancelled && <span className="schedule-event-flag cancelled-flag">Annule</span>}
              </div>
            )
          })}
        </div>
      ))}
    </div>
  )
}
