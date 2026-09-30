/**
 * Modèle de données de « Plutôt Que Scroller ».
 *
 * Tous les types métier sont regroupés ici pour qu'on puisse voir d'un coup
 * d'œil « de quoi est faite » l'application. Les identifiants (passions,
 * moods…) sont des chaînes stables : ils sont enregistrés dans la base de
 * données de l'utilisateur, il ne faut donc jamais les renommer une fois
 * publiés (on peut en revanche changer librement les libellés affichés).
 */

import type { PICTOS } from '../lib/pictos'

/** Nom d'un pictogramme de l'app (voir src/lib/pictos.ts). */
export type PictoName = keyof typeof PICTOS

/* -------------------------------------------------------------------------- */
/*  Catalogue de passions                                                     */
/* -------------------------------------------------------------------------- */

export type PassionFamilyId =
  | 'arts-visuels'
  | 'audiovisuel'
  | 'mots'
  | 'son'
  | 'corps-mouvement'
  | 'fabrication'
  | 'esprit-strategie'
  | 'nature-exploration'

export type PassionId =
  // Arts visuels
  | 'dessin'
  | 'peinture'
  | 'photographie'
  | 'illustration-numerique'
  | 'mode-stylisme'
  // Audiovisuel
  | 'cinema'
  | 'animation'
  | 'montage-video'
  // Mots
  | 'ecriture'
  | 'poesie'
  | 'journal-intime'
  | 'critique-blogging'
  // Son
  | 'musique'
  | 'chant'
  | 'composition'
  | 'podcast'
  // Corps & mouvement
  | 'danse'
  | 'sport'
  | 'theatre'
  | 'arts-martiaux'
  // Fabrication
  | 'bricolage'
  | 'cuisine'
  | 'couture'
  | 'jardinage'
  // Esprit & stratégie
  | 'jeux-video-creatifs'
  | 'programmation-creative'
  | 'jeux-de-societe'
  | 'echecs'
  // Nature & exploration
  | 'randonnee'
  | 'observation-nature'
  | 'voyage'

/**
 * Façon dont le tableau de bord affiche la progression d'une passion :
 * - `gallery`  : galerie de photos de ce que l'utilisateur a réalisé ;
 * - `films`    : liste de films avec une note sur 5 ;
 * - `timeline` : liste chronologique des activités (par défaut).
 */
export type ProgressView = 'gallery' | 'films' | 'timeline'

export interface Passion {
  id: PassionId
  familyId: PassionFamilyId
  label: string
  picto: PictoName
  progressView: ProgressView
}

export interface PassionFamily {
  id: PassionFamilyId
  label: string
  picto: PictoName
  /** Couleur d'accent (hex), utilisée en teinte légère dans l'interface. */
  color: string
  passionIds: PassionId[]
  /**
   * Passions proposées en premier aux personnes qui arrivent par le chemin
   * « je ne sais pas trop » : les plus faciles à démarrer sans matériel.
   */
  starterPassionIds: PassionId[]
}

/* -------------------------------------------------------------------------- */
/*  Moods (étape A du parcours)                                               */
/* -------------------------------------------------------------------------- */

export type MoodId =
  // Énergie basse / retrait
  | 'ennui'
  | 'fatigue'
  | 'coup-de-mou'
  | 'manque-inspiration'
  | 'calme'
  // Énergie haute / tension
  | 'stress'
  | 'defouler'
  | 'procrastination'
  | 'curiosite'

export type EnergyLevel = 'basse' | 'haute'

export interface Mood {
  id: MoodId
  label: string
  /** Libellé court, pour les filtres et les petites étiquettes. */
  shortLabel: string
  picto: PictoName
  energy: EnergyLevel
  /** Petite phrase d'accompagnement affichée sous le libellé. */
  hint: string
}

/* -------------------------------------------------------------------------- */
/*  Chemin alternatif de l'onboarding                                         */
/* -------------------------------------------------------------------------- */

export type LifeInterestId =
  | 'creer-mains'
  | 'raconter'
  | 'bouger'
  | 'comprendre'
  | 'musique'
  | 'nature'
  | 'autres'
  | 'jouer'

