import { parseICS } from 'node-ical'
import type { ChangedField, ScheduleChange, ScheduleEvent } from '../shared/types'

const FETCH_TIMEOUT_MS = 20_000

/** Recupere le texte brut d'un flux ICS, avec un delai d'abandon raisonnable. */
export async function fetchIcsText(url: string): Promise<string> {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS)
  try {
    const res = await fetch(url, { signal: controller.signal, headers: { 'User-Agent': 'ent-studio' } })
    if (!res.ok) throw new Error(`Le flux a repondu avec une erreur (HTTP ${res.status}).`)
    const text = await res.text()
    // Beaucoup d'ENT (ADE compris) appellent ca "flux RSS" dans leur interface
    // alors qu'ils exportent en realite de l'iCalendar - on verifie le vrai
    // contenu plutot que de se fier a l'intitule du bouton cote ENT.
    if (!text.includes('BEGIN:VCALENDAR')) {
      throw new Error(
        "Le contenu recu ne ressemble pas a un flux ICS/iCalendar valide. Verifie l'URL fournie par ton ENT."
      )
    }
    return text
  } catch (err) {
    if (err instanceof Error && err.name === 'AbortError') {
      throw new Error('Le flux met trop de temps a repondre (delai depasse).')
    }
    throw err
  } finally {
    clearTimeout(timer)
  }
}

/** Convertit le texte ICS en evenements plats, tries chronologiquement. */
export function parseIcsEvents(icsText: string): ScheduleEvent[] {
  const data = parseICS(icsText)
  const events: ScheduleEvent[] = []
  for (const key of Object.keys(data)) {
    const item = data[key]
    if (item.type !== 'VEVENT' || !item.uid || !item.start || !item.end) continue
    events.push({
      uid: item.uid,
      summary: item.summary || '(Sans titre)',
      location: item.location || null,
      start: new Date(item.start).getTime(),
      end: new Date(item.end).getTime(),
      description: item.description || null,
      status: item.status ?? null
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
