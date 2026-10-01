/**
 * ============================================================================
 *  LES PARCOURS : progresser étape par étape
 * ============================================================================
 *
 * Deux parcours par passion : un pour débuter, un pour aller plus loin. Chaque
 * parcours compte six étapes de plus en plus exigeantes : l'échauffement et
 * l'étape facile durent 5 minutes, les deux suivantes 15, les deux dernières
 * 30, jusqu'au défi final. Une étape se débloque en réussissant la précédente.
 * Le parcours « confirmé » s'ouvre une fois le premier terminé, ou au niveau 3
 * de la passion (voir progress.ts).
 *
 * ⚠️ Ces textes ne font pas partie des 60 activités validées : à relire.
 *
 * Une étape se joue comme une activité (même preuve, même garde-fou temporel,
 * mêmes minutons) ; son identifiant est `parcours-<parcours>-<numéro>`.
 */

import { frenchTypography } from './typography.ts'
import type { Activity, Duration, PassionId } from './types.ts'

/** Six étapes, de l'échauffement au défi final. */
export const DIFFICULTIES = ['Échauffement', 'Facile', 'Moyen', 'Corsé', 'Difficile', 'Défi final'] as const
/** La durée de chaque étape : elle s'allonge avec la difficulté. */
export const STEP_DURATIONS: readonly Duration[] = [5, 5, 15, 15, 30, 30]
export const STEPS_PER_PATH = DIFFICULTIES.length

/** Débutant, puis confirmé. */
export const PATH_TIERS = { 1: 'Débutant', 2: 'Confirmé' } as const
export type PathTier = keyof typeof PATH_TIERS

type RawStep = [title: string, text: string, focus: string]

interface RawPath {
  id: string
  passion: PassionId
  tier: PathTier
  title: string
  pitch: string
  /** Le badge gagné à la fin du parcours. */
  badge: string
  steps: [RawStep, RawStep, RawStep, RawStep, RawStep, RawStep]
}

