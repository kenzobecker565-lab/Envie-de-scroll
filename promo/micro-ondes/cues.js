/**
 * Instants clés de la vidéo, calculés à partir de timeline.json (écrit par
 * voix.py). Partagés par l'image (main.js) et le son (audio.mjs) : un repère
 * déplacé décale les deux ensemble.
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
  /** Début de la réplique. */
  const S = (id) => line(id).start
  /** Fin de la réplique. */
  const E = (id) => line(id).start + line(id).dur
  /** Instant où le mot (le n-ième qui commence par `word`) est prononcé. */
  const W = (id, word, n = 0) => {
    const found = line(id).words.filter((w) => norm(w.w).startsWith(norm(word)))
    if (!found[n]) throw new Error(`Mot « ${word} » introuvable dans ${id}`)
    return found[n].t
  }
  const cut = (id) => S(id) - 0.12

  // Les sections (une par décor) et leurs coupes.
  const sections = [
    { id: 'feu', t0: 0, t1: cut('03') },
    { id: 'eau', t0: cut('03'), t1: cut('08') },
    { id: 'magnetron', t0: cut('08'), t1: cut('10') },
    { id: 'boite', t0: cut('10'), t1: cut('13') },
    { id: 'vitre', t0: cut('13'), t1: cut('15') },
    { id: 'plateau', t0: cut('15'), t1: cut('17') },
    { id: 'porte', t0: cut('17'), t1: cut('18') },
    { id: 'puissance', t0: cut('18'), t1: cut('19') },
    { id: 'bravo', t0: cut('19'), t1: tl.duration },
  ]
  // Le gros plan sur la grille (« 12 centimètres ») : une coupe dans la section « vitre ».
  const macro = cut('14')

  // Le champ électrique bascule une fois, puis de plus en plus vite.
  const flips = [W('05', 'basculer') + 0.15]
  const swarm = W('06', 'milliards') - 0.2
  for (let f = S('06') + 0.05, gap = 0.5; f < swarm; f += gap, gap = Math.max(0.09, gap * 0.72)) flips.push(f)

  // Demi-puissance : le magnétron marche ou s'arrête (d'après la voix, puis cycle régulier).
  const pw = { full: W('18', 'fort') - 0.1, on: W('18', 'sallume') - 0.05, off: W('18', 'seteint') - 0.05, on2: W('18', 'rallume') - 0.05 }
  const powerOn = (t) => {
    if (t < pw.on) return t >= pw.full - 0.05
    if (t < pw.off) return true
    if (t < pw.on2) return false
    return (t - pw.on2) % 1.4 < 0.7
  }

  const ding = E('19') + 0.5
  return { S, E, W, sections, macro, flips, swarm, pw, powerOn, ding, duration: tl.duration, lines: tl.lines }
}
