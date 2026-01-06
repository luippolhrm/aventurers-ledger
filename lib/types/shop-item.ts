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
  // New fields for dynamic effects
  equippable_slot?: string
  wondrous_type?: string
  effect_dice?: string
  effect_type?: string
  effect_target?: string
  spell_level?: number
  spell_name?: string
  spell_school?: string
  effect_description?: string
}

