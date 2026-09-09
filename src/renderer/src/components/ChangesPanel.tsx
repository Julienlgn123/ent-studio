import { format } from 'date-fns'
import { fr } from 'date-fns/locale'
import { Bell } from 'lucide-react'
import { useStore } from '../store'
import type { ChangedField, ScheduleChange } from '../../../shared/types'

function fmtDateTime(ms: number): string {
  return format(new Date(ms), "EEEE d MMM 'a' HH:mm", { locale: fr })
}

function fmtValue(field: ChangedField, value: unknown): string {
  if (field === 'start' || field === 'end') return typeof value === 'number' ? fmtDateTime(value) : '?'
  if (value === null || value === undefined || value === '') return '(vide)'
  return String(value)
}

const FIELD_LABEL: Record<ChangedField, string> = {
  start: 'Debut',
  end: 'Fin',
  location: 'Salle',
  summary: 'Intitule',
  status: 'Statut'
}

function ChangeCard({ change }: { change: ScheduleChange }): JSX.Element {
  const cancelledNow = change.kind === 'changed' && change.event.status === 'CANCELLED' && change.fields?.includes('status')

  return (
    <div className={`change-card ${change.kind}`}>
      <div className="change-kind-label">
        {change.kind === 'added' && 'Nouveau cours'}
        {change.kind === 'removed' && 'Cours retire'}
        {change.kind === 'changed' && (cancelledNow ? 'Cours annule' : 'Cours modifie')}
      </div>
      <div className="change-summary">{change.event.summary}</div>
      {change.kind === 'added' && (
        <div className="change-detail">{fmtDateTime(change.event.start)}{change.event.location ? ` · ${change.event.location}` : ''}</div>
      )}
      {change.kind === 'removed' && (
        <div className="change-detail">Etait prevu le {fmtDateTime(change.event.start)}</div>
      )}
      {change.kind === 'changed' && change.fields && change.previous && (
        <div className="change-detail">
          {change.fields.filter((f) => f !== 'status' || !cancelledNow).map((field) => (
            <div key={field}>
              {FIELD_LABEL[field]} : <span className="old-value">{fmtValue(field, change.previous?.[field])}</span>
              {' -> '}
              {fmtValue(field, field === 'start' ? change.event.start : field === 'end' ? change.event.end : field === 'location' ? change.event.location : field === 'summary' ? change.event.summary : change.event.status)}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default function ChangesPanel(): JSX.Element {
  const { feeds, activeFeedId, changesByFeed } = useStore()
  const activeFeed = feeds.find((f) => f.id === activeFeedId)
  const changes = (activeFeedId && changesByFeed[activeFeedId]) || []

  return (
    <div className="changes-panel">
      <div className="changes-panel-header">
        <Bell size={14} />
        <span className="changes-panel-title">Changements{activeFeed ? ` — ${activeFeed.name}` : ''}</span>
      </div>
      <div className="changes-list">
        {changes.length === 0 && (
          <div className="empty-state">
            <div className="empty-state-desc">Rien de nouveau depuis la derniere fois.</div>
          </div>
        )}
        {changes.map((c) => <ChangeCard key={`${c.kind}-${c.uid}`} change={c} />)}
      </div>
    </div>
  )
}
