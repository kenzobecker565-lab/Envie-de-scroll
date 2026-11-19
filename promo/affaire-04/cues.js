/**
 * Instants clés de l'affaire n°4, calculés à partir de timeline.json (écrit
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
  const debat = E('03') + 0.1
  const sections = [
    { id: 'jardin', t0: 0, t1: cut('02') },
    { id: 'vingt', t0: cut('02'), t1: cut('03'), cut: 'flash' },
    { id: 'salon', t0: cut('03'), t1: debat, cut: 'flash' },
    { id: 'tribunal', t0: debat, t1: cut('10'), cut: 'wipe' },
    { id: 'vote', t0: cut('10'), t1: tl.duration, cut: 'wipe' },
  ]
  const gavel = [debat + 0.3]
  const balance = [
    [S('04'), -0.35],
    [S('05'), 0.3],
    [S('06'), -0.4],
    [S('07'), 0.3],
    [S('08'), -0.15],
    [S('09'), 0.05],
  ]
  return { S, E, W, line, sections, gavel, balance, duration: tl.duration, lines: tl.lines }
}
