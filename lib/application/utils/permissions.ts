import { ErrorService, ErrorCode } from "@/lib/infrastructure/errors"
import type { CampaignRepository } from "@/lib/infrastructure/repositories/campaign-repository"
import type { CampaignMemberRepository } from "@/lib/infrastructure/repositories/campaign-member-repository"
import type { CharacterRepository } from "@/lib/infrastructure/repositories/character-repository"
import { SupabaseCampaignRepository } from "@/lib/infrastructure/repositories/campaign-repository"
import { SupabaseCampaignMemberRepository } from "@/lib/infrastructure/repositories/campaign-member-repository"
import { SupabaseCharacterRepository } from "@/lib/infrastructure/repositories/character-repository"

/**
 * Helper central de permisos para validar acceso a recursos
 * Sigue el principio de Single Responsibility y es reutilizable en todos los servicios
 * 
 * NOTA: Esta implementación NO usa el sistema legacy de roles (game_master/player).
 * En su lugar, usa campaigns.game_master_id como fuente de verdad.
 */
export class PermissionUtils {
  private static campaignRepo: CampaignRepository = new SupabaseCampaignRepository()
  private static campaignMemberRepo: CampaignMemberRepository = new SupabaseCampaignMemberRepository()
  private static characterRepo: CharacterRepository = new SupabaseCharacterRepository()

  /**
   * Valida que un usuario es Game Master de una campaña
   * Usa campaigns.game_master_id como fuente de verdad (NO usa roles legacy)
   * 
   * @param userId ID del usuario
   * @param campaignId ID de la campaña
   * @throws AppError si el usuario no es Game Master
   */
  static async ensureGameMaster(userId: string, campaignId: string): Promise<void> {
    if (!userId || userId.trim() === "") {
      throw ErrorService.create(ErrorCode.VALIDATION_ERROR, "User ID is required")
    }

    if (!campaignId || campaignId.trim() === "") {
      throw ErrorService.create(ErrorCode.VALIDATION_ERROR, "Campaign ID is required")
    }

    // Obtener la campaña para verificar el game_master_id
    const campaign = await this.campaignRepo.getById(campaignId)
    
    if (!campaign) {
      throw ErrorService.create(ErrorCode.CAMPAIGN_NOT_FOUND)
    }

    // Verificar que el usuario es el creador de la campaña
    if (campaign.game_master_id !== userId) {
      throw ErrorService.create(
        ErrorCode.CAMPAIGN_ACCESS_DENIED,
        "Only the campaign creator can perform this action"
      )
    }
  }

  /**
   * Valida que un usuario tiene acceso a una campaña
   * El usuario debe ser el creador (GM) O un miembro con personaje asignado
   * 
   * @param userId ID del usuario
   * @param campaignId ID de la campaña
   * @throws AppError si el usuario no tiene acceso
   */
  static async ensureCampaignAccess(userId: string, campaignId: string): Promise<void> {
    if (!userId || userId.trim() === "") {
      throw ErrorService.create(ErrorCode.VALIDATION_ERROR, "User ID is required")
    }

    if (!campaignId || campaignId.trim() === "") {
      throw ErrorService.create(ErrorCode.VALIDATION_ERROR, "Campaign ID is required")
    }

    // Verificar si es el creador de la campaña
    const campaign = await this.campaignRepo.getById(campaignId)
    
    if (!campaign) {
      throw ErrorService.create(ErrorCode.CAMPAIGN_NOT_FOUND)
    }

    if (campaign.game_master_id === userId) {
      return // Es el creador, tiene acceso
    }

    // Verificar si es miembro con personaje asignado
    const member = await this.campaignMemberRepo.getByCampaignAndUser(campaignId, userId)
    
    if (!member || !member.character_id) {
      throw ErrorService.create(
        ErrorCode.CAMPAIGN_ACCESS_DENIED,
        "You must be a member of this campaign to perform this action"
      )
    }
  }

  /**
   * Valida que un usuario es dueño de un personaje
   * @param userId ID del usuario
   * @param characterId ID del personaje
   * @throws AppError si el usuario no es dueño del personaje
   */
  static async ensureCharacterOwner(userId: string, characterId: string): Promise<void> {
    if (!userId || userId.trim() === "") {
      throw ErrorService.create(ErrorCode.VALIDATION_ERROR, "User ID is required")
    }

    if (!characterId || characterId.trim() === "") {
      throw ErrorService.create(ErrorCode.VALIDATION_ERROR, "Character ID is required")
    }

    const character = await this.characterRepo.getById(characterId)
    
    if (!character) {
      throw ErrorService.create(ErrorCode.CHARACTER_NOT_FOUND)
    }

    if (character.user_id !== userId) {
      throw ErrorService.create(
        ErrorCode.CHARACTER_ACCESS_DENIED,
        "You can only access your own characters"
      )
    }
  }

