/**
 * Extrait de lucide-react (installé à la racine du dépôt, comme pour l'app)
 * les pictogrammes utilisés par la pub, et les écrit dans icons.js.
 *
 *   node scrollup/make-icons.mjs
 */

import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const here = path.dirname(fileURLToPath(import.meta.url))
const dir = path.resolve(here, '../../node_modules/lucide-react/dist/esm/icons')

const NAMES = [
  'arrow-right', 'check', 'clapperboard', 'cloud-lightning', 'feather', 'headphones', 'heart', 'hourglass',
  'images', 'life-buoy', 'message-circle', 'music', 'palette', 'pencil', 'send', 'snail', 'wind', 'bookmark',
  'calendar-x', 'camera', 'clock', 'coins', 'music-2', 'pen-line', 'shuffle', 'sparkles', 'volume-x',
]

const toMarkup = (node) =>
  node
    .map(([tag, attrs]) =>
      `<${tag} ${Object.entries(attrs)
        .filter(([k]) => k !== 'key')
        .map(([k, v]) => `${k}="${v}"`)
        .join(' ')}/>`,
    )
    .join('')

const icons = {}
for (const name of NAMES) {
  // Le module importe React : on ne lit que ses données, sans l'exécuter.
  const source = fs.readFileSync(path.join(dir, `${name}.mjs`), 'utf8')
  const data = source.slice(source.indexOf('const __iconData = ') + 19, source.indexOf('};', source.indexOf('const __iconData')) + 1)
  const { node } = new Function(`return (${data})`)()
  icons[name] = toMarkup(node)
}

const out = `/** Pictogrammes Lucide de l'app (généré par make-icons.mjs, ne pas modifier à la main). */\nexport const ICONS = ${JSON.stringify(icons, null, 2)}\n`
fs.writeFileSync(path.join(here, 'icons.js'), out)
console.log(`${Object.keys(icons).length} pictogrammes → scrollup/icons.js`)
