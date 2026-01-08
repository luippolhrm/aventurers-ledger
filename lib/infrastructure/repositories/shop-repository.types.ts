/**
 * Tipos y interfaces para ShopRepository
 */

export interface Shop {
  id: string
  name: string
  description: string | null
  location_id: string
  shopkeeper_name: string | null
  shop_type: string | null
  created_at: string
  updated_at: string | null
}

export interface ShopWithLocation extends Shop {
  location?: {
    id: string
    name: string
    description: string | null
    campaign_id: string
  }
}

export type CreateShop = Omit<Shop, "id" | "created_at" | "updated_at">

export type UpdateShop = Partial<Omit<Shop, "id" | "created_at" | "updated_at">>