  /**
   * Valida que un usuario tiene acceso a un personaje en el contexto de una campaña
   * El usuario debe ser:
   * - El dueño del personaje, O
   * - El Game Master de la campaña donde está el personaje
   * 
   * @param userId ID del usuario
   * @param characterId ID del personaje
   * @param campaignId ID de la campaña (opcional)
   * @throws AppError si el usuario no tiene acceso
   */
  static async ensureCharacterAccess(
    userId: string,
    characterId: string,
    campaignId?: string
  ): Promise<void> {
    if (!userId || userId.trim() === "") {
      throw ErrorService.create(ErrorCode.VALIDATION_ERROR, "User ID is required")
    }

    if (!characterId || characterId.trim() === "") {
      throw ErrorService.create(ErrorCode.VALIDATION_ERROR, "Character ID is required")
    }

    const character = await this.characterRepo.getById(characterId)
    
    if (!character) {
      throw ErrorService.create(ErrorCode.CHARACTER_NOT_FOUND)
    }

    // Si es el dueño del personaje, tiene acceso
    if (character.user_id === userId) {
      return
    }

    // Si hay campaignId, verificar si es el creador de esa campaña
    if (campaignId) {
      const campaign = await this.campaignRepo.getById(campaignId)
      if (campaign && campaign.game_master_id === userId) {
        return
      }
    }

    // Si no es dueño ni GM, denegar acceso
    throw ErrorService.create(
      ErrorCode.CHARACTER_ACCESS_DENIED,
      "You can only access your own characters or characters in campaigns you manage"
    )
  }

  /**
   * Valida que un usuario es miembro de una campaña con un personaje asignado
   * (No verifica roles legacy, solo que tenga un personaje en la campaña)
   * 
   * @param userId ID del usuario
   * @param campaignId ID de la campaña
   * @param characterId ID del personaje (opcional, si se proporciona valida que coincida)
   * @throws AppError si el usuario no es miembro o no tiene personaje asignado
   */
  static async ensureCampaignMemberWithCharacter(
    userId: string,
    campaignId: string,
    characterId?: string
  ): Promise<void> {
    if (!userId || userId.trim() === "") {
      throw ErrorService.create(ErrorCode.VALIDATION_ERROR, "User ID is required")
    }

    if (!campaignId || campaignId.trim() === "") {
      throw ErrorService.create(ErrorCode.VALIDATION_ERROR, "Campaign ID is required")
    }

    // Obtener el miembro de la campaña
    const member = await this.campaignMemberRepo.getByCampaignAndUser(campaignId, userId)
    
    if (!member) {
      throw ErrorService.create(
        ErrorCode.CAMPAIGN_ACCESS_DENIED,
        "You are not a member of this campaign"
      )
    }

    // Verificar que tiene un personaje asignado
    if (!member.character_id) {
      throw ErrorService.create(
        ErrorCode.CAMPAIGN_ACCESS_DENIED,
        "You must have a character assigned in this campaign"
      )
    }

    // Si se especificó characterId, validar que coincida
    if (characterId && member.character_id !== characterId) {
      throw ErrorService.create(
        ErrorCode.CAMPAIGN_ACCESS_DENIED,
        "This character is not assigned to you in this campaign"
      )
    }
  }

  /**
   * Verifica si un usuario es Game Master de una campaña (sin lanzar error)
   * Usa campaigns.game_master_id como fuente de verdad (NO usa roles legacy)
   * 
   * @param userId ID del usuario
   * @param campaignId ID de la campaña
   * @returns true si es el creador de la campaña, false en caso contrario
   */
  static async isGameMaster(userId: string, campaignId: string): Promise<boolean> {
    if (!userId || userId.trim() === "" || !campaignId || campaignId.trim() === "") {
      return false
    }

    try {
      const campaign = await this.campaignRepo.getById(campaignId)
      return campaign?.game_master_id === userId
    } catch {
      return false
    }
  }

  /**
   * Verifica si un usuario tiene acceso a una campaña (sin lanzar error)
   * El usuario tiene acceso si es el creador O es miembro con personaje asignado
   * 
   * @param userId ID del usuario
   * @param campaignId ID de la campaña
   * @returns true si tiene acceso, false en caso contrario
   */
  static async hasCampaignAccess(userId: string, campaignId: string): Promise<boolean> {
    if (!userId || userId.trim() === "" || !campaignId || campaignId.trim() === "") {
      return false
    }

    try {
      // Verificar si es el creador
      const campaign = await this.campaignRepo.getById(campaignId)
      if (campaign?.game_master_id === userId) {
        return true
      }

      // Verificar si es miembro con personaje
      const member = await this.campaignMemberRepo.getByCampaignAndUser(campaignId, userId)
      return member !== null && member.character_id !== null
    } catch {
      return false
    }
  }

  /**
   * Verifica si un usuario es dueño de un personaje (sin lanzar error)
   * @param userId ID del usuario
   * @param characterId ID del personaje
   * @returns true si es dueño, false en caso contrario
   */
  static async isCharacterOwner(userId: string, characterId: string): Promise<boolean> {
    if (!userId || userId.trim() === "" || !characterId || characterId.trim() === "") {
      return false
    }

    try {
      const character = await this.characterRepo.getById(characterId)
      return character?.user_id === userId
    } catch {
      return false
    }
  }
}