const RAW_PATHS: RawPath[] = [
  /* ------------------------------------------------------------- Dessin */
  {
    id: 'premiers-traits',
    passion: 'dessin',
    tier: 1,
    title: 'Premiers traits',
    pitch: 'Du gribouillis à la nature morte, en six étapes.',
    badge: 'Œil affûté',
    steps: [
      ['La main qui se détend', 'Remplis une page entière de lignes : droites, courbes, spirales, zigzags. Sans règle et sans gomme.', 'Le geste, sans peur de rater'],
      ['Voir les formes', "Dessine 5 objets autour de toi en n'utilisant que des formes simples : ronds, carrés, triangles.", 'Décomposer un objet en formes'],
      ['Regarder vraiment', 'Dessine une tasse ou un verre en regardant ton modèle plus souvent que ta feuille.', "L'observation"],
      ["L'ombre et la lumière", "Redessine la même tasse, puis noircis tout ce que la lumière ne touche pas : l'ombre sur la tasse et celle qu'elle pose sur la table.", 'Les ombres et le volume'],
      ['Trois objets ensemble', 'Pose 3 objets de tailles différentes sur une table et dessine-les ensemble, avec leurs ombres.', 'Les proportions entre les objets'],
      ['Un coin de ta pièce', 'Dessine un coin de la pièce où tu es : au moins un meuble, une ombre, et un détail que personne ne remarque.', "La composition d'une scène entière"],
    ],
  },
  {
    id: 'visages',
    passion: 'dessin',
    tier: 2,
    title: 'Visages',
    pitch: 'Des ovales au vrai portrait, pas à pas.',
    badge: 'Portraitiste',
    steps: [
      ['La grille du visage', "Trace 6 ovales et place les yeux à mi-hauteur. Oui, à mi-hauteur : c'est plus bas qu'on ne le croit.", 'Les proportions du visage'],
      ['Dix regards', "Dessine 10 paires d'yeux : rieurs, fatigués, surpris, en colère, endormis...", "L'expression du regard"],
      ['Nez et bouche', 'Regarde-toi dans un miroir et dessine ton nez et ta bouche, de face puis de profil.', 'Les volumes du visage'],
      ['Six émotions', 'Dessine 6 visages en 2 minutes chacun, avec une émotion différente à chaque fois.', 'Aller vite et faire passer une émotion'],
      ['Autoportrait', "Fais ton autoportrait dans un miroir, sans t'arrêter sur les défauts : tu dessines, tu ne juges pas.", 'Tout assembler en observant'],
      ['Le vrai portrait', "Dessine le portrait de quelqu'un (en vrai ou en photo) avec ses cheveux, son expression et un fond simple.", 'Un portrait complet'],
    ],
  },
  /* ----------------------------------------------------------- Écriture */
  {
    id: 'premieres-pages',
    passion: 'ecriture',
    tier: 1,
    title: 'Premières pages',
    pitch: 'De la première phrase à ta première histoire.',
    badge: 'Première plume',
    steps: [
      ['Je me souviens', 'Écris 10 phrases qui commencent par "Je me souviens...".', 'Se lancer sans se juger'],
      ['Les cinq sens', "Décris ce qui t'entoure en passant par les 5 sens : ce que tu vois, entends, sens, touches et goûtes.", 'Les détails qui font vivre un texte'],
      ['Ce qui ne se dit pas', "Écris une scène de 10 lignes où deux personnes se parlent sans jamais dire ce qu'elles pensent vraiment.", 'Le dialogue et le sous-entendu'],
      ['Au présent', "Raconte un souvenir d'enfance au présent, comme s'il se passait maintenant.", 'Le temps du récit'],
      ['Une vraie histoire', "Écris une histoire d'une page avec un début, un problème et une fin.", "La structure d'un récit"],
      ["L'art de couper", "Reprends ton histoire de l'étape précédente et réécris-la en coupant un tiers des mots. Garde le meilleur.", 'Relire et resserrer'],
    ],
  },
  {
    id: 'nouvelle',
    passion: 'ecriture',
    tier: 2,
    title: 'Une nouvelle en six temps',
    pitch: 'Un personnage, un problème, une fin : ta première nouvelle.',
    badge: 'Nouvelliste',
    steps: [
      ['Ton personnage', 'Invente un personnage : un prénom, un métier, une peur, un secret.', "Donner vie à quelqu'un"],
      ["Ce qu'il veut", "En 5 lignes : ce que ton personnage veut plus que tout, et ce qui l'en empêche.", "L'enjeu de l'histoire"],
      ['Avant que tout bascule', 'Écris la première scène : ton personnage dans son quotidien, juste avant que tout change.', 'Une ouverture qui accroche'],
      ['Le moment où tout bascule', "Écris la scène où l'imprévu arrive et oblige ton personnage à agir.", "L'élément déclencheur"],
      ['Le choix', 'Écris le moment le plus difficile : ton personnage doit choisir, et chaque choix lui coûte quelque chose.', 'Le point culminant'],
      ['La fin', 'Écris la fin de ta nouvelle, relis le tout et donne-lui un titre.', 'Le dénouement'],
    ],
  },
  /* ------------------------------------------------------------ Musique */
  {
    id: 'oreille-curieuse',
    passion: 'musique',
    tier: 1,
    title: 'Oreille curieuse',
    pitch: 'Apprendre à écouter, pas seulement à entendre.',
    badge: 'Oreille fine',
    steps: [
      ['Rien que la basse', 'Écoute une chanson que tu adores en ne suivant que la basse, du début à la fin.', "L'écoute active"],
      ['Les yeux fermés', 'Écoute un morceau les yeux fermés et compte tous les instruments que tu entends.', 'Séparer les sons'],
      ['Hors de ta zone', "Écoute 3 morceaux d'un genre que tu n'écoutes jamais, et garde celui qui te surprend le plus.", 'Sortir de tes habitudes'],
      ["D'où ça vient", "Choisis une chanson que tu aimes et cherche ce qui l'a inspirée : un sample, un artiste, un vieux morceau.", "Les racines d'un morceau"],
      ['Un album entier', "Écoute un album en entier, dans l'ordre, sans rien faire d'autre.", "L'écoute longue"],
      ['Ta playlist-histoire', 'Compose une playlist de 8 morceaux qui raconte une histoire, du premier au dernier.', 'Assembler, raconter'],
    ],
  },
  {
    id: 'voyage-musical',
    passion: 'musique',
    tier: 2,
    title: 'Voyage musical',
    pitch: 'Faire le tour du monde et du temps avec tes oreilles.',
    badge: 'Oreille du monde',
    steps: [
      ['Une autre langue', 'Écoute un morceau chanté dans une langue que tu ne parles pas.', 'Ressentir sans comprendre'],
      ['Deux versions', 'Écoute le même morceau en deux versions (live, reprise, remix...) et choisis ta préférée.', 'Comparer'],
      ['Avant 1960', 'Découvre en 4 morceaux un genre né avant 1960 : blues, swing, bossa nova, rocksteady...', "L'histoire de la musique"],
      ["L'arbre généalogique", 'Trouve un artiste qui a inspiré ton artiste préféré, et écoute 3 de ses morceaux.', 'Les influences'],
      ['Un classique inconnu', "Écoute un album culte d'un genre que tu ne connais pas du tout.", 'Comprendre un genre'],
      ['Le concert', 'Regarde un concert ou un live filmé, et retiens le moment le plus fort.', 'La musique vivante'],
    ],
  },
  /* ------------------------------------------------------------- Cinéma */
  {
    id: 'regard-curieux',
    passion: 'cinema',
    tier: 1,
    title: 'Regard curieux',
    pitch: 'Regarder autrement ce que tu regardes déjà.',
    badge: 'Œil curieux',
    steps: [
      ['La bande-annonce', "Regarde la bande-annonce d'un film que tu n'aurais jamais choisi.", 'La curiosité'],
      ['Sans le son', "Regarde une scène culte sans le son : que raconte l'image toute seule ?", "La force de l'image"],
      ['Un court animé', "Regarde un court-métrage d'animation et repère le moment exact où il te touche.", "L'émotion"],
      ['Trois ouvertures', "Regarde la scène d'ouverture de 3 films : laquelle donne le plus envie de voir la suite ?", 'Les débuts qui accrochent'],
      ["D'ailleurs", "Regarde un épisode d'une série d'un pays dont tu n'as jamais rien vu.", "D'autres façons de raconter"],
      ['Trois choix', "Regarde le début d'un film d'un·e cinéaste que tu ne connais pas, et note 3 choix de mise en scène.", 'Voir la mise en scène'],
    ],
  },
  {
    id: 'oeil-de-cineaste',
    passion: 'cinema',
    tier: 2,
    title: 'Œil de cinéaste',
    pitch: 'Comprendre comment un film est fait.',
    badge: 'Œil de cinéaste',
    steps: [
      ['Le cadre', 'Mets un film sur pause au hasard et décris le cadre : qui est où, ce qui est net, ce qui est flou.', 'Le cadrage'],
      ['La musique raconte', 'Écoute une scène de film les yeux fermés : que te raconte la musique ?', 'Le son'],
      ['Même scène, deux films', 'Compare la même situation dans deux films : une poursuite, une rencontre, un adieu...', 'La mise en scène'],
      ['Les coulisses', "Regarde un making-of ou une analyse vidéo d'une scène célèbre.", "Comment c'est fait"],
      ['Un court primé', 'Regarde un court-métrage primé et repère ce qui le rend si efficace en si peu de temps.', 'Raconter court'],
      ['Un classique', 'Regarde un film muet ou en noir et blanc, et trouve ce qui le rend encore moderne.', "L'histoire du cinéma"],
    ],
  },
]

