import { describe, expect, it } from 'vitest'
import { fr } from './typography'

const NBSP = ' '

describe('fr (typographie française)', () => {
  it('rend insécable l’espace avant ? ! : ;', () => {
    expect(fr('Ça va ? Oui ! Note : 5 ; fin')).toBe(`Ça va${NBSP}? Oui${NBSP}! Note${NBSP}: 5${NBSP}; fin`)
  })

  it('protège l’intérieur des guillemets', () => {
    expect(fr('les « pages du matin »')).toBe(`les «${NBSP}pages du matin${NBSP}»`)
  })

  it('ne touche pas au reste du texte', () => {
    expect(fr('21:14, http://exemple.fr et l’heure')).toBe('21:14, http://exemple.fr et l’heure')
  })
})
