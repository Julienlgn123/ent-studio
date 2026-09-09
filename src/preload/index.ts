import { contextBridge, ipcRenderer } from 'electron'
import type { AppSettings, FeedRefreshResult, FeedSource, ScheduleChange } from '../shared/types'

interface FeedSnapshot {
  events: FeedRefreshResult['events']
  fetchedAt: number
}

function on<T>(channel: string, cb: (payload: T) => void): () => void {
  const handler = (_: unknown, payload: T): void => cb(payload)
  ipcRenderer.on(channel, handler)
  return () => ipcRenderer.removeListener(channel, handler)
}

const api = {
  window: {
    minimize: () => ipcRenderer.invoke('window:minimize'),
    maximize: () => ipcRenderer.invoke('window:maximize'),
    close: () => ipcRenderer.invoke('window:close')
  },
  settings: {
    get: (): Promise<AppSettings> => ipcRenderer.invoke('settings:get'),
    setTheme: (theme: 'dark' | 'light'): Promise<AppSettings> =>
      ipcRenderer.invoke('settings:setTheme', theme)
  },
  feeds: {
    list: (): Promise<FeedSource[]> => ipcRenderer.invoke('feeds:list'),
    add: (feed: { name: string; url: string }): Promise<FeedSource> =>
      ipcRenderer.invoke('feeds:add', feed),
    remove: (id: string): Promise<void> => ipcRenderer.invoke('feeds:remove', id),
    rename: (id: string, name: string): Promise<void> => ipcRenderer.invoke('feeds:rename', id, name),
    snapshot: (id: string): Promise<FeedSnapshot | null> => ipcRenderer.invoke('feeds:snapshot', id),
    lastChanges: (id: string): Promise<ScheduleChange[]> => ipcRenderer.invoke('feeds:lastChanges', id),
    refresh: (id: string): Promise<FeedRefreshResult> => ipcRenderer.invoke('feeds:refresh', id),
    refreshAll: (): Promise<FeedRefreshResult[]> => ipcRenderer.invoke('feeds:refreshAll'),
    onRefreshed: (cb: (results: FeedRefreshResult[]) => void) => on<FeedRefreshResult[]>('feeds:refreshed', cb)
  },
  shell: {
    openExternal: (url: string): Promise<void> => ipcRenderer.invoke('shell:openExternal', url)
  },
  app: {
    notifyReady: () => ipcRenderer.send('renderer:ready'),
    installUpdate: (): Promise<void> => ipcRenderer.invoke('app:installUpdate'),
    onUpdateReady: (cb: (payload: { version: string }) => void) =>
      on<{ version: string }>('app:updateReady', cb)
  }
}

contextBridge.exposeInMainWorld('api', api)
export type Api = typeof api
