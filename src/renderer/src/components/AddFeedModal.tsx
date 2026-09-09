import { useState } from 'react'
import { useStore } from '../store'

export default function AddFeedModal({ onClose }: { onClose: () => void }): JSX.Element {
  const { addFeed } = useStore()
  const [name, setName] = useState('')
  const [url, setUrl] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  async function submit(): Promise<void> {
    if (!url.trim()) return
    setBusy(true)
    setError('')
    try {
      await addFeed(name, url)
      onClose()
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err))
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-card" onClick={(e) => e.stopPropagation()}>
        <div className="modal-title">Ajouter un emploi du temps</div>
        <div className="modal-field">
          <label>Nom (optionnel)</label>
          <input
            className="field-input"
            placeholder="Ex : Semestre 1"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        </div>
        <div className="modal-field">
          <label>Lien ICS / iCal fourni par ton ENT</label>
          <input
            className="field-input"
            placeholder="https://ade.univ-.../direct/index.jsp?..."
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') submit() }}
          />
          <span className="muted" style={{ fontSize: 11.5 }}>
            Dans ton ENT, cherche "Flux RSS" ou "S'abonner au calendrier" sur la page de ton emploi du
            temps : c'est generalement un lien iCalendar (.ics), meme si le bouton s'appelle "RSS".
          </span>
        </div>
        {error && <div style={{ color: 'var(--danger)', fontSize: 12, marginBottom: 10 }}>{error}</div>}
        <div className="modal-actions">
          <button className="btn btn-secondary" onClick={onClose} disabled={busy}>Annuler</button>
          <button className="btn btn-primary" onClick={submit} disabled={busy || !url.trim()}>
            {busy ? <div className="spinner" /> : null}
            Ajouter
          </button>
        </div>
      </div>
    </div>
  )
}
