/**
 * Servicio de aplicación para gestión de feats (dotes) del PHB 2024
 *
 * Gestiona todos los tipos de feats:
 * - Origin Feats (Dotes de Origen): Nivel 1, otorgadas por traits raciales
 * - General Feats (Dotes Generales): Niveles 4, 8, 12, 16, 19 (futuro)
 * - Combat Style Feats (Dotes de Estilo de Combate): Según clase (futuro)
 * - Epic Boons (Dotes Épicas): Niveles altos (futuro)
 */

import { ValidationUtils } from "../utils/validation"
import { ErrorService, ErrorCode } from "@/lib/infrastructure/errors"

// ============================================
// TIPOS BASE COMPARTIDOS
// ============================================

export interface AbilityScores {
  strength?: number
  dexterity?: number
  constitution?: number
  intelligence?: number
  wisdom?: number
  charisma?: number
}

export interface FeatPrerequisites {
  abilityScores?: Partial<AbilityScores> // Ej: { strength: 13 }
  level?: number
  otherFeats?: string[] // IDs de otras dotes requeridas
  class?: string[] // Clases que pueden tomar esta dote
  proficiency?: string[] // Competencias requeridas
}

export interface FeatBenefits {
  abilityScoreIncrease?: Partial<AbilityScores> // Ej: { strength: 1 }
  skillProficiencies?: string[] // IDs de habilidades
  toolProficiencies?: string[] // IDs de herramientas
  weaponProficiencies?: string[] // IDs de armas
  armorProficiencies?: string[] // IDs de armaduras
  languages?: string[] // Idiomas adicionales
  features?: string[] // Características especiales (descritas en description)
}

// ============================================
// ORIGIN FEATS (Dotes de Origen)
// ============================================

export interface OriginFeat {
  id: string
  name: string // En español
  description: string
  prerequisites?: FeatPrerequisites
  benefits?: FeatBenefits
  // Nota: Los origin feats se otorgan al nivel 1, no tienen requisitos de nivel típicamente
}

// ============================================
// GENERAL FEATS (Planificación Futura)
// ============================================

export interface GeneralFeat {
  id: string
  name: string
  description: string
  prerequisites?: FeatPrerequisites
  benefits?: FeatBenefits
  recommendedLevels?: number[] // [4, 8, 12, 16, 19]
}

// ============================================
// COMBAT STYLE FEATS (Planificación Futura)
// ============================================

export interface CombatStyleFeat {
  id: string
  name: string
  description: string
  prerequisites?: FeatPrerequisites
  benefits?: FeatBenefits
  combatStyle?: string
}

// ============================================
// EPIC BOONS (Planificación Futura)
// ============================================

export interface EpicBoon {
  id: string
  name: string
  description: string
  prerequisites?: FeatPrerequisites
  benefits?: FeatBenefits
  minimumLevel?: number // Típicamente 20
}

// ============================================
// TIPOS UNIÓN
// ============================================

export type Feat = OriginFeat | GeneralFeat | CombatStyleFeat | EpicBoon
export type FeatType = "origin" | "general" | "combat_style" | "epic"

// ============================================
// SERVICIO
// ============================================

export class FeatService {
  /**
   * ============================================
   * ORIGIN FEATS (Dotes de Origen)
   * ============================================
   * Se otorgan al nivel 1 durante la creación del personaje
   * Disponibles para ciertas especies/traits (ej: Humanos Versátil)
   */

