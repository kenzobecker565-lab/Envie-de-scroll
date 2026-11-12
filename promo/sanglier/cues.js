/**
 * Instants clés du « Sanglier » (le chasseur et le joggeur), calculés à partir de
 * timeline.json (écrit par voix.py). Partagés par l'image (main.js) et le son.
 */

export const FPS = 30
export const WIDTH = 1080
export const HEIGHT = 1920

const norm = (s) =>
  s
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]/g, '')

export function makeCues(tl) {
  const line = (id) => {
    const l = tl.lines.find((x) => x.id.startsWith(id))
    if (!l) throw new Error(`Réplique inconnue : ${id}`)
    return l
  }
  const has = (id) => tl.lines.some((x) => x.id.startsWith(id))
  const S = (id) => line(id).start
  const E = (id) => line(id).start + line(id).dur
  const W = (id, word, n = 0) => {
    const found = line(id).words.filter((w) => norm(w.w).startsWith(norm(word)))
    if (!found[n]) throw new Error(`Mot « ${word} » introuvable dans ${id}`)
    return found[n].t
  }
  const cut = (id) => S(id) - 0.15

  // Les scènes. « cut » : transition d'entrée.
  const sections = [
    { id: 'foret', t0: 0, t1: cut('02') },
    { id: 'gerard', t0: cut('02'), t1: cut('03'), cut: 'flash' },
    { id: 'tribunal', t0: cut('03'), t1: cut('16'), cut: 'wipe' },
    { id: 'vote', t0: cut('16'), t1: tl.duration, cut: 'wipe' },
  ]
  // Les insultes, couvertes par un bip : [réplique, mot, n-ième occurrence].
  const INSULTS = [['04', 'bouffon'], ['08', 'connard'], ['10', 'nud'], ['11', 'gueule'], ['13', 'abruti'], ['14', 'tocard']]
  const bips = INSULTS.map(([id, word, n = 0]) => {
    const l = line(id)
    const i = l.words.findIndex((w) => norm(w.w).startsWith(word) && n-- === 0)
    if (i < 0) throw new Error(`Insulte « ${word} » introuvable dans ${id}`)
    const t0 = l.words[i].t - 0.03
    const t1 = Math.min(l.words[i + 1]?.t ?? l.start + l.dur, t0 + 0.6) - 0.04
    return { id, word, t0, t1 }
  })
  // Signature de la marque (proces/marque.mjs) : après « Coupable… ou non coupable ? ».
  const signature = W('16', 'coupable', 1) + 0.4
  return { S, E, W, has, line, sections, signature, bips, duration: tl.duration, lines: tl.lines }
}
