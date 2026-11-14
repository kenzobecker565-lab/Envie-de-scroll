import 'fake-indexeddb/auto'
import { beforeEach, describe, expect, it } from 'vitest'
import { getActivity } from '../data/activities'
import { db } from '../db/database'
import { countDemoEntries, removeDemoData, resetAllData, restoreDemoData, seedDemoDataOnce } from './demoData'
import { attachPhoto, deleteEntry, listHistory, recordActivity, updateEntryDetails } from './historyService'
import { createProfile, getProfile, updateProfile } from './profileService'
import type { HistoryEntry, UserProfile } from '../types'

/**
 * Tests de la couche de persistance, sur une base IndexedDB simulée en
 * mémoire (fake-indexeddb) : mêmes appels que dans le navigateur.
 */

beforeEach(async () => {
  await db.delete()
  await db.open()
})

const croquis = getActivity('dessin.ennui.croquis-express')!

describe('données de démonstration', () => {
  it('ne sont installées qu’une seule fois, même si on appelle deux fois', async () => {
    await Promise.all([seedDemoDataOnce(), seedDemoDataOnce()])
    await seedDemoDataOnce()
    const count = await countDemoEntries()
    expect(count).toBeGreaterThanOrEqual(10)
    expect(await db.history.count()).toBe(count)
    expect(await db.photos.count()).toBe(3)
  })

  it('peuvent être retirées sans toucher aux vraies activités, puis remises', async () => {
    await seedDemoDataOnce()
    const realId = await recordActivity(croquis, 'ennui')

    await removeDemoData()
    expect(await countDemoEntries()).toBe(0)
    expect(await db.photos.count()).toBe(0)
    expect((await listHistory()).map((entry) => entry.id)).toEqual([realId])

    await restoreDemoData()
    expect(await countDemoEntries()).toBeGreaterThan(0)
    expect(await db.history.get(realId)).toBeDefined()
  })
})

describe('profil', () => {
  it('est null avant l’onboarding, puis créé et modifiable', async () => {
    expect(await getProfile()).toBeNull()
    await createProfile({ firstName: '  Léa ', passionIds: ['dessin', 'cinema', 'dessin'], beginnerMode: false, lifeInterestIds: [] })
    expect(await getProfile()).toMatchObject({ firstName: 'Léa', passionIds: ['dessin', 'cinema'] })

    await updateProfile({ firstName: 'Lou', passionIds: ['cuisine'] })
    expect(await getProfile()).toMatchObject({ firstName: 'Lou', passionIds: ['cuisine'] })
  })

  it('refuse un profil sans passion', async () => {
    await expect(createProfile({ firstName: '', passionIds: [], beginnerMode: true, lifeInterestIds: [] })).rejects.toThrow()
  })
})

describe('historique', () => {
  it('enregistre une activité avec le jour local et la durée de l’activité', async () => {
    const id = await recordActivity(croquis, 'stress', new Date(2026, 8, 28, 23, 45))
    const entry = await db.history.get(id)
    expect(entry).toMatchObject({ passionId: 'dessin', mood: 'stress', duration: 5, dateKey: '2026-09-28' })
  })

  it('ajoute puis efface note et film', async () => {
    const id = await recordActivity(croquis, 'ennui')
    await updateEntryDetails(id, { note: ' Super ', film: { title: 'Totoro', rating: 5 } })
    expect(await db.history.get(id)).toMatchObject({ note: 'Super', film: { title: 'Totoro', rating: 5 } })

    await updateEntryDetails(id, { note: '', film: null })
    const entry = await db.history.get(id)
    expect(entry?.note).toBeUndefined()
    expect(entry?.film).toBeUndefined()
  })

  it('remplace la photo d’une entrée et la supprime avec l’entrée', async () => {
    const id = await recordActivity(croquis, 'ennui')
    await attachPhoto(id, new Blob(['a'], { type: 'image/png' }))
    await attachPhoto(id, new Blob(['b'], { type: 'image/png' }))
    expect(await db.photos.count()).toBe(1)

    await deleteEntry(id)
    expect(await db.history.count()).toBe(0)
    expect(await db.photos.count()).toBe(0)
  })
})

describe('données abîmées en base', () => {
  it('sont corrigées ou ignorées à la lecture, sans planter', async () => {
    const now = new Date().toISOString()
    const raw = (value: object) => db.history.add(value as HistoryEntry)
    await raw({ activityId: 'a', passionId: 'dessin', mood: 'ennui', duration: 7, title: 42, description: 'ok', completedAt: now, dateKey: 'n’importe quoi', note: { oups: true }, film: { title: 12 } })
    await raw({ activityId: 'b', passionId: 'passion-disparue', mood: 'ennui', duration: 5, title: 't', description: 'd', completedAt: now, dateKey: '2026-09-29' })
    await raw({ activityId: 'e', passionId: 'constructor', mood: 'toString', duration: 5, title: 't', description: 'd', completedAt: now, dateKey: '2026-09-29' })
    await raw({ activityId: 'c', passionId: 'cinema', mood: 'mood-inconnu', duration: 5, title: 't', description: 'd', completedAt: now, dateKey: '2026-09-29' })
    await raw({ activityId: 'd', passionId: 'cinema', mood: 'calme', duration: 15, title: 't', description: 'd', completedAt: 'pas une date', dateKey: '2026-09-29' })

    const entries = await listHistory()
    expect(entries).toHaveLength(1)
    expect(entries[0]).toMatchObject({ passionId: 'dessin', duration: 5, title: 'Activité', note: undefined, film: undefined })
    expect(entries[0]?.dateKey).toMatch(/^\d{4}-\d{2}-\d{2}$/)
  })

  it('corrigent un profil abîmé', async () => {
    await db.profile.put({ id: 'me', firstName: 42, passionIds: ['dessin', 'disparue', 3, 'dessin'], beginnerMode: 'oui' } as unknown as UserProfile)
    expect(await getProfile()).toMatchObject({ firstName: '', passionIds: ['dessin'], beginnerMode: false, lifeInterestIds: [] })
  })
})

describe('réinitialisation', () => {
  it('efface tout et ne réinstalle pas la démo', async () => {
    await seedDemoDataOnce()
    await createProfile({ firstName: 'Léa', passionIds: ['dessin'], beginnerMode: false, lifeInterestIds: [] })
    await recordActivity(croquis, 'ennui')

    await resetAllData()
    await seedDemoDataOnce()

    expect(await getProfile()).toBeNull()
    expect(await db.history.count()).toBe(0)
    expect(await db.photos.count()).toBe(0)
  })
})
