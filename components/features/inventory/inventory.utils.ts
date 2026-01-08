import { ItemFormConfigService, type ItemCategory } from "@/lib/services/item-form-config"
import {
  BODY_SLOTS,
  CONTAINER_SLOTS,
  EQUIPPABLE_ITEM_TYPES,
  SLOT_TO_TRANSLATION_KEY,
  type BodySlot,
  type ContainerSlot,
} from "./inventory.types"

/**
 * Obtiene la clave de traducción para un slot
 * @param slot Slot en formato snake_case
 * @returns Clave de traducción en formato camelCase
 */
export function getSlotTranslationKey(slot: string): string {
  return SLOT_TO_TRANSLATION_KEY[slot] || slot
}

/**
 * Verifica si un item puede equiparse en slots corporales
 * @param item Item a verificar
 * @returns true si puede equiparse en slots corporales
 */
export function canEquipToBodySlots(item: {
  item_type: string
  item_category?: string | null
  is_container: boolean
}): boolean {
  if (item.is_container) return false

  // Si tiene item_category, usar el servicio para verificar
  if (item.item_category) {
    return ItemFormConfigService.canEquipCategory(item.item_category as ItemCategory)
  }

  // Fallback a item_type
  return (EQUIPPABLE_ITEM_TYPES as readonly string[]).includes(item.item_type)
}

/**
 * Verifica si un slot es un slot corporal
 * @param slot Slot a verificar
 * @returns true si es un slot corporal
 */
export function isBodySlot(slot: string): slot is BodySlot {
  return (BODY_SLOTS as readonly string[]).includes(slot)
}

/**
 * Verifica si un slot es un slot de contenedor
 * @param slot Slot a verificar
 * @returns true si es un slot de contenedor
 */
export function isContainerSlot(slot: string): slot is ContainerSlot {
  return (CONTAINER_SLOTS as readonly string[]).includes(slot)
}

/**
 * Obtiene todos los slots disponibles para un item
 * @param item Item para el cual obtener slots
 * @returns Array de slots disponibles
 */
export function getAvailableSlots(item: {
  item_type: string
  item_category?: string | null
  is_container: boolean
}): string[] {
  if (item.is_container) {
    return [...CONTAINER_SLOTS]
  }

  if (canEquipToBodySlots(item)) {
    return [...BODY_SLOTS]
  }

  return []
}

