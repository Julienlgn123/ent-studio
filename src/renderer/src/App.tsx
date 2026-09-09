import { useEffect } from 'react'
import { useStore } from './store'
import TitleBar from './components/TitleBar'
import FeedsSidebar from './components/FeedsSidebar'
import ScheduleArea from './components/ScheduleArea'
import ChangesPanel from './components/ChangesPanel'
import Toast from './components/Toast'
import type { FeedRefreshResult } from '../../shared/types'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const api = (window as any).api

export default function App(): JSX.Element {
  const { loadAll, applyRefreshResults, toast } = useStore()

  useEffect(() => {
    loadAll()
    api.app.notifyReady()

    // Le rafraichissement au lancement est declenche cote main (voir
    // src/main/index.ts) des que la fenetre est prete ; on ecoute juste son
    // resultat ici pour mettre l'UI a jour sans avoir a le redemander.
    const offRefreshed = api.feeds.onRefreshed((results: FeedRefreshResult[]) => {
      applyRefreshResults(results)
      const totalChanges = results.reduce((n, r) => n + r.changes.length, 0)
      if (totalChanges > 0) toast(`${totalChanges} changement(s) detecte(s)`, 'info')
    })

    const offUpdateReady = api.app.onUpdateReady(() => {
      toast('Mise a jour prete - redemarre ENT Studio pour l\'appliquer', 'info')
    })

    return () => {
      offRefreshed()
      offUpdateReady()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <div className="app-shell">
      <TitleBar />
      <div className="main-body">
        <FeedsSidebar />
        <ScheduleArea />
        <ChangesPanel />
      </div>
      <Toast />
    </div>
  )
}
