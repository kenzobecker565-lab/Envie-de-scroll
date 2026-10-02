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
}
export const SHOP_ITEMS: readonly ShopItem[] = [
  { id: 'ambiance-aube', category: 'ambiance', title: 'Aube tranquille', description: 'Une composition originale aux notes douces, pour créer au calme.', price: 40, symbol: '🌅', colors: ['#FFC78A','#FFE6BA'], available: true, audio: '/music/shop-aube.mp3' },
  { id: 'ambiance-orbite', category: 'ambiance', title: 'Orbite', description: 'Une composition originale aux nappes spatiales et légères.', price: 60, symbol: '🪐', colors: ['#C1B3FF','#8CB8FF'], available: true, audio: '/music/shop-orbite.mp3' },
  { id: 'piano-lanterne', category: 'piano', title: 'La lanterne', description: 'Une petite mélodie originale à jouer note après note sur le clavier.', price: 50, symbol: '🎹', colors: ['#FFE6A7','#FFCC80'], available: true, difficulty: 'Débutant', audio: '/music/shop-lanterne.mp3' },
  { id: 'piano-constellation', category: 'piano', title: 'Constellation', description: 'Une mélodie originale en plusieurs phrases, pour travailler les déplacements.', price: 90, symbol: '✨', colors: ['#B6CDFF','#D8C8FF'], available: true, difficulty: 'Intermédiaire', audio: '/music/shop-constellation.mp3' },
  { id: 'piano-davy-jones', category: 'piano', title: 'Davy Jones', description: 'Le thème de Pirates des Caraïbes. En attente d’autorisation pour le clavier guidé : aucun minuton ne sera débité.', price: 0, symbol: '🏴‍☠️', colors: ['#BDD6D5','#D3E3DE'], available: false, difficulty: 'À confirmer' },
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
]
export function getShopItem(id: string): ShopItem | undefined { return SHOP_ITEMS.find((item) => item.id === id) }
export interface ShopState {
  earned: number
  spent: number
  balance: number
  owned: string[]
  equipped: Partial<Record<ShopCategory, string>>
}
