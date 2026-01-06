/**
 * Tipos y interfaces para ShoppingCartRepository
 */

export interface ShoppingCart {
  id: string
  character_id: string
  shop_id: string
  created_at: string
  updated_at: string
}

export interface ShoppingCartItem {
  id: string
  cart_id: string
  shop_item_id: string
  quantity: number
  created_at: string
  updated_at: string
}

export interface ShoppingCartItemWithShopItem extends ShoppingCartItem {
  shop_item?: {
    id: string
    item_name: string
    item_type: string | null
    description: string | null
    price_in_copper: number
    weight: number
    quantity_available: number
    image_url?: string | null
    rarity?: string | null
    item_category?: string | null
  }
}

export interface CartWithItems extends ShoppingCart {
  items: ShoppingCartItemWithShopItem[]
}

export type CreateShoppingCart = Omit<ShoppingCart, "id" | "created_at" | "updated_at">

export type CreateShoppingCartItem = Omit<ShoppingCartItem, "id" | "created_at" | "updated_at">

export type UpdateShoppingCartItem = Partial<Pick<ShoppingCartItem, "quantity">>

