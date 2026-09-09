import ICAL from 'ical.js'
import type { ChangedField, ScheduleChange, ScheduleEvent } from './types'

// Parsing/diffing lives here (not in src/main) because it must also run
// unmodified inside the Android WebView (no Node.js there): ical.js is a
// dependency-free, browser-safe ICS parser, unlike node-ical which hard-
// requires `fs`/`axios` at import time and cannot be bundled for a browser
// target at all.

/** Convertit le texte ICS en evenements plats, tries chronologiquement. */
export function parseIcsEvents(icsText: string): ScheduleEvent[] {
  const jcalData = ICAL.parse(icsText)
  const root = new ICAL.Component(jcalData)
  const vevents = root.getAllSubcomponents('vevent')
  const events: ScheduleEvent[] = []

  for (const vevent of vevents) {
    const event = new ICAL.Event(vevent)
    if (!event.uid || !event.startDate || !event.endDate) continue
    const status = vevent.getFirstPropertyValue('status')
    events.push({
      uid: event.uid,
      summary: event.summary || '(Sans titre)',
      location: event.location || null,
      start: event.startDate.toJSDate().getTime(),
      end: event.endDate.toJSDate().getTime(),
      description: event.description || null,
      status: typeof status === 'string' ? status : null
    })
  }

  events.sort((a, b) => a.start - b.start)
  return events
}

function maxStart(events: ScheduleEvent[]): number {
  return events.reduce((m, e) => Math.max(m, e.start), 0)
}

const FIELD_GETTERS: Record<ChangedField, (e: ScheduleEvent) => unknown> = {
  start: (e) => e.start,
  end: (e) => e.end,
  location: (e) => e.location,
  summary: (e) => e.summary,
  status: (e) => e.status
}

/**
 * Compare deux instantanes d'un meme flux. Les flux d'emploi du temps (ADE et
 * la plupart des ENT) ne couvrent qu'une fenetre glissante de N jours a
 * partir de l'instant de recuperation ("Syndication des plannings sur 15
 * jours") : un cours qui "disparait" simplement parce qu'il est sorti de
 * cette fenetre avec le temps qui passe n'est PAS un vrai changement, et un
 * cours qui "apparait" simplement parce que la fenetre a avance jusqu'a lui
 * n'en est pas un non plus. On ne compare donc que sur la plage de dates
 * couverte par les DEUX instantanes.
 */
export function diffEvents(previous: ScheduleEvent[], current: ScheduleEvent[]): ScheduleChange[] {
  const now = Date.now()
  const overlapEnd = Math.min(maxStart(previous), maxStart(current))
  const prevById = new Map(previous.map((e) => [e.uid, e]))
  const currById = new Map(current.map((e) => [e.uid, e]))
  const changes: ScheduleChange[] = []

  for (const [uid, ev] of currById) {
    const before = prevById.get(uid)
    if (!before) {
      if (ev.start <= overlapEnd) changes.push({ kind: 'added', uid, event: ev })
      continue
    }
    const fields: ChangedField[] = []
    const previousValues: Partial<Record<ChangedField, unknown>> = {}
    for (const field of Object.keys(FIELD_GETTERS) as ChangedField[]) {
      const a = FIELD_GETTERS[field](before)
      const b = FIELD_GETTERS[field](ev)
      if (a !== b) {
        fields.push(field)
        previousValues[field] = a
      }
    }
    if (fields.length > 0) {
      changes.push({
        kind: 'changed',
        uid,
        event: ev,
        previous: previousValues as ScheduleChange['previous'],
        fields
      })
    }
  }

  for (const [uid, ev] of prevById) {
    const stillRelevant = ev.start >= now - 24 * 60 * 60 * 1000 && ev.start <= overlapEnd
    if (!currById.has(uid) && stillRelevant) {
      changes.push({ kind: 'removed', uid, event: ev })
    }
  }

  changes.sort((a, b) => a.event.start - b.event.start)
  return changes
}
