/** Stable account-scoped discovery flags; independent of the welcome tutorial. */
export const DISCOVERY_GUIDES=['explorer','passion','practice','learning','lesson','gallery','notebook','exhibition','shop','profile'] as const
export type DiscoveryGuide=typeof DISCOVERY_GUIDES[number]
export function isDiscoveryGuide(value:unknown):value is DiscoveryGuide{return typeof value==='string'&&(DISCOVERY_GUIDES as readonly string[]).includes(value)}
export function parseDiscoveryGuides(value:unknown):DiscoveryGuide[]{
 try{const raw=typeof value==='string'?JSON.parse(value):value;return Array.isArray(raw)?[...new Set(raw.filter(isDiscoveryGuide))]:[]}catch{return []}
}
