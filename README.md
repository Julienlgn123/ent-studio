# ENT Studio

Application desktop (Electron + React + TypeScript) qui suit ton emploi du temps
fourni par ton ENT (Pronote, ADE, etc.) via son flux **ICS/iCal**, et repere a
chaque ouverture ce qui a change : cours deplace, annule, ajoute ou retire.

> La plupart des ENT appellent ce lien "Flux RSS" dans leur interface, mais il
> s'agit en realite d'un flux iCalendar (`.ics`) — c'est ce format qu'ENT
> Studio attend.

100 % local : le flux est recupere directement depuis ton PC, aucune donnee
n'est envoyee ailleurs.

---

## Installation

ENT Studio s'installe et se met a jour directement depuis
[**Open Studio**](https://github.com/Julienlgn123/open-studio) : telecharge sa
derniere release, puis choisis ENT Studio dans son catalogue.

> **macOS uniquement** : ENT Studio n'a pas de certificat Apple Developer
> payant, la build n'est donc signee qu'en *ad-hoc*. Au premier lancement,
> macOS affiche **« ENT Studio est endommagee et ne peut pas etre ouverte »**
> (le clic droit → Ouvrir ne suffit pas ici). Pour debloquer :
> 1. Glisse `ENT Studio.app` dans `/Applications` (depuis le `.dmg` monte).
> 2. Puis, au choix :
>    - double-clique `Fix-macOS-Signature.command` fourni dans le `.dmg`, ou
>    - ouvre Terminal et lance :
>      ```bash
>      xattr -cr "/Applications/ENT Studio.app"
>      ```
>
> Windows affichera aussi un avertissement SmartScreen a la premiere ouverture
> (« Editeur non identifie ») — normal pour un build independant, clique
> *Informations complementaires → Executer quand meme*.

### Android

Telecharge le `.apk` depuis la
[derniere release GitHub](https://github.com/Julienlgn123/ent-studio/releases/latest),
ouvre-le sur ton telephone et autorise "Installer des applications inconnues"
si Android le demande. Pas de compte Google Play Developer : l'APK n'est pas
signe pour un store (juste en debug) et Play Protect peut afficher un
avertissement — normal pour une app installee hors store.

## Comment recuperer le lien de ton emploi du temps

Ca depend de ton ENT, mais en general :
- **ADE / Adesoft** (beaucoup d'universites/BUT) : dans le planning, bouton
  **"Flux RSS"** (icone antenne) → choisis la duree de syndication → **OK** →
  copie le lien affiche.
- **Pronote** : *Icone calendrier → Options → S'abonner au calendrier (ICal)*.
- Sinon, cherche "flux ICS", "iCal", "S'abonner au calendrier" ou "Flux RSS"
  sur la page de ton emploi du temps.

## Utilisation

1. Ajoute un flux via le bouton **+** du panneau de gauche (colle le lien
   ICS/iCal, donne-lui un nom si tu veux).
2. A chaque ouverture de l'app (et toutes les 15 minutes tant qu'elle reste
   ouverte), ENT Studio recupere le flux et compare avec la version
   precedente.
3. Les changements detectes s'affichent dans le panneau de droite : nouveau
   cours, cours modifie (horaire/salle), cours annule, cours retire — avec le
   badge correspondant directement sur le cours concerne dans l'agenda.
4. Bouton de rafraichissement manuel disponible dans la barre du haut.

### Pourquoi certains "changements" ne sont pas signales

Un flux d'emploi du temps ne couvre generalement qu'une fenetre glissante de
quelques jours (ex. 15 jours) a partir du moment ou il est genere. ENT Studio
ne compare donc que la periode couverte par les deux dernieres recuperations :
un cours qui sort simplement de cette fenetre avec le temps qui passe (ou qui
y entre nouvellement pour la meme raison) n'est pas un vrai changement et
n'est pas signale comme tel.

## Stack

| Couche | Techno |
|---|---|
| Desktop | Electron 35, electron-vite, electron-builder |
| Android | Capacitor 8 (WebView + plugins natifs), meme UI React que le desktop |
| UI | React 18, TypeScript, Zustand, Lucide, date-fns |
| Flux | `ical.js` (analyse ICS, sans dependance Node — partage entre desktop et Android) |
| Reseau | `fetch` process principal sur desktop ; plugin `CapacitorHttp` (natif, sans CORS) sur Android |
| Donnees | JSON local (`userData/ent-studio-data.json`) sur desktop ; `@capacitor/preferences` sur Android |

Le code de parsing/diff ICS (`src/shared/ics.ts`) et la quasi-totalite de
l'interface (`src/renderer/src/components/*`) sont partages tels quels entre
les deux plateformes — seule la couche `window.api` differe
(`src/preload/index.ts` cote Electron, `src/mobile/api.ts` cote Android).

## Limites connues

- Les evenements recurrents exprimes via une regle `RRULE` dans le flux ICS
  ne sont pas developpes en plusieurs occurrences (seule la date de base est
  prise en compte) — sans impact pour les flux ADE/Pronote, qui exportent deja
  chaque seance individuellement avec sa propre date.
- L'APK Android n'est pas testee sur un appareil/emulateur reel (pas de SDK
  Android disponible dans l'environnement de developpement) — verifiee via un
  navigateur en taille d'ecran mobile avec les plugins Capacitor en mode web
  (leur equivalent natif — HTTP et stockage — n'a pas pu etre teste directement).
