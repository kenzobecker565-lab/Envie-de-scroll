/**
 * Instants clés de l'affaire n°2, calculés à partir de timeline.json (écrit
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
  const debat = E('04') + 0.1
  const sections = [
    { id: 'messages', t0: 0, t1: cut('02') },
    { id: 'plaintes', t0: cut('02'), t1: cut('03'), cut: 'flash' },
    { id: 'nuit', t0: cut('03'), t1: cut('04'), cut: 'flash' },
    { id: 'peine', t0: cut('04'), t1: debat, cut: 'flash' },
    { id: 'tribunal', t0: debat, t1: cut('11'), cut: 'wipe' },
    { id: 'vote', t0: cut('11'), t1: tl.duration, cut: 'wipe' },
  ]
  // Coup de marteau du juge, à l'ouverture des débats.
  const gavel = [debat + 0.3]
  // La jauge « coupable / non coupable » après chaque argument (−1 coupable … +1 non coupable).
  const balance = [
    [S('05'), -0.35],
    [S('06'), 0.3],
    [S('07'), -0.3],
    [S('08'), 0.3],
    [S('09'), -0.15],
    [S('10'), 0.05],
  ]
  return { S, E, W, line, sections, gavel, balance, duration: tl.duration, lines: tl.lines }
}
