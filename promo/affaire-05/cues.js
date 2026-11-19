/**
 * Instants clés de l'affaire n°5, calculés à partir de timeline.json (écrit
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

  // Les scènes. « cut » : transition d'entrée (volet de couleur, ou flash blanc).
  const debat = E('06') + 0.1
  const sections = [
    { id: 'adresse', t0: 0, t1: cut('02') },
    { id: 'soir', t0: cut('02'), t1: cut('03'), cut: 'flash' },
    { id: 'box', t0: cut('03'), t1: cut('04'), cut: 'flash' },
    { id: 'appart', t0: cut('04'), t1: cut('05'), cut: 'wipe' },
    { id: 'voiture', t0: cut('05'), t1: cut('06'), cut: 'flash' },
    { id: 'partie', t0: cut('06'), t1: debat, cut: 'flash' },
    { id: 'tribunal', t0: debat, t1: cut('21'), cut: 'wipe' },
    { id: 'vote', t0: cut('21'), t1: tl.duration, cut: 'wipe' },
  ]
  const gavel = [debat + 0.3]
  const balance = [
    [S('07'), -0.3],
    [S('10'), 0.25],
    [S('12'), -0.45],
    [S('14'), 0.2],
    [S('15'), -0.5],
    [S('17'), 0.15],
    [S('19'), -0.2],
    [S('20'), 0.0],
  ]
  // Signature de la marque (proces/marque.mjs) : quand tombe « Quel est ton verdict ? ».
  const signature = W('22', 'verdict') + 0.6
  return { S, E, W, line, sections, gavel, balance, signature, duration: tl.duration, lines: tl.lines }
}
