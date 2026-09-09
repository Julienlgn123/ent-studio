// La description ICS d'un evenement academique (ADE, Pronote...) est du
// texte libre sans structure formelle - pas de champ "enseignant" dedie.
// En pratique (verifie sur un vrai flux ADE), le nom de l'enseignant y
// apparait presque toujours comme la derniere ligne non vide avant la
// mention d'export, sous la forme "NOM Prenom" tout en majuscules - alors
// que les autres lignes (groupes "R&T1 A", intitules de BUT/filiere) soit
// contiennent des chiffres/esperluettes, soit ne sont pas entierement en
// majuscules. On isole cette ligne plutot que d'afficher le bloc brut.

export interface ParsedEventDetails {
  teacher: string | null
  otherLines: string[]
}

const EXPORTED_LINE = /^\(Exported/i
// Mot en majuscules (accents compris), sans chiffre : ex. "ROUFFAUD", "XAVIER".
const CAPS_WORD = /^[\p{Lu}][\p{Lu}'-]*$/u

function looksLikeTeacherName(line: string): boolean {
  const words = line.split(/\s+/)
  return words.length >= 2 && words.every((w) => CAPS_WORD.test(w))
}

export function parseEventDescription(description: string | null): ParsedEventDetails {
  if (!description) return { teacher: null, otherLines: [] }

  const lines = description
    .split('\n')
    .map((l) => l.trim())
    .filter((l) => l.length > 0 && !EXPORTED_LINE.test(l))

  let teacher: string | null = null
  const otherLines: string[] = []
  for (let i = lines.length - 1; i >= 0; i--) {
    if (teacher === null && looksLikeTeacherName(lines[i])) {
      teacher = lines[i]
    } else {
      otherLines.unshift(lines[i])
    }
  }

  return { teacher, otherLines }
}
