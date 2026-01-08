/**
 * Servicio de configuración para la hoja de personaje
 * Define secciones, campos y cálculos según reglas D&D 5e
 */

export type CharacterSheetSection = "basic" | "ability_scores" | "background" | "notes"

export interface FieldConfig {
  id: string
  label: string
  type: "text" | "number" | "select" | "textarea"
  required?: boolean
  placeholder?: string
  min?: number
  max?: number
  options?: { value: string; label: string }[]
  helpText?: string
}

export interface SectionConfig {
  id: CharacterSheetSection
  label: string
  icon: string
  fields: FieldConfig[]
  required?: boolean
  order: number
}

export interface ValidationResult {
  isValid: boolean
  errors: Record<string, string>
}

export interface AbilityScores {
  strength?: number | null
  dexterity?: number | null
  constitution?: number | null
  intelligence?: number | null
  wisdom?: number | null
  charisma?: number | null
}

/**
 * Servicio de configuración para hoja de personaje
 */
export class CharacterSheetConfigService {
  /**
   * Obtiene todas las secciones configuradas
   */
  static getSections(): SectionConfig[] {
    return [
      {
        id: "basic",
        label: "Información Básica",
        icon: "User",
        fields: this.getSectionFields("basic"),
        required: true,
        order: 1,
      },
      {
        id: "ability_scores",
        label: "Atributos",
        icon: "Activity",
        fields: this.getSectionFields("ability_scores"),
        required: false,
        order: 2,
      },
      {
        id: "background",
        label: "Trasfondo",
        icon: "Book",
        fields: this.getSectionFields("background"),
        required: false,
        order: 3,
      },
      {
        id: "notes",
        label: "Notas",
        icon: "FileText",
        fields: this.getSectionFields("notes"),
        required: false,
        order: 4,
      },
    ]
  }

  /**
   * Obtiene los campos de una sección específica
   */
  static getSectionFields(section: CharacterSheetSection): FieldConfig[] {
    switch (section) {
      case "basic":
        return [
          {
            id: "name",
            label: "Nombre",
            type: "text",
            required: true,
            placeholder: "Nombre del personaje",
          },
          {
            id: "race",
            label: "Raza",
            type: "text",
            required: true,
            placeholder: "Raza del personaje",
          },
          {
            id: "class",
            label: "Clase",
            type: "select",
            required: false,
            options: [
              { value: "barbarian", label: "Bárbaro" },
              { value: "bard", label: "Bardo" },
              { value: "cleric", label: "Clérigo" },
              { value: "druid", label: "Druida" },
              { value: "fighter", label: "Guerrero" },
              { value: "monk", label: "Monje" },
              { value: "paladin", label: "Paladín" },
              { value: "ranger", label: "Explorador" },
              { value: "rogue", label: "Pícaro" },
              { value: "sorcerer", label: "Hechicero" },
              { value: "warlock", label: "Brujo" },
              { value: "wizard", label: "Mago" },
            ],
          },
          {
            id: "level",
            label: "Nivel",
            type: "number",
            required: false,
            min: 1,
            max: 20,
            placeholder: "1-20",
          },
          {
            id: "gender",
            label: "Género",
            type: "select",
            required: false,
            options: [
              { value: "male", label: "Masculino" },
              { value: "female", label: "Femenino" },
              { value: "other", label: "Otro" },
            ],
          },
        ]

      case "ability_scores":
        return [
          {
            id: "strength",
            label: "Fuerza",
            type: "number",
            required: false,
            min: 1,
            max: 30,
            helpText: "Usado para calcular capacidad de carga",
          },
          {
            id: "dexterity",
            label: "Destreza",
            type: "number",
            required: false,
            min: 1,
            max: 30,
          },
          {
            id: "constitution",
            label: "Constitución",
            type: "number",
            required: false,
            min: 1,
            max: 30,
          },
          {
            id: "intelligence",
            label: "Inteligencia",
            type: "number",
            required: false,
            min: 1,
            max: 30,
          },
          {
            id: "wisdom",
            label: "Sabiduría",
            type: "number",
            required: false,
            min: 1,
            max: 30,
          },
          {
            id: "charisma",
            label: "Carisma",
            type: "number",
            required: false,
            min: 1,
            max: 30,
          },
          {
            id: "size",
            label: "Tamaño",
            type: "select",
            required: false,
            options: [
              { value: "small", label: "Pequeño" },
              { value: "medium", label: "Mediano" },
              { value: "large", label: "Grande" },
            ],
            helpText: "Afecta la capacidad de carga",
          },
        ]

      case "background":
        return [
          {
            id: "background",
            label: "Trasfondo",
            type: "text",
            required: false,
            placeholder: "Ej: Soldado, Noble, Criminal",
          },
          {
            id: "alignment",
            label: "Alineamiento",
            type: "select",
            required: false,
            options: [
              { value: "lawful_good", label: "Legal Bueno" },
              { value: "neutral_good", label: "Neutral Bueno" },
              { value: "chaotic_good", label: "Caótico Bueno" },
              { value: "lawful_neutral", label: "Legal Neutral" },
              { value: "true_neutral", label: "Neutral Verdadero" },
              { value: "chaotic_neutral", label: "Caótico Neutral" },
              { value: "lawful_evil", label: "Legal Malvado" },
              { value: "neutral_evil", label: "Neutral Malvado" },
              { value: "chaotic_evil", label: "Caótico Malvado" },
            ],
          },
          {
            id: "experience_points",
            label: "Puntos de Experiencia",
            type: "number",
            required: false,
            min: 0,
            placeholder: "0",
          },
        ]

      case "notes":
        return [
          {
            id: "preparation_notes",
            label: "Notas de Preparación",
            type: "textarea",
            required: false,
            placeholder: "Ej: Comprar 3 pociones de curación antes de la próxima sesión",
            helpText: "Notas para preparar la próxima aventura",
          },
        ]

      default:
        return []
    }
  }

