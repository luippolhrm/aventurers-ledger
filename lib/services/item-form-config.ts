/**
 * Service for managing dynamic form fields configuration based on item category
 * Provides centralized logic for both inventory and shop items forms
 */

export type ItemCategory =
  | "weapon"
  | "armor"
  | "potion"
  | "scroll"
  | "wondrous"
  | "tool"
  | "gear"
  | "consumable"
  | "treasure"
  | "equipment"
  | "other"

export type FieldType = "text" | "number" | "select" | "textarea" | "checkbox" | "url"

export interface FieldOption {
  value: string
  label: string
}

export interface FieldConfig {
  id: string
  label: string
  type: FieldType
  required?: boolean
  placeholder?: string
  min?: number
  max?: number
  step?: number
  options?: FieldOption[]
  conditional?: (formData: any) => boolean
  helpText?: string
}

export interface CategoryConfig {
  category: ItemCategory
  defaultSlot?: string
  availableSlots?: string[]
  fields: FieldConfig[]
  getConditionalFields?: (formData: any) => FieldConfig[]
}

// Mapeo de wondrous items a slots
export const WONDROUS_SLOT_MAPPING: Record<string, string[]> = {
  ring: ["ring_left", "ring_right"],
  amulet: ["neck"],
  necklace: ["neck"],
  cloak: ["shoulders"],
  cape: ["shoulders"],
  boots: ["feet"],
  belt: ["waist"],
  gloves: ["hands"],
  gauntlets: ["hands"],
  helmet: ["head"],
  crown: ["head"],
  hat: ["head"],
  // Por defecto, wondrous puede ir en cualquier slot
  default: ["head", "neck", "shoulders", "body", "hands", "waist", "ring_left", "ring_right", "feet"],
}

export class ItemFormConfigService {
  private static categoryConfigs: Map<ItemCategory, CategoryConfig> = new Map([
    [
      "weapon",
      {
        category: "weapon",
        defaultSlot: "weapon_main",
        availableSlots: ["weapon_main", "weapon_off"],
        fields: [
          {
            id: "damage_dice",
            label: "Dados de Daño",
            type: "text",
            placeholder: "e.g., 1d8, 2d6+3",
            helpText: "Notación de dados de D&D (ej: 1d8, 2d6+3)",
          },
          {
            id: "damage_type",
            label: "Tipo de Daño",
            type: "select",
            options: [
              { value: "slashing", label: "Cortante" },
              { value: "piercing", label: "Perforante" },
              { value: "bludgeoning", label: "Contundente" },
              { value: "fire", label: "Fuego" },
              { value: "cold", label: "Frío" },
              { value: "lightning", label: "Relámpago" },
              { value: "thunder", label: "Trueno" },
              { value: "poison", label: "Veneno" },
              { value: "acid", label: "Ácido" },
              { value: "necrotic", label: "Nigromántico" },
              { value: "radiant", label: "Radiante" },
              { value: "psychic", label: "Psíquico" },
              { value: "force", label: "Fuerza" },
            ],
          },
        ],
      },
    ],
    [
      "armor",
      {
        category: "armor",
        defaultSlot: "body",
        availableSlots: ["body"],
        fields: [
          {
            id: "armor_class",
            label: "Clase de Armadura",
            type: "number",
            min: 0,
            max: 30,
            placeholder: "AC",
          },
        ],
      },
    ],
    [
      "potion",
      {
        category: "potion",
        fields: [
          {
            id: "effect_dice",
            label: "Dados de Efecto",
            type: "text",
            placeholder: "e.g., 2d4+2",
            helpText: "Cantidad de curación o efecto (ej: 2d4+2 para curación)",
          },
          {
            id: "effect_type",
            label: "Tipo de Efecto",
            type: "select",
            options: [
              { value: "healing", label: "Curación" },
              { value: "temporary_hit_points", label: "Puntos de Golpe Temporales" },
              { value: "stat_buff", label: "Mejora de Atributo" },
              { value: "damage", label: "Daño" },
              { value: "condition_removal", label: "Remover Condición" },
              { value: "other", label: "Otro" },
            ],
          },
          {
            id: "effect_target",
            label: "Objetivo",
            type: "select",
            options: [
              { value: "self", label: "Uno mismo" },
              { value: "other", label: "Otro objetivo" },
              { value: "area", label: "Área" },
            ],
          },
        ],
      },
    ],
    [
      "scroll",
      {
        category: "scroll",
        fields: [
          {
            id: "spell_level",
            label: "Nivel de Hechizo",
            type: "number",
            min: 0,
            max: 9,
            placeholder: "0-9",
          },
          {
            id: "spell_name",
            label: "Nombre del Hechizo",
            type: "text",
            placeholder: "e.g., Fireball, Cure Wounds",
          },
          {
            id: "spell_school",
            label: "Escuela de Magia",
            type: "select",
            options: [
              { value: "abjuration", label: "Abjuración" },
              { value: "conjuration", label: "Conjuración" },
              { value: "divination", label: "Adivinación" },
              { value: "enchantment", label: "Encantamiento" },
              { value: "evocation", label: "Evocación" },
              { value: "illusion", label: "Ilusión" },
              { value: "necromancy", label: "Nigromancia" },
              { value: "transmutation", label: "Transmutación" },
            ],
          },
        ],
      },
    ],
    [
      "wondrous",
      {
        category: "wondrous",
        // Slots disponibles según el tipo de wondrous
        availableSlots: ["head", "neck", "shoulders", "body", "hands", "waist", "ring_left", "ring_right", "feet"],
        fields: [
          {
            id: "wondrous_type",
            label: "Tipo de Objeto Maravilloso",
            type: "select",
            options: [
              { value: "ring", label: "Anillo" },
              { value: "amulet", label: "Amuleto" },
              { value: "necklace", label: "Collar" },
              { value: "cloak", label: "Capa" },
              { value: "boots", label: "Botas" },
              { value: "belt", label: "Cinturón" },
              { value: "gloves", label: "Guantes" },
              { value: "helmet", label: "Casco/Yelmo" },
              { value: "other", label: "Otro" },
            ],
            helpText: "Selecciona el tipo para determinar el slot de equipamiento",
          },
          {
            id: "effect_description",
            label: "Descripción del Efecto",
            type: "textarea",
            placeholder: "Describe los efectos mágicos del objeto...",
            helpText: "Efectos especiales, bonificadores, habilidades, etc.",
          },
        ],
        getConditionalFields: (formData) => {
          // Si es un anillo, sugerir slots de anillo
          if (formData.wondrous_type === "ring") {
            return [
              {
                id: "suggested_slot",
                label: "Slot Sugerido",
                type: "select",
                options: [
                  { value: "ring_left", label: "Anillo Izquierdo" },
                  { value: "ring_right", label: "Anillo Derecho" },
                ],
                helpText: "Los anillos pueden equiparse en cualquier mano",
              },
            ]
          }
          return []
        },
      },
    ],
  ])

