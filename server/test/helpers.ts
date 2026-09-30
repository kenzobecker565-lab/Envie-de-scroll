import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import Database from 'better-sqlite3'
import { signInitData } from '../src/auth/initData.ts'
import { createPrisma, type PrismaClient } from '../src/db.ts'

const MIGRATIONS = path.resolve(import.meta.dirname, '../prisma/migrations')

/** Base SQLite neuve, dans un dossier temporaire, avec toutes les migrations appliquées. */
export function createTestDatabase(): { prisma: PrismaClient; dir: string; cleanup: () => Promise<void> } {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'pqs-test-'))
  const file = path.join(dir, 'test.db')
  const sqlite = new Database(file)
  for (const migration of fs.readdirSync(MIGRATIONS).filter((name) => !name.endsWith('.toml')).sort()) {
    sqlite.exec(fs.readFileSync(path.join(MIGRATIONS, migration, 'migration.sql'), 'utf8'))
  }
  sqlite.close()
  const prisma = createPrisma(file)
  return {
    prisma,
    dir,
    cleanup: async () => {
      await prisma.$disconnect()
      fs.rmSync(dir, { recursive: true, force: true })
    },
  }
}

/** Horloge réglable à la main. */
export function testClock(start = '2026-09-30T08:00:00Z') {
  let current = new Date(start)
  return {
    now: () => new Date(current),
    advanceMinutes(minutes: number) {
      current = new Date(current.getTime() + minutes * 60_000)
    },
    set(iso: string) {
      current = new Date(iso)
    },
  }
}

export const TEST_BOT_TOKEN = '123456:TEST-TOKEN'

/** initData Telegram signées comme le ferait Telegram. */
export function makeInitData(user: object, { authDate = 1_790_000_000, token = TEST_BOT_TOKEN } = {}): string {
  const params = new URLSearchParams({
    query_id: 'AAHdF6IQAAAAAN0XohDhrOrc',
    user: JSON.stringify(user),
    auth_date: String(authDate),
  })
  params.set('hash', signInitData(params, token))
  return params.toString()
}
