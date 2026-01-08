import {
  SupabaseCharacterRepository,
  type CharacterRepository,
  type Character,
  type CharactersByStatus,
} from "@/lib/infrastructure/repositories/character-repository"
import { ErrorService, ErrorCode } from "@/lib/infrastructure/errors"
import { ValidationUtils } from "../utils/validation"
import { CharacterSheetConfigService, type AbilityScores } from "@/lib/services/character-sheet-config"
import { calculateCarryingCapacity } from "../utils/character-sheet.utils"
import { RacialTraitService } from "@/lib/services/racial-traits-service"

/**
 * Servicio de aplicación para manejo de personajes
 */
export class CharacterService {
  constructor(
    private characterRepo: CharacterRepository = new SupabaseCharacterRepository()
  ) {}

  /**
   * Obtiene un personaje por ID
   */
  async getCharacter(characterId: string): Promise<Character> {
    ValidationUtils.validateId(characterId, "Character ID")

    const character = await this.characterRepo.getById(characterId)
    if (!character) {
      throw ErrorService.create(ErrorCode.CHARACTER_NOT_FOUND)
    }

    return character
  }

  /**
   * Obtiene todos los personajes de un usuario
   */
  async getUserCharacters(
    userId: string,
    includeArchived = false
  ): Promise<Character[]> {
    ValidationUtils.validateId(userId, "User ID")
    return this.characterRepo.getByUserId(userId, includeArchived)
  }

  /**
   * Obtiene todos los personajes (sin filtrar por usuario)
   * Útil para casos como transferencias entre personajes de diferentes usuarios
   * @param includeArchived Si incluir personajes archivados (default: false)
   * @returns Array de personajes
   */
  async getAllCharacters(includeArchived = false): Promise<Character[]> {
    return this.characterRepo.getAll(includeArchived)
  }

  /**
   * Crea un nuevo personaje
   */
  async createCharacter(
    character: Omit<Character, "id" | "created_at" | "updated_at" | "user_id">,
    userId: string
  ): Promise<Character> {
    ValidationUtils.validateId(userId, "User ID")
    ValidationUtils.validateNonEmptyString(character.name, "Character name")

    return this.characterRepo.create({
      ...character,
      user_id: userId,
      archived: false,
    })
  }

  /**
   * Actualiza un personaje
   */
  async updateCharacter(
    characterId: string,
    updates: Partial<Character>
  ): Promise<Character> {
    return this.characterRepo.update(characterId, updates)
  }

  /**
   * Archiva un personaje
   */
  async archiveCharacter(characterId: string): Promise<void> {
    await this.characterRepo.archive(characterId)
  }

  /**
   * Desarchiva un personaje
   */
  async unarchiveCharacter(characterId: string): Promise<void> {
    await this.characterRepo.unarchive(characterId)
  }

  /**
   * Valida que un personaje pertenezca a un usuario
   */
  async validateOwnership(
    characterId: string,
    userId: string
  ): Promise<boolean> {
    try {
      const character = await this.getCharacter(characterId)
      return character.user_id === userId
    } catch {
      return false
    }
  }

  /**
   * Obtiene personajes divididos en asignados (en campañas) y libres
   * @param userId ID del usuario
   * @returns Objeto con arrays de personajes asignados y libres
   */
  async getCharactersByStatus(userId: string): Promise<CharactersByStatus> {
    ValidationUtils.validateId(userId, "User ID")
    return this.characterRepo.getByStatus(userId)
  }

  /**
   * Calcula la capacidad de carga de un personaje
   * @param characterId ID del personaje
   * @returns Capacidad de carga en libras
   */
  async calculateCarryingCapacity(characterId: string): Promise<number> {
    ValidationUtils.validateId(characterId, "Character ID")

    const character = await this.getCharacter(characterId)
    return calculateCarryingCapacity(character.strength, character.size || "medium")
  }

