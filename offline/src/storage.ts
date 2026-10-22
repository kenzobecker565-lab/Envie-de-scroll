/**
 * Sauvegarde sur le téléphone (IndexedDB) : les tables de la base et les
 * photos des dessins. Rien ne quitte l'appareil.
 */

import type { Tables } from './memoryPrisma.ts'

const DB_NAME = 'scroll-up-offline'
const STATE = 'state'
const PHOTOS = 'photos'

let opening: Promise<IDBDatabase> | undefined

function open(): Promise<IDBDatabase> {
  opening ??= new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, 1)
    request.onupgradeneeded = () => {
      request.result.createObjectStore(STATE)
      request.result.createObjectStore(PHOTOS)
    }
    request.onsuccess = () => resolve(request.result)
    request.onerror = () => reject(request.error)
  })
  return opening
}

function run<T>(store: string, mode: IDBTransactionMode, action: (objects: IDBObjectStore) => IDBRequest<T>): Promise<T> {
  return open().then(
    (db) =>
      new Promise<T>((resolve, reject) => {
        const transaction = db.transaction(store, mode)
        const request = action(transaction.objectStore(store))
        transaction.oncomplete = () => resolve(request.result)
        transaction.onerror = () => reject(transaction.error)
        transaction.onabort = () => reject(transaction.error)
      }),
  )
}

/* ---------------- JSON avec les dates et les grands entiers (identifiants) */

function encode(value: unknown): unknown {
  if (value instanceof Date) return { $date: value.toISOString() }
  if (typeof value === 'bigint') return { $bigint: value.toString() }
  if (Array.isArray(value)) return value.map(encode)
  if (value && typeof value === 'object') return Object.fromEntries(Object.entries(value).map(([key, item]) => [key, encode(item)]))
  return value
}

function decode(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(decode)
  if (value && typeof value === 'object') {
    const record = value as Record<string, unknown>
    if (typeof record.$date === 'string') return new Date(record.$date)
    if (typeof record.$bigint === 'string') return BigInt(record.$bigint)
    return Object.fromEntries(Object.entries(record).map(([key, item]) => [key, decode(item)]))
  }
  return value
}

export async function loadTables(): Promise<Tables | undefined> {
  try {
    const text = await run<string | undefined>(STATE, 'readonly', (objects) => objects.get('tables'))
    return text ? (decode(JSON.parse(text)) as Tables) : undefined
  } catch (error) {
    console.error('[hors ligne] Lecture de la sauvegarde impossible', error)
    return undefined
  }
}

export async function saveTables(tables: Tables): Promise<void> {
  await run(STATE, 'readwrite', (objects) => objects.put(JSON.stringify(encode(tables)), 'tables'))
}

export async function loadPhotos(): Promise<Map<string, Blob>> {
  const photos = new Map<string, Blob>()
  try {
    const db = await open()
    await new Promise<void>((resolve, reject) => {
      const request = db.transaction(PHOTOS, 'readonly').objectStore(PHOTOS).openCursor()
      request.onsuccess = () => {
        const cursor = request.result
        if (!cursor) return resolve()
        photos.set(String(cursor.key), cursor.value as Blob)
        cursor.continue()
      }
      request.onerror = () => reject(request.error)
    })
  } catch (error) {
    console.error('[hors ligne] Lecture des photos impossible', error)
  }
  return photos
}

export async function savePhoto(ref: string, blob: Blob): Promise<void> {
  await run(PHOTOS, 'readwrite', (objects) => objects.put(blob, ref))
}

export async function deletePhoto(ref: string): Promise<void> {
  await run(PHOTOS, 'readwrite', (objects) => objects.delete(ref))
}

/** Demande au navigateur de ne pas effacer ces données pour faire de la place. */
export function requestPersistence(): void {
  void navigator.storage?.persist?.().catch(() => false)
}
