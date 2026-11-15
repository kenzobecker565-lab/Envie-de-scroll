/**
 * Instants clés du « Contrôleur » (Manon, 15 ans, débarquée du train la nuit), calculés à
 * partir de timeline.json (écrit par voix.py). Partagés par l'image (main.js) et
 * le son (audio.mjs).
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
  const sections = [
    { id: 'hook', t0: 0, t1: cut('04') },
    { id: 'tribunal', t0: cut('04'), t1: cut('13'), cut: 'wipe' },
    { id: 'vote', t0: cut('13'), t1: tl.duration, cut: 'wipe' },
  ]

  // Le hook (cases BD) : le visage du harceleur, beaucoup trop près ; les yeux de Léa ;
  // sa main sur la barre ; « ma belle » ; Moussa : « Toi. Tu descends. » ; la poussée ;
  // le quai. Puis le replay (le wagon, les 40 passagers, Moussa, la chute, la radio), le jugement.
  const hook = {
    F1: W('01', 'fais') - 0.1, // les yeux de Léa
    F3: W('01', 'souris') - 0.1, // la main sur la barre
    F4: W('01', 'ma') - 0.12, // « ma belle » : les visages se referment
    MOUSSA: S('01b') - 0.02, // CLAP : la main de Moussa sur son épaule
    PUSH: E('01b') + 0.05, // les portes, la poussée
  }
  hook.F2 = hook.F1 + 0.45 // retour sur lui, encore plus près
  hook.FALL = hook.PUSH + 0.35 // le quai
  hook.REPLAY = S('02') + 0.1
  hook.REWIND = hook.REPLAY - 0.45
  hook.LEA = W('02', 'lea') - 0.12
  hook.FORTY = W('02', 'quarante') - 0.1
  hook.SAUF = W('02', 'sauf') - 0.1
  hook.PUSHR = S('03') - 0.08
  hook.SKULL = W('03', 'lhomme') - 0.1
  hook.TODAY = W('03', 'aujourd') - 0.12
  hook.GAVEL = W('03', 'juge') - 0.1

  // Les piques : fond rouge, coup de zoom, la musique se tait.
  const hot = [
    [W('05', 'quatre') - 0.1, E('05') + 0.15],
    [W('07', 'vous') - 0.1, E('07') + 0.1],
    [W('09', 'il', 1) - 0.1, E('09') + 0.1],
  ]
  // « Et c'est lui que vous jugez. » : la musique se tait jusqu'au vote.
  const impact = W('12', 'et') - 0.15

  // Signature de la marque (proces/marque.mjs) : après « Coupable… ou non coupable ? ».
  const signature = W('13', 'coupable', 1) + 0.4
  return { S, E, W, has, line, sections, hook, hot, impact, signature, duration: tl.duration, lines: tl.lines }
}
