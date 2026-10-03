import { useSyncExternalStore } from 'react'
import { dayPeriod, type DayPeriod } from '../components/decor/Ornaments.tsx'
import { getAppTheme, subscribeAppTheme } from './appTheme.ts'

export type AppearanceMode = 'auto' | 'light' | 'dark'
const listeners = new Set<() => void>()
let mode: AppearanceMode = 'auto'
try { const saved = localStorage.getItem('swipe-home-light'); if (saved === 'light' || saved === 'dark') mode = saved } catch { /* Session only. */ }
let scene: DayPeriod = dayPeriod(new Date().getHours())
let snapshot = { mode, scene }
function update() {
  const next = mode === 'dark' || (mode === 'auto' && getAppTheme() === 'nuit') ? 'night' : mode === 'light' ? 'day' : dayPeriod(new Date().getHours())
  document.documentElement.dataset.scene = next
  document.documentElement.dataset.appearance = mode
  if (next !== scene || snapshot.mode !== mode) { scene = next; snapshot = { mode, scene }; listeners.forEach(fn => fn()) }
}
export function setAppearance(next: AppearanceMode) {
  mode = next
  try { localStorage.setItem('swipe-home-light', mode) } catch { /* Session only. */ }
  update()
}
export function startAppearance() {
  update()
  const timer = window.setInterval(update, 30_000)
  document.addEventListener('visibilitychange', update)
  const stop = subscribeAppTheme(update)
  return () => { clearInterval(timer); document.removeEventListener('visibilitychange', update); stop() }
}
export function useAppearance() {
  return useSyncExternalStore(fn => { listeners.add(fn); return () => { listeners.delete(fn) } }, () => snapshot)
}