export interface LifeInterest {
  id: LifeInterestId
  label: string
  picto: PictoName
  /** Familles de passions vers lesquelles cette réponse redirige. */
  familyIds: PassionFamilyId[]
  /** Passions pré-cochées quand on choisit cette réponse. */
  suggestedPassionIds: PassionId[]
}

/* -------------------------------------------------------------------------- */
/*  Bibliothèque d'activités                                                  */
/* -------------------------------------------------------------------------- */

/** Temps disponible, en minutes (étape C du parcours). */
export type Duration = 5 | 15 | 30

export type Level = 'debutant' | 'intermediaire'

export interface Activity {
  /** Identifiant stable, généré à partir de la passion, du mood et du titre. */
  id: string
  passionId: PassionId
  mood: MoodId
  duration: Duration
  title: string
  description: string
  /**
   * Optionnel. `debutant` : accessible sans aucune expérience.
   * `intermediaire` : demande un peu de pratique ; ces activités sont évitées
   * pour les profils en « mode débutant ». Sans niveau = convient à tous.
   */
  level?: Level
}

/* -------------------------------------------------------------------------- */
/*  Données utilisateur (persistées dans IndexedDB)                           */
/* -------------------------------------------------------------------------- */

export interface UserProfile {
  /** Un seul profil par appareil : l'identifiant est toujours `me`. */
  id: 'me'
  firstName: string
  passionIds: PassionId[]
  /**
   * Vrai si l'utilisateur est passé par le chemin « je ne sais pas trop » :
   * le moteur privilégie alors les activités de niveau débutant.
   */
  beginnerMode: boolean
  /** Réponses à « Qu'est-ce qui te plaît dans la vie ? », si posée. */
  lifeInterestIds: LifeInterestId[]
  createdAt: string
  updatedAt: string
}

/** Film noté dans la vue « cinéma » du tableau de bord. */
export interface FilmLog {
  title: string
  /** Note de 1 à 5 ; 0 = pas encore noté. */
  rating: 0 | 1 | 2 | 3 | 4 | 5
}

/**
 * Une entrée d'historique = une envie de scroller transformée en activité.
 * On garde une copie du titre et de la description de l'activité : si la
 * bibliothèque évolue plus tard, l'historique reste lisible.
 */
export interface HistoryEntry {
  id?: number
  activityId: string
  passionId: PassionId
  mood: MoodId
  duration: Duration
  title: string
  description: string
  /** Date et heure ISO de l'enregistrement. */
  completedAt: string
  /** Jour local au format AAAA-MM-JJ (sert au calcul du streak). */
  dateKey: string
  /** Note libre facultative (« ce que j'ai fait »). */
  note?: string
  /** Référence vers la table `photos` (galerie). */
  photoId?: number
  film?: FilmLog
  /** Vrai pour les entrées de démonstration créées au premier lancement. */
  isDemo?: boolean
}

export interface PhotoRecord {
  id?: number
  blob: Blob
  createdAt: string
}

/* -------------------------------------------------------------------------- */
/*  Statistiques calculées                                                    */
/* -------------------------------------------------------------------------- */

export interface DayCell {
  dateKey: string
  count: number
  isToday: boolean
  /** Jour pas encore arrivé (fin de la semaine en cours). */
  isFuture: boolean
}

export interface Stats {
  /** Nombre de jours consécutifs avec au moins une envie transformée. */
  currentStreak: number
  bestStreak: number
  /** Vrai si le streak est encore à prolonger aujourd'hui. */
  streakNeedsToday: boolean
  totalTransformed: number
  /** Temps estimé récupéré, en minutes. */
  minutesReclaimed: number
  lastEntry: HistoryEntry | undefined
  countByPassion: Partial<Record<PassionId, number>>
  /** Envies transformées depuis lundi. */
  thisWeek: number
  /**
   * Les 5 dernières semaines, du lundi au dimanche (35 cases), de la plus
   * ancienne à la plus récente : de quoi dessiner un petit calendrier.
   */
  lastWeeks: DayCell[]
}
