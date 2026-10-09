import type { LinkKind } from '@scroll-up/shared'

/** Un lien vers une recherche (YouTube, Spotify, Deezer, JustWatch, images). */
export interface ExternalLink {
  label: string
  url: string
  kind: 'video' | 'audio' | 'watch' | 'image'
}

/** « Parasite (2019) » → « Parasite 2019 » ; « Kind of Blue — Miles Davis » → « Kind of Blue Miles Davis ». */
export function searchQuery(text: string, suffix?: string): string {
  const base = text.replace(/[()—,]/g, ' ').replace(/\b(court-métrage|série)\b/g, ' ').replace(/\s+/g, ' ').trim()
  return suffix ? `${base} ${suffix}` : base
}

const youtube = (query: string) => `https://www.youtube.com/results?search_query=${encodeURIComponent(query)}`

/** Les liens pour écouter, regarder ou voir une idée. */
export function linksFor(kind: LinkKind, item: string, suffix?: string): ExternalLink[] {
  const query = searchQuery(item, suffix)
  switch (kind) {
    case 'ecoute':
      return [
        { label: 'YouTube', url: youtube(query), kind: 'video' },
        { label: 'Spotify', url: `https://open.spotify.com/search/${encodeURIComponent(query)}`, kind: 'audio' },
        { label: 'Deezer', url: `https://www.deezer.com/search/${encodeURIComponent(query)}`, kind: 'audio' },
      ]
    case 'film':
      return [
        { label: 'Bande-annonce', url: youtube(`${query} bande-annonce`), kind: 'video' },
        { label: 'Où le voir', url: `https://www.justwatch.com/fr/recherche?q=${encodeURIComponent(searchQuery(item.replace(/\(.*\)/, '')))}`, kind: 'watch' },
      ]
    case 'regarder':
      return [
        { label: 'Sur YouTube', url: youtube(query), kind: 'video' },
        { label: 'Où le voir', url: `https://www.justwatch.com/fr/recherche?q=${encodeURIComponent(searchQuery(item.replace(/\(.*\)/, '').replace(/^Le premier épisode d[e’]\s*/, '')))}`, kind: 'watch' },
      ]
    case 'video':
      return [{ label: 'Sur YouTube', url: youtube(query), kind: 'video' }]
    case 'image':
      return [{ label: 'Voir des images', url: `https://www.google.com/search?tbm=isch&q=${encodeURIComponent(query)}`, kind: 'image' }]
  }
}
