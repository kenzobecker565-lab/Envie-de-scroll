// Charge le hook demandé par la page (window.HOOK) et le monte avec le moteur commun.
import { start } from './base.js'

const mod = await import(`./${window.HOOK}.js`)
await start(mod.default)