/** Une étape : une activité, avec sa place dans le parcours. */
export interface PathStep extends Activity {
  pathId: string
  /** 1 à 6. */
  index: number
  title: string
  /** Ce que l'étape fait travailler. */
  focus: string
  difficulty: (typeof DIFFICULTIES)[number]
}

export interface Path {
  id: string
  passion: PassionId
  tier: PathTier
  title: string
  pitch: string
  badge: string
  steps: PathStep[]
}

export const PATHS: readonly Path[] = RAW_PATHS.map((raw) => ({
  id: raw.id,
  passion: raw.passion,
  tier: raw.tier,
  title: frenchTypography(raw.title),
  pitch: frenchTypography(raw.pitch),
  badge: frenchTypography(raw.badge),
  steps: raw.steps.map(([title, text, focus], index) => ({
    id: stepId(raw.id, index + 1),
    passion: raw.passion,
    duration: STEP_DURATIONS[index] ?? 30,
    number: index + 1,
    text: frenchTypography(text),
    pathId: raw.id,
    index: index + 1,
    title: frenchTypography(title),
    focus: frenchTypography(focus),
    difficulty: DIFFICULTIES[index] ?? 'Défi final',
  })),
}))

export function stepId(pathId: string, index: number): string {
  return `parcours-${pathId}-${index}`
}

