import {
  SupabaseCampaignRepository,
  type CampaignRepository,
  type Campaign,
  type CreateCampaign,
  type UpdateCampaign,
} from "@/lib/infrastructure/repositories/campaign-repository"
import {
  SupabaseCampaignMemberRepository,
  type CampaignMemberRepository,
  type CampaignMember,
  type CreateCampaignMember,
  type CampaignMemberRole,
} from "@/lib/infrastructure/repositories/campaign-member-repository"
import type { CampaignMemberWithDetails } from "@/lib/infrastructure/repositories/campaign-repository.types"
import type { Character } from "@/lib/infrastructure/repositories/character-repository"
import { ErrorService, ErrorCode } from "@/lib/infrastructure/errors"
import { ValidationUtils } from "../utils/validation"
import { CharacterService } from "./character-service"

/**
 * Servicio de aplicación para manejo de campañas
 * Contiene la lógica de negocio relacionada con campañas y miembros
 */
export class CampaignService {
  constructor(
    private campaignRepo: CampaignRepository = new SupabaseCampaignRepository(),
    private memberRepo: CampaignMemberRepository = new SupabaseCampaignMemberRepository(),
    private characterService: CharacterService = new CharacterService()
  ) {}

  /**
   * Obtiene una campaña por su ID
   */
  async getCampaign(campaignId: string): Promise<Campaign> {
    ValidationUtils.validateId(campaignId, "Campaign ID")

    const campaign = await this.campaignRepo.getById(campaignId)
    if (!campaign) {
      throw ErrorService.create(ErrorCode.CAMPAIGN_NOT_FOUND)
    }

    return campaign
  }

  /**
   * Obtiene todas las campañas de un usuario
   */
  async getUserCampaigns(userId: string): Promise<Campaign[]> {
    ValidationUtils.validateId(userId, "User ID")
    return this.campaignRepo.getByUserId(userId)
  }

  /**
   * Obtiene campañas donde el usuario es Game Master
   */
  async getCampaignsAsGM(userId: string): Promise<Campaign[]> {
    ValidationUtils.validateId(userId, "User ID")
    return this.campaignRepo.getByGameMaster(userId)
  }

  /**
   * Obtiene una campaña por código de invitación
   */
  async getCampaignByInviteCode(inviteCode: string): Promise<Campaign> {
    ValidationUtils.validateNonEmptyString(inviteCode, "Invite code")

    const campaign = await this.campaignRepo.getByInviteCode(inviteCode)
    if (!campaign) {
      throw ErrorService.create(ErrorCode.CAMPAIGN_NOT_FOUND, undefined, "Invalid invite code")
    }

    return campaign
  }

  /**
   * Crea una nueva campaña y agrega automáticamente al creador como GM
   */
  async createCampaign(
    campaignData: CreateCampaign,
    userId: string
  ): Promise<{ campaign: Campaign; member: CampaignMember }> {
    ValidationUtils.validateId(userId, "User ID")
    ValidationUtils.validateNonEmptyString(campaignData.name, "Campaign name")

    // Asegurar que el game_master_id sea el usuario actual
    const campaignToCreate: CreateCampaign = {
      ...campaignData,
      game_master_id: userId,
      status: campaignData.status || "active",
    }

    // Crear la campaña
    const campaign = await this.campaignRepo.create(campaignToCreate)

    // Agregar automáticamente al creador como Game Master
    const member = await this.memberRepo.addMember({
      campaign_id: campaign.id,
      user_id: userId,
      character_id: null, // GM no tiene character_id
      role: "game_master",
    })

    return { campaign, member }
  }

  /**
   * Actualiza una campaña (solo el GM puede hacerlo)
   */
  async updateCampaign(
    campaignId: string,
    updates: UpdateCampaign,
    userId: string
  ): Promise<Campaign> {
    ValidationUtils.validateId(campaignId, "Campaign ID")
    ValidationUtils.validateId(userId, "User ID")

    // Validar que el usuario es el GM
    const isGM = await this.memberRepo.isGameMaster(userId, campaignId)
    if (!isGM) {
      throw ErrorService.create(ErrorCode.CAMPAIGN_ACCESS_DENIED, "Only the Game Master can update campaigns")
    }

    return this.campaignRepo.update(campaignId, updates)
  }

  /**
   * Archiva una campaña (equivalente a "desactivar" en personajes)
   * Solo el GM puede hacerlo.
   */
  async archiveCampaign(campaignId: string, userId: string): Promise<Campaign> {
    return this.updateCampaign(campaignId, { status: "archived" }, userId)
  }

  /**
   * Reactiva una campaña archivada
   * Solo el GM puede hacerlo.
   */
  async unarchiveCampaign(campaignId: string, userId: string): Promise<Campaign> {
    return this.updateCampaign(campaignId, { status: "active" }, userId)
  }

