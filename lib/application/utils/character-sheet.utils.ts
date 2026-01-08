/**
 * Utilidades de aplicación para hoja de personaje
 * Wrappers sobre CharacterSheetConfigService para uso en capa de aplicación
 */

import { CharacterSheetConfigService } from "@/lib/services/character-sheet-config"
import type { Character } from "@/lib/infrastructure/repositories/character-repository"

/**
 * Calcula la capacidad de carga para un personaje
 */
export function calculateCarryingCapacity(
  strength: number | null | undefined,
  size: "small" | "medium" | "large" | null | undefined = "medium",
  racialTraits?: string[] | null
): number {
  return CharacterSheetConfigService.calculateCarryingCapacity(strength, size, racialTraits)
}

/**
 * Calcula el modificador de un atributo
 */
export function calculateAbilityModifier(score: number | null | undefined): number {
  return CharacterSheetConfigService.calculateAbilityModifier(score)
}

/**
 * Formatea un atributo con su modificador
 * Ejemplo: "15 (+2)"
 */
export function formatAbilityScore(score: number | null | undefined): string {
  return CharacterSheetConfigService.formatAbilityScore(score)
}

/**
 * Calcula la capacidad de carga desde un objeto Character
 */
export function calculateCarryingCapacityFromCharacter(character: Partial<Character>): number {
  return calculateCarryingCapacity(
    character.strength,
    character.size || "medium",
    character.racial_traits || null
  )
}

