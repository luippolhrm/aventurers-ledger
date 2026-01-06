import {
  SupabaseCharacterRepository,
  type CharacterRepository,
  type Character,
  type CharactersByStatus,
} from "@/lib/infrastructure/repositories/character-repository"
import { ErrorService, ErrorCode } from "@/lib/infrastructure/errors"
import { ValidationUtils } from "../utils/validation"

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
}