  /**
   * Actualiza los atributos de un personaje y recalcula la capacidad de carga
   * @param characterId ID del personaje
   * @param scores Atributos a actualizar
   * @returns Personaje actualizado
   */
  async updateAbilityScores(
    characterId: string,
    scores: Partial<AbilityScores> & { size?: "small" | "medium" | "large" | null }
  ): Promise<Character> {
    ValidationUtils.validateId(characterId, "Character ID")

    // Validar ability scores si se proporcionan
    const abilityScoreKeys: (keyof AbilityScores)[] = [
      "strength",
      "dexterity",
      "constitution",
      "intelligence",
      "wisdom",
      "charisma",
    ]

    for (const key of abilityScoreKeys) {
      const value = scores[key]
      if (value !== null && value !== undefined) {
        if (value < 1 || value > 30) {
          throw ErrorService.create(
            ErrorCode.VALIDATION_ERROR,
            `${key} must be between 1 and 30`
          )
        }
      }
    }

    // Obtener personaje actual para calcular nueva capacidad
    const currentCharacter = await this.getCharacter(characterId)
    const updatedScores = { ...currentCharacter, ...scores }

    // Calcular nueva capacidad de carga
    const newCarryingCapacity = calculateCarryingCapacity(
      updatedScores.strength,
      updatedScores.size || "medium",
      updatedScores.racial_traits || null
    )

    // Actualizar personaje con nuevos atributos y capacidad
    return this.updateCharacter(characterId, {
      ...scores,
      carrying_capacity: newCarryingCapacity,
    })
  }

  /**
   * Crea un personaje con valores por defecto y cálculos automáticos
   * Aplica bonificaciones, calcula capacidad de carga, etc.
   * @param data Datos parciales del personaje
   * @param userId ID del usuario
   * @returns Personaje creado
   */
  async createCharacterWithDefaults(
    data: Partial<Character>,
    userId: string
  ): Promise<Character> {
    ValidationUtils.validateId(userId, "User ID")
    ValidationUtils.validateNonEmptyString(data.name, "Character name")

    // Determinar sistema de reglas
    const rulesSystem = data.rules_system || "5e_2024"
    const is2014 = rulesSystem === "5e_2014"
    const is2024 = rulesSystem === "5e_2024"

    // Obtener Character Origin/Race según el sistema
    let racialTraits: string[] = data.racial_traits || []
    let defaultSize: "small" | "medium" | "large" = data.size || "medium"
    let abilityBonuses: Partial<AbilityScores> = {}

    if (data.race) {
      if (is2014) {
        // Sistema 2014: usar razas PHB 2014
        const race = RacialTraitService.getRace2014ById(data.race)
        if (race) {
          // Aplicar traits de la raza si no se proporcionaron explícitamente
          if (!data.racial_traits || data.racial_traits.length === 0) {
            racialTraits = race.traits
          }
          // Usar tamaño por defecto de la raza si no se proporcionó
          if (!data.size) {
            defaultSize = race.defaultSize
          }
          // Calcular bonos raciales (raza + subraza)
          if (data.racial_ability_bonuses) {
            abilityBonuses = data.racial_ability_bonuses
          } else if (data.subrace) {
            // Calcular automáticamente si hay subraza
            abilityBonuses = RacialTraitService.getRacialAbilityBonuses2014(data.race, data.subrace)
          } else {
            // Solo bonos base de la raza
            abilityBonuses = race.baseAbilityBonuses
          }
        }
      } else {
        // Sistema 2024: usar Character Origins
        const origin = RacialTraitService.getOriginById(data.race)
        if (origin) {
          // Aplicar traits del origin si no se proporcionaron explícitamente
          if (!data.racial_traits || data.racial_traits.length === 0) {
            racialTraits = origin.traits
          }
          // Usar tamaño por defecto del origin si no se proporcionó
          if (!data.size) {
            defaultSize = origin.defaultSize
          }
        }
      }
    }

    // Las bonificaciones del Background (2024) o Raza (2014) se seleccionan manualmente por el usuario
    if (is2024 && data.background_ability_bonuses) {
      abilityBonuses = data.background_ability_bonuses
    } else if (is2014 && data.racial_ability_bonuses) {
      abilityBonuses = data.racial_ability_bonuses
    }

    // Aplicar bonificaciones a los ability scores base
    const baseScores: AbilityScores = {
      strength: data.strength || null,
      dexterity: data.dexterity || null,
      constitution: data.constitution || null,
      intelligence: data.intelligence || null,
      wisdom: data.wisdom || null,
      charisma: data.charisma || null,
    }

    const finalScores = RacialTraitService.applyAbilityBonuses(baseScores, abilityBonuses)

    // Calcular capacidad de carga con traits
    let carryingCapacity = data.carrying_capacity || null
    if (finalScores.strength && !carryingCapacity) {
      carryingCapacity = calculateCarryingCapacity(
        finalScores.strength,
        defaultSize,
        racialTraits
      )
    }

    // Obtener bonificadores de compra/tienda (solo referencia)
    const shopBonuses = data.race
      ? RacialTraitService.getShopBonuses(data.race, racialTraits)
      : null

    // Crear personaje con valores por defecto
    const characterData: Omit<Character, "id" | "created_at" | "updated_at" | "user_id"> = {
      name: data.name!,
      race: data.race || "",
      class: data.class || null,
      level: data.level || 1,
      gender: data.gender || null,
      avatar_url: data.avatar_url || null,
      archived: false,
      strength: finalScores.strength || null,
      dexterity: finalScores.dexterity || null,
      constitution: finalScores.constitution || null,
      intelligence: finalScores.intelligence || null,
      wisdom: finalScores.wisdom || null,
      charisma: finalScores.charisma || null,
      size: defaultSize,
      background: data.background || null,
      alignment: data.alignment || null,
      experience_points: data.experience_points || 0,
      carrying_capacity: carryingCapacity,
      preparation_notes: data.preparation_notes || null,
      racial_traits: racialTraits.length > 0 ? racialTraits : null,
      character_background: data.character_background || null,
      background_ability_bonuses: is2024 && Object.keys(abilityBonuses).length > 0 ? abilityBonuses : null,
      racial_ability_bonuses: is2014 && Object.keys(abilityBonuses).length > 0 ? abilityBonuses : null,
      subrace: is2014 ? (data.subrace || null) : null,
      rules_system: "5e_2024", // Siempre usar PHB 2024
      shop_bonuses: shopBonuses || null,
    }

    return this.createCharacter(characterData, userId)
  }

