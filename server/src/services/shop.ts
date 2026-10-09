import { createHash } from 'node:crypto'
import { CLASSIC_MELODIES, getShopItem, melody, SHOP_CATEGORIES, type ShopCategory, type ShopState } from '@scroll-up/shared'
import type { PrismaClient } from '../db.ts'
import { isAdmin } from './feedback.ts'
import { ApiError, badRequest } from '../http/errors.ts'

export async function getShop(prisma: PrismaClient, userId: bigint, admins: readonly string[] = []): Promise<ShopState> {
  const [user, coins, purchases] = await Promise.all([
    prisma.user.findUniqueOrThrow({ where: { id: userId } }),
    prisma.completion.aggregate({ where: { userId }, _sum: { coins: true } }),
    prisma.shopPurchase.findMany({ where: { userId } }),
  ])
  const earned = coins._sum.coins ?? 0
  const owned = purchases.map((purchase) => purchase.itemId)
  let equipped: ShopState['equipped'] = {}
  try {
    const raw = JSON.parse(user.shopEquipment) as Record<string, unknown>
    equipped = Object.fromEntries(SHOP_CATEGORIES.flatMap((category) => {
      const id = raw[category]
      return typeof id === 'string' && owned.includes(id) && getShopItem(id)?.category === category ? [[category, id]] : []
    }))
  } catch { /* Un ancien profil sans équipement conserve les réglages gratuits. */ }
  return { earned, bonus: user.shopBonus, canClaimTestCredit: !user.shopTestCreditClaimed && await isAdmin(prisma, admins, userId), spent: user.coinsSpent, balance: Math.max(0, earned + user.shopBonus - user.coinsSpent), owned, equipped }
}

export async function buyItem(prisma: PrismaClient, userId: bigint, id: unknown, admins: readonly string[] = []): Promise<ShopState> {
  const item = typeof id === 'string' ? getShopItem(id) : undefined
  if (!item) throw badRequest('Objet inconnu.')
  if (item.redemptionOnly) throw badRequest('Cette tenue se débloque uniquement avec un code.')
  if (!item.available) throw badRequest(item.category === 'mascot' ? 'Cette tenue ne fait plus partie de la boutique. Tes tenues déjà achetées restent disponibles dans Mes achats.' : 'Ce morceau attend encore son autorisation. Aucun achat possible.')
  try {
    await prisma.$transaction(async (tx) => {
      if (await tx.shopPurchase.findUnique({ where: { userId_itemId: { userId, itemId: item.id } } })) return
      const earned = (await tx.completion.aggregate({ where: { userId }, _sum: { coins: true } }))._sum.coins ?? 0
      const user = await tx.user.findUniqueOrThrow({ where: { id: userId } })
      // Débit conditionnel, prix choisi côté serveur et achat dans la même transaction.
      const debit = await tx.user.updateMany({ where: { id: userId, coinsSpent: { lte: earned + user.shopBonus - item.price } }, data: { coinsSpent: { increment: item.price } } })
      if (debit.count !== 1) throw new ApiError(409, 'invalid_request', 'Tu n’as pas encore assez de minutons disponibles.')
      await tx.shopPurchase.create({ data: { userId, itemId: item.id, price: item.price } })
      if (item.category === 'theme') {
        const user = await tx.user.findUniqueOrThrow({ where: { id: userId } })
        const equipment = JSON.parse(user.shopEquipment) as Record<string, string>
        equipment.theme = item.id
        await tx.user.update({ where: { id: userId }, data: { shopEquipment: JSON.stringify(equipment) } })
      }
    })
  } catch (error) {
    // Deux requêtes pour le même objet : la contrainte unique annule le second débit.
    if (!(typeof error === 'object' && error !== null && 'code' in error && error.code === 'P2002')) throw error
  }
  return getShop(prisma, userId, admins)
}

