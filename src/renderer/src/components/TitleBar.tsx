import { Minus, RefreshCw, Square, X } from 'lucide-react'
import { useStore } from '../store'

export default function TitleBar(): JSX.Element {
  const { refreshing, refreshAll } = useStore()

  return (
    <div className="titlebar">
      <span className="titlebar-title">ENT Studio</span>
      <div className="titlebar-spacer" />
      <button className="icon-btn" onClick={() => refreshAll()} disabled={refreshing} data-tooltip="Rafraichir">
        <RefreshCw size={14} className={refreshing ? 'spin' : ''} />
      </button>
      <div className="titlebar-controls">
        <div className="titlebar-btn" onClick={() => window.api.window.minimize()}>
          <Minus size={13} />
        </div>
        <div className="titlebar-btn" onClick={() => window.api.window.maximize()}>
          <Square size={11} />
        </div>
        <div className="titlebar-btn close" onClick={() => window.api.window.close()}>
          <X size={14} />
        </div>
      </div>
    </div>
  )
}
