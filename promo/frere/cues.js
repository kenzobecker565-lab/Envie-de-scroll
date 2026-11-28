/**
 * « Sauf moi » (projet séparé) : instants clés calculés depuis timeline.json
 * (écrit par voix.py). Partagés par l'image (main.js) et le son (audio.mjs).
 */

export const FPS = 30
export const WIDTH = 1080
export const HEIGHT = 1920

export const norm = (s) =>
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
  const cut = (id) => S(id) - 0.12
  // Les plans : [nom, début]. Chaque plan dure jusqu'au suivant.
  const list = [
    ['rue', 0],
    ['cafe', cut('02')],
    ['chaine', W('02', 'un') - 0.15],
    ['facteur', cut('03')],
    ['chien', W('03', 'le', 1) - 0.12],
    ['ecrans', cut('04')],
    ['chambre', cut('05')],
    ['aube', cut('06')],
    ['lampadaire', cut('07')],
    ['toit', cut('08')],
    ['bandeau', cut('09')],
    ['plan', W('09', 'gauche') - 0.45],
    ['voisin', cut('10')],
    ['office', cut('11')],
    ['bureau', cut('12')],
    ['guidou', cut('13')],
    ['seul', cut('14')],
    ['concert', cut('15')],
    ['panne', cut('16')],
    ['noir', cut('17')],
    ['torche', cut('18')],
    ['file', cut('19')],
    ['chien2', cut('20')],
    ['badge', cut('21')],
    ['fin', cut('22')],
  ]
  const shots = list.map(([id, t0], i) => ({ id, t0: Math.max(0, t0), t1: i + 1 < list.length ? list[i + 1][1] : tl.duration }))
  return { S, E, W, line, shots, duration: tl.duration, lines: tl.lines }
}
