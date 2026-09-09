// Implementation de la meme interface `Api` que le preload Electron (voir
// src/preload/index.ts), mais pour l'app Android/Capacitor : stockage via
// @capacitor/preferences au lieu d'un fichier JSON, reseau via CapacitorHttp
// (contourne le CORS - un ENT n'a aucune raison d'autoriser l'origine de
// l'app mobile) au lieu d'IPC vers un process principal qui n'existe pas ici.
import { CapacitorHttp } from '@capacitor/core'
import { Preferences } from '@capacitor/preferences'
import { diffEvents, parseIcsEvents } from '../shared/ics'
import type {
  AppSettings,
  FeedRefreshResult,
  FeedSource,
  ScheduleChange,
  ScheduleEvent
} from '../shared/types'
import type { Api } from '../preload'

interface FeedSnapshot {
  events: ScheduleEvent[]
  fetchedAt: number
}

interface StoreShape {
  feeds: FeedSource[]
  snapshots: Record<string, FeedSnapshot>
  lastChanges: Record<string, ScheduleChange[]>
  settings: AppSettings
}

const PREF_KEY = 'ent-studio-data'
const FETCH_TIMEOUT_MS = 20_000

function defaultStore(): StoreShape {
  return { feeds: [], snapshots: {}, lastChanges: {}, settings: {} }
}

async function load(): Promise<StoreShape> {
  const { value } = await Preferences.get({ key: PREF_KEY })
  if (!value) return defaultStore()
  try {
    return { ...defaultStore(), ...JSON.parse(value) }
  } catch {
    return defaultStore()
  }
}

async function persist(store: StoreShape): Promise<void> {
  await Preferences.set({ key: PREF_KEY, value: JSON.stringify(store) })
}

async function fetchIcsText(url: string): Promise<string> {
  const res = await CapacitorHttp.get({
    url,
    headers: { 'User-Agent': 'ent-studio' },
    readTimeout: FETCH_TIMEOUT_MS,
    connectTimeout: FETCH_TIMEOUT_MS,
    responseType: 'text'
  })
  if (res.status < 200 || res.status >= 300) {
    throw new Error(`Le flux a repondu avec une erreur (HTTP ${res.status}).`)
  }
  const text = typeof res.data === 'string' ? res.data : JSON.stringify(res.data)
  if (!text.includes('BEGIN:VCALENDAR')) {
    throw new Error(
      "Le contenu recu ne ressemble pas a un flux ICS/iCalendar valide. Verifie l'URL fournie par ton ENT."
    )
  }
  return text
}

async function refreshFeed(feedId: string): Promise<FeedRefreshResult> {
  const store = await load()
  const feed = store.feeds.find((f) => f.id === feedId)
  if (!feed) throw new Error('Flux inconnu : ' + feedId)
  const fetchedAt = Date.now()
  try {
    const text = await fetchIcsText(feed.url)
    const events = parseIcsEvents(text)
    const previous = store.snapshots[feedId]
    const changes = previous ? diffEvents(previous.events, events) : []
    store.snapshots[feedId] = { events, fetchedAt }
    store.lastChanges[feedId] = changes
    await persist(store)
    return { feedId, feedName: feed.name, events, changes, fetchedAt, error: null }
  } catch (err) {
    const previous = store.snapshots[feedId]
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

export const mobileApi: Api = {
  window: {
    // Pas de chrome de fenetre sur mobile (barre systeme Android geree par l'OS).
    minimize: async () => {},
    maximize: async () => {},
    close: async () => {}
  },
  settings: {
    get: async () => (await load()).settings,
    setTheme: async (theme) => {
      const store = await load()
      store.settings.theme = theme
      await persist(store)
      return store.settings
    }
  },
  feeds: {
    list: async () => (await load()).feeds,
    add: async (feed) => {
      const url = feed.url.trim()
      if (!/^https?:\/\//i.test(url)) throw new Error("L'URL du flux doit commencer par http:// ou https://.")
      const created: FeedSource = { id: crypto.randomUUID(), name: feed.name.trim() || 'Emploi du temps', url }
      const store = await load()
      store.feeds.push(created)
      await persist(store)
      return created
    },
    remove: async (id) => {
      const store = await load()
      store.feeds = store.feeds.filter((f) => f.id !== id)
      delete store.snapshots[id]
      delete store.lastChanges[id]
      await persist(store)
    },
    rename: async (id, name) => {
      const store = await load()
      const feed = store.feeds.find((f) => f.id === id)
      if (feed) feed.name = name
      await persist(store)
    },
    snapshot: async (id) => (await load()).snapshots[id] ?? null,
    lastChanges: async (id) => (await load()).lastChanges[id] ?? [],
    refresh: refreshFeed,
    refreshAll: async () => {
      const store = await load()
      return Promise.all(store.feeds.map((f) => refreshFeed(f.id)))
    },
    // Pas de process principal separe qui pousse des evenements sur mobile :
    // chaque ecran demande directement ce dont il a besoin.
    onRefreshed: () => () => {}
  },
  shell: {
    openExternal: async (url) => {
      window.open(url, '_blank')
    }
  },
  app: {
    notifyReady: () => {},
    installUpdate: async () => {},
    onUpdateReady: () => () => {}
  }
}
