import { ACTIVITIES_BY_PASSION } from '../data/activities'
import { SKETCH_MONSTER, SKETCH_OBJECTS, SKETCH_STILL_LIFE } from '../data/demoSketches'
import { db } from '../db/database'
import { addDays, toDateKey } from '../lib/dates'
import type { Activity, Duration, FilmLog, HistoryEntry, MoodId, PassionId } from '../types'

/**
 * ============================================================================
 *  DONNÉES DE DÉMONSTRATION
 * ============================================================================
 *
 * Au tout premier lancement, on ajoute une douzaine d'entrées fictives
 * (marquées `isDemo: true`) pour que le tableau de bord ne soit pas vide :
 * une série de 4 jours, une galerie de dessins, quelques films notés…
 * Les dates sont calculées à partir d'aujourd'hui.
 *
 * L'utilisateur peut les retirer (ou les remettre) depuis son profil.
 */

interface DemoSpec {
  daysAgo: number
  /** Heure locale, ex. 20.5 = 20 h 30. */
  hour: number
  passionId: PassionId
  mood: MoodId
  duration: Duration
  /** Titre de l'activité visée dans la bibliothèque. */
  title: string
  note?: string
  film?: FilmLog
  sketch?: string
}

const DEMO_SPECS: DemoSpec[] = [
  { daysAgo: 1, hour: 20.5, passionId: 'dessin', mood: 'ennui', duration: 5, title: 'Croquis express', sketch: SKETCH_OBJECTS, note: 'Quatre objets du bureau, une minute chacun. La lampe ressemble à une grue.' },
  { daysAgo: 1, hour: 17, passionId: 'cinema', mood: 'fatigue', duration: 15, title: 'Court-métrage Pixar', film: { title: 'Bao', rating: 4 }, note: 'Je ne m’attendais pas à être ému par un ravioli.' },
  { daysAgo: 2, hour: 21.25, passionId: 'ecriture', mood: 'stress', duration: 5, title: 'Déverser puis tordre', note: '« Tu n’auras jamais fini ce dossier, mouahaha. » Beaucoup moins effrayant dit comme ça.' },
  { daysAgo: 2, hour: 16.5, passionId: 'cinema', mood: 'coup-de-mou', duration: 15, title: 'Hair Love', film: { title: 'Hair Love', rating: 5 } },
  { daysAgo: 3, hour: 18, passionId: 'cuisine', mood: 'coup-de-mou', duration: 15, title: 'Trois crêpes', note: 'Crêpes caramel beurre salé : validé.' },
  { daysAgo: 4, hour: 19.75, passionId: 'dessin', mood: 'stress', duration: 5, title: 'Le monstre du stress', sketch: SKETCH_MONSTER },
  { daysAgo: 6, hour: 22, passionId: 'musique', mood: 'calme', duration: 15, title: 'Touches noires', note: 'Improvisé sur les touches noires, ça sonnait presque comme une vraie musique de film.' },
  { daysAgo: 7, hour: 14.25, passionId: 'sport', mood: 'defouler', duration: 5, title: 'Tabata' },
  { daysAgo: 9, hour: 20, passionId: 'dessin', mood: 'calme', duration: 15, title: 'Nature morte au ralenti', sketch: SKETCH_STILL_LIFE },
  { daysAgo: 10, hour: 21.5, passionId: 'cinema', mood: 'calme', duration: 30, title: 'Première demi-heure Ghibli', film: { title: 'Mon voisin Totoro', rating: 5 } },
  { daysAgo: 12, hour: 18.25, passionId: 'ecriture', mood: 'ennui', duration: 15, title: 'Dialogue de bus en panne', note: 'Deux inconnus, un bus en panne, et une dispute sur la meilleure garniture de pizza.' },
  { daysAgo: 13, hour: 17.5, passionId: 'cinema', mood: 'ennui', duration: 30, title: 'La Jetée', film: { title: 'La Jetée', rating: 4 } },
]

/** Retrouve l'activité visée ; si son titre a changé, prend une activité équivalente. */
function findDemoActivity(spec: DemoSpec): Activity | undefined {
  const pool = ACTIVITIES_BY_PASSION[spec.passionId].filter((activity) => activity.mood === spec.mood)
  return (
    pool.find((activity) => activity.title === spec.title) ??
    pool.find((activity) => activity.duration === spec.duration) ??
    pool[0]
  )
}

/** Insère les entrées de démo. À appeler dans une transaction sur `history` et `photos`. */
async function insertDemoEntries(now: Date): Promise<void> {
  for (const spec of DEMO_SPECS) {
    const activity = findDemoActivity(spec)
    if (!activity) continue

    const day = addDays(now, -spec.daysAgo)
    const completedAt = new Date(day.getFullYear(), day.getMonth(), day.getDate(), Math.floor(spec.hour), Math.round((spec.hour % 1) * 60))

    const photoId = spec.sketch
      ? await db.photos.add({
          blob: new Blob([spec.sketch], { type: 'image/svg+xml' }),
          createdAt: completedAt.toISOString(),
        })
      : undefined

    const entry: HistoryEntry = {
      activityId: activity.id,
      passionId: activity.passionId,
      mood: spec.mood,
      duration: activity.duration,
      title: activity.title,
      description: activity.description,
      completedAt: completedAt.toISOString(),
      dateKey: toDateKey(completedAt),
      note: spec.note,
      film: spec.film,
      photoId,
      isDemo: true,
    }
    await db.history.add(entry)
  }
}

/**
 * Appelé au démarrage de l'application : installe la démo une seule fois
 * dans la vie de la base (un drapeau est gardé dans la table `meta`).
 * Sans risque si on l'appelle plusieurs fois : la transaction garantit
 * qu'un seul appel fait le travail.
 */
export async function seedDemoDataOnce(now = new Date()): Promise<void> {
  await db.transaction('rw', db.meta, db.history, db.photos, async () => {
    const alreadySeeded = await db.meta.get('demoSeeded')
    if (alreadySeeded?.value) return
    await insertDemoEntries(now)
    await db.meta.put({ key: 'demoSeeded', value: true })
  })
}

/** Nombre d'entrées de démo encore présentes (0 = aucune). */
export async function countDemoEntries(): Promise<number> {
  return db.history.filter((entry) => entry.isDemo === true).count()
}

/** Retire toutes les entrées de démo (les vraies activités ne sont pas touchées). */
export async function removeDemoData(): Promise<void> {
  await db.transaction('rw', db.history, db.photos, async () => {
    const demoEntries = await db.history.filter((entry) => entry.isDemo === true).toArray()
    const photoIds = demoEntries.flatMap((entry) => (entry.photoId !== undefined ? [entry.photoId] : []))
    await db.photos.bulkDelete(photoIds)
    await db.history.bulkDelete(demoEntries.flatMap((entry) => (entry.id !== undefined ? [entry.id] : [])))
  })
}

/** Remet les données de démo (après les avoir retirées). */
export async function restoreDemoData(now = new Date()): Promise<void> {
  await removeDemoData()
  await db.transaction('rw', db.history, db.photos, () => insertDemoEntries(now))
}

/**
 * Réinitialisation complète : profil, historique et photos sont effacés.
 * La démo n'est PAS réinstallée (l'utilisateur repart vraiment de zéro).
 */
export async function resetAllData(): Promise<void> {
  await db.transaction('rw', [db.profile, db.history, db.photos, db.meta], async () => {
    await Promise.all([db.profile.clear(), db.history.clear(), db.photos.clear()])
    await db.meta.put({ key: 'demoSeeded', value: true })
  })
}
