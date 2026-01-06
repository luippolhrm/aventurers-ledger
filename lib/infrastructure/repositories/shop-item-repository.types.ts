/**
 * Tipos y interfaces para ShopItemRepository
 */

export interface ShopItem {
  id: string
  shop_id: string
  item_name: string
  item_type: string | null
  description: string | null
  price_in_copper: number
  weight: number
  quantity_available: number
  image_url?: string | null
  rarity?: string | null
  item_category?: string | null
  created_at: string
  updated_at: string | null
}

export type CreateShopItem = Omit<ShopItem, "id" | "created_at" | "updated_at">

export type UpdateShopItem = Partial<Omit<ShopItem, "id" | "shop_id" | "created_at" | "updated_at">>

