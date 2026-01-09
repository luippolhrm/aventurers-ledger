import { createBrowserClient } from "@/lib/supabase/client"
import type { SupabaseClient } from "@supabase/supabase-js"
import { ErrorService, ErrorCode } from "@/lib/infrastructure/errors"
import type { Npc, CreateNpc, UpdateNpc } from "./npc-repository.types"
import type { Shop } from "./shop-repository"
import type { DungeonRoom } from "./dungeon-repository.types"

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
   * Obtiene NPCs asociados a una tienda
   */
  getNpcsByShop(shopId: string): Promise<Npc[]>

  /**
   * Obtiene NPCs asociados a una sala de dungeon
   */
  getNpcsByDungeonRoom(roomId: string): Promise<Npc[]>

  /**
   * Obtiene tiendas donde está un NPC
   */
  getShopsByNpc(npcId: string): Promise<Shop[]>

  /**
   * Obtiene salas de dungeon donde está un NPC
   */
  getDungeonRoomsByNpc(npcId: string): Promise<DungeonRoom[]>

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

  async getNpcsByShop(shopId: string): Promise<Npc[]> {
    const { data, error } = await this.supabase
      .from("shop_npcs")
      .select(
        `
        npc_id,
        npcs (
          id,
          campaign_id,
          name,
          title,
          resistances,
          story,
          created_at,
          updated_at
        )
      `
      )
      .eq("shop_id", shopId)
      .not("npc_id", "is", null)

    if (error) {
      throw ErrorService.fromSupabaseError(error)
    }

    return (data || [])
      .map((item: any) => item.npcs)
      .filter((npc: any) => npc !== null)
      .map((npc: any) => this.mapToNpc(npc))
  }

  async getNpcsByDungeonRoom(roomId: string): Promise<Npc[]> {
    const { data, error } = await this.supabase
      .from("dungeon_room_npcs")
      .select(
        `
        npc_id,
        npcs (
          id,
          campaign_id,
          name,
          title,
          resistances,
          story,
          created_at,
          updated_at
        )
      `
      )
      .eq("dungeon_room_id", roomId)
      .not("npc_id", "is", null)

    if (error) {
      throw ErrorService.fromSupabaseError(error)
    }

    return (data || [])
      .map((item: any) => item.npcs)
      .filter((npc: any) => npc !== null)
      .map((npc: any) => this.mapToNpc(npc))
  }

  async getShopsByNpc(npcId: string): Promise<Shop[]> {
    const { data, error } = await this.supabase
      .from("shop_npcs")
      .select(
        `
        shop_id,
        shops (
          id,
          name,
          description,
          location_id,
          shopkeeper_name,
          shop_type,
          created_at,
          updated_at
        )
      `
      )
      .eq("npc_id", npcId)

    if (error) {
      throw ErrorService.fromSupabaseError(error)
    }

    return (data || [])
      .map((item: any) => item.shops)
      .filter((shop: any) => shop !== null)
      .map((shop: any) => ({
        id: shop.id,
        name: shop.name,
        description: shop.description || null,
        location_id: shop.location_id,
        shopkeeper_name: shop.shopkeeper_name || null,
        shop_type: shop.shop_type || null,
        created_at: shop.created_at,
        updated_at: shop.updated_at || null,
      }))
  }

  async getDungeonRoomsByNpc(npcId: string): Promise<DungeonRoom[]> {
    const { data, error } = await this.supabase
      .from("dungeon_room_npcs")
      .select(
        `
        dungeon_room_id,
        dungeon_rooms (
          id,
          dungeon_id,
          name,
          description,
          room_type,
          order_index,
          position_x,
          position_y,
          connections,
          created_at,
          updated_at
        )
      `
      )
      .eq("npc_id", npcId)

    if (error) {
      throw ErrorService.fromSupabaseError(error)
    }

    return (data || [])
      .map((item: any) => item.dungeon_rooms)
      .filter((room: any) => room !== null)
      .map((room: any) => ({
        id: room.id,
        dungeon_id: room.dungeon_id,
        name: room.name,
        description: room.description || null,
        room_type: room.room_type || null,
        order_index: Number(room.order_index || 0),
        position_x: room.position_x ? Number(room.position_x) : null,
        position_y: room.position_y ? Number(room.position_y) : null,
        connections: room.connections || null,
        created_at: room.created_at,
        updated_at: room.updated_at || null,
      }))
  }

  private mapToNpc(data: any): Npc {
    return {
      id: data.id,
      campaign_id: data.campaign_id,
      name: data.name,
      title: data.title || null,
      resistances: data.resistances || null,
      story: data.story || null,
      created_at: data.created_at,
      updated_at: data.updated_at || null,
    }
  }
}

