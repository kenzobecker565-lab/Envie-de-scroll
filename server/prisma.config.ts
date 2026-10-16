import path from 'node:path'
import { defineConfig } from 'prisma/config'

// Variables d'environnement du fichier server/.env, s'il existe.
try {
  process.loadEnvFile(path.join(import.meta.dirname, '.env'))
} catch {
  // Pas de fichier .env : les valeurs par défaut s'appliquent.
}

export default defineConfig({
  schema: 'prisma/schema.prisma',
  migrations: { path: 'prisma/migrations' },
  datasource: { url: process.env.DATABASE_URL ?? 'file:./data/scroll-up.db' },
})