  /**
   * Actualiza un personaje recalculando valores dependientes
   * Recalcula capacidad de carga, aplica modificadores, etc.
   * @param characterId ID del personaje
   * @param updates Datos parciales a actualizar
   * @returns Personaje actualizado
   */
  async updateCharacterWithCalculations(
    characterId: string,
    updates: Partial<Character>
  ): Promise<Character> {
    ValidationUtils.validateId(characterId, "Character ID")

    // Obtener personaje actual
    const currentCharacter = await this.getCharacter(characterId)

    // Combinar actualizaciones con datos actuales
    const updatedData = { ...currentCharacter, ...updates }

    // Determinar sistema de reglas
    const rulesSystem = updatedData.rules_system || "5e_2024"
    const is2014 = rulesSystem === "5e_2014"
    const is2024 = rulesSystem === "5e_2024"

    // Si cambió el race, actualizar traits y tamaño por defecto según el sistema
    if (updates.race !== undefined && updates.race) {
      if (is2014) {
        // Sistema 2014: usar razas PHB 2014
        const race = RacialTraitService.getRace2014ById(updates.race)
        if (race) {
          // Aplicar traits de la raza si no se proporcionaron explícitamente
          if (!updates.racial_traits) {
            updates.racial_traits = race.traits
          }
          // Usar tamaño por defecto de la raza si no se proporcionó
          if (!updates.size) {
            updates.size = race.defaultSize
          }
        }
      } else {
        // Sistema 2024: usar Character Origins
        const origin = RacialTraitService.getOriginById(updates.race)
        if (origin) {
          // Aplicar traits del origin si no se proporcionaron explícitamente
          if (!updates.racial_traits) {
            updates.racial_traits = origin.traits
          }
          // Usar tamaño por defecto del origin si no se proporcionó
          if (!updates.size) {
            updates.size = origin.defaultSize
          }
        }
      }
    }

    // Si cambió el background (2024), actualizar bonificaciones
    if (is2024) {
      if (updates.character_background !== undefined && !updates.character_background) {
        // Si se elimina el background, limpiar las bonificaciones
        updates.background_ability_bonuses = null
      }

      // Aplicar bonificaciones del Background a los ability scores si hay cambios
      if (updates.background_ability_bonuses !== undefined || updates.character_background !== undefined) {
        const backgroundBonuses = updatedData.background_ability_bonuses || {}
        const baseScores: AbilityScores = {
          strength: updatedData.strength || null,
          dexterity: updatedData.dexterity || null,
          constitution: updatedData.constitution || null,
          intelligence: updatedData.intelligence || null,
          wisdom: updatedData.wisdom || null,
          charisma: updatedData.charisma || null,
        }
        const finalScores = RacialTraitService.applyAbilityBonuses(baseScores, backgroundBonuses)
        
        // Actualizar ability scores con bonificaciones aplicadas
        updates.strength = finalScores.strength || null
        updates.dexterity = finalScores.dexterity || null
        updates.constitution = finalScores.constitution || null
        updates.intelligence = finalScores.intelligence || null
        updates.wisdom = finalScores.wisdom || null
        updates.charisma = finalScores.charisma || null
      }
    }

    // Si cambió la raza/subraza (2014), actualizar bonificaciones
    if (is2014) {
      if (updates.race !== undefined || updates.subrace !== undefined || updates.racial_ability_bonuses !== undefined) {
        const raceId = updates.race || updatedData.race
        const subraceId = updates.subrace !== undefined ? updates.subrace : updatedData.subrace
        
        if (raceId) {
          // Si hay bonos manuales, usarlos; si no, calcular automáticamente
          let racialBonuses: Partial<AbilityScores> = {}
          
          if (updates.racial_ability_bonuses) {
            racialBonuses = updates.racial_ability_bonuses
          } else if (subraceId) {
            // Calcular automáticamente si hay subraza
            racialBonuses = RacialTraitService.getRacialAbilityBonuses2014(raceId, subraceId)
            updates.racial_ability_bonuses = racialBonuses
          } else {
            // Solo bonos base de la raza
            const race = RacialTraitService.getRace2014ById(raceId)
            if (race) {
              racialBonuses = race.baseAbilityBonuses
            }
          }

          // Aplicar bonificaciones a los ability scores base
          const baseScores: AbilityScores = {
            strength: updatedData.strength || null,
            dexterity: updatedData.dexterity || null,
            constitution: updatedData.constitution || null,
            intelligence: updatedData.intelligence || null,
            wisdom: updatedData.wisdom || null,
            charisma: updatedData.charisma || null,
          }
          const finalScores = RacialTraitService.applyAbilityBonuses(baseScores, racialBonuses)
          
          // Actualizar ability scores con bonificaciones aplicadas
          updates.strength = finalScores.strength || null
          updates.dexterity = finalScores.dexterity || null
          updates.constitution = finalScores.constitution || null
          updates.intelligence = finalScores.intelligence || null
          updates.wisdom = finalScores.wisdom || null
          updates.charisma = finalScores.charisma || null
        }
      }
    }

    // Recalcular capacidad de carga si cambió strength, size o traits
    if (updates.strength !== undefined || updates.size !== undefined || updates.racial_traits !== undefined) {
      const newCarryingCapacity = calculateCarryingCapacity(
        updatedData.strength || null,
        updatedData.size || "medium",
        updatedData.racial_traits || null
      )
      updates.carrying_capacity = newCarryingCapacity
    }

    // Actualizar bonificadores de compra/tienda si cambió race o traits
    if (updates.race !== undefined || updates.racial_traits !== undefined) {
      const shopBonuses = updatedData.race
        ? RacialTraitService.getShopBonuses(updatedData.race, updatedData.racial_traits || [])
        : null
      updates.shop_bonuses = shopBonuses || null
    }

    // Actualizar personaje
    return this.updateCharacter(characterId, updates)
  }
}

