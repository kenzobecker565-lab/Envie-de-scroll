import { liveQuery } from 'dexie'
import { describe, expect, it } from 'vitest'
import { initializeApp, isStorageTemporary } from './appInit'
import { countDemoEntries } from './demoData'
import { getProfile } from './profileService'

/**
 * Ici, pas de fake-indexeddb global : comme dans un navigateur qui bloque le
 * stockage, l'app doit basculer sur sa base en mémoire et tout doit marcher,
 * y compris les lectures « en direct » utilisées par les écrans.
 */
describe('démarrage sans stockage du navigateur', () => {
  it('bascule sur une base en mémoire pleinement fonctionnelle', async () => {
    expect(globalThis.indexedDB).toBeUndefined()

    await Promise.all([initializeApp(), initializeApp()]) // deux appels, un seul démarrage
    expect(isStorageTemporary()).toBe(true)
    expect(await countDemoEntries()).toBeGreaterThan(0)

    const firstValue = await new Promise((resolve, reject) => {
      const subscription = liveQuery(getProfile).subscribe({
        next: (value) => {
          resolve(value)
          queueMicrotask(() => subscription.unsubscribe())
        },
        error: reject,
      })
    })
    expect(firstValue).toBeNull()
  })
})