export async function equipItem(prisma: PrismaClient, userId: bigint, category: unknown, id: unknown, admins: readonly string[] = []): Promise<ShopState> {
  if (!SHOP_CATEGORIES.includes(category as ShopCategory)) throw badRequest('Catégorie inconnue.')
  if (category === 'piano') throw badRequest('Un morceau se joue depuis la bibliothèque.')
  if (id !== null && typeof id !== 'string') throw badRequest('Objet inconnu.')
  await prisma.$transaction(async (tx) => {
    const user = await tx.user.findUniqueOrThrow({ where: { id: userId } })
    if (id !== null) {
      const item = getShopItem(id as string)
      if (!item || (!item.available && item.category !== 'mascot') || item.category !== category || !(await tx.shopPurchase.findUnique({ where: { userId_itemId: { userId, itemId: item.id } } }))) throw new ApiError(403, 'unauthorized', 'Débloque cet objet avant de l’utiliser.')
    }
    const equipped = JSON.parse(user.shopEquipment) as Record<string, string>
    if (id === null) delete equipped[category as string]
    else equipped[category as string] = id as string
    await tx.user.update({ where: { id: userId }, data: { shopEquipment: JSON.stringify(equipped) } })
  })
  return getShop(prisma, userId, admins)
}

// Compositions originales et adaptations classiques Scroll-up, distinctes des leçons gratuites.
const BONUS_MELODIES = {
  ...CLASSIC_MELODIES,
  'piano-lanterne': melody('La lanterne', 'C4 E4 G4 E4 | D4 F4 A4 F4 | E4 G4 C5 B4 | A4 G4 E4 C4 || C4 D4 E4 G4 | A4 G4 F4 E4 | D4 E4 G4 D4 | E4 D4 C4'),
  'piano-constellation': melody('Constellation', 'A3 E4 A4 B4 | C5 B4 A4 E4 | F4 A4 C5 A4 | G4 B4 D5 B4 || E4 G4 B4 E5 | D5 B4 A4 G4 | F4 E4 D4 E4 | A4 E4 C4 A3 || A4 C5 E5 C5 | G4 B4 D5 B4 | F4 A4 C5 E4 | B3 E4 A4 A3'),
}
export async function bonusMelody(prisma: PrismaClient, userId: bigint, id: string) {
  if (!(id in BONUS_MELODIES)) throw badRequest('Morceau indisponible.')
  if (!(await prisma.shopPurchase.findUnique({ where: { userId_itemId: { userId, itemId: id } } }))) throw new ApiError(403, 'unauthorized', 'Débloque ce morceau avant de le jouer.')
  return BONUS_MELODIES[id as keyof typeof BONUS_MELODIES]
}

/** Un seul crédit de 10 000 pour le compte admin authentifié, montant imposé côté serveur. */
export async function claimShopTestCredit(prisma: PrismaClient, userId: bigint, admins: readonly string[] = []): Promise<ShopState> {
  if (!(await isAdmin(prisma, admins, userId))) throw new ApiError(403, 'unauthorized', 'Ce crédit de test est réservé au compte administrateur.')
  await prisma.user.updateMany({ where: { id: userId, shopTestCreditClaimed: false }, data: { shopTestCreditClaimed: true, shopBonus: { increment: 10_000 } } })
  return getShop(prisma, userId, admins)
}

// Les codes restent côté serveur ; le client ne reçoit jamais la liste des codes.
const SKIN_CODES: Readonly<Record<string, string>> = {
  '8de38b9402d05ba561c6f5dd48a7d0a14c771fba26a1b86eaf48dca47921f5ed': 'mascot-testers-explorer',
  'bea9f4846c575907ba628ad8f4262611bb12082975fc473e403cacfbef0997db': 'mascot-private-maradona',
  '9253f1476e7c805ac1a0331ec2c4aea286d299412a1156fcb3bae77f98e5083e': 'mascot-private-poney',
}

/** Un code partagé peut offrir la même tenue à plusieurs comptes, sans débit. */
export async function redeemSkinCode(prisma: PrismaClient, userId: bigint, code: unknown, admins: readonly string[] = []): Promise<ShopState & { redeemedItemId: string }> {
  if (typeof code !== 'string' || code.trim().length < 1 || code.trim().length > 64) throw badRequest('Saisis un code valide.')
  const itemId = SKIN_CODES[createHash('sha256').update(code.trim()).digest('hex')]
  const item = itemId ? getShopItem(itemId) : undefined
  if (!item?.redemptionOnly) throw badRequest('Ce code n’est pas reconnu. Vérifie-le et réessaie.')
  await prisma.shopPurchase.upsert({ where: { userId_itemId: { userId, itemId: item.id } }, create: { userId, itemId: item.id, price: 0 }, update: {} })
  return { ...await getShop(prisma, userId, admins), redeemedItemId: item.id }
}
