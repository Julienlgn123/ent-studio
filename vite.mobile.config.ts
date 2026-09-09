import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Build web standalone pour l'app Android (Capacitor charge out/mobile en
// tant que site statique dans sa WebView) - separe de electron.vite.config.ts
// qui construit main/preload/renderer pour l'app desktop.
export default defineConfig({
  root: 'src/mobile',
  base: './',
  plugins: [react()],
  build: {
    outDir: '../../out/mobile',
    emptyOutDir: true
  }
})
