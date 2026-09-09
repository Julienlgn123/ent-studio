import { useStore } from '../store'

export default function Toast(): JSX.Element {
  const { toasts, dismissToast } = useStore()
  return (
    <div className="toast-stack">
      {toasts.map((t) => (
        <div key={t.id} className={`toast ${t.type}`} onClick={() => dismissToast(t.id)}>
          {t.message}
        </div>
      ))}
    </div>
  )
}
