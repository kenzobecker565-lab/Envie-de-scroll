/**
 * Instants clés du casse n°1, calculés à partir de timeline.json (écrit
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

  // Les scènes (pour le son et la marque) : l'accroche, le récit du casse, la fin.
  const sections = [
    { id: 'accroche', t0: 0, t1: cut('03') },
    { id: 'recit', t0: cut('03'), t1: cut('09'), cut: 'wipe' },
    { id: 'vote', t0: cut('09'), t1: tl.duration, cut: 'flash' },
  ]
  const gavel = []
  const balance = []
  // La signature de la marque apparaît sur « Et toi… ».
  const signature = W('09', 'et') + 0.2
  return { S, E, W, line, sections, gavel, balance, signature, duration: tl.duration, lines: tl.lines }
}
