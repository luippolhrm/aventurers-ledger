import { createBrowserClient } from "@/lib/supabase/client"
import type { SupabaseClient } from "@supabase/supabase-js"
import { ErrorService, ErrorCode } from "@/lib/infrastructure/errors"
import type { Campaign, CreateCampaign, UpdateCampaign, CampaignStatus } from "./campaign-repository.types"

// Re-export types for convenience
export type { Campaign, CreateCampaign, UpdateCampaign, CampaignStatus } from "./campaign-repository.types"

/**
 * Interfaz del repositorio de Campaigns
 * Define el contrato que deben cumplir todas las implementaciones
 */
export interface CampaignRepository {
  /**
   * Obtiene una campaña por su ID
   */
  getById(campaignId: string): Promise<Campaign | null>

  /**
   * Obtiene todas las campañas de un usuario (como GM o como Player)
   */
  getByUserId(userId: string): Promise<Campaign[]>

  /**
   * Obtiene campañas donde el usuario es Game Master
   */
  getByGameMaster(userId: string): Promise<Campaign[]>

  /**
   * Obtiene una campaña por su código de invitación
   */
  getByInviteCode(inviteCode: string): Promise<Campaign | null>

  /**
   * Crea una nueva campaña
   */
  create(campaign: CreateCampaign): Promise<Campaign>

  /**
   * Actualiza una campaña
   */
  update(campaignId: string, updates: UpdateCampaign): Promise<Campaign>

  /**
   * Elimina una campaña
   */
  delete(campaignId: string): Promise<void>

  /**
   * Genera un nuevo código de invitación para una campaña
   */
  generateInviteCode(campaignId: string): Promise<Campaign>
}

/**
 * Implementación de CampaignRepository usando Supabase
 */
export class SupabaseCampaignRepository implements CampaignRepository {
  constructor(private supabase: SupabaseClient = createBrowserClient()) {}

  async getById(campaignId: string): Promise<Campaign | null> {
    const { data, error } = await this.supabase
      .from("campaigns")
      .select("*")
      .eq("id", campaignId)
      .maybeSingle()

    if (error && error.code !== "PGRST116") {
      throw ErrorService.fromSupabaseError(error)
    }

    return data ? this.mapToCampaign(data) : null
  }

  async getByUserId(userId: string): Promise<Campaign[]> {
    // Obtener campañas donde el usuario es miembro (GM o Player)
    // Esto requiere un join con campaign_members
    const { data: memberData, error: memberError } = await this.supabase
      .from("campaign_members")
      .select("campaign_id")
      .eq("user_id", userId)

    if (memberError) {
      throw ErrorService.fromSupabaseError(memberError)
    }

    if (!memberData || memberData.length === 0) {
      return []
    }

    const campaignIds = memberData.map((m) => m.campaign_id)

    const { data, error } = await this.supabase
      .from("campaigns")
      .select("*")
      .in("id", campaignIds)
      .order("created_at", { ascending: false })

    if (error) {
      throw ErrorService.fromSupabaseError(error)
    }

    return (data || []).map(this.mapToCampaign)
  }

  async getByGameMaster(userId: string): Promise<Campaign[]> {
    const { data, error } = await this.supabase
      .from("campaigns")
      .select("*")
      .eq("game_master_id", userId)
      .order("created_at", { ascending: false })

    if (error) {
      throw ErrorService.fromSupabaseError(error)
    }

    return (data || []).map(this.mapToCampaign)
  }

  async getByInviteCode(inviteCode: string): Promise<Campaign | null> {
    const { data, error } = await this.supabase
      .from("campaigns")
      .select("*")
      .eq("invite_code", inviteCode)
      .maybeSingle()

    if (error && error.code !== "PGRST116") {
      throw ErrorService.fromSupabaseError(error)
    }

    return data ? this.mapToCampaign(data) : null
  }

  async create(campaign: CreateCampaign): Promise<Campaign> {
    const { data, error } = await this.supabase
      .from("campaigns")
      .insert(campaign)
      .select()
      .single()

    if (error) {
      throw ErrorService.fromSupabaseError(error)
    }

    if (!data) {
      throw ErrorService.create(ErrorCode.CAMPAIGN_NOT_FOUND)
    }

    return this.mapToCampaign(data)
  }

  async update(campaignId: string, updates: UpdateCampaign): Promise<Campaign> {
    const { data, error } = await this.supabase
      .from("campaigns")
      .update(updates)
      .eq("id", campaignId)
      .select()
      .single()

    if (error) {
      throw ErrorService.fromSupabaseError(error)
    }

    if (!data) {
      throw ErrorService.create(ErrorCode.CAMPAIGN_NOT_FOUND)
    }

    return this.mapToCampaign(data)
  }

  async delete(campaignId: string): Promise<void> {
    const { error } = await this.supabase.from("campaigns").delete().eq("id", campaignId)

    if (error) {
      throw ErrorService.fromSupabaseError(error)
    }
  }

  async generateInviteCode(campaignId: string): Promise<Campaign> {
    // Generar un código único de 8 caracteres
    const generateCode = () => {
      return Math.random().toString(36).substring(2, 10).toUpperCase()
    }

    let inviteCode = generateCode()
    let attempts = 0
    const maxAttempts = 10

    // Verificar que el código sea único
    while (attempts < maxAttempts) {
      const existing = await this.getByInviteCode(inviteCode)
      if (!existing || existing.id === campaignId) {
        break
      }
      inviteCode = generateCode()
      attempts++
    }

    if (attempts >= maxAttempts) {
      throw ErrorService.create(
        ErrorCode.VALIDATION_ERROR,
        "Could not generate unique invite code"
      )
    }

    return this.update(campaignId, { invite_code: inviteCode })
  }

  /**
   * Mapea los datos de Supabase a Campaign
   */
  private mapToCampaign(data: any): Campaign {
    return {
      id: data.id,
      name: data.name,
      description: data.description || null,
      game_master_id: data.game_master_id,
      status: data.status || "active",
      invite_code: data.invite_code || "",
      created_at: data.created_at,
      updated_at: data.updated_at || null,
    }
  }
}

