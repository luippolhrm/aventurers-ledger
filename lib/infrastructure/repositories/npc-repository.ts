import { createBrowserClient } from "@/lib/supabase/client"
import type { SupabaseClient } from "@supabase/supabase-js"
import { ErrorService, ErrorCode } from "@/lib/infrastructure/errors"
import type { Npc, CreateNpc, UpdateNpc } from "./npc-repository.types"

// Re-export types
export type { Npc, CreateNpc, UpdateNpc } from "./npc-repository.types"

/**
 * Interfaz del repositorio de NPCs
 */
export interface NpcRepository {
  /**
   * Obtiene un NPC por su ID
   */
  getById(npcId: string): Promise<Npc | null>

  /**
   * Obtiene todos los NPCs de una campaña
   */
  getByCampaignId(campaignId: string): Promise<Npc[]>

  /**
   * Crea un nuevo NPC
   */
  create(npc: CreateNpc): Promise<Npc>

  /**
   * Actualiza un NPC
   */
  update(npcId: string, updates: UpdateNpc): Promise<Npc>

  /**
   * Elimina un NPC
   */
  delete(npcId: string): Promise<void>
}

/**
 * Implementación de NpcRepository usando Supabase
 */
export class SupabaseNpcRepository implements NpcRepository {
  constructor(private supabase: SupabaseClient = createBrowserClient()) {}

  async getById(npcId: string): Promise<Npc | null> {
    const { data, error } = await this.supabase
      .from("npcs")
      .select("*")
      .eq("id", npcId)
      .maybeSingle()

    if (error && error.code !== "PGRST116") {
      throw ErrorService.fromSupabaseError(error)
    }

    return data as Npc | null
  }

  async getByCampaignId(campaignId: string): Promise<Npc[]> {
    const { data, error } = await this.supabase
      .from("npcs")
      .select("*")
      .eq("campaign_id", campaignId)
      .order("created_at", { ascending: false })

    if (error) {
      throw ErrorService.fromSupabaseError(error)
    }

    return (data as Npc[]) || []
  }

  async create(npc: CreateNpc): Promise<Npc> {
    const { data, error } = await this.supabase
      .from("npcs")
      .insert(npc)
      .select()
      .single()

    if (error) {
      throw ErrorService.fromSupabaseError(error)
    }

    if (!data) {
      throw ErrorService.create(ErrorCode.NOT_FOUND, "Failed to create NPC")
    }

    return data as Npc
  }

  async update(npcId: string, updates: UpdateNpc): Promise<Npc> {
    const { data, error } = await this.supabase
      .from("npcs")
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq("id", npcId)
      .select()
      .single()

    if (error) {
      throw ErrorService.fromSupabaseError(error)
    }

    if (!data) {
      throw ErrorService.create(ErrorCode.NOT_FOUND, "NPC not found")
    }

    return data as Npc
  }

  async delete(npcId: string): Promise<void> {
    const { error } = await this.supabase.from("npcs").delete().eq("id", npcId)

    if (error) {
      throw ErrorService.fromSupabaseError(error)
    }
  }
}

