import { createBrowserClient } from "@/lib/supabase/client"
import type { SupabaseClient } from "@supabase/supabase-js"
import { ErrorService, ErrorCode } from "@/lib/infrastructure/errors"

export interface Character {
  id: string
  name: string
  race: string
  class?: string | null
  description?: string | null
  level?: number | null
  gender?: string | null
  avatar_url?: string | null
  user_id: string
  archived: boolean
  created_at: string
  updated_at?: string | null
  // D&D 5e Ability Scores
  strength?: number | null
  dexterity?: number | null
  constitution?: number | null
  intelligence?: number | null
  wisdom?: number | null
  charisma?: number | null
  // Character size (affects carrying capacity)
  size?: "small" | "medium" | "large" | null
  // Background and alignment
  background?: string | null
  alignment?: string | null
  experience_points?: number | null
  // Carrying capacity (already exists from script 036)
  carrying_capacity?: number | null
  // Preparation notes (already exists from script 036)
  preparation_notes?: string | null
  // Traits raciales (D&D 2024)
  racial_traits?: string[] | null
  // Background (D&D 2024)
  character_background?: string | null
  // Bonificaciones de Background (D&D 2024)
  background_ability_bonuses?: {
    strength?: number | null
    dexterity?: number | null
    constitution?: number | null
    intelligence?: number | null
    wisdom?: number | null
    charisma?: number | null
  } | null
  // Bonificaciones de Raza (D&D 2014)
  racial_ability_bonuses?: {
    strength?: number | null
    dexterity?: number | null
    constitution?: number | null
    intelligence?: number | null
    wisdom?: number | null
    charisma?: number | null
  } | null
  // Subraza (D&D 2014)
  subrace?: string | null
  // Linaje seleccionado (D&D 2024, para especies con linajes como Elfos)
  selected_lineage?: string | null
  // Campos específicos de Humanos (D&D 2024)
  human_skill_proficiency?: string | null // Habilidad seleccionada para "Diestro"
  selected_origin_feat?: string | null // Dote de origen seleccionada para "Versátil"
  // Campo específico de Goliat (D&D 2024)
  goliath_giant_lineage?: string | null // Linaje gigante seleccionado ("fire", "hill", "cloud", "frost", "stone", "storm")
  // Sistema de reglas
  rules_system?: "5e_2014" | "5e_2024" | null
  // Bonificadores de compra/tienda (referencia)
  shop_bonuses?: {
    discount_percent?: number
    negotiation_bonus?: number
    // Otros bonificadores posibles
  } | null
}

export interface CharacterWithCampaign extends Character {
  campaignName: string
  campaignId: string
}

export interface CharactersByStatus {
  assigned: CharacterWithCampaign[]
  free: Character[]
}

export interface CharacterRepository {
  getById(characterId: string): Promise<Character | null>
  getByUserId(userId: string, includeArchived?: boolean): Promise<Character[]>
  /**
   * Obtiene todos los personajes (sin filtrar por usuario)
   * Útil para casos como transferencias entre personajes de diferentes usuarios
   * @param includeArchived Si incluir personajes archivados (default: false)
   * @returns Array de personajes
   */
  getAll(includeArchived?: boolean): Promise<Character[]>
  /**
   * Obtiene personajes divididos en asignados (en campañas) y libres
   * @param userId ID del usuario
   * @returns Objeto con arrays de personajes asignados y libres
   */
  getByStatus(userId: string): Promise<CharactersByStatus>
  create(character: Omit<Character, "id" | "created_at" | "updated_at">): Promise<Character>
  update(characterId: string, updates: Partial<Character>): Promise<Character>
  archive(characterId: string): Promise<void>
  unarchive(characterId: string): Promise<void>
}

export class SupabaseCharacterRepository implements CharacterRepository {
  constructor(private supabase: SupabaseClient = createBrowserClient()) {}

