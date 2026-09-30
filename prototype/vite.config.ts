/// <reference types="vitest/config" />
import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  // Chemins relatifs : le build fonctionne aussi servi depuis un sous-dossier
  // (utile plus tard pour héberger la Telegram Mini App n'importe où).
  base: './',
  build: {
    // Tout est embarqué dans un seul fichier (React, Dexie et la bibliothèque
    // d'activités) : ~170 Ko compressés, chargés une fois puis mis en cache.
    chunkSizeWarningLimit: 800,
  },
  test: {
    environment: 'node',
    include: ['src/**/*.test.ts'],
  },
})