  /**
   * Elimina una campaña (solo el GM puede hacerlo)
   */
  async deleteCampaign(campaignId: string, userId: string): Promise<void> {
    ValidationUtils.validateId(campaignId, "Campaign ID")
    ValidationUtils.validateId(userId, "User ID")

    // Validar que el usuario es el GM
    const isGM = await this.memberRepo.isGameMaster(userId, campaignId)
    if (!isGM) {
      throw ErrorService.create(ErrorCode.CAMPAIGN_ACCESS_DENIED, "Only the Game Master can delete campaigns")
    }

    await this.campaignRepo.delete(campaignId)
  }

  /**
   * Genera un nuevo código de invitación para una campaña
   */
  async generateInviteCode(campaignId: string, userId: string): Promise<Campaign> {
    ValidationUtils.validateId(campaignId, "Campaign ID")
    ValidationUtils.validateId(userId, "User ID")

    // Validar que el usuario es el GM
    const isGM = await this.memberRepo.isGameMaster(userId, campaignId)
    if (!isGM) {
      throw ErrorService.create(ErrorCode.CAMPAIGN_ACCESS_DENIED, "Only the Game Master can generate invite codes")
    }

    return this.campaignRepo.generateInviteCode(campaignId)
  }

  /**
   * Obtiene todos los miembros de una campaña
   */
  async getCampaignMembers(campaignId: string): Promise<CampaignMember[]> {
    ValidationUtils.validateId(campaignId, "Campaign ID")
    return this.memberRepo.getByCampaignId(campaignId)
  }

  /**
   * Obtiene miembros de una campaña con información enriquecida (perfiles y personajes)
   */
  async getCampaignMembersWithDetails(campaignId: string): Promise<CampaignMemberWithDetails[]> {
    ValidationUtils.validateId(campaignId, "Campaign ID")
    return this.memberRepo.getByCampaignIdWithDetails(campaignId)
  }

  /**
   * Obtiene miembros de un usuario
   */
  async getUserMembers(userId: string): Promise<CampaignMember[]> {
    ValidationUtils.validateId(userId, "User ID")
    return this.memberRepo.getByUserId(userId)
  }

  /**
   * Obtiene miembros de un personaje
   */
  async getCharacterMembers(characterId: string): Promise<CampaignMember[]> {
    ValidationUtils.validateId(characterId, "Character ID")
    return this.memberRepo.getByCharacterId(characterId)
  }

  /**
   * Obtiene el personaje de un jugador en una campaña específica
   * @param campaignId ID de la campaña
   * @param userId ID del usuario
   * @returns El personaje del jugador en esa campaña, o null si no es jugador o no tiene personaje asignado
   */
  async getPlayerCharacterInCampaign(campaignId: string, userId: string): Promise<Character | null> {
    ValidationUtils.validateId(campaignId, "Campaign ID")
    ValidationUtils.validateId(userId, "User ID")

    // Obtener el miembro de la campaña
    const member = await this.memberRepo.getByCampaignAndUser(campaignId, userId)
    
    if (!member) {
      return null
    }

    // Si no es jugador, retornar null (los GMs no tienen character_id)
    if (member.role !== "player") {
      return null
    }

    // Si no tiene character_id, retornar null
    if (!member.character_id) {
      return null
    }

    // Obtener el personaje completo
    try {
      return await this.characterService.getCharacter(member.character_id)
    } catch (error) {
      // Si el personaje no existe, retornar null
      return null
    }
  }

  /**
   * Agrega un miembro a una campaña (unirse como player)
   */
  async joinCampaign(
    campaignId: string,
    userId: string,
    characterId: string | null
  ): Promise<CampaignMember> {
    ValidationUtils.validateId(campaignId, "Campaign ID")
    ValidationUtils.validateId(userId, "User ID")

    // Validar que la campaña existe
    await this.getCampaign(campaignId)

    // Verificar si el usuario ya es miembro
    const existingMember = await this.memberRepo.getByCampaignUserAndCharacter(
      campaignId,
      userId,
      characterId || ""
    )

    if (existingMember) {
      throw ErrorService.create(ErrorCode.VALIDATION_ERROR, "User is already a member of this campaign")
    }

    // Verificar si el usuario ya es GM (no puede unirse como player)
    const isGM = await this.memberRepo.isGameMaster(userId, campaignId)
    if (isGM) {
      throw ErrorService.create(ErrorCode.VALIDATION_ERROR, "Game Master cannot join as a player")
    }

    // Agregar como player
    return this.memberRepo.addMember({
      campaign_id: campaignId,
      user_id: userId,
      character_id: characterId,
      role: "player",
    })
  }

  /**
   * Agrega un miembro a una campaña usando código de invitación
   */
  async joinCampaignByInviteCode(
    inviteCode: string,
    userId: string,
    characterId: string | null
  ): Promise<{ campaign: Campaign; member: CampaignMember }> {
    ValidationUtils.validateNonEmptyString(inviteCode, "Invite code")
    ValidationUtils.validateId(userId, "User ID")

    // Obtener la campaña por código de invitación
    const campaign = await this.getCampaignByInviteCode(inviteCode)

    // Unirse a la campaña
    const member = await this.joinCampaign(campaign.id, userId, characterId)

    return { campaign, member }
  }

