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

  const sections = [
    { id: 'couple', t0: 0, t1: cut('02') },
    { id: 'chambre', t0: cut('02'), t1: cut('04') },
    { id: 'tribunal', t0: cut('04'), t1: cut('15') },
    { id: 'vote', t0: cut('15'), t1: tl.duration },
  ]
  // Coups de marteau du juge.
  const gavel = [W('05', 'laudience') - 0.25, W('14', 'clos') + 0.35]
  // La jauge « coupable / non coupable » après chaque argument (−1 coupable … +1 non coupable).
  const balance = [
    [S('06'), -0.35],
    [S('07'), 0.15],
    [S('08'), -0.3],
    [S('09'), 0.25],
    [S('10'), -0.4],
    [S('11'), 0.3],
    [S('12'), -0.2],
    [S('13'), 0.05],
  ]
  return { S, E, W, line, sections, gavel, balance, duration: tl.duration, lines: tl.lines }
}
