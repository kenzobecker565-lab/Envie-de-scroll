import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { App } from './App.tsx'
import { initAmbient } from './lib/ambient.ts'
import { initAppTheme } from './lib/appTheme.ts'
// Polices servies par l'app elle-même (pas de Google Fonts) : affichage plus
// rapide dans Telegram, et rien ne dépend d'un service extérieur.
import '@fontsource-variable/bricolage-grotesque'
import '@fontsource-variable/rethink-sans'
import '@fontsource-variable/rubik'
import '@fontsource-variable/rubik/wght-italic.css'
import '@fontsource/bangers'
import '@fontsource-variable/nunito'
import '@fontsource-variable/nunito/wght-italic.css'
import '@fontsource-variable/syne'
import '@fontsource-variable/outfit'
import './styles/index.css'
import './styles/art-direction.css'

// Le dernier thème choisi sur ce téléphone, avant le premier affichage.
initAppTheme()
// La musique d'ambiance attend le premier toucher.
initAmbient()

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
