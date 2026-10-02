/** Le catalogue et les prix sont partagés ; le serveur décide des achats. */
export const SHOP_CATEGORIES = ['ambiance', 'piano', 'theme', 'mascot', 'cover', 'profile', 'palette'] as const
export type ShopCategory = typeof SHOP_CATEGORIES[number]
export const SHOP_CATEGORY_LABELS: Record<ShopCategory, string> = { ambiance: 'Ambiances', piano: 'Piano', theme: 'Thèmes', mascot: 'Minuton', cover: 'Couvertures', profile: 'Profil', palette: 'Palettes' }
export interface ShopItem {
  id: string
  category: ShopCategory
  title: string
  description: string
  price: number
  symbol: string
  colors: readonly string[]
  available: boolean
  difficulty?: string
  audio?: string
  composer?: string
  edition?: string
}
export const SHOP_ITEMS: readonly ShopItem[] = [
  { id: 'ambiance-aube', category: 'ambiance', title: 'Aube tranquille', description: 'Une composition originale aux notes douces, pour créer au calme.', price: 40, symbol: '🌅', colors: ['#FFC78A','#FFE6BA'], available: true, audio: '/music/shop-aube.mp3' },
  { id: 'ambiance-orbite', category: 'ambiance', title: 'Orbite', description: 'Une composition originale aux nappes spatiales et légères.', price: 60, symbol: '🪐', colors: ['#C1B3FF','#8CB8FF'], available: true, audio: '/music/shop-orbite.mp3' },
  { id: 'piano-lanterne', category: 'piano', title: 'La lanterne', description: 'Une petite mélodie originale à jouer note après note sur le clavier.', price: 50, symbol: '🎹', colors: ['#FFE6A7','#FFCC80'], available: true, difficulty: 'Débutant', audio: '/music/shop-lanterne.mp3' },
  { id: 'piano-constellation', category: 'piano', title: 'Constellation', description: 'Une mélodie originale en plusieurs phrases, pour travailler les déplacements.', price: 90, symbol: '✨', colors: ['#B6CDFF','#D8C8FF'], available: true, difficulty: 'Intermédiaire', audio: '/music/shop-constellation.mp3' },
  { id: 'piano-elise', category: 'piano', title: 'Lettre à Élise', composer: 'Beethoven', edition: 'Extrait guidé · adaptation à une main', description: 'Beethoven · un thème célèbre du domaine public, adapté note après note pour le clavier Scroll-up.', price: 160, symbol: '🌹', colors: ['#B6CDFF','#FFE6A7'], available: true, difficulty: 'Intermédiaire', audio: '/music/shop-elise.mp3' },
  { id: 'piano-joie', category: 'piano', title: 'Ode à la joie', composer: 'Beethoven', edition: 'Extrait guidé · adaptation à une main', description: 'Beethoven · un thème célèbre du domaine public, adapté note après note pour le clavier Scroll-up.', price: 100, symbol: '☀️', colors: ['#B6CDFF','#FFE6A7'], available: true, difficulty: 'Débutant', audio: '/music/shop-joie.mp3' },
  { id: 'piano-moonlight', category: 'piano', title: 'Sonate au clair de lune', composer: 'Beethoven', edition: 'Extrait guidé · adaptation à une main', description: 'Beethoven · un thème célèbre du domaine public, adapté note après note pour le clavier Scroll-up.', price: 180, symbol: '🌙', colors: ['#B6CDFF','#FFE6A7'], available: true, difficulty: 'Intermédiaire', audio: '/music/shop-moonlight.mp3' },
  { id: 'piano-canon', category: 'piano', title: 'Canon de Pachelbel', composer: 'Pachelbel', edition: 'Extrait guidé · adaptation à une main', description: 'Pachelbel · un thème célèbre du domaine public, adapté note après note pour le clavier Scroll-up.', price: 140, symbol: '🎼', colors: ['#B6CDFF','#FFE6A7'], available: true, difficulty: 'Débutant', audio: '/music/shop-canon.mp3' },
  { id: 'piano-bach-prelude', category: 'piano', title: 'Prélude en do majeur', composer: 'Bach', edition: 'Extrait guidé · adaptation à une main', description: 'Bach · un thème célèbre du domaine public, adapté note après note pour le clavier Scroll-up.', price: 160, symbol: '🎹', colors: ['#B6CDFF','#FFE6A7'], available: true, difficulty: 'Intermédiaire', audio: '/music/shop-bach-prelude.mp3' },
  { id: 'piano-gymnopedie', category: 'piano', title: 'Gymnopédie nº 1', composer: 'Satie', edition: 'Extrait guidé · adaptation à une main', description: 'Satie · un thème célèbre du domaine public, adapté note après note pour le clavier Scroll-up.', price: 140, symbol: '☁️', colors: ['#B6CDFF','#FFE6A7'], available: true, difficulty: 'Débutant', audio: '/music/shop-gymnopedie.mp3' },
  { id: 'piano-davy-jones', category: 'piano', title: 'Davy Jones', description: 'Retrouve la partition officielle de Hans Zimmer et entraîne-toi sur le clavier libre. Les notes guidées ne sont pas encore disponibles.', price: 0, symbol: '🏴‍☠️', colors: ['#BDD6D5','#D3E3DE'], available: false, difficulty: 'Clavier libre · partition externe' },
  { id: 'theme-crepuscule', category: 'theme', title: 'Crépuscule', description: 'Une palette pêche et prune qui habille toute l’application.', price: 120, symbol: '🌇', colors: ['#FFF0E6','#E68778','#A390CA'], available: true },
  { id: 'theme-jardin', category: 'theme', title: 'Jardin', description: 'Un fond crème et des accents verts pour une ambiance végétale.', price: 120, symbol: '🌿', colors: ['#EDF5E8','#77C5A1','#DCEAA7'], available: true },
  { id: 'mascot-beret', category: 'mascot', title: 'Minuton artiste', description: 'Un béret pour Minuton, visible sur l’accueil et dans ton profil.', price: 40, symbol: '🎨', colors: ['#FFA995','#FFE1A6'], available: true },
  { id: 'mascot-casque', category: 'mascot', title: 'Minuton mélomane', description: 'Un casque pour accompagner tes moments créatifs.', price: 60, symbol: '🎧', colors: ['#B2CFFF','#D6BEF5'], available: true },
  { id: 'cover-carnet', category: 'cover', title: 'Carnet d’artiste', description: 'Des rayures colorées pour les couvertures de tes projets sans photo.', price: 30, symbol: '📓', colors: ['#FFC778','#FF978D','#A4DACC'], available: true },
  { id: 'cover-vinyle', category: 'cover', title: 'Pochette vinyle', description: 'Un disque sur fond lavande pour les projets sans photo.', price: 40, symbol: '💿', colors: ['#D4C0F1','#2C2640'], available: true },
  { id: 'profile-etoiles', category: 'profile', title: 'Cadre étoilé', description: 'Un cadre et des étoiles autour de Minuton dans ton profil.', price: 30, symbol: '⭐', colors: ['#FFE7A3','#FFCA60'], available: true },
  { id: 'profile-fleurs', category: 'profile', title: 'Cadre fleuri', description: 'Un cadre végétal pour décorer ton profil.', price: 30, symbol: '🌸', colors: ['#DCECCB','#F7B9CA'], available: true },
  { id: 'palette-pastel', category: 'palette', title: 'Pastel', description: 'Six nouvelles couleurs disponibles sur la feuille de dessin.', price: 30, symbol: '🖌️', colors: ['#685D75','#F3A4B5','#A7C8F2','#AAD5B0','#F3D58E','#C8B2E8'], available: true },
  { id: 'palette-vintage', category: 'palette', title: 'Vintage', description: 'Six teintes chaudes pour tes prochains dessins.', price: 30, symbol: '🖌️', colors: ['#453D32','#B85C47','#548392','#81936D','#D2A450','#947784'], available: true },
  { id: 'palette-ocean', category: 'palette', title: 'Océan', description: 'Six couleurs coordonnées à utiliser directement sur ta feuille de dessin.', price: 45, symbol: '🖌️', colors: ['#183B56', '#2389A8', '#65C9CF', '#B4E8D8', '#F3E4BB', '#557AB5'], available: true },
  { id: 'palette-neon', category: 'palette', title: 'Néon', description: 'Six couleurs coordonnées à utiliser directement sur ta feuille de dessin.', price: 45, symbol: '🖌️', colors: ['#242044', '#ED5EC8', '#8B6DFF', '#47E3D0', '#D8FF68', '#FF9675'], available: true },
  { id: 'palette-terre', category: 'palette', title: 'Terre cuite', description: 'Six couleurs coordonnées à utiliser directement sur ta feuille de dessin.', price: 45, symbol: '🖌️', colors: ['#573B35', '#C77556', '#E5AC80', '#F0D8AD', '#8C9872', '#B39187'], available: true },
  { id: 'palette-sakura', category: 'palette', title: 'Sakura', description: 'Six couleurs coordonnées à utiliser directement sur ta feuille de dessin.', price: 45, symbol: '🖌️', colors: ['#594362', '#E58CAC', '#F7BDCB', '#D2B6E5', '#A9CDB8', '#FFE2B3'], available: true },
  { id: 'palette-foret', category: 'palette', title: 'Forêt', description: 'Six couleurs coordonnées à utiliser directement sur ta feuille de dessin.', price: 45, symbol: '🖌️', colors: ['#253B31', '#45775B', '#85A76B', '#C6D5A3', '#D4B77C', '#8A6A50'], available: true },
  { id: 'palette-bonbon', category: 'palette', title: 'Bonbon', description: 'Six couleurs coordonnées à utiliser directement sur ta feuille de dessin.', price: 45, symbol: '🖌️', colors: ['#704782', '#FF8BB0', '#FFBE85', '#FAE68C', '#8DDDCF', '#A6B7F5'], available: true },
  { id: 'palette-cosmos', category: 'palette', title: 'Cosmos', description: 'Six couleurs coordonnées à utiliser directement sur ta feuille de dessin.', price: 45, symbol: '🖌️', colors: ['#272642', '#5B4E9B', '#9581D1', '#D49EC4', '#80BAD5', '#F4CD87'], available: true },
  { id: 'palette-monochrome', category: 'palette', title: 'Graphite', description: 'Six couleurs coordonnées à utiliser directement sur ta feuille de dessin.', price: 45, symbol: '🖌️', colors: ['#20232B', '#444957', '#6C7280', '#979CA7', '#C9CDD4', '#F1F2F5'], available: true },
  { id: 'cover-ocean', category: 'cover', title: 'Vagues océanes', description: 'Une couverture illustrée pour personnaliser tes projets sans photo.', price: 45, symbol: '📓', colors: ['#70C8D1', '#256880', '#D2EEE6'], available: true },
  { id: 'cover-sakura', category: 'cover', title: 'Carnet Sakura', description: 'Une couverture illustrée pour personnaliser tes projets sans photo.', price: 45, symbol: '📓', colors: ['#F3BDCE', '#C49BD5', '#FFE6CE'], available: true },
  { id: 'cover-cosmos', category: 'cover', title: 'Carnet cosmique', description: 'Une couverture illustrée pour personnaliser tes projets sans photo.', price: 45, symbol: '📓', colors: ['#8E8BD5', '#D4B1E7', '#ACE0E8'], available: true },
  { id: 'cover-soleil', category: 'cover', title: 'Carnet solaire', description: 'Une couverture illustrée pour personnaliser tes projets sans photo.', price: 45, symbol: '📓', colors: ['#FFD281', '#EB967A', '#FFF0BD'], available: true },
  { id: 'cover-foret', category: 'cover', title: 'Carnet botanique', description: 'Une couverture illustrée pour personnaliser tes projets sans photo.', price: 45, symbol: '📓', colors: ['#95BEA0', '#D6DDA2', '#6A9484'], available: true },
  { id: 'cover-neon', category: 'cover', title: 'Carnet électrique', description: 'Une couverture illustrée pour personnaliser tes projets sans photo.', price: 45, symbol: '📓', colors: ['#B69AF4', '#71DCCF', '#F2A7D4'], available: true },
]
export function getShopItem(id: string): ShopItem | undefined { return SHOP_ITEMS.find((item) => item.id === id) }
export interface ShopState {
  /** Crédit de test distinct des minutons gagnés avec les activités. */
  bonus?: number
  canClaimTestCredit?: boolean
  earned: number
  spent: number
  balance: number
  owned: string[]
  equipped: Partial<Record<ShopCategory, string>>
}
