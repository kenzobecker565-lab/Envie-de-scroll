/// <reference types="vitest/config" />
import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
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
