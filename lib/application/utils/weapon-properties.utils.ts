import type { InventoryItem } from "@/lib/infrastructure/repositories"

/**
 * Obtiene el daño actual de un arma considerando si es versátil
 * y si está usando una o dos manos
 */
export function getCurrentWeaponDamage(item: InventoryItem, weaponOffItem: InventoryItem | null): string {
  if (!item.properties?.includes("versatile") || !item.damage_dice_versatile) {
    return item.damage_dice || ""
  }

  // Si tiene versatile_usage explícito, respetarlo
  if (item.versatile_usage === "two-handed") {
    return item.damage_dice_versatile
  }
  if (item.versatile_usage === "one-handed") {
    return item.damage_dice || ""
  }

  // Si no tiene uso explícito, inferir: si weapon_main está libre, usar 2 manos
  if (item.equipped_slot === "weapon_main" && !weaponOffItem) {
    return item.damage_dice_versatile
  }

  return item.damage_dice || ""
}

/**
 * Determina si un arma versátil está siendo usada con dos manos
 */
export function isVersatileWeaponTwoHanded(item: InventoryItem, weaponOffItem: InventoryItem | null): boolean {
  if (!item.properties?.includes("versatile")) {
    return false
  }

  // Si tiene versatile_usage explícito, respetarlo
  if (item.versatile_usage === "two-handed") {
    return true
  }
  if (item.versatile_usage === "one-handed") {
    return false
  }

  // Si no tiene uso explícito, inferir
  return item.equipped_slot === "weapon_main" && !weaponOffItem
}

/**
 * Valida si un arma puede ser equipada en weapon_off
 * Las armas two-handed o versátiles en modo two-handed no pueden ir en weapon_off
 */
export function canEquipToWeaponOff(item: InventoryItem): boolean {
  if (item.item_category !== "weapon") {
    return true // No es arma, no aplica restricción
  }

  // Two-handed no puede ir en weapon_off
  if (item.properties?.includes("two-handed")) {
    return false
  }

  // Versátil configurada para two-handed no puede ir en weapon_off
  if (item.versatile_usage === "two-handed") {
    return false
  }

  return true
}

/**
 * Valida si weapon_off puede ser ocupado dado el estado de weapon_main
 */
export function canOccupyWeaponOff(weaponMainItem: InventoryItem | null): boolean {
  if (!weaponMainItem) {
    return true // weapon_main vacío, weapon_off puede usarse
  }

  if (weaponMainItem.item_category !== "weapon") {
    return true // No es arma en main, weapon_off puede usarse
  }

  // Si weapon_main tiene arma two-handed, bloquear weapon_off
  if (weaponMainItem.properties?.includes("two-handed")) {
    return false
  }

  // Si weapon_main tiene arma versátil en modo two-handed, bloquear weapon_off
  if (weaponMainItem.versatile_usage === "two-handed") {
    return false
  }

  return true
}

/**
 * Valida las propiedades de un arma según las reglas del PHB 2024
 */
export function validateWeaponProperties(item: Partial<InventoryItem>): string[] {
  const errors: string[] = []

  if (item.item_category !== "weapon") {
    return errors // Solo validar armas
  }

  // Validar armas versátiles
  if (item.properties?.includes("versatile")) {
    if (!item.damage_dice_versatile) {
      errors.push("Las armas versátiles requieren especificar el daño versátil (2 manos)")
    }
  }

  // Validar armas a distancia (ranged)
  if (item.properties?.includes("ranged")) {
    if (!item.weapon_range_normal || item.weapon_range_normal <= 0) {
      errors.push("Las armas a distancia requieren especificar el rango normal")
    }
  }

  // Validar armas arrojadizas (thrown)
  if (item.properties?.includes("thrown")) {
    if (!item.weapon_range_normal || item.weapon_range_normal <= 0) {
      errors.push("Las armas arrojadizas requieren especificar el rango normal")
    }
  }

  return errors
}
