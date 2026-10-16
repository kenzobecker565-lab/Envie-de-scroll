/**
 * Recolore une illustration unDraw (https://undraw.co, licence libre) avec les
 * couleurs du design system : chaque couleur d'origine devient une variable
 * CSS, pour que l'illustration suive le thème clair / sombre.
 *
 *   node scripts/recolor-undraw.mjs <fichier.svg> <nom>
 *   → src/illustrations/<nom>.svg
 */

import fs from 'node:fs'
import path from 'node:path'

const [input, name] = process.argv.slice(2)
if (!input || !name) {
  console.error('Usage : node scripts/recolor-undraw.mjs <fichier.svg> <nom>')
  process.exit(1)
}

/** Couleurs d'unDraw → tokens du design system. */
const PALETTE = {
  // Couleur principale d'unDraw
  '#6c63ff': 'var(--accent)',
  '#8985a8': 'var(--accent-soft)',
  // Cheveux, vêtements sombres, traits
  '#2f2e41': 'var(--ink)',
  '#3f3d56': 'var(--ink)',
  '#090814': 'var(--ink)',
  '#000': 'var(--ink)',
  '#000000': 'var(--ink)',
  '#707070': 'var(--ink-faint)',
  // Peau
  '#ed9da0': 'var(--warm)',
  '#ffb6b6': 'var(--warm)',
  '#ffb8b8': 'var(--warm)',
  '#ffb9b9': 'var(--warm)',
  '#9e616a': 'var(--warm)',
  '#a0616a': 'var(--warm)',
  // Gris clairs, fonds
  '#ccc': 'var(--ink-faint)',
  '#cbcbcb': 'var(--ink-faint)',
  '#e6e6e6': 'var(--line)',
  '#e4e4e4': 'var(--line)',
  '#f2f2f2': 'var(--surface-300)',
  '#f0f0f0': 'var(--surface-300)',
  '#f8f8f8': 'var(--surface-300)',
  '#fff': 'var(--surface-200)',
  '#ffffff': 'var(--surface-200)',
}

let svg = fs.readFileSync(input, 'utf8')
const unknown = new Set()
// Les couleurs passent dans un attribut style (les variables CSS y sont
// comprises par tous les moteurs, WebKit compris).
svg = svg.replace(/<([a-zA-Z]+)((?:\s+[^\s=>]+="[^"]*")*)\s*(\/?)>/g, (tag, element, attributes, selfClosing) => {
  const styles = []
  const rest = attributes.replace(/\s+(fill|stroke|stop-color)="(#[0-9a-fA-F]{3,6})"/g, (_match, attribute, color) => {
    const token = PALETTE[color.toLowerCase()]
    if (!token) unknown.add(color)
    styles.push(`${attribute}:${token ?? color}`)
    return ''
  })
  if (styles.length === 0) return tag
  return `<${element}${rest} style="${styles.join(';')}"${selfClosing ? ' /' : ''}>`
})
if (unknown.size > 0) {
  console.error(`Couleurs sans correspondance : ${[...unknown].join(', ')}`)
  process.exit(1)
}

// Identifiants uniques (plusieurs illustrations peuvent cohabiter dans la page).
svg = svg.replace(/id="([^"]+)"/g, `id="${name}-$1"`).replace(/url\(#([^)]+)\)/g, `url(#${name}-$1)`)
// Remplissage par défaut (éléments sans « fill ») : l'encre du thème. Taille fluide.
svg = svg
  .replace(/<svg([^>]*?) width="[^"]*" height="[^"]*"/, '<svg$1')
  .replace('<svg', `<svg style="fill:var(--ink)" aria-hidden="true" focusable="false"`)

const out = path.join(import.meta.dirname, '..', 'src', 'illustrations', `${name}.svg`)
fs.writeFileSync(out, svg)
console.log(`→ ${path.relative(process.cwd(), out)}`)
