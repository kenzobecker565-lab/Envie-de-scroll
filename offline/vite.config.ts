/**
 * Build de la version hors ligne (APK de présentation) : l'app habituelle,
 * sans le SDK Telegram, avec un serveur local à la place de /api.
 *
 *   npm run build -w offline   →   offline/dist/
 */
import path from 'node:path'
import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { defineConfig, type Plugin } from 'vite'

const appDir = path.resolve(import.meta.dirname, '../app')
const entry = path.resolve(import.meta.dirname, 'src/main.ts')

/** Même page que l'app, mais sans le SDK Telegram et avec l'entrée hors ligne. */
function offlineHtml(): Plugin {
  return {
    name: 'scroll-up-offline-html',
    enforce: 'pre',
    transformIndexHtml: {
      order: 'pre',
      handler: (html) =>
        html.replace(/\s*<!-- SDK Telegram[\s\S]*?<\/script>/, '').replace('src="/src/main.tsx"', 'src="/offline-entry.ts"'),
    },
  }
}

export default defineConfig({
  root: appDir,
  base: '/',
  plugins: [offlineHtml(), react(), tailwindcss()],
  resolve: {
    alias: [
      { find: /^\/offline-entry\.ts$/, replacement: entry },
      { find: '@', replacement: path.resolve(appDir, 'src') },
      // Seul createHash('sha256') sert côté boutique : une version navigateur suffit.
      { find: /^node:crypto$/, replacement: path.resolve(import.meta.dirname, 'src/shims/crypto.ts') },
    ],
  },
  build: {
    outDir: path.resolve(import.meta.dirname, 'dist'),
    emptyOutDir: true,
    // Pas de page de téléchargement ni d'APK dans l'APK.
    copyPublicDir: true,
  },
  server: { fs: { allow: [path.resolve(import.meta.dirname, '..')] } },
})
