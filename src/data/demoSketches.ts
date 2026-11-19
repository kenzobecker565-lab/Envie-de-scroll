/**
 * Trois « croquis » au format SVG, utilisés comme photos de démonstration
 * dans la galerie de dessin. Ils sont stockés comme de vraies images dans la
 * base (au même titre qu'une photo prise avec le téléphone).
 */

const PAPER = `
  <rect width="400" height="300" fill="#FBF6EC"/>
  <g stroke="#DCE5F0" stroke-width="1">
    <path d="M0 50H400M0 80H400M0 110H400M0 140H400M0 170H400M0 200H400M0 230H400M0 260H400"/>
  </g>
  <path d="M34 0V300" stroke="#F2C4B8" stroke-width="1.2"/>`

const PENCIL = 'fill="none" stroke="#3B3330" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"'

/** Croquis express : quatre objets du bureau, tracés d'un seul trait. */
export const SKETCH_OBJECTS = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 300">${PAPER}
  <g ${PENCIL}>
    <path d="M50 125 Q48 178 60 196 Q84 207 104 196 Q114 178 112 125 Q81 116 50 125 Z"/>
    <path d="M112 142 Q136 144 134 162 Q131 180 110 178"/>
    <path d="M62 104 Q55 92 63 82 M80 104 Q74 90 82 76 M97 104 Q91 92 99 82"/>
    <circle cx="168" cy="160" r="19"/>
    <circle cx="168" cy="160" r="6"/>
    <path d="M187 160 H246 M230 160 V173 M241 160 V170"/>
    <path d="M262 200 H330 M296 200 Q284 176 292 158 L302 124"/>
    <path d="M284 124 L322 124 L311 96 L295 96 Z"/>
    <path d="M343 170 L349 200 H379 L385 170 Z M364 170 Q358 140 346 131 M364 170 Q368 140 382 129 M364 170 V136"/>
  </g>
  <path d="M60 238 Q130 228 200 240 T340 236" fill="none" stroke="#E4572E" stroke-width="2" stroke-linecap="round"/>
</svg>`

/** Le monstre du stress, avec son chapeau ridicule et ses chaussettes dépareillées. */
export const SKETCH_MONSTER = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 300">${PAPER}
  <path d="M132 232 Q112 152 152 112 Q200 74 250 112 Q290 152 270 232 Q200 250 132 232 Z" fill="#BFDDB0" ${PENCIL.replace('fill="none" ', '')}/>
  <g stroke="#7FA873" stroke-width="1.6" stroke-linecap="round">
    <path d="M150 200 L162 188 M156 214 L172 198 M166 222 L182 206 M240 206 L252 194 M246 220 L260 206"/>
  </g>
  <circle cx="176" cy="146" r="15" fill="#fff" stroke="#3B3330" stroke-width="2.4"/>
  <circle cx="180" cy="149" r="6" fill="#3B3330"/>
  <circle cx="226" cy="140" r="10" fill="#fff" stroke="#3B3330" stroke-width="2.4"/>
  <circle cx="224" cy="142" r="4" fill="#3B3330"/>
  <path d="M170 186 L182 178 L194 188 L206 178 L218 188 L230 179" ${PENCIL}/>
  <path d="M190 97 L205 56 L221 94 Z" fill="#F2B632" stroke="#3B3330" stroke-width="2.4" stroke-linejoin="round"/>
  <circle cx="205" cy="53" r="7" fill="#E4572E" stroke="#3B3330" stroke-width="2"/>
  <path d="M133 172 Q104 162 94 140 M268 170 Q298 166 310 146" ${PENCIL}/>
  <path d="M170 238 V256 M234 238 V256" ${PENCIL}/>
  <path d="M160 254 H180 V272 H152 Q148 262 160 262 Z" fill="#9B5DE5" stroke="#3B3330" stroke-width="2.2" stroke-linejoin="round"/>
  <path d="M224 254 H244 V272 H252 Q256 262 244 262" fill="none" stroke="#3B3330" stroke-width="2.2"/>
  <rect x="224" y="254" width="20" height="18" fill="#13A89E" stroke="#3B3330" stroke-width="2.2"/>
  <path d="M224 260 H244 M224 266 H244" stroke="#FBF6EC" stroke-width="2"/>
</svg>`

/** Nature morte au ralenti : une pomme, une tasse et un livre, avec hachures. */
export const SKETCH_STILL_LIFE = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 300">${PAPER}
  <ellipse cx="190" cy="252" rx="150" ry="12" fill="#E9E1D4"/>
  <path d="M70 222 L262 222 L262 248 L70 248 Z" fill="#EAD8C1" ${PENCIL.replace('fill="none" ', '')}/>
  <path d="M70 222 L90 206 L282 206 L262 222 M262 248 L282 232 L282 206" ${PENCIL}/>
  <path d="M78 230 H254 M78 238 H254" stroke="#C9B399" stroke-width="1.4"/>
  <path d="M146 206 Q108 206 108 172 Q108 142 138 142 Q148 146 153 144 Q168 138 183 147 Q198 162 188 192 Q178 208 160 206 Q152 203 146 206 Z" fill="#EE9270" ${PENCIL.replace('fill="none" ', '')}/>
  <path d="M152 144 Q154 128 162 120" ${PENCIL}/>
  <path d="M156 131 Q169 119 180 127 Q169 137 156 131 Z" fill="#9BCB7A" stroke="#3B3330" stroke-width="2"/>
  <g stroke="#B85B3E" stroke-width="1.4" stroke-linecap="round">
    <path d="M168 196 L182 182 M160 200 L182 178 M174 198 L186 186"/>
  </g>
  <path d="M218 206 L212 150 L266 150 L260 206 Z" fill="#FFFDF8" ${PENCIL.replace('fill="none" ', '')}/>
  <path d="M266 160 Q288 162 286 178 Q284 194 262 192" ${PENCIL}/>
  <path d="M212 150 Q239 142 266 150" ${PENCIL}/>
  <g stroke="#8E857E" stroke-width="1.3" stroke-linecap="round">
    <path d="M246 200 L258 186 M238 202 L259 178 M250 203 L260 192"/>
  </g>
</svg>`
