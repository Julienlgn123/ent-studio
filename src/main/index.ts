import { app, BrowserWindow, shell, ipcMain, session } from 'electron'
import { join } from 'path'
import { electronApp, optimizer, is } from '@electron-toolkit/utils'
import { autoUpdater } from 'electron-updater'
import { registerIpc } from './ipc'
import { broadcast } from './events'
import { refreshAllFeeds } from './refresh'
import { getFeeds } from './store'

let mainWindow: BrowserWindow | null = null

// Rafraichit a l'ouverture (le besoin de depart : "a chaque fois que l'app
// est open, ca rafraichit") puis periodiquement tant qu'elle reste ouverte,
// pour ne pas se retrouver avec un emploi du temps perime sur une session
// laissee allumee toute la journee.
const PERIODIC_REFRESH_MS = 15 * 60_000

function createWindow(): void {
  mainWindow = new BrowserWindow({
    width: 1150,
    height: 760,
    minWidth: 820,
    minHeight: 560,
    show: false,
    frame: false,
    titleBarStyle: 'hidden',
    backgroundColor: '#0d0d0f',
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      sandbox: false,
      contextIsolation: true
    }
  })

  mainWindow.on('ready-to-show', () => mainWindow?.show())

  mainWindow.on('closed', () => {
    mainWindow = null
  })
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url)
    return { action: 'deny' }
  })

  if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
    mainWindow.loadURL(process.env['ELECTRON_RENDERER_URL'])
  } else {
    mainWindow.loadFile(join(__dirname, '../renderer/index.html'))
  }
}

async function refreshAndBroadcast(): Promise<void> {
  if (getFeeds().length === 0) return
  const results = await refreshAllFeeds().catch(() => [])
  broadcast('feeds:refreshed', results)
}

app.whenReady().then(() => {
  electronApp.setAppUserModelId('com.ent-studio.app')
  app.on('browser-window-created', (_, w) => optimizer.watchWindowShortcuts(w))

  session.defaultSession.webRequest.onHeadersReceived((details, callback) => {
    const csp = is.dev
      ? "default-src 'self' 'unsafe-inline' 'unsafe-eval' data: ws://localhost:* http://localhost:*; " +
        'style-src \'self\' \'unsafe-inline\' https://fonts.googleapis.com; font-src https://fonts.gstatic.com data:; ' +
        "img-src 'self' data: http://localhost:*"
      : "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; " +
        "font-src https://fonts.gstatic.com; img-src 'self' data:; connect-src 'self'"
    // Le flux ICS lui-meme est recupere cote main process (voir src/main/ics.ts),
    // jamais depuis le renderer : connect-src 'self' n'a donc pas besoin
    // d'autoriser un domaine d'ENT arbitraire.
    callback({
      responseHeaders: {
        ...details.responseHeaders,
        'Content-Security-Policy': [csp]
      }
    })
  })

  registerIpc()
  createWindow()

  refreshAndBroadcast()
  setInterval(refreshAndBroadcast, PERIODIC_REFRESH_MS)

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })

  if (app.isPackaged) {
    autoUpdater.autoDownload = true
    autoUpdater.autoInstallOnAppQuit = true

    autoUpdater.on('update-downloaded', (info) => {
      broadcast('app:updateReady', { version: info.version })
    })
    autoUpdater.on('error', (err) => {
      console.error('[autoUpdater]', err)
    })

    let checked = false
    const runCheck = (): void => {
      if (checked) return
      checked = true
      autoUpdater.checkForUpdates().catch(() => null)
    }
    ipcMain.on('renderer:ready', runCheck)
    setTimeout(runCheck, 8000)
  }
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit()
})
