/**
 * Instants clés de l'affaire du tir (LBD), épisode 2 « Le verdict », calculés à partir de
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
    { id: 'cam', t0: 0, t1: cut('04') },
    { id: 'tribunal', t0: cut('04'), t1: cut('06'), cut: 'wipe' },
    { id: 'pause', t0: cut('06'), t1: cut('07'), cut: 'flash' },
    { id: 'theo', t0: cut('07'), t1: cut('08'), cut: 'dip' },
    { id: 'vidal', t0: cut('08'), t1: cut('09'), cut: 'dip' },
    { id: 'verdict', t0: cut('09'), t1: cut('10'), cut: 'flash' },
    { id: 'fin', t0: cut('10'), t1: tl.duration, cut: 'wipe' },
  ]
  // Signature de la marque (proces/marque.mjs) : après « Dis-le en commentaire ».
  const signature = E('10') + 0.3
  return { S, E, W, has, line, sections, signature, duration: tl.duration, lines: tl.lines }
}
