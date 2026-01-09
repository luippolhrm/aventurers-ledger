/**
 * Tipos e interfaces para NpcInventoryRepository
 */

export interface NpcInventoryItem {
  id: string
  npc_id: string
  item_name: string
  item_type: string
  quantity: number
  weight: number
  value_in_copper: number
  description: string | null
  created_at: string
  updated_at: string | null
}

export type CreateNpcInventoryItem = Omit<
  NpcInventoryItem,
  "id" | "created_at" | "updated_at"
>

export type UpdateNpcInventoryItem = Partial<
  Omit<NpcInventoryItem, "id" | "npc_id" | "created_at" | "updated_at">
>

