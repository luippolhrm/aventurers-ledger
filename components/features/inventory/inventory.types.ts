/**
 * Tipos y constantes compartidas para el sistema de inventario
 */

// Slots corporales (items individuales, NO contenedores)
export const BODY_SLOTS = [
  "head",
  "neck",
  "shoulders",
  "body",
  "hands",
  "waist",
  "ring_left",
  "ring_right",
  "feet",
  "weapon_main",
  "weapon_off",
] as const

// Slots de contenedores (pueden almacenar items)
export const CONTAINER_SLOTS = ["backpack", "pouch_left", "pouch_right"] as const

// Tipos de items que pueden equiparse en slots corporales
export const EQUIPPABLE_ITEM_TYPES = ["weapon", "armor", "equipment", "wondrous"] as const

// Tipos TypeScript
export type BodySlot = (typeof BODY_SLOTS)[number]
export type ContainerSlot = (typeof CONTAINER_SLOTS)[number]
export type EquippableItemType = (typeof EQUIPPABLE_ITEM_TYPES)[number]

// Mapeo de slot keys (snake_case) a translation keys (camelCase)
export const SLOT_TO_TRANSLATION_KEY: Record<string, string> = {
  ring_left: "ringLeft",
  ring_right: "ringRight",
  weapon_main: "weaponMain",
  weapon_off: "weaponOff",
  pouch_left: "pouchLeft",
  pouch_right: "pouchRight",
}

// Tipo para datos del formulario de inventario
export interface InventoryFormData {
  item_name: string
  item_type: string
  item_category: string | null
  equippable_slot: string | null
  quantity: number
  weight: number
  value_in_copper: number
  description: string | null
  equipped: boolean
  equipped_slot: string | null
  container_id: string | null
  is_container: boolean
  container_capacity: number
  // Effect fields
  wondrous_type: string | null
  effect_dice: string | null
  effect_type: string | null
  effect_target: string | null
  spell_level: number | null
  spell_name: string | null
  spell_school: string | null
  effect_description: string | null
  // Combat stats
  damage_dice: string | null
  damage_type: string | null
  armor_class: number | null
  weapon_mastery: string | null
  weapon_range_normal: number | null
  weapon_range_long: number | null
  properties: string[] | null
  // Attunement
  attunement: boolean | null
}

