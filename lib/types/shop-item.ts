/**
 * Type definition for shop items
 */

export interface ShopItemExtended {
  item_name: string
  item_type: string | null
  description: string | null
  price_in_copper: number
  weight: number
  quantity_available: number
  image_url?: string
  rarity?: 'common' | 'uncommon' | 'rare' | 'very_rare' | 'legendary' | 'artifact'
  item_category?: string
  damage_dice?: string
  damage_type?: string
  armor_class?: number
  properties?: string[]
  requirements?: string
  attunement?: boolean
  original_name_en?: string
  source?: 'manual'
}

