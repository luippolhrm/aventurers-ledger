import { createBrowserClient } from "@/lib/supabase/client"
import type { SupabaseClient } from "@supabase/supabase-js"
import { ErrorService, ErrorCode } from "@/lib/infrastructure/errors"
import type {
  NpcInventoryItem,
  CreateNpcInventoryItem,
  UpdateNpcInventoryItem,
} from "./npc-inventory-repository.types"

// Re-export types
export type { NpcInventoryItem, CreateNpcInventoryItem, UpdateNpcInventoryItem } from "./npc-inventory-repository.types"

/**
 * Interfaz del repositorio de Inventario de NPCs
 */
export interface NpcInventoryRepository {
  /**
   * Obtiene todos los items del inventario de un NPC
   */
  getByNpcId(npcId: string): Promise<NpcInventoryItem[]>

  /**
   * Obtiene un item por su ID
   */
  getById(itemId: string): Promise<NpcInventoryItem | null>

  /**
   * Crea un nuevo item en el inventario del NPC
   */
  create(item: CreateNpcInventoryItem): Promise<NpcInventoryItem>

  /**
   * Actualiza un item
   */
  update(itemId: string, updates: UpdateNpcInventoryItem): Promise<NpcInventoryItem>

  /**
   * Elimina un item
   */
  delete(itemId: string): Promise<void>
}

/**
 * Implementación de NpcInventoryRepository usando Supabase
 */
export class SupabaseNpcInventoryRepository implements NpcInventoryRepository {
  constructor(private supabase: SupabaseClient = createBrowserClient()) {}

  async getByNpcId(npcId: string): Promise<NpcInventoryItem[]> {
    const { data, error } = await this.supabase
      .from("npc_inventory")
      .select("*")
      .eq("npc_id", npcId)
      .order("created_at", { ascending: false })

    if (error) {
      throw ErrorService.fromSupabaseError(error)
    }

    return (data || []).map((item) => this.mapToNpcInventoryItem(item))
  }

  async getById(itemId: string): Promise<NpcInventoryItem | null> {
    const { data, error } = await this.supabase
      .from("npc_inventory")
      .select("*")
      .eq("id", itemId)
      .maybeSingle()

    if (error && error.code !== "PGRST116") {
      throw ErrorService.fromSupabaseError(error)
    }

    return data ? this.mapToNpcInventoryItem(data) : null
  }

  async create(item: CreateNpcInventoryItem): Promise<NpcInventoryItem> {
    const { data, error } = await this.supabase
      .from("npc_inventory")
      .insert(item)
      .select()
      .single()

    if (error) {
      throw ErrorService.fromSupabaseError(error)
    }

    if (!data) {
      throw ErrorService.create(ErrorCode.ITEM_NOT_FOUND, "Failed to create NPC inventory item")
    }

    return this.mapToNpcInventoryItem(data)
  }

  async update(itemId: string, updates: UpdateNpcInventoryItem): Promise<NpcInventoryItem> {
    const { data, error } = await this.supabase
      .from("npc_inventory")
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq("id", itemId)
      .select()
      .single()

    if (error) {
      throw ErrorService.fromSupabaseError(error)
    }

    if (!data) {
      throw ErrorService.create(ErrorCode.ITEM_NOT_FOUND, "NPC inventory item not found")
    }

    return this.mapToNpcInventoryItem(data)
  }

  async delete(itemId: string): Promise<void> {
    const { error } = await this.supabase.from("npc_inventory").delete().eq("id", itemId)

    if (error) {
      throw ErrorService.fromSupabaseError(error)
    }
  }

  private mapToNpcInventoryItem(data: any): NpcInventoryItem {
    return {
      id: data.id,
      npc_id: data.npc_id,
      item_name: data.item_name,
      item_type: data.item_type,
      quantity: Number(data.quantity || 1),
      weight: Number(data.weight || 0),
      value_in_copper: Number(data.value_in_copper || 0),
      description: data.description || null,
      created_at: data.created_at,
      updated_at: data.updated_at || null,
    }
  }
}