  /**
   * Calcula la capacidad de carga según reglas D&D 5e
   * Base: Strength × 15 lbs
   * Small: ÷ 2
   * Medium: × 1
   * Large: × 2
   * Considera traits raciales (ej: Powerful Build) que aumentan el tamaño efectivo
   */
  static calculateCarryingCapacity(
    strength: number | null | undefined,
    size: "small" | "medium" | "large" | null | undefined = "medium",
    racialTraits?: string[] | null
  ): number {
    if (!strength || strength < 1) {
      return 150 // Default para strength 10
    }

    // Importar aquí para evitar dependencias circulares
    const { RacialTraitService } = require("./racial-traits-service")

    // Calcular tamaño efectivo considerando traits
    const effectiveSize = RacialTraitService.calculateEffectiveSize(
      size || "medium",
      racialTraits || []
    )

    let baseCapacity = strength * 15

    switch (effectiveSize) {
      case "small":
        baseCapacity = Math.floor(baseCapacity / 2)
        break
      case "medium":
        // No change
        break
      case "large":
        baseCapacity = baseCapacity * 2
        break
      case "huge":
        baseCapacity = baseCapacity * 4
        break
      default:
        // Default to medium
        break
    }

    return baseCapacity
  }

  /**
   * Calcula el modificador de un atributo según D&D 5e
   * Fórmula: Math.floor((score - 10) / 2)
   */
  static calculateAbilityModifier(score: number | null | undefined): number {
    if (!score || score < 1) {
      return 0
    }
    return Math.floor((score - 10) / 2)
  }

  /**
   * Formatea un atributo con su modificador
   * Ejemplo: "15 (+2)"
   */
  static formatAbilityScore(score: number | null | undefined): string {
    if (!score) {
      return "—"
    }
    const modifier = this.calculateAbilityModifier(score)
    const modifierStr = modifier >= 0 ? `+${modifier}` : `${modifier}`
    return `${score} (${modifierStr})`
  }

  /**
   * Valida una hoja de personaje completa
   */
  static validateSheet(sheet: Partial<Record<string, any>>): ValidationResult {
    const errors: Record<string, string> = {}

    // Validar campos requeridos
    if (!sheet.name || (sheet.name as string).trim() === "") {
      errors.name = "El nombre es requerido"
    }

    if (!sheet.race || (sheet.race as string).trim() === "") {
      errors.race = "La raza es requerida"
    }

    // Validar ability scores (si se proporcionan)
    const abilityScores = ["strength", "dexterity", "constitution", "intelligence", "wisdom", "charisma"]
    for (const score of abilityScores) {
      const value = sheet[score]
      if (value !== null && value !== undefined) {
        const num = Number(value)
        if (isNaN(num) || num < 1 || num > 30) {
          errors[score] = `El valor debe estar entre 1 y 30`
        }
      }
    }

    // Validar level (si se proporciona)
    if (sheet.level !== null && sheet.level !== undefined) {
      const level = Number(sheet.level)
      if (isNaN(level) || level < 1 || level > 20) {
        errors.level = "El nivel debe estar entre 1 y 20"
      }
    }

    // Validar size (si se proporciona)
    if (sheet.size !== null && sheet.size !== undefined) {
      const validSizes = ["small", "medium", "large"]
      if (!validSizes.includes(sheet.size as string)) {
        errors.size = "El tamaño debe ser: small, medium o large"
      }
    }

    return {
      isValid: Object.keys(errors).length === 0,
      errors,
    }
  }
}

