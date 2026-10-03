import { useSyncExternalStore } from 'react'
import { dayPeriod, type DayPeriod } from '../components/decor/Ornaments.tsx'

const listeners = new Set<() => void>()
let scene: DayPeriod = dayPeriod(new Date().getHours())
let snapshot = { mode: 'auto' as const, scene }
function update() {
  const next = dayPeriod(new Date().getHours())
  document.documentElement.dataset.scene = next
  document.documentElement.dataset.appearance = 'auto'
  if (next !== scene) { scene = next; snapshot = { mode: 'auto', scene }; listeners.forEach(fn => fn()) }
}
export function startAppearance() {
  update()
  const timer = window.setInterval(update, 30_000)
  document.addEventListener('visibilitychange', update)
  return () => { clearInterval(timer); document.removeEventListener('visibilitychange', update) }
}
export function useAppearance() {
  return useSyncExternalStore(fn => { listeners.add(fn); return () => { listeners.delete(fn) } }, () => snapshot)
}
