// Couleur par cours (pas par evenement) : deux seances du meme cours ("R101
// ... TP A" et "R101 ... CM ABCD") doivent avoir la meme couleur, alors que
// leurs intitules completes different - d'ou l'extraction d'une clef courte.

const PALETTE = [
  '#3b82f6', // bleu
  '#a855f7', // violet
  '#ec4899', // rose
  '#f59e0b', // ambre
  '#10b981', // vert
  '#06b6d4', // cyan
  '#ef4444', // rouge
  '#84cc16', // citron vert
  '#8b5cf6', // indigo
  '#f97316', // orange
  '#14b8a6', // teal
  '#e879f9'  // fuchsia
]

export const COURSE_COLOR_PALETTE: readonly string[] = PALETTE

/**
 * Extrait une clef de regroupement depuis l'intitule d'un evenement : la
 * plupart des flux academiques (ADE, Pronote...) prefixent chaque seance
 * d'un code court en majuscules ("R101 Initiation...", "MTU - Methodologie
 * ..."). Un intitule sans code reconnaissable (ex. une annonce toute en
 * majuscules) retombe sur l'intitule complet comme clef.
 */
export function courseKey(summary: string): string {
  const trimmed = summary.trim()
  // \p{Lu} (lettre majuscule Unicode) plutot que A-Z : des codes comme
  // "SAÉ104" utilisent des majuscules accentuees, hors du jeu ASCII.
  const match = trimmed.match(/^([\p{Lu}0-9]{2,8})[\s-]/u)
  if (match) {
    const rest = trimmed.slice(match[0].length)
    if (/[a-z]/.test(rest)) return match[1]
  }
  return trimmed
}

function hashString(s: string): number {
  let h = 0
  for (let i = 0; i < s.length; i++) {
    h = (h * 31 + s.charCodeAt(i)) | 0
  }
  return Math.abs(h)
}

/** Couleur deterministe par clef : le meme cours a toujours la meme couleur d'une session a l'autre, sans configuration. */
export function autoColorFor(key: string): string {
  return PALETTE[hashString(key) % PALETTE.length]
}

/** Couleur effective d'un evenement : le choix manuel de l'utilisateur (s'il existe) l'emporte sur la couleur automatique. */
export function getCourseColor(summary: string, overrides?: Record<string, string>): string {
  const key = courseKey(summary)
  return overrides?.[key] ?? autoColorFor(key)
}
