import { create } from 'zustand'
import type { AppSettings, FeedRefreshResult, FeedSource, ScheduleChange, ScheduleEvent } from '../../../shared/types'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const api = (window as any).api

interface ToastItem {
  id: string
  message: string
  type: 'success' | 'error' | 'info'
}

interface StoreState {
  feeds: FeedSource[]
  activeFeedId: string | null
  eventsByFeed: Record<string, ScheduleEvent[]>
  changesByFeed: Record<string, ScheduleChange[]>
  errorByFeed: Record<string, string | null>
  fetchedAtByFeed: Record<string, number>
  loading: boolean
  refreshing: boolean
  settings: AppSettings
  toasts: ToastItem[]

  loadAll: () => Promise<void>
  addFeed: (name: string, url: string) => Promise<void>
  removeFeed: (id: string) => Promise<void>
  setActiveFeed: (id: string | null) => void
  refreshAll: () => Promise<void>
  applyRefreshResults: (results: FeedRefreshResult[]) => void
  saveTheme: (theme: 'dark' | 'light') => Promise<void>
  toast: (message: string, type?: ToastItem['type']) => void
  dismissToast: (id: string) => void
}

export const useStore = create<StoreState>((set, get) => ({
  feeds: [],
  activeFeedId: null,
  eventsByFeed: {},
  changesByFeed: {},
  errorByFeed: {},
  fetchedAtByFeed: {},
  loading: true,
  refreshing: false,
  settings: {},
  toasts: [],

  async loadAll() {
    const [feeds, settings] = await Promise.all([api.feeds.list(), api.settings.get()])
    const eventsByFeed: Record<string, ScheduleEvent[]> = {}
    const changesByFeed: Record<string, ScheduleChange[]> = {}
    const fetchedAtByFeed: Record<string, number> = {}
    for (const feed of feeds as FeedSource[]) {
      const [snapshot, changes] = await Promise.all([api.feeds.snapshot(feed.id), api.feeds.lastChanges(feed.id)])
      if (snapshot) {
        eventsByFeed[feed.id] = snapshot.events
        fetchedAtByFeed[feed.id] = snapshot.fetchedAt
      }
      changesByFeed[feed.id] = changes
    }
    set({
      feeds,
      settings,
      eventsByFeed,
      changesByFeed,
      fetchedAtByFeed,
      activeFeedId: get().activeFeedId ?? feeds[0]?.id ?? null,
      loading: false
    })
  },

  async addFeed(name, url) {
    const created = await api.feeds.add({ name, url })
    set((s) => ({ feeds: [...s.feeds, created], activeFeedId: s.activeFeedId ?? created.id }))
    const result: FeedRefreshResult = await api.feeds.refresh(created.id)
    get().applyRefreshResults([result])
    if (result.error) get().toast(result.error, 'error')
    else get().toast(`« ${created.name} » ajoute (${result.events.length} evenement(s))`, 'success')
  },

  async removeFeed(id) {
    await api.feeds.remove(id)
    set((s) => {
      const feeds = s.feeds.filter((f) => f.id !== id)
      const activeFeedId = s.activeFeedId === id ? (feeds[0]?.id ?? null) : s.activeFeedId
      return { feeds, activeFeedId }
    })
  },

  setActiveFeed(id) {
    set({ activeFeedId: id })
  },

  async refreshAll() {
    if (get().feeds.length === 0) return
    set({ refreshing: true })
    try {
      const results: FeedRefreshResult[] = await api.feeds.refreshAll()
      get().applyRefreshResults(results)
      const totalChanges = results.reduce((n, r) => n + r.changes.length, 0)
      const failed = results.filter((r) => r.error)
      if (failed.length > 0) get().toast(`${failed.length} flux injoignable(s)`, 'error')
      else if (totalChanges > 0) get().toast(`${totalChanges} changement(s) detecte(s)`, 'info')
      else get().toast('Emploi du temps a jour, rien de nouveau', 'success')
    } finally {
      set({ refreshing: false })
    }
  },

  applyRefreshResults(results) {
    set((s) => {
      const eventsByFeed = { ...s.eventsByFeed }
      const changesByFeed = { ...s.changesByFeed }
      const errorByFeed = { ...s.errorByFeed }
      const fetchedAtByFeed = { ...s.fetchedAtByFeed }
      for (const r of results) {
        if (!r.error) eventsByFeed[r.feedId] = r.events
        changesByFeed[r.feedId] = r.changes
        errorByFeed[r.feedId] = r.error
        fetchedAtByFeed[r.feedId] = r.fetchedAt
      }
      return { eventsByFeed, changesByFeed, errorByFeed, fetchedAtByFeed }
    })
  },

  async saveTheme(theme) {
    const settings = await api.settings.setTheme(theme)
    set({ settings })
  },

  toast(message, type = 'info') {
    const id = Math.random().toString(36).slice(2)
    set((s) => ({ toasts: [...s.toasts, { id, message, type }] }))
    setTimeout(() => get().dismissToast(id), 4000)
  },

  dismissToast(id) {
    set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) }))
  }
}))