  async getById(characterId: string): Promise<Character | null> {
    const { data, error } = await this.supabase
      .from("characters")
      .select("*")
      .eq("id", characterId)
      .maybeSingle()

    if (error && error.code !== "PGRST116") {
      throw ErrorService.fromSupabaseError(error)
    }

    return data as Character | null
  }

  async getByUserId(
    userId: string,
    includeArchived = false
  ): Promise<Character[]> {
    let query = this.supabase
      .from("characters")
      .select("*")
      .eq("user_id", userId)

    if (!includeArchived) {
      query = query.eq("archived", false)
    }

    const { data, error } = await query.order("created_at", { ascending: true })

    if (error) {
      throw ErrorService.fromSupabaseError(error)
    }

    return (data || []) as Character[]
  }

  async getAll(includeArchived = false): Promise<Character[]> {
    let query = this.supabase.from("characters").select("*")

    if (!includeArchived) {
      query = query.eq("archived", false)
    }

    const { data, error } = await query.order("name", { ascending: true })

    if (error) {
      throw ErrorService.fromSupabaseError(error)
    }

    return (data || []) as Character[]
  }

  async getByStatus(userId: string): Promise<CharactersByStatus> {
    // Obtener todos los personajes del usuario (no archivados)
    const allCharacters = await this.getByUserId(userId, false)

    // Obtener personajes asignados a campañas con información de la campaña
    const { data: assignedData, error: assignedError } = await this.supabase
      .from("campaign_members")
      .select(
        `
        character_id,
        campaign_id,
        campaigns!inner (
          id,
          name
        )
      `
      )
      .eq("user_id", userId)
      .not("character_id", "is", null)

    if (assignedError) {
      throw ErrorService.fromSupabaseError(assignedError)
    }

    // Crear mapa de character_id -> campaign info
    const assignedMap = new Map<
      string,
      { campaignId: string; campaignName: string }
    >()
    if (assignedData) {
      for (const member of assignedData) {
        if (member.character_id && member.campaigns) {
          assignedMap.set(member.character_id, {
            campaignId: member.campaign_id,
            campaignName: (member.campaigns as any).name,
          })
        }
      }
    }

    // Dividir personajes en asignados y libres
    const assigned: CharacterWithCampaign[] = []
    const free: Character[] = []

    for (const character of allCharacters) {
      const campaignInfo = assignedMap.get(character.id)
      if (campaignInfo) {
        assigned.push({
          ...character,
          campaignId: campaignInfo.campaignId,
          campaignName: campaignInfo.campaignName,
        })
      } else {
        free.push(character)
      }
    }

    return { assigned, free }
  }

  async create(
    character: Omit<Character, "id" | "created_at" | "updated_at">
  ): Promise<Character> {
    const { data, error } = await this.supabase
      .from("characters")
      .insert(character)
      .select()
      .single()

    if (error) {
      throw ErrorService.fromSupabaseError(error)
    }

    if (!data) {
      throw ErrorService.create(ErrorCode.CHARACTER_NOT_FOUND)
    }

    return data as Character
  }

  async update(
    characterId: string,
    updates: Partial<Character>
  ): Promise<Character> {
    const { data, error } = await this.supabase
      .from("characters")
      .update(updates)
      .eq("id", characterId)
      .select()
      .single()

    if (error) {
      throw ErrorService.fromSupabaseError(error)
    }

    if (!data) {
      throw ErrorService.create(ErrorCode.CHARACTER_NOT_FOUND)
    }

    return data as Character
  }

  async archive(characterId: string): Promise<void> {
    const { error } = await this.supabase
      .from("characters")
      .update({ archived: true })
      .eq("id", characterId)

    if (error) {
      throw ErrorService.fromSupabaseError(error)
    }
  }

  async unarchive(characterId: string): Promise<void> {
    const { error } = await this.supabase
      .from("characters")
      .update({ archived: false })
      .eq("id", characterId)

    if (error) {
      throw ErrorService.fromSupabaseError(error)
    }
  }
}

