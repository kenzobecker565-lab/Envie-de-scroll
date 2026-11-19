/**
 * Instants clés du Dossier n°1, calculés à partir de timeline.json (écrit
 * par voix.py). Partagés par l'image (main.js) et le son (audio.mjs).
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
  const S = (id) => line(id).start
  const E = (id) => line(id).start + line(id).dur
  const W = (id, word, n = 0) => {
    const found = line(id).words.filter((w) => norm(w.w).startsWith(norm(word)))
    if (!found[n]) throw new Error(`Mot « ${word} » introuvable dans ${id}`)
    return found[n].t
  }
  const cut = (id) => S(id) - 0.15

  // Les pages du dossier. « cut » : transition d'entrée (grille de points, ou flash).
  const sections = [
    { id: 'couverture', t0: 0, t1: W('01', 'une') - 0.15 },
    { id: 'plan', t0: W('01', 'une') - 0.15, t1: cut('03'), cut: 'flash' },
    { id: 'suspects', t0: cut('03'), t1: cut('04'), cut: 'dots' },
    { id: 'femme', t0: cut('04'), t1: cut('05'), cut: 'dots' },
    { id: 'associe', t0: cut('05'), t1: cut('06'), cut: 'dots' },
    { id: 'secretaire', t0: cut('06'), t1: cut('07'), cut: 'dots' },
    { id: 'indice', t0: cut('07'), t1: cut('08'), cut: 'dots' },
    { id: 'vote', t0: cut('08'), t1: tl.duration, cut: 'dots' },
  ]
  // Signature de la marque (proces/marque.mjs) : sur « Le dossier s'ouvre… ».
  const signature = W('08', 'dossier') + 0.3
  return { S, E, W, line, sections, signature, duration: tl.duration, lines: tl.lines }
}
