import { BrowserWindow } from 'electron'

/** Pousse un evenement vers toutes les fenetres ouvertes (aucun IPC de retour attendu). */
export function broadcast<T>(channel: string, payload: T): void {
  for (const win of BrowserWindow.getAllWindows()) {
    win.webContents.send(channel, payload)
  }
}
