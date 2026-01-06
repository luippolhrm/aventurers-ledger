import {
  SupabaseNpcRepository,
  type NpcRepository,
  type Npc,
  type CreateNpc,
  type UpdateNpc,
} from "@/lib/infrastructure/repositories/npc-repository"
import { CampaignService } from "./campaign-service"
import { ErrorService, ErrorCode } from "@/lib/infrastructure/errors"
import { ValidationUtils } from "../utils/validation"

/**
 * Servicio de aplicación para gestión de NPCs
 * Maneja la lógica de negocio relacionada con NPCs
 */
export class NpcService {
  constructor(
    private npcRepo: NpcRepository = new SupabaseNpcRepository(),
    private campaignService: CampaignService = new CampaignService()
  ) {}

  /**
   * Obtiene un NPC por su ID
   */
  async getNpc(npcId: string): Promise<Npc> {
    ValidationUtils.validateId(npcId, "NPC ID")

    const npc = await this.npcRepo.getById(npcId)
    if (!npc) {
      throw ErrorService.create(ErrorCode.NOT_FOUND, "NPC not found")
    }

    return npc
  }

  /**
   * Obtiene todos los NPCs de una campaña
   */
  async getNpcsByCampaign(campaignId: string): Promise<Npc[]> {
    ValidationUtils.validateId(campaignId, "Campaign ID")
    return this.npcRepo.getByCampaignId(campaignId)
  }

  /**
   * Crea un nuevo NPC
   * Valida que el usuario tenga acceso a la campaña
   */
  async createNpc(npc: CreateNpc, userId: string): Promise<Npc> {
    ValidationUtils.validateId(npc.campaign_id, "Campaign ID")
    ValidationUtils.validateNonEmptyString(npc.name, "NPC name")

    // Verificar que el usuario es GM de la campaña
    const isGM = await this.campaignService.isGameMaster(userId, npc.campaign_id)
    if (!isGM) {
      throw ErrorService.create(ErrorCode.FORBIDDEN, "Only Game Masters can create NPCs")
    }

    return this.npcRepo.create(npc)
  }

  /**
   * Actualiza un NPC
   * Valida que el usuario tenga acceso a la campaña
   */
  async updateNpc(npcId: string, updates: UpdateNpc, userId: string): Promise<Npc> {
    ValidationUtils.validateId(npcId, "NPC ID")

    // Obtener el NPC para verificar la campaña
    const npc = await this.getNpc(npcId)

    // Verificar que el usuario es GM de la campaña
    const isGM = await this.campaignService.isGameMaster(userId, npc.campaign_id)
    if (!isGM) {
      throw ErrorService.create(ErrorCode.FORBIDDEN, "Only Game Masters can update NPCs")
    }

    return this.npcRepo.update(npcId, updates)
  }

  /**
   * Elimina un NPC
   * Valida que el usuario tenga acceso a la campaña
   */
  async deleteNpc(npcId: string, userId: string): Promise<void> {
    ValidationUtils.validateId(npcId, "NPC ID")

    // Obtener el NPC para verificar la campaña
    const npc = await this.getNpc(npcId)

    // Verificar que el usuario es GM de la campaña
    const isGM = await this.campaignService.isGameMaster(userId, npc.campaign_id)
    if (!isGM) {
      throw ErrorService.create(ErrorCode.FORBIDDEN, "Only Game Masters can delete NPCs")
    }

    return this.npcRepo.delete(npcId)
  }
}

