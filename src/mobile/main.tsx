import React from 'react'
import ReactDOM from 'react-dom/client'
import { mobileApi } from './api'
import App from './App'
import '../renderer/src/styles/globals.css'
import './mobile.css'

// Doit etre en place avant tout rendu : les composants reutilises du
// renderer Electron (ScheduleArea, ChangesPanel, AddFeedModal, Toast, le
// store zustand) appellent tous `window.api` sans savoir s'ils tournent
// dans Electron ou dans l'app Android.
window.api = mobileApi

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
)
