import { diffEvents, fetchIcsText, parseIcsEvents } from './ics'
import { getFeeds, getSnapshot, setLastChanges, setSnapshot } from './store'
import type { FeedRefreshResult } from '../shared/types'

export async function refreshFeed(feedId: string): Promise<FeedRefreshResult> {
  const feed = getFeeds().find((f) => f.id === feedId)
  if (!feed) throw new Error('Flux inconnu : ' + feedId)
  const fetchedAt = Date.now()
  try {
    const text = await fetchIcsText(feed.url)
    const events = parseIcsEvents(text)
    const previous = getSnapshot(feedId)
    // Premiere recuperation de ce flux : rien a comparer, pas de "changements".
    const changes = previous ? diffEvents(previous.events, events) : []
    setSnapshot(feedId, { events, fetchedAt })
    setLastChanges(feedId, changes)
    return { feedId, feedName: feed.name, events, changes, fetchedAt, error: null }
  } catch (err) {
    // Le flux est injoignable/invalide cette fois-ci : on garde le dernier
    // instantane connu affiche plutot que de vider l'emploi du temps.
    const previous = getSnapshot(feedId)
    return {
      feedId,
      feedName: feed.name,
      events: previous?.events ?? [],
      changes: [],
      fetchedAt,
      error: err instanceof Error ? err.message : String(err)
    }
  }
}

export async function refreshAllFeeds(): Promise<FeedRefreshResult[]> {
  return Promise.all(getFeeds().map((f) => refreshFeed(f.id)))
}
