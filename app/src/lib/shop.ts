import { getShopItem, type ShopCategory } from '@scroll-up/shared'
import { useAppState } from '../state/AppState.tsx'

export function useShop() {
  const { state } = useAppState()
  const earned = state.me.stats.totalCoins
  const shop = state.me.shop
  return { earned, spent: shop?.spent ?? 0, balance: Math.max(0, earned - (shop?.spent ?? 0)), owned: shop?.owned ?? [], equipped: shop?.equipped ?? {} }
}
export function useEquipped(category: ShopCategory) {
  const shop = useShop()
  const id = shop.equipped[category]
  return id ? getShopItem(id) : undefined
}
