const FETCH_TIMEOUT_MS = 20_000

/** Recupere le texte brut d'un flux ICS, avec un delai d'abandon raisonnable. */
export async function fetchIcsText(url: string): Promise<string> {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS)
  try {
    const res = await fetch(url, { signal: controller.signal, headers: { 'User-Agent': 'ent-studio' } })
    if (!res.ok) throw new Error(`Le flux a repondu avec une erreur (HTTP ${res.status}).`)
    const text = await res.text()
    // Beaucoup d'ENT (ADE compris) appellent ca "flux RSS" dans leur interface
    // alors qu'ils exportent en realite de l'iCalendar - on verifie le vrai
    // contenu plutot que de se fier a l'intitule du bouton cote ENT.
    if (!text.includes('BEGIN:VCALENDAR')) {
      throw new Error(
        "Le contenu recu ne ressemble pas a un flux ICS/iCalendar valide. Verifie l'URL fournie par ton ENT."
      )
    }
    return text
  } catch (err) {
    if (err instanceof Error && err.name === 'AbortError') {
      throw new Error('Le flux met trop de temps a repondre (delai depasse).')
    }
    throw err
  } finally {
    clearTimeout(timer)
  }
}

export { parseIcsEvents, diffEvents } from '../shared/ics'
