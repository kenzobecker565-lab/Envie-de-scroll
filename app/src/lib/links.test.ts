import { describe, expect, it } from 'vitest'
import { linksFor, searchQuery } from './links.ts'

describe('liens pour écouter ou regarder une idée', () => {
  it('nettoie la recherche', () => {
    expect(searchQuery('Kind of Blue — Miles Davis (1959)')).toBe('Kind of Blue Miles Davis 1959')
    expect(searchQuery('Paperman (court-métrage, 2012)')).toBe('Paperman 2012')
    expect(searchQuery('Manga', 'dessin')).toBe('Manga dessin')
  })

  it('propose YouTube, Spotify et Deezer pour écouter ; bande-annonce et JustWatch pour un film', () => {
    expect(linksFor('ecoute', 'Getz/Gilberto — Stan Getz').map((link) => link.label)).toEqual(['YouTube', 'Spotify', 'Deezer'])
    const film = linksFor('film', 'Parasite (2019)')
    expect(film.map((link) => link.label)).toEqual(['Bande-annonce', 'Où le voir'])
    expect(film[0]!.url).toContain('bande-annonce')
    expect(film[1]!.url).toBe('https://www.justwatch.com/fr/recherche?q=Parasite')
    expect(linksFor('regarder', 'Le premier épisode de Cowboy Bebop')[1]!.url).toContain('q=Cowboy%20Bebop')
    expect(linksFor('image', 'Hokusai', 'illustration')[0]!.url).toContain('tbm=isch')
  })
})
