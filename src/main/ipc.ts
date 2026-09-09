import { randomUUID } from 'crypto'
import { BrowserWindow, ipcMain, shell } from 'electron'
import { autoUpdater } from 'electron-updater'
import { refreshFeed, refreshAllFeeds } from './refresh'
import {
  addFeed,
  getFeeds,
  getLastChanges,
  getSettings,
  getSnapshot,
  removeFeed,
  renameFeed,
  setTheme
} from './store'
import type { FeedSource } from '../shared/types'

function getWin(): BrowserWindow {
  return BrowserWindow.getAllWindows()[0]
}

export function registerIpc(): void {
  ipcMain.handle('window:minimize', () => getWin()?.minimize())
  ipcMain.handle('window:maximize', () => {
    const w = getWin()
    if (!w) return
    w.isMaximized() ? w.unmaximize() : w.maximize()
  })
  ipcMain.handle('window:close', () => getWin()?.close())

  ipcMain.handle('settings:get', () => getSettings())
  ipcMain.handle('settings:setTheme', (_, theme: 'dark' | 'light') => {
    setTheme(theme)
    return getSettings()
  })

  ipcMain.handle('feeds:list', () => getFeeds())
  ipcMain.handle('feeds:add', (_, feed: { name: string; url: string }) => {
    const url = feed.url.trim()
    if (!/^https?:\/\//i.test(url)) throw new Error('L\'URL du flux doit commencer par http:// ou https://.')
    const created: FeedSource = {
      id: randomUUID(),
      name: feed.name.trim() || 'Emploi du temps',
      url
    }
    addFeed(created)
    return created
  })
  ipcMain.handle('feeds:remove', (_, id: string) => removeFeed(id))
  ipcMain.handle('feeds:rename', (_, id: string, name: string) => renameFeed(id, name))
  ipcMain.handle('feeds:snapshot', (_, id: string) => getSnapshot(id))
  ipcMain.handle('feeds:lastChanges', (_, id: string) => getLastChanges(id))
  ipcMain.handle('feeds:refresh', (_, id: string) => refreshFeed(id))
  ipcMain.handle('feeds:refreshAll', () => refreshAllFeeds())

  ipcMain.handle('shell:openExternal', (_, url: string) => shell.openExternal(url))

  ipcMain.handle('app:installUpdate', () => autoUpdater.quitAndInstall())
}
