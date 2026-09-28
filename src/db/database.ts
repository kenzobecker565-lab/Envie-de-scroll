import Dexie, { type EntityTable } from 'dexie'
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

  constructor(name = 'plutot-que-scroller') {
    super(name)

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

export const db = new PlutotQueScrollerDatabase()
