import { app } from 'electron'
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'fs'
import { join } from 'path'
import type { AppSettings, FeedSource, ScheduleChange, ScheduleEvent } from '../shared/types'

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

function defaultStore(): StoreShape {
  return { feeds: [], snapshots: {}, lastChanges: {}, settings: {} }
}

function dataPath(): string {
  return join(app.getPath('userData'), 'ent-studio-data.json')
}

let cache: StoreShape | null = null

function load(): StoreShape {
  if (cache) return cache
  const file = dataPath()
  if (!existsSync(file)) {
    cache = defaultStore()
    return cache
  }
  let loaded: StoreShape
  try {
    const raw = JSON.parse(readFileSync(file, 'utf-8'))
    loaded = { ...defaultStore(), ...raw }
  } catch {
    // Fichier corrompu/illisible : on repart d'un etat vide plutot que de planter au demarrage.
    loaded = defaultStore()
  }
  cache = loaded
  return loaded
}

function persist(): void {
  if (!cache) return
  const dir = app.getPath('userData')
  if (!existsSync(dir)) mkdirSync(dir, { recursive: true })
  writeFileSync(dataPath(), JSON.stringify(cache, null, 2), 'utf-8')
}

export function getFeeds(): FeedSource[] {
  return load().feeds
}

export function addFeed(feed: FeedSource): void {
  const store = load()
  store.feeds.push(feed)
  persist()
}

export function removeFeed(id: string): void {
  const store = load()
  store.feeds = store.feeds.filter((f) => f.id !== id)
  delete store.snapshots[id]
  delete store.lastChanges[id]
  persist()
}

export function renameFeed(id: string, name: string): void {
  const store = load()
  const feed = store.feeds.find((f) => f.id === id)
  if (feed) feed.name = name
  persist()
}

export function getSnapshot(feedId: string): FeedSnapshot | null {
  return load().snapshots[feedId] ?? null
}

export function setSnapshot(feedId: string, snapshot: FeedSnapshot): void {
  const store = load()
  store.snapshots[feedId] = snapshot
  persist()
}

export function getLastChanges(feedId: string): ScheduleChange[] {
  return load().lastChanges[feedId] ?? []
}

export function setLastChanges(feedId: string, changes: ScheduleChange[]): void {
  const store = load()
  store.lastChanges[feedId] = changes
  persist()
}

export function getSettings(): AppSettings {
  return load().settings
}

export function setTheme(theme: 'dark' | 'light'): void {
  const store = load()
  store.settings.theme = theme
  persist()
}

export function setCourseColor(key: string, color: string | null): void {
  const store = load()
  if (!store.settings.courseColors) store.settings.courseColors = {}
  if (color) store.settings.courseColors[key] = color
  else delete store.settings.courseColors[key]
  persist()
}
