import { createBrowserClient } from "@/lib/supabase/client"
import type { SupabaseClient } from "@supabase/supabase-js"
import { ErrorService, ErrorCode } from "@/lib/infrastructure/errors"
import type {
  CampaignMember,
  CreateCampaignMember,
  UpdateCampaignMember,
  CampaignMemberRole,
  CampaignMemberWithDetails,
} from "./campaign-repository.types"

// Re-export types for convenience
export type {
  CampaignMember,
  CreateCampaignMember,
  UpdateCampaignMember,
  CampaignMemberRole,
} from "./campaign-repository.types"

/**
 * Interfaz del repositorio de CampaignMembers
 * Define el contrato que deben cumplir todas las implementaciones
 */
export interface CampaignMemberRepository {
  /**
   * Obtiene un miembro por su ID
   */
  getById(memberId: string): Promise<CampaignMember | null>

  /**
   * Obtiene todos los miembros de una campaña
   */
  getByCampaignId(campaignId: string): Promise<CampaignMember[]>

  /**
   * Obtiene todos los miembros de un usuario
   */
  getByUserId(userId: string): Promise<CampaignMember[]>

  /**
   * Obtiene miembros de un personaje específico
   */
  getByCharacterId(characterId: string): Promise<CampaignMember[]>

  /**
   * Obtiene un miembro específico de una campaña y usuario
   */
  getByCampaignAndUser(campaignId: string, userId: string): Promise<CampaignMember | null>

  /**
   * Obtiene un miembro específico de una campaña, usuario y personaje
   */
  getByCampaignUserAndCharacter(
    campaignId: string,
    userId: string,
    characterId: string
  ): Promise<CampaignMember | null>

  /**
   * Agrega un nuevo miembro a una campaña
   */
  addMember(member: CreateCampaignMember): Promise<CampaignMember>

  /**
   * Actualiza el rol de un miembro
   */
  updateRole(memberId: string, role: CampaignMemberRole): Promise<CampaignMember>

  /**
   * Actualiza un miembro
   */
  update(memberId: string, updates: UpdateCampaignMember): Promise<CampaignMember>

  /**
   * Remueve un miembro de una campaña
   */
  removeMember(memberId: string): Promise<void>

  /**
   * Remueve un miembro por campaña, usuario y personaje
   */
  removeByCampaignUserAndCharacter(
    campaignId: string,
    userId: string,
    characterId: string | null
  ): Promise<void>

  /**
   * Valida si un usuario tiene acceso a una campaña
   */
  validateAccess(userId: string, campaignId: string): Promise<boolean>

  /**
   * Valida si un usuario es Game Master de una campaña
   */
  isGameMaster(userId: string, campaignId: string): Promise<boolean>

  /**
   * Obtiene miembros de una campaña con información enriquecida (perfiles y personajes)
   */
  getByCampaignIdWithDetails(campaignId: string): Promise<CampaignMemberWithDetails[]>
}

/**
 * Implementación de CampaignMemberRepository usando Supabase
 */
export class SupabaseCampaignMemberRepository implements CampaignMemberRepository {
  constructor(private supabase: SupabaseClient = createBrowserClient()) {}

  async getById(memberId: string): Promise<CampaignMember | null> {
    const { data, error } = await this.supabase
      .from("campaign_members")
      .select("*")
      .eq("id", memberId)
      .maybeSingle()

    if (error && error.code !== "PGRST116") {
      throw ErrorService.fromSupabaseError(error)
    }

    return data ? this.mapToCampaignMember(data) : null
  }

  async getByCampaignId(campaignId: string): Promise<CampaignMember[]> {
    const { data, error } = await this.supabase
      .from("campaign_members")
      .select("*")
      .eq("campaign_id", campaignId)
      .order("joined_at", { ascending: true })

    if (error) {
      throw ErrorService.fromSupabaseError(error)
    }

    return (data || []).map(this.mapToCampaignMember)
  }

  async getByUserId(userId: string): Promise<CampaignMember[]> {
    const { data, error } = await this.supabase
      .from("campaign_members")
      .select("*")
      .eq("user_id", userId)
      .order("joined_at", { ascending: false })

    if (error) {
      throw ErrorService.fromSupabaseError(error)
    }

    return (data || []).map(this.mapToCampaignMember)
  }

  async getByCharacterId(characterId: string): Promise<CampaignMember[]> {
    const { data, error } = await this.supabase
      .from("campaign_members")
      .select("*")
      .eq("character_id", characterId)
      .order("joined_at", { ascending: false })

    if (error) {
      throw ErrorService.fromSupabaseError(error)
    }

    return (data || []).map(this.mapToCampaignMember)
  }

  async getByCampaignAndUser(
    campaignId: string,
    userId: string
  ): Promise<CampaignMember | null> {
    const { data, error } = await this.supabase
      .from("campaign_members")
      .select("*")
      .eq("campaign_id", campaignId)
      .eq("user_id", userId)
      .maybeSingle()

    if (error && error.code !== "PGRST116") {
      throw ErrorService.fromSupabaseError(error)
    }

    return data ? this.mapToCampaignMember(data) : null
  }

