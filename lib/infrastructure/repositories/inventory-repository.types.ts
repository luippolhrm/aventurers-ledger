/**
 * Tipos y interfaces para InventoryRepository
 */

export interface InventoryItem {
  id: string
  character_id: string
  item_name: string
  item_type: string
  item_category?: string | null
  quantity: number
  weight: number
  value_in_copper: number
  description: string | null
  equipped: boolean
  equipped_slot: string | null
  equippable_slot: string | null
  container_id: string | null
  is_container: boolean
  container_capacity: number
  // Effect fields
  wondrous_type?: string | null
  effect_dice?: string | null
  effect_type?: string | null
  effect_target?: string | null
  spell_level?: number | null
  spell_name?: string | null
  spell_school?: string | null
  effect_description?: string | null
  // Combat stats
  damage_dice?: string | null
  damage_type?: string | null
  armor_class?: number | null
  // Weapon properties (D&D 2024)
  weapon_mastery?: string | null
  properties?: string[] | null // Array de propiedades: versatile, finesse, two-handed, light, heavy, reach, ranged, thrown, ammunition, loading
  damage_dice_versatile?: string | null // Daño cuando se usa con 2 manos (solo armas versatile)
  versatile_usage?: "one-handed" | "two-handed" | null // Uso explícito del arma versátil
  weapon_range_normal?: number | null // Rango normal en pies
  weapon_range_long?: number | null // Rango largo en pies
  // Attunement
  attunement?: boolean | null
  created_at?: string
  updated_at?: string | null
}

export type CreateInventoryItem = Omit<
  InventoryItem,
  "id" | "created_at" | "updated_at"
>

export type UpdateInventoryItem = Partial<
  Omit<InventoryItem, "id" | "character_id" | "created_at" | "updated_at">
>