  /**
   * Agrega un miembro a una campaña (solo GM puede hacerlo)
   */
  async addMember(
    campaignId: string,
    userId: string,
    characterId: string | null,
    role: CampaignMemberRole,
    gmUserId: string
  ): Promise<CampaignMember> {
    ValidationUtils.validateId(campaignId, "Campaign ID")
    ValidationUtils.validateId(userId, "User ID")
    ValidationUtils.validateId(gmUserId, "Game Master User ID")

    // Validar que el usuario que hace la acción es el GM
    const isGM = await this.memberRepo.isGameMaster(gmUserId, campaignId)
    if (!isGM) {
      throw ErrorService.create(ErrorCode.CAMPAIGN_ACCESS_DENIED, "Only the Game Master can add members")
    }

    // Verificar si el usuario ya es miembro
    const existingMember = characterId
      ? await this.memberRepo.getByCampaignUserAndCharacter(campaignId, userId, characterId)
      : await this.memberRepo.getByCampaignAndUser(campaignId, userId)

    if (existingMember) {
      throw ErrorService.create(ErrorCode.VALIDATION_ERROR, "User is already a member of this campaign")
    }

    return this.memberRepo.addMember({
      campaign_id: campaignId,
      user_id: userId,
      character_id: characterId,
      role,
    })
  }

  /**
   * Remueve un miembro de una campaña
   */
  async removeMember(
    memberId: string,
    userId: string,
    campaignId: string
  ): Promise<void> {
    ValidationUtils.validateId(memberId, "Member ID")
    ValidationUtils.validateId(userId, "User ID")

    // Obtener el miembro
    const member = await this.memberRepo.getById(memberId)
    if (!member) {
      throw ErrorService.create(ErrorCode.CAMPAIGN_ACCESS_DENIED, "Member not found")
    }

    // Validar acceso: el usuario puede remover si:
    // 1. Es el GM de la campaña, o
    // 2. Está removiéndose a sí mismo
    const isGM = await this.memberRepo.isGameMaster(userId, campaignId)
    const isRemovingSelf = member.user_id === userId

    if (!isGM && !isRemovingSelf) {
      throw ErrorService.create(ErrorCode.CAMPAIGN_ACCESS_DENIED, "You can only remove yourself or be removed by the Game Master")
    }

    // No permitir que el GM se remueva a sí mismo
    if (isGM && member.role === "game_master" && member.user_id === userId) {
      throw ErrorService.create(ErrorCode.VALIDATION_ERROR, "Game Master cannot remove themselves")
    }

    await this.memberRepo.removeMember(memberId)
  }

  /**
   * Remueve un miembro por campaña, usuario y personaje
   */
  async leaveCampaign(
    campaignId: string,
    userId: string,
    characterId: string | null
  ): Promise<void> {
    ValidationUtils.validateId(campaignId, "Campaign ID")
    ValidationUtils.validateId(userId, "User ID")

    // Verificar si el usuario es GM
    const isGM = await this.memberRepo.isGameMaster(userId, campaignId)
    if (isGM) {
      throw ErrorService.create(ErrorCode.VALIDATION_ERROR, "Game Master cannot leave the campaign")
    }

    await this.memberRepo.removeByCampaignUserAndCharacter(campaignId, userId, characterId)
  }

  /**
   * Actualiza el rol de un miembro (solo GM puede hacerlo)
   */
  async updateMemberRole(
    memberId: string,
    role: CampaignMemberRole,
    gmUserId: string,
    campaignId: string
  ): Promise<CampaignMember> {
    ValidationUtils.validateId(memberId, "Member ID")
    ValidationUtils.validateId(gmUserId, "Game Master User ID")

    // Validar que el usuario es el GM
    const isGM = await this.memberRepo.isGameMaster(gmUserId, campaignId)
    if (!isGM) {
      throw ErrorService.create(ErrorCode.CAMPAIGN_ACCESS_DENIED, "Only the Game Master can update member roles")
    }

    // No permitir cambiar el rol del GM
    const member = await this.memberRepo.getById(memberId)
    if (member && member.role === "game_master") {
      throw ErrorService.create(ErrorCode.VALIDATION_ERROR, "Cannot change Game Master role")
    }

    return this.memberRepo.updateRole(memberId, role)
  }

  /**
   * Valida si un usuario tiene acceso a una campaña
   */
  async validateAccess(userId: string, campaignId: string): Promise<boolean> {
    if (!userId || userId.trim() === "" || !campaignId || campaignId.trim() === "") {
      return false
    }

    return this.memberRepo.validateAccess(userId, campaignId)
  }

  /**
   * Valida si un usuario es Game Master de una campaña
   */
  async isGameMaster(userId: string, campaignId: string): Promise<boolean> {
    if (!userId || userId.trim() === "" || !campaignId || campaignId.trim() === "") {
      return false
    }

    return this.memberRepo.isGameMaster(userId, campaignId)
  }
}