  /**
   * Obtiene todas las dotes de origen del PHB 2024
   */
  static getOriginFeats(): OriginFeat[] {
    return [
      {
        id: "skilled",
        name: "Habilidoso",
        description:
          "Ganas competencia en tres habilidades de tu elección. Cada vez que ganes un nivel, puedes reemplazar una de estas competencias por otra habilidad de tu elección.",
        benefits: {
          skillProficiencies: ["choice", "choice", "choice"], // 3 a elección
        },
      },
      {
        id: "tough",
        name: "Resistente",
        description:
          "Aumentas tu puntuación de Constitución en 1, hasta un máximo de 20. Además, ganas 2 puntos de golpe adicionales por cada nivel de personaje que tengas.",
        benefits: {
          abilityScoreIncrease: { constitution: 1 },
          // HP adicionales se calculan dinámicamente: level * 2
        },
      },
      {
        id: "alert",
        name: "Alerta",
        description:
          "Siempre estás alerta al peligro. Ganas un bonificador de +5 a las tiradas de iniciativa. No puedes ser sorprendido mientras estés consciente. Otras criaturas no obtienen ventaja en las tiradas de ataque contra ti como resultado de no haberte detectado.",
        benefits: {
          // Bonificador de iniciativa se aplica en el cálculo de iniciativa
        },
      },
      {
        id: "lucky",
        name: "Afortunado",
        description:
          "Tienes 3 puntos de suerte. Siempre que hagas una tirada de ataque, una prueba de característica o una tirada de salvación, puedes gastar un punto de suerte para tirar un d20 adicional. Eliges cuál de los d20 usar para la tirada. Puedes gastar un punto de suerte después de ver el resultado de la tirada, pero antes de que se determine el resultado. Recuperas todos los puntos de suerte gastados cuando termines un descanso largo.",
        benefits: {},
      },
      {
        id: "magic_initiate",
        name: "Iniciado Mágico",
        description:
          "Aprendes dos trucos de una lista de conjuros de una clase de tu elección. Además, eliges un truco de nivel 1 de esa misma lista y aprendes ese conjuro. Puedes lanzar ese conjuro una vez sin gastar un espacio de conjuro, y recuperas la capacidad de hacerlo cuando termines un descanso largo. Las características de lanzamiento de conjuros para estos conjuros son las de la clase que elegiste.",
        benefits: {},
      },
      {
        id: "musician",
        name: "Músico",
        description:
          "Eres un músico competente. Ganas competencia con tres instrumentos musicales de tu elección. Puedes usar un instrumento musical como foco de conjuro para tus conjuros.",
        benefits: {
          toolProficiencies: ["choice", "choice", "choice"], // 3 instrumentos a elección
        },
      },
      {
        id: "savage_attacker",
        name: "Atacante Salvaje",
        description:
          "Una vez por turno cuando hagas daño con un arma, puedes volver a tirar el daño del arma y usar el resultado más alto.",
        benefits: {},
      },
      {
        id: "tavern_brawler",
        name: "Peleador de Taberna",
        description:
          "Aumentas tu puntuación de Fuerza o Constitución en 1, hasta un máximo de 20. Ganas competencia con armas improvisadas. Cuando golpeas con un arma improvisada, puedes hacer un ataque desarmado como acción adicional.",
        benefits: {
          abilityScoreIncrease: { strength: 1 }, // O constitution, a elección
          weaponProficiencies: ["improvised"],
        },
      },
      {
        id: "weapon_master",
        name: "Maestro de Armas",
        description:
          "Aumentas tu puntuación de Fuerza o Destreza en 1, hasta un máximo de 20. Ganas competencia con cuatro armas simples o marciales de tu elección.",
        benefits: {
          abilityScoreIncrease: { strength: 1 }, // O dexterity, a elección
          weaponProficiencies: ["choice", "choice", "choice", "choice"], // 4 armas a elección
        },
      },
      // TODO: Agregar más origin feats del PHB 2024 cuando tengamos la información completa
      // Algunos feats adicionales que pueden estar en el manual:
      // - Actor
      // - Athlete
      // - Charger
      // - Crossbow Expert
      // - Defensive Duelist
      // - Dual Wielder
      // - Durable
      // - Elemental Adept
      // - Grappler
      // - Great Weapon Master
      // - Healer
      // - Heavy Armor Master
      // - Inspiring Leader
      // - Keen Mind
      // - Lightly Armored
      // - Linguist
      // - Mage Slayer
      // - Medium Armor Master
      // - Mobile
      // - Moderately Armored
      // - Mounted Combatant
      // - Observant
      // - Polearm Master
      // - Resilient
      // - Ritual Caster
      // - Sentinel
      // - Sharpshooter
      // - Shield Master
      // - Spell Sniper
      // - War Caster
    ]
  }

  /**
   * Obtiene una dote de origen por ID
   * @param id ID de la dote
   * @returns Dote de origen o null si no se encuentra
   */
  static getOriginFeatById(id: string): OriginFeat | null {
    ValidationUtils.validateNonEmptyString(id, "Feat ID")
    return this.getOriginFeats().find((feat) => feat.id === id) || null
  }

