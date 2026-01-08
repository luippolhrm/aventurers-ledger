import { CharacterSheetConfigService } from "@/lib/services/character-sheet-config"
import type { Character } from "@/lib/infrastructure/repositories/character-repository"
import type { CharacterSheetFormData, CharacterSheetFormErrors } from "./character-sheet.types"

/**
 * Valida los datos del formulario de hoja de personaje
 */
export function validateFormData(data: CharacterSheetFormData): {
  isValid: boolean
  errors: CharacterSheetFormErrors
} {
  const result = CharacterSheetConfigService.validateSheet(data)
  return {
    isValid: result.isValid,
    errors: result.errors,
  }
}

/**
 * Calcula la capacidad de carga desde los datos del formulario
 */
export function calculateCarryingCapacityFromForm(
  formData: CharacterSheetFormData
): number {
  return CharacterSheetConfigService.calculateCarryingCapacity(
    formData.strength,
    formData.size || "medium"
  )
}

/**
 * Prepara los datos iniciales del formulario desde un personaje
 */
export function getInitialFormData(character?: Partial<Character>): CharacterSheetFormData {
  if (!character) {
    return {
      name: "",
      race: "",
      class: null,
      level: null,
      gender: null,
      strength: null,
      dexterity: null,
      constitution: null,
      intelligence: null,
      wisdom: null,
      charisma: null,
      size: "medium",
      background: null,
      alignment: null,
      experience_points: null,
      preparation_notes: null,
    }
  }

  return {
    ...character,
    // Asegurar que todos los campos opcionales estén definidos
    size: character.size || "medium",
  }
}

