// Types partages entre le process main et le renderer.

export interface FeedSource {
  id: string
  name: string
  url: string
}

export interface ScheduleEvent {
  uid: string
  summary: string
  location: string | null
  /** Epoch ms */
  start: number
  /** Epoch ms */
  end: number
  description: string | null
  /** CONFIRMED / TENTATIVE / CANCELLED, tel que fourni par le flux ICS (souvent absent) */
  status: string | null
}

export type ChangeKind = 'added' | 'removed' | 'changed'
export type ChangedField = 'start' | 'end' | 'location' | 'summary' | 'status'

export interface ScheduleChange {
  kind: ChangeKind
  uid: string
  /** Version courante (added/changed) ou derniere version connue (removed). */
  event: ScheduleEvent
  /** Uniquement pour 'changed' : les valeurs precedentes des champs qui ont change. */
  previous?: Partial<Record<ChangedField, ScheduleEvent[ChangedField]>>
  fields?: ChangedField[]
}

export interface FeedRefreshResult {
  feedId: string
  feedName: string
  events: ScheduleEvent[]
  changes: ScheduleChange[]
  fetchedAt: number
  error: string | null
}

export interface AppSettings {
  theme?: 'dark' | 'light'
}
