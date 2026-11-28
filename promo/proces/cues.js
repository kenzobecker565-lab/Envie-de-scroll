/**
 * Instants clés du procès, calculés à partir de timeline.json (écrit par
 * voix.py). Partagés par l'image (main.js) et le son (audio.mjs).
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

  // Les scènes. « cut » : transition d'entrée (volet de couleur, ou flash blanc
  // pour le montage rapide des faits).
  const outside = W('14', 'regardez') - 0.12
  const sections = [
    { id: 'accuse', t0: 0, t1: cut('02') },
    { id: 'foule', t0: cut('02'), t1: cut('03'), cut: 'flash' },
    { id: 'toi', t0: cut('03'), t1: cut('04'), cut: 'flash' },
    { id: 'mairie', t0: cut('04'), t1: cut('05'), cut: 'wipe' },
    { id: 'maternite', t0: cut('05'), t1: cut('06'), cut: 'flash' },
    { id: 'factures', t0: cut('06'), t1: cut('07'), cut: 'flash' },
    { id: 'peine', t0: cut('07'), t1: cut('08'), cut: 'flash' },
    { id: 'tribunal', t0: cut('08'), t1: outside, cut: 'wipe' },
    { id: 'dehors', t0: outside, t1: cut('15'), cut: 'flash' },
    { id: 'tribunal2', t0: cut('15'), t1: cut('18'), cut: 'flash' },
    { id: 'vote', t0: cut('18'), t1: tl.duration, cut: 'wipe' },
  ]
  // Coups de marteau du juge.
  const gavel = [W('08', 'laudience') - 0.25, W('17', 'clos') + 0.35]
  // La jauge « coupable / non coupable » après chaque argument (−1 coupable … +1 non coupable).
  const balance = [
    [S('09'), -0.4],
    [S('10'), 0.25],
    [S('11'), -0.35],
    [S('12'), 0.35],
    [S('13'), -0.25],
    [S('14'), 0.15],
    [S('15'), -0.1],
    [S('16'), 0.05],
  ]
  return { S, E, W, line, sections, gavel, balance, duration: tl.duration, lines: tl.lines }
}
