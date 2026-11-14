/**
 * Instants clés de l'affaire n°7 (la fausse avocate), calculés à partir de
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
  const debat = E('03') + 0.1
  const sections = [
    { id: 'plaide', t0: 0, t1: cut('02') },
    { id: 'registre', t0: cut('02'), t1: cut('03'), cut: 'flash' },
    { id: 'box', t0: cut('03'), t1: debat, cut: 'flash' },
    { id: 'tribunal', t0: debat, t1: cut('11'), cut: 'wipe' },
    { id: 'vote', t0: cut('11'), t1: tl.duration, cut: 'wipe' },
  ]
  // Signature de la marque (proces/marque.mjs) : après « Coupable… ou non coupable ? ».
  const signature = W('11', 'et') + 0.1
  return { S, E, W, has, line, sections, signature, duration: tl.duration, lines: tl.lines }
}