const PATHS_BY_ID = new Map(PATHS.map((path) => [path.id, path]))
const STEPS_BY_ID = new Map(PATHS.flatMap((path) => path.steps.map((step) => [step.id, step] as const)))

export function getPath(id: string): Path | undefined {
  return PATHS_BY_ID.get(id)
}

export function getPathStep(id: string): PathStep | undefined {
  return STEPS_BY_ID.get(id)
}

export function isPathStepId(id: string): boolean {
  return STEPS_BY_ID.has(id)
}

export function pathsFor(passion: PassionId): Path[] {
  return PATHS.filter((path) => path.passion === passion).sort((a, b) => a.tier - b.tier)
}

export interface PathProgress {
  path: Path
  /** Étapes réussies (0 à 6). */
  done: number
  finished: boolean
  /** Le parcours est ouvert (le premier toujours ; le confirmé après le premier, ou au niveau 3). */
  unlocked: boolean
  /** La prochaine étape à jouer, ou null si le parcours est fini. */
  next: PathStep | null
}

/** Niveau de la passion à partir duquel le parcours confirmé s'ouvre, même sans finir le premier. */
export const CONFIRMED_PATH_LEVEL = 3

/**
 * Où en est-on dans chaque parcours d'une passion, à partir des étapes déjà
 * réussies (`doneSteps`) et du niveau atteint dans la passion.
 */
export function pathProgress(passion: PassionId, doneSteps: readonly string[], level: number): PathProgress[] {
  const done = new Set(doneSteps)
  const paths = pathsFor(passion)
  const finishedTier1 = paths.filter((path) => path.tier === 1).every((path) => path.steps.every((step) => done.has(step.id)))
  return paths.map((path) => {
    // Les étapes se réussissent dans l'ordre : on compte jusqu'à la première manquante.
    const count = path.steps.findIndex((step) => !done.has(step.id))
    const doneCount = count === -1 ? path.steps.length : count
    return {
      path,
      done: doneCount,
      finished: doneCount === path.steps.length,
      unlocked: path.tier === 1 || finishedTier1 || level >= CONFIRMED_PATH_LEVEL,
      next: path.steps[doneCount] ?? null,
    }
  })
}

/** L'étape peut-elle être jouée ? (parcours ouvert, étapes précédentes réussies). */
export function canPlayStep(step: PathStep, doneSteps: readonly string[], level: number): boolean {
  const progress = pathProgress(step.passion, doneSteps, level).find((entry) => entry.path.id === step.pathId)
  if (!progress?.unlocked) return false
  // On peut rejouer une étape réussie, ou jouer la suivante.
  return step.index <= progress.done + 1
}