  /**
   * Valida si un personaje puede tomar un origin feat
   * @param featId ID de la dote
   * @param characterLevel Nivel del personaje
   * @param characterAbilityScores Puntuaciones de características del personaje
   * @param characterClass Clase del personaje (opcional)
   * @param otherFeats Otras dotes que el personaje ya tiene (opcional)
   * @returns Objeto con canTake (boolean) y reason (string opcional)
   */
  static canTakeOriginFeat(
    featId: string,
    characterLevel: number,
    characterAbilityScores: Partial<AbilityScores>,
    characterClass?: string,
    otherFeats?: string[]
  ): { canTake: boolean; reason?: string } {
    ValidationUtils.validateNonEmptyString(featId, "Feat ID")
    ValidationUtils.validateNonNegativeNumber(characterLevel, "Character Level")

    const feat = this.getOriginFeatById(featId)
    if (!feat) {
      return { canTake: false, reason: "Dote no encontrada" }
    }

    // Los origin feats se toman al nivel 1
    if (characterLevel > 1) {
      return {
        canTake: false,
        reason: "Las dotes de origen solo se pueden tomar al nivel 1",
      }
    }

    // Validar requisitos
    if (feat.prerequisites) {
      // Validar puntuaciones de características
      if (feat.prerequisites.abilityScores) {
        for (const [ability, minValue] of Object.entries(
          feat.prerequisites.abilityScores
        )) {
          const currentValue =
            characterAbilityScores[ability as keyof AbilityScores] || 0
          if (currentValue < minValue!) {
            return {
              canTake: false,
              reason: `Requiere ${ability} ${minValue} o superior`,
            }
          }
        }
      }

      // Validar otras dotes requeridas
      if (
        feat.prerequisites.otherFeats &&
        feat.prerequisites.otherFeats.length > 0
      ) {
        const hasAllFeats = feat.prerequisites.otherFeats.every(
          (requiredFeat) => otherFeats?.includes(requiredFeat)
        )
        if (!hasAllFeats) {
          return {
            canTake: false,
            reason: `Requiere otras dotes: ${feat.prerequisites.otherFeats.join(
              ", "
            )}`,
          }
        }
      }

      // Validar clase
      if (feat.prerequisites.class && characterClass) {
        if (!feat.prerequisites.class.includes(characterClass)) {
          return {
            canTake: false,
            reason: `Solo disponible para: ${feat.prerequisites.class.join(
              ", "
            )}`,
          }
        }
      }
    }

    return { canTake: true }
  }

  /**
   * ============================================
   * GENERAL FEATS (Dotes Generales) - PLANIFICACIÓN
   * ============================================
   * Se pueden tomar en niveles 4, 8, 12, 16, 19
   * Como alternativa a mejoras de características
   */

  static getGeneralFeats(): GeneralFeat[] {
    // TODO: Implementar cuando trabajemos en general feats
    return []
  }

  static getGeneralFeatById(id: string): GeneralFeat | null {
    ValidationUtils.validateNonEmptyString(id, "Feat ID")
    return this.getGeneralFeats().find((feat) => feat.id === id) || null
  }

  /**
   * Obtiene los niveles en los que un personaje puede tomar general feats
   */
  static getGeneralFeatAvailableLevels(): number[] {
    return [4, 8, 12, 16, 19]
  }

  /**
   * ============================================
   * COMBAT STYLE FEATS - PLANIFICACIÓN
   * ============================================
   */

  static getCombatStyleFeats(): CombatStyleFeat[] {
    // TODO: Implementar cuando trabajemos en combat style feats
    return []
  }

  /**
   * ============================================
   * EPIC BOONS - PLANIFICACIÓN
   * ============================================
   */

  static getEpicBoons(): EpicBoon[] {
    // TODO: Implementar cuando trabajemos en epic boons
    return []
  }

  /**
   * ============================================
   * MÉTODOS GENÉRICOS
   * ============================================
   */

  /**
   * Obtiene todos los feats de un tipo específico
   */
  static getFeatsByType(type: FeatType): Feat[] {
    switch (type) {
      case "origin":
        return this.getOriginFeats()
      case "general":
        return this.getGeneralFeats()
      case "combat_style":
        return this.getCombatStyleFeats()
      case "epic":
        return this.getEpicBoons()
      default:
        return []
    }
  }

  /**
   * Obtiene un feat por ID sin importar el tipo
   */
  static getFeatById(id: string, type?: FeatType): Feat | null {
    ValidationUtils.validateNonEmptyString(id, "Feat ID")

    if (type) {
      return this.getFeatsByType(type).find((feat) => feat.id === id) || null
    }

    // Buscar en todos los tipos
    const allTypes: FeatType[] = ["origin", "general", "combat_style", "epic"]
    for (const featType of allTypes) {
      const feat = this.getFeatsByType(featType).find((f) => f.id === id)
      if (feat) return feat
    }

    return null
  }
}

