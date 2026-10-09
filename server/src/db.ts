import fs from 'node:fs'
import path from 'node:path'
import { PrismaBetterSqlite3 } from '@prisma/adapter-better-sqlite3'
import { PrismaClient } from './generated/prisma/client.ts'

export type { Completion, Project, Proposal, User } from './generated/prisma/client.ts'
export { PrismaClient }

/** Ouvre la base SQLite (le dossier est créé au besoin). */
export function createPrisma(databaseFile: string): PrismaClient {
  fs.mkdirSync(path.dirname(databaseFile), { recursive: true })
  const adapter = new PrismaBetterSqlite3({ url: `file:${databaseFile}` })
  return new PrismaClient({ adapter })
}
