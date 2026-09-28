import { db } from '../db/database'
import { isPassionId } from '../data/passions'
import type { LifeInterestId, PassionId, UserProfile } from '../types'

/**
 * Lecture et écriture du profil utilisateur.
 * Il n'y a qu'un profil par appareil (identifiant fixe « me »).
 */

const PROFILE_ID = 'me'

/** Renvoie le profil, ou `null` si l'onboarding n'a pas encore été fait. */
export async function getProfile(): Promise<UserProfile | null> {
  const profile = await db.profile.get(PROFILE_ID)
  if (!profile) return null
  // Même garde-fou que pour l'historique : on ignore une passion disparue du catalogue.
  return { ...profile, passionIds: cleanPassions(profile.passionIds) }
}

/** Nettoie une liste de passions : identifiants connus uniquement, sans doublon. */
function cleanPassions(passionIds: readonly string[]): PassionId[] {
  return [...new Set(passionIds)].filter(isPassionId)
}

export interface NewProfile {
  firstName: string
  passionIds: PassionId[]
  beginnerMode: boolean
  lifeInterestIds: LifeInterestId[]
}

/** Crée le profil à la fin de l'onboarding. */
export async function createProfile(input: NewProfile): Promise<void> {
  const passionIds = cleanPassions(input.passionIds)
  if (passionIds.length === 0) throw new Error('Il faut au moins une passion.')

  const now = new Date().toISOString()
  await db.profile.put({
    id: PROFILE_ID,
    firstName: input.firstName.trim(),
    passionIds,
    beginnerMode: input.beginnerMode,
    lifeInterestIds: input.lifeInterestIds,
    createdAt: now,
    updatedAt: now,
  })
}

export type ProfileChanges = Partial<Pick<UserProfile, 'firstName' | 'passionIds' | 'beginnerMode'>>

/** Met à jour une partie du profil (prénom, passions, mode débutant). */
export async function updateProfile(changes: ProfileChanges): Promise<void> {
  const patch: Partial<UserProfile> = { updatedAt: new Date().toISOString() }
  if (changes.firstName !== undefined) patch.firstName = changes.firstName.trim()
  if (changes.beginnerMode !== undefined) patch.beginnerMode = changes.beginnerMode
  if (changes.passionIds !== undefined) {
    const passionIds = cleanPassions(changes.passionIds)
    if (passionIds.length === 0) throw new Error('Il faut au moins une passion.')
    patch.passionIds = passionIds
  }
  await db.profile.update(PROFILE_ID, patch)
}