  async getByCampaignUserAndCharacter(
    campaignId: string,
    userId: string,
    characterId: string
  ): Promise<CampaignMember | null> {
    const { data, error } = await this.supabase
      .from("campaign_members")
      .select("*")
      .eq("campaign_id", campaignId)
      .eq("user_id", userId)
      .eq("character_id", characterId)
      .maybeSingle()

    if (error && error.code !== "PGRST116") {
      throw ErrorService.fromSupabaseError(error)
    }

    return data ? this.mapToCampaignMember(data) : null
  }

  async addMember(member: CreateCampaignMember): Promise<CampaignMember> {
    const { data, error } = await this.supabase
      .from("campaign_members")
      .insert(member)
      .select()
      .single()

    if (error) {
      throw ErrorService.fromSupabaseError(error)
    }

    if (!data) {
      throw ErrorService.create(ErrorCode.VALIDATION_ERROR, "Failed to create campaign member")
    }

    return this.mapToCampaignMember(data)
  }

  async updateRole(memberId: string, role: CampaignMemberRole): Promise<CampaignMember> {
    return this.update(memberId, { role })
  }

  async update(memberId: string, updates: UpdateCampaignMember): Promise<CampaignMember> {
    const { data, error } = await this.supabase
      .from("campaign_members")
      .update(updates)
      .eq("id", memberId)
      .select()
      .single()

    if (error) {
      throw ErrorService.fromSupabaseError(error)
    }

    if (!data) {
      throw ErrorService.create(ErrorCode.CAMPAIGN_ACCESS_DENIED)
    }

    return this.mapToCampaignMember(data)
  }

  async removeMember(memberId: string): Promise<void> {
    const { error } = await this.supabase
      .from("campaign_members")
      .delete()
      .eq("id", memberId)

    if (error) {
      throw ErrorService.fromSupabaseError(error)
    }
  }

  async removeByCampaignUserAndCharacter(
    campaignId: string,
    userId: string,
    characterId: string | null
  ): Promise<void> {
    let query = this.supabase
      .from("campaign_members")
      .delete()
      .eq("campaign_id", campaignId)
      .eq("user_id", userId)

    if (characterId !== null) {
      query = query.eq("character_id", characterId)
    } else {
      query = query.is("character_id", null)
    }

    const { error } = await query

    if (error) {
      throw ErrorService.fromSupabaseError(error)
    }
  }

  async validateAccess(userId: string, campaignId: string): Promise<boolean> {
    const member = await this.getByCampaignAndUser(campaignId, userId)
    return member !== null
  }

  async isGameMaster(userId: string, campaignId: string): Promise<boolean> {
    const member = await this.getByCampaignAndUser(campaignId, userId)
    return member?.role === "game_master" || false
  }

  async getByCampaignIdWithDetails(campaignId: string): Promise<CampaignMemberWithDetails[]> {
    const members = await this.getByCampaignId(campaignId)

    if (members.length === 0) {
      return []
    }

    // Extraer IDs únicos
    const userIds = [...new Set(members.map((m) => m.user_id).filter((id): id is string => id !== null))]
    const characterIds = members
      .map((m) => m.character_id)
      .filter((id): id is string => id !== null)

    // Cargar perfiles
    const profilesPromise =
      userIds.length > 0
        ? this.supabase
            .from("profiles")
            .select("id, display_name")
            .in("id", userIds)
        : Promise.resolve({ data: [], error: null })

    // Cargar personajes (intentar RPC primero, fallback a query directa)
    let charactersPromise: Promise<{ data: any[] | null; error: any }>
    if (characterIds.length > 0) {
      charactersPromise = this.supabase
        .rpc("get_campaign_character_names", {
          campaign_uuid: campaignId,
          character_ids: characterIds,
        })
        .then((result: { data: any[] | null; error: any }) => {
          if (result.error) {
            // Fallback: query directa (limitada por RLS)
            return this.supabase.from("characters").select("id, name").in("id", characterIds)
          }
          return result
        })
    } else {
      charactersPromise = Promise.resolve({ data: [], error: null })
    }

    const [profilesResult, charactersResult] = await Promise.all([
      profilesPromise,
      charactersPromise,
    ])

    // Enriquecer miembros con información de perfiles y personajes
    const enrichedMembers: CampaignMemberWithDetails[] = members.map((member) => {
      const profile = profilesResult.data?.find((p: any) => p.id === member.user_id)
      const character = member.character_id
        ? charactersResult.data?.find((c: any) => c.id === member.character_id)
        : null

      return {
        ...member,
        user_display_name: profile?.display_name || null,
        character_name: character?.name || null,
      }
    })

    return enrichedMembers
  }

  /**
   * Mapea los datos de Supabase a CampaignMember
   */
  private mapToCampaignMember(data: any): CampaignMember {
    return {
      id: data.id,
      campaign_id: data.campaign_id,
      user_id: data.user_id,
      character_id: data.character_id || null,
      role: data.role || "player",
      joined_at: data.joined_at,
    }
  }
}

