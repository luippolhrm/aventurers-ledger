import { createBrowserClient } from "@/lib/supabase/client"
import type { SupabaseClient } from "@supabase/supabase-js"
import { ErrorService, ErrorCode } from "@/lib/infrastructure/errors"
import type {
  Dungeon,
  DungeonRoom,
  DungeonWithRooms,
  DungeonRoomWithNpcs,
  CreateDungeon,
  UpdateDungeon,
  CreateDungeonRoom,
  UpdateDungeonRoom,
} from "./dungeon-repository.types"

// Re-export types
export type {
  Dungeon,
  DungeonRoom,
  DungeonWithRooms,
  DungeonRoomWithNpcs,
  CreateDungeon,
  UpdateDungeon,
  CreateDungeonRoom,
  UpdateDungeonRoom,
} from "./dungeon-repository.types"

/**
 * Interfaz del repositorio de Dungeons
 */
export interface DungeonRepository {
  /**
   * Obtiene un dungeon por su ID
   */
  getById(dungeonId: string): Promise<Dungeon | null>

  /**
   * Obtiene un dungeon por location_id
   */
  getByLocationId(locationId: string): Promise<Dungeon | null>

  /**
   * Obtiene un dungeon con sus salas
   */
  getWithRooms(dungeonId: string): Promise<DungeonWithRooms | null>

  /**
   * Crea un nuevo dungeon
   */
  create(dungeon: CreateDungeon): Promise<Dungeon>

  /**
   * Actualiza un dungeon
   */
  update(dungeonId: string, updates: UpdateDungeon): Promise<Dungeon>

  /**
   * Elimina un dungeon
   */
  delete(dungeonId: string): Promise<void>
}

/**
 * Interfaz del repositorio de Dungeon Rooms
 */
export interface DungeonRoomRepository {
  /**
   * Obtiene una sala por su ID
   */
  getById(roomId: string): Promise<DungeonRoom | null>

  /**
   * Obtiene todas las salas de un dungeon
   */
  getByDungeonId(dungeonId: string): Promise<DungeonRoom[]>

  /**
   * Obtiene una sala con sus NPCs
   */
  getWithNpcs(roomId: string): Promise<DungeonRoomWithNpcs | null>

  /**
   * Crea una nueva sala
   */
  create(room: CreateDungeonRoom): Promise<DungeonRoom>

  /**
   * Actualiza una sala
   */
  update(roomId: string, updates: UpdateDungeonRoom): Promise<DungeonRoom>

  /**
   * Elimina una sala
   */
  delete(roomId: string): Promise<void>
}

/**
 * Implementación de DungeonRepository usando Supabase
 */
export class SupabaseDungeonRepository implements DungeonRepository {
  constructor(private supabase: SupabaseClient = createBrowserClient()) {}

  async getById(dungeonId: string): Promise<Dungeon | null> {
    const { data, error } = await this.supabase
      .from("dungeons")
      .select("*")
      .eq("id", dungeonId)
      .maybeSingle()

    if (error && error.code !== "PGRST116") {
      throw ErrorService.fromSupabaseError(error)
    }

    return data ? this.mapToDungeon(data) : null
  }

  async getByLocationId(locationId: string): Promise<Dungeon | null> {
    const { data, error } = await this.supabase
      .from("dungeons")
      .select("*")
      .eq("location_id", locationId)
      .maybeSingle()

    if (error && error.code !== "PGRST116") {
      throw ErrorService.fromSupabaseError(error)
    }

    return data ? this.mapToDungeon(data) : null
  }