  static getFieldsForCategory(category: ItemCategory): FieldConfig[] {
    const config = this.categoryConfigs.get(category)
    return config?.fields || []
  }

  static getAvailableSlots(category: ItemCategory, itemType?: string, wondrousType?: string): string[] {
    const config = this.categoryConfigs.get(category)

    if (category === "wondrous" && wondrousType) {
      return WONDROUS_SLOT_MAPPING[wondrousType] || WONDROUS_SLOT_MAPPING.default
    }

    return config?.availableSlots || []
  }

  static getDefaultSlot(category: ItemCategory, itemType?: string, wondrousType?: string): string | undefined {
    const config = this.categoryConfigs.get(category)

    if (category === "wondrous" && wondrousType) {
      const slots = WONDROUS_SLOT_MAPPING[wondrousType]
      return slots?.[0]
    }

    return config?.defaultSlot
  }

  static canEquipCategory(category: ItemCategory): boolean {
    const equippableCategories: ItemCategory[] = ["weapon", "armor", "equipment", "wondrous"]
    return equippableCategories.includes(category)
  }

  static getConditionalFields(category: ItemCategory, formData: any): FieldConfig[] {
    const config = this.categoryConfigs.get(category)
    if (config?.getConditionalFields) {
      return config.getConditionalFields(formData)
    }
    return []
  }

  static validateField(fieldId: string, value: any, fieldConfig: FieldConfig): string | null {
    if (fieldConfig.required && (!value || value === "")) {
      return `${fieldConfig.label} es requerido`
    }

    if (fieldConfig.type === "number") {
      const num = Number(value)
      if (isNaN(num)) return `${fieldConfig.label} debe ser un número`
      if (fieldConfig.min !== undefined && num < fieldConfig.min) {
        return `${fieldConfig.label} debe ser al menos ${fieldConfig.min}`
      }
      if (fieldConfig.max !== undefined && num > fieldConfig.max) {
        return `${fieldConfig.label} debe ser máximo ${fieldConfig.max}`
      }
    }

    return null
  }

  static getAllCategories(): ItemCategory[] {
    return Array.from(this.categoryConfigs.keys())
  }

  static getCategoryConfig(category: ItemCategory): CategoryConfig | undefined {
    return this.categoryConfigs.get(category)
  }
}

