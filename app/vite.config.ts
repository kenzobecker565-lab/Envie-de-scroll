/// <reference types="vitest/config" />
import path from 'node:path'
import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  // « @/… » désigne le dossier src/ (convention de shadcn/ui).
  resolve: { alias: { '@': path.resolve(import.meta.dirname, 'src') } },
  build: {
    rolldownOptions: {
      output: {
        // Bibliothèques à part : elles changent rarement, le navigateur les garde en cache.
        codeSplitting: {
          groups: [
            { name: 'react', test: /node_modules[\\/](react|react-dom|scheduler)[\\/]/ },
            { name: 'motion', test: /node_modules[\\/](motion|framer-motion|motion-dom|motion-utils)[\\/]/ },
            { name: 'ui', test: /node_modules[\\/](@radix-ui|radix-ui|class-variance-authority|clsx|tailwind-merge|react-remove-scroll[^\\/]*|aria-hidden|use-callback-ref|use-sidecar|detect-node-es|get-nonce|tslib)[\\/]/ },
            { name: 'icons', test: /node_modules[\\/]lucide-react[\\/]/ },
          ],
        },
      },
    },
  },
  server: {
    // Accessible depuis le téléphone ou un tunnel HTTPS (ngrok, cloudflared…).
    host: true,
    allowedHosts: true,
    // En développement, l'API tourne à côté (npm run dev à la racine).
    proxy: { '/api': 'http://localhost:3000' },
  },
  test: {
    environment: 'node',
    include: ['src/**/*.test.ts'],
  },
})
