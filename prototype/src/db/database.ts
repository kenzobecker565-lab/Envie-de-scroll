import Dexie, { type DexieOptions, type EntityTable } from 'dexie'
import { IDBFactory as MemoryIDBFactory, IDBKeyRange as MemoryIDBKeyRange } from 'fake-indexeddb'
import type { HistoryEntry, PhotoRecord, UserProfile } from '../types'

/**
 * ============================================================================
 *  PERSISTANCE : la base de données locale (IndexedDB, via Dexie)
 * ============================================================================
 *
 * Toutes les données de l'utilisateur vivent dans le navigateur, dans une
 * base IndexedDB nommée « plutot-que-scroller ». Elles survivent aux
 * rechargements de page et aux redémarrages, et ne quittent jamais l'appareil.
 *
 * Tables :
 *   - profile : le profil (un seul enregistrement, id = « me ») ;
 *   - history : une ligne par envie transformée ;
 *   - photos  : les photos de la galerie (fichiers binaires, « Blob ») ;
 *   - meta    : petits drapeaux techniques (ex. « démo déjà installée »).
 *
 * Règle d'architecture : SEULS les fichiers de `src/db/` et `src/services/`
 * importent `db`. Les composants passent par les services et les hooks.
 * Pour migrer plus tard vers un serveur ou vers le stockage Telegram, c'est
 * cette couche-là (et elle seule) qu'il faudra réécrire.
 *
 * Si le navigateur refuse l'accès au stockage (certaines navigations
 * privées, aperçus intégrés…), l'app bascule sur une base identique mais
 * gardée en mémoire (voir `switchToMemoryDatabase`) : tout fonctionne, mais rien
 * n'est conservé après la fermeture de la page.
 *
 * Faire évoluer le schéma : ne modifie jamais une version existante. Ajoute
 * `this.version(2).stores({...})` avec, si besoin, un `.upgrade(...)` qui
 * transforme les anciennes données (voir la doc de Dexie : « Database
 * versioning »).
 */

export interface MetaRecord {
  key: 'demoSeeded'
  value: boolean
}

export class PlutotQueScrollerDatabase extends Dexie {
  profile!: EntityTable<UserProfile, 'id'>
  history!: EntityTable<HistoryEntry, 'id'>
  photos!: EntityTable<PhotoRecord, 'id'>
  meta!: EntityTable<MetaRecord, 'key'>

  constructor(name = 'plutot-que-scroller', options?: DexieOptions) {
    super(name, options)

    // Seuls les champs listés ici sont indexés (servent au tri / à la
    // recherche). Les autres champs sont quand même enregistrés.
    // `++id` = identifiant numérique auto-incrémenté.
    this.version(1).stores({
      profile: 'id',
      history: '++id, completedAt, dateKey, passionId, mood',
      photos: '++id',
      meta: 'key',
    })
  }
}

const DATABASE_NAME = 'plutot-que-scroller'

/**
 * La base utilisée par toute l'app. Déclarée avec `let` : elle peut être
 * remplacée par la base en mémoire au démarrage (les modules qui l'importent
 * voient automatiquement la nouvelle).
 */
export let db = new PlutotQueScrollerDatabase(DATABASE_NAME)

/** Vrai quand l'app tourne sur la base en mémoire (rien n'est conservé). */
export let isMemoryDatabase = false

/** Remplace la base du navigateur par une base en mémoire, au même schéma. */
export function switchToMemoryDatabase(): void {
  if (isMemoryDatabase) return
  const indexedDB = new MemoryIDBFactory() as unknown as IDBFactory
  const keyRange = MemoryIDBKeyRange as unknown as typeof IDBKeyRange
  // Les lectures « en direct » (liveQuery) de Dexie ne s'exécutent que si
  // Dexie connaît un IndexedDB : quand le navigateur n'en expose aucun, on
  // lui déclare la base en mémoire.
  if (!Dexie.dependencies.indexedDB) {
    Dexie.dependencies.indexedDB = indexedDB
    Dexie.dependencies.IDBKeyRange = keyRange
  }
  db.close()
  db = new PlutotQueScrollerDatabase(DATABASE_NAME, { indexedDB, IDBKeyRange: keyRange })
  isMemoryDatabase = true
}
