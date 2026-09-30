import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { App } from './App.tsx'
import { initAppTheme } from './lib/appTheme.ts'
import './styles/index.css'

// Le dernier thème choisi sur ce téléphone, avant le premier affichage.
initAppTheme()

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