  async getWithRooms(dungeonId: string): Promise<DungeonWithRooms | null> {
    const { data, error } = await this.supabase
      .from("dungeons")
      .select(
        `
        *,
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
      .eq("id", dungeonId)
      .maybeSingle()

    if (error && error.code !== "PGRST116") {
      throw ErrorService.fromSupabaseError(error)
    }

    if (!data) {
      return null
    }

    return {
      ...this.mapToDungeon(data),
      rooms: data.dungeon_rooms
        ? data.dungeon_rooms.map((room: any) => this.mapToDungeonRoom(room))
        : undefined,
    }
  }

  async create(dungeon: CreateDungeon): Promise<Dungeon> {
    const { data, error } = await this.supabase
      .from("dungeons")
      .insert(dungeon)
      .select()
      .single()

    if (error) {
      throw ErrorService.fromSupabaseError(error)
    }

    if (!data) {
      throw ErrorService.create(ErrorCode.NOT_FOUND, "Failed to create dungeon")
    }

    return this.mapToDungeon(data)
  }

  async update(dungeonId: string, updates: UpdateDungeon): Promise<Dungeon> {
    const { data, error } = await this.supabase
      .from("dungeons")
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq("id", dungeonId)
      .select()
      .single()

    if (error) {
      throw ErrorService.fromSupabaseError(error)
    }

    if (!data) {
      throw ErrorService.create(ErrorCode.NOT_FOUND, "Dungeon not found")
    }

    return this.mapToDungeon(data)
  }

  async delete(dungeonId: string): Promise<void> {
    const { error } = await this.supabase.from("dungeons").delete().eq("id", dungeonId)

    if (error) {
      throw ErrorService.fromSupabaseError(error)
    }
  }

  private mapToDungeon(data: any): Dungeon {
    return {
      id: data.id,
      location_id: data.location_id,
      recommended_level: data.recommended_level ? Number(data.recommended_level) : null,
      difficulty_level: data.difficulty_level || null,
      is_cleared: Boolean(data.is_cleared || false),
      is_active: data.is_active !== undefined ? data.is_active : true,
      map_data: data.map_data || null,
      created_at: data.created_at,
      updated_at: data.updated_at || null,
    }
  }

  private mapToDungeonRoom(data: any): DungeonRoom {
    return {
      id: data.id,
      dungeon_id: data.dungeon_id,
      name: data.name,
      description: data.description || null,
      room_type: data.room_type || null,
      order_index: Number(data.order_index || 0),
      position_x: data.position_x ? Number(data.position_x) : null,
      position_y: data.position_y ? Number(data.position_y) : null,
      connections: data.connections || null,
      created_at: data.created_at,
      updated_at: data.updated_at || null,
    }
  }
}

/**
 * Implementación de DungeonRoomRepository usando Supabase
 */
export class SupabaseDungeonRoomRepository implements DungeonRoomRepository {
  constructor(private supabase: SupabaseClient = createBrowserClient()) {}

  async getById(roomId: string): Promise<DungeonRoom | null> {
    const { data, error } = await this.supabase
      .from("dungeon_rooms")
      .select("*")
      .eq("id", roomId)
      .maybeSingle()

    if (error && error.code !== "PGRST116") {
      throw ErrorService.fromSupabaseError(error)
    }

    return data ? this.mapToDungeonRoom(data) : null
  }

  async getByDungeonId(dungeonId: string): Promise<DungeonRoom[]> {
    const { data, error } = await this.supabase
      .from("dungeon_rooms")
      .select("*")
      .eq("dungeon_id", dungeonId)
      .order("order_index", { ascending: true })
      .order("created_at", { ascending: true })

    if (error) {
      throw ErrorService.fromSupabaseError(error)
    }

    return (data || []).map((room) => this.mapToDungeonRoom(room))
  }

  async getWithNpcs(roomId: string): Promise<DungeonRoomWithNpcs | null> {
    const { data, error } = await this.supabase
      .from("dungeon_rooms")
      .select(
        `
        *,
        dungeon_room_npcs (
          id,
          npc_id,
          name,
          title,
          resistances,
          story
        )
      `
      )
      .eq("id", roomId)
      .maybeSingle()

    if (error && error.code !== "PGRST116") {
      throw ErrorService.fromSupabaseError(error)
    }

    if (!data) {
      return null
    }

    return {
      ...this.mapToDungeonRoom(data),
      npcs: data.dungeon_room_npcs
        ? data.dungeon_room_npcs.map((npc: any) => ({
            id: npc.id,
            npc_id: npc.npc_id || null,
            name: npc.name || null,
            title: npc.title || null,
            resistances: npc.resistances || null,
            story: npc.story || null,
          }))
        : undefined,
    }
  }

  async create(room: CreateDungeonRoom): Promise<DungeonRoom> {
    const { data, error } = await this.supabase
      .from("dungeon_rooms")
      .insert(room)
      .select()
      .single()

    if (error) {
      throw ErrorService.fromSupabaseError(error)
    }

    if (!data) {
      throw ErrorService.create(ErrorCode.NOT_FOUND, "Failed to create dungeon room")
    }

    return this.mapToDungeonRoom(data)
  }

  async update(roomId: string, updates: UpdateDungeonRoom): Promise<DungeonRoom> {
    const { data, error } = await this.supabase
      .from("dungeon_rooms")
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq("id", roomId)
      .select()
      .single()

    if (error) {
      throw ErrorService.fromSupabaseError(error)
    }

    if (!data) {
      throw ErrorService.create(ErrorCode.NOT_FOUND, "Dungeon room not found")
    }

    return this.mapToDungeonRoom(data)
  }

  async delete(roomId: string): Promise<void> {
    const { error } = await this.supabase.from("dungeon_rooms").delete().eq("id", roomId)

    if (error) {
      throw ErrorService.fromSupabaseError(error)
    }
  }

  private mapToDungeonRoom(data: any): DungeonRoom {
    return {
      id: data.id,
      dungeon_id: data.dungeon_id,
      name: data.name,
      description: data.description || null,
      room_type: data.room_type || null,
      order_index: Number(data.order_index || 0),
      position_x: data.position_x ? Number(data.position_x) : null,
      position_y: data.position_y ? Number(data.position_y) : null,
      connections: data.connections || null,
      created_at: data.created_at,
      updated_at: data.updated_at || null,
    }
  }
}

