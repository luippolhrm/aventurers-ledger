/**
 * Tipos e interfaces para DungeonRepository
 */

export interface Dungeon {
  id: string
  location_id: string
  recommended_level: number | null
  difficulty_level: string | null
  is_cleared: boolean
  is_active?: boolean
  map_data: Record<string, unknown> | null
  created_at: string
  updated_at: string | null
}

export interface DungeonRoom {
  id: string
  dungeon_id: string
  name: string
  description: string | null
  room_type: string | null
  order_index: number
  position_x: number | null
  position_y: number | null
  connections: string[] | null
  created_at: string
  updated_at: string | null
}

export interface DungeonWithRooms extends Dungeon {
  rooms?: DungeonRoom[]
}

export interface DungeonRoomWithNpcs extends DungeonRoom {
  npcs?: Array<{
    id: string
    npc_id: string | null
    name: string | null
    title: string | null
    resistances: string | null
    story: string | null
  }>
}

export type CreateDungeon = Omit<Dungeon, "id" | "created_at" | "updated_at">

export type UpdateDungeon = Partial<Omit<Dungeon, "id" | "location_id" | "created_at" | "updated_at">>

export type CreateDungeonRoom = Omit<DungeonRoom, "id" | "created_at" | "updated_at">

export type UpdateDungeonRoom = Partial<Omit<DungeonRoom, "id" | "dungeon_id" | "created_at" | "updated_at">>

