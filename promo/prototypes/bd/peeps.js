/**
 * Assemble un personnage Open Peeps (Pablo Stanley, CC0) en SVG, comme le
 * composant Effigy du paquet @opeepsfun/open-peeps : corps, tête (coiffure,
 * visage, barbe) aux mêmes positions. `colors` remplit les couleurs (%nom%).
 */
const NS = 'http://www.w3.org/2000/svg'
const DEFAULTS = { outlineColor: '#141414', skinColor: '#f2c8a2', hairColor: '#2b2b2b', beardColor: '#2b2b2b', topColor: '#ffffff', blazerColor: '#22252e', jacketColor: '#c43a2f', pocketColor: '#ffffff', paperColor: '#ffffff', clipColor: '#888', computerColor: '#ddd', cupColor: '#fff', capColor: '#333', beanieColor: '#333', hijabColor: '#333', turbanColor: '#333', knifeColor: '#ccc' }

export function piece(lib, key, colors) {
  const p = lib.parts[key]
  if (!p) return ''
  return p.svg.replace(/%(\w+)%/g, (_, n) => colors[n] ?? DEFAULTS[n] ?? '#000')
}

/** Renvoie un <svg> (viewBox de l'Effigy) ; les groupes nommés permettent d'animer la tête. */
export function peep(lib, { body, head, face, beard = null, colors = {} }) {
  const c = { ...DEFAULTS, ...colors }
  const ho = lib.headOffset[body] ?? [0, 0]
  const hr = lib.hairOffset[head] ?? [0, 0]
  const el = document.createElementNS(NS, 'svg')
  el.setAttribute('viewBox', '184 210 940 1130')
  el.setAttribute('overflow', 'visible')
  el.innerHTML = `<g class="bust">
    <g class="body" transform="translate(147 639)">${piece(lib, 'body/' + body, c)}</g>
    <g class="headwrap" transform="translate(${ho[0]} ${ho[1]})"><g class="head">
      <g transform="translate(${342 + hr[0]} ${190 + hr[1]})">${piece(lib, 'head/' + head, c)}</g>
      <g class="face" transform="translate(531 366)">${piece(lib, 'face/' + face, c)}</g>
      ${beard ? `<g transform="translate(495 518)">${piece(lib, 'beard/' + beard, c)}</g>` : ''}
    </g></g>
  </g>`
  return el
}
