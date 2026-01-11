import { createBrowserClient } from "@/lib/supabase/client"
import type { SupabaseClient } from "@supabase/supabase-js"
import { ErrorService, ErrorCode } from "@/lib/infrastructure/errors"
import type {
  InventoryItem,
  CreateInventoryItem,
  UpdateInventoryItem,
} from "./inventory-repository.types"

// Re-export types for convenience
export type { InventoryItem, CreateInventoryItem, UpdateInventoryItem } from "./inventory-repository.types"

/**
 * Interfaz del repositorio de Inventory
 * Define el contrato que deben cumplir todas las implementaciones
 */
export interface InventoryRepository {
  /**
   * Obtiene todos los items del inventario de un personaje
   */
  getByCharacterId(characterId: string): Promise<InventoryItem[]>

  /**
   * Obtiene un item por su ID
   */
  getById(itemId: string): Promise<InventoryItem | null>

  /**
   * Obtiene items equipados de un personaje
   */
  getEquippedByCharacterId(characterId: string): Promise<InventoryItem[]>

  /**
   * Obtiene items en un contenedor específico
   */
  getByContainerId(containerId: string): Promise<InventoryItem[]>

  /**
   * Obtiene contenedores de un personaje
   */
  getContainersByCharacterId(characterId: string): Promise<InventoryItem[]>

  /**
   * Crea un nuevo item en el inventario
   */
  create(item: CreateInventoryItem): Promise<InventoryItem>

  /**
   * Actualiza un item
   */
  update(itemId: string, updates: UpdateInventoryItem): Promise<InventoryItem>

  /**
   * Elimina un item
   */
  delete(itemId: string): Promise<void>

  /**
   * Equipa un item en un slot específico
   */
  equipItem(itemId: string, slot: string): Promise<InventoryItem>

  /**
   * Desequipa un item
   */
  unequipItem(itemId: string): Promise<InventoryItem>

  /**
   * Almacena un item en un contenedor
   */
  storeInContainer(itemId: string, containerId: string): Promise<InventoryItem>

  /**
   * Remueve un item de su contenedor
   */
  removeFromContainer(itemId: string): Promise<InventoryItem>

  /**
   * Desequipa cualquier item que esté en un slot específico
   */
  unequipSlot(characterId: string, slot: string): Promise<void>
}

/**
 * Implementación de InventoryRepository usando Supabase
 */
export class SupabaseInventoryRepository implements InventoryRepository {
  constructor(private supabase: SupabaseClient = createBrowserClient()) {}

  async getByCharacterId(characterId: string): Promise<InventoryItem[]> {
    const { data, error } = await this.supabase
      .from("inventory")
      .select("*")
      .eq("character_id", characterId)
      .order("created_at", { ascending: false })

    if (error) {
      throw ErrorService.fromSupabaseError(error)
    }

    return (data || []).map(this.mapToInventoryItem)
  }

  async getById(itemId: string): Promise<InventoryItem | null> {
    const { data, error } = await this.supabase
      .from("inventory")
      .select("*")
      .eq("id", itemId)
      .maybeSingle()

    if (error && error.code !== "PGRST116") {
      throw ErrorService.fromSupabaseError(error)
    }

    return data ? this.mapToInventoryItem(data) : null
  }

  async getEquippedByCharacterId(
    characterId: string
  ): Promise<InventoryItem[]> {
    const { data, error } = await this.supabase
      .from("inventory")
      .select("*")
      .eq("character_id", characterId)
      .eq("equipped", true)

    if (error) {
      throw ErrorService.fromSupabaseError(error)
    }

    return (data || []).map(this.mapToInventoryItem)
  }

  async getByContainerId(containerId: string): Promise<InventoryItem[]> {
    const { data, error } = await this.supabase
      .from("inventory")
      .select("*")
      .eq("container_id", containerId)

    if (error) {
      throw ErrorService.fromSupabaseError(error)
    }

    return (data || []).map(this.mapToInventoryItem)
  }

  async getContainersByCharacterId(
    characterId: string
  ): Promise<InventoryItem[]> {
    const { data, error } = await this.supabase
      .from("inventory")
      .select("*")
      .eq("character_id", characterId)
      .eq("is_container", true)

    if (error) {
      throw ErrorService.fromSupabaseError(error)
    }

    return (data || []).map(this.mapToInventoryItem)
  }

  async create(item: CreateInventoryItem): Promise<InventoryItem> {
    const { data, error } = await this.supabase
      .from("inventory")
      .insert(item)
      .select()
      .single()

    if (error) {
      throw ErrorService.fromSupabaseError(error)
    }

    if (!data) {
      throw ErrorService.create(ErrorCode.ITEM_NOT_FOUND)
    }

    return this.mapToInventoryItem(data)
  }

  async update(
    itemId: string,
    updates: UpdateInventoryItem
  ): Promise<InventoryItem> {
    const { data, error } = await this.supabase
      .from("inventory")
      .update(updates)
      .eq("id", itemId)
      .select()
      .single()

    if (error) {
      throw ErrorService.fromSupabaseError(error)
    }

    if (!data) {
      throw ErrorService.create(ErrorCode.ITEM_NOT_FOUND)
    }

    return this.mapToInventoryItem(data)
  }

  async delete(itemId: string): Promise<void> {
    const { error } = await this.supabase
      .from("inventory")
      .delete()
      .eq("id", itemId)

    if (error) {
      throw ErrorService.fromSupabaseError(error)
    }
  }

  async equipItem(itemId: string, slot: string): Promise<InventoryItem> {
    const { data, error } = await this.supabase
      .from("inventory")
      .update({
        equipped: true,
        equipped_slot: slot,
      })
      .eq("id", itemId)
      .select()
      .single()

    if (error) {
      throw ErrorService.fromSupabaseError(error)
    }

    if (!data) {
      throw ErrorService.create(ErrorCode.ITEM_NOT_FOUND)
    }

    return this.mapToInventoryItem(data)
  }

  async unequipItem(itemId: string): Promise<InventoryItem> {
    const { data, error } = await this.supabase
      .from("inventory")
      .update({
        equipped: false,
        equipped_slot: null,
      })
      .eq("id", itemId)
      .select()
      .single()

    if (error) {
      throw ErrorService.fromSupabaseError(error)
    }

    if (!data) {
      throw ErrorService.create(ErrorCode.ITEM_NOT_FOUND)
    }

    return this.mapToInventoryItem(data)
  }

  async storeInContainer(
    itemId: string,
    containerId: string
  ): Promise<InventoryItem> {
    const { data, error } = await this.supabase
      .from("inventory")
      .update({
        container_id: containerId,
        equipped: false,
        equipped_slot: null,
      })
      .eq("id", itemId)
      .select()
      .single()

    if (error) {
      throw ErrorService.fromSupabaseError(error)
    }

    if (!data) {
      throw ErrorService.create(ErrorCode.ITEM_NOT_FOUND)
    }

    return this.mapToInventoryItem(data)
  }

  async removeFromContainer(itemId: string): Promise<InventoryItem> {
    const { data, error } = await this.supabase
      .from("inventory")
      .update({
        container_id: null,
      })
      .eq("id", itemId)
      .select()
      .single()

    if (error) {
      throw ErrorService.fromSupabaseError(error)
    }

    if (!data) {
      throw ErrorService.create(ErrorCode.ITEM_NOT_FOUND)
    }

    return this.mapToInventoryItem(data)
  }

  async unequipSlot(characterId: string, slot: string): Promise<void> {
    const { error } = await this.supabase
      .from("inventory")
      .update({
        equipped: false,
        equipped_slot: null,
      })
      .eq("character_id", characterId)
      .eq("equipped_slot", slot)

    if (error) {
      throw ErrorService.fromSupabaseError(error)
    }
  }

  /**
   * Mapea los datos de Supabase a InventoryItem
   * Asegura que todos los valores sean del tipo correcto
   */
  private mapToInventoryItem(data: any): InventoryItem {
    return {
      id: data.id,
      character_id: data.character_id,
      item_name: data.item_name,
      item_type: data.item_type,
      item_category: data.item_category || null,
      quantity: Number(data.quantity || 1),
      weight: Number(data.weight || 0),
      value_in_copper: Number(data.value_in_copper || 0),
      description: data.description || null,
      equipped: Boolean(data.equipped || false),
      equipped_slot: data.equipped_slot || null,
      equippable_slot: data.equippable_slot || null,
      container_id: data.container_id || null,
      is_container: Boolean(data.is_container || false),
      container_capacity: Number(data.container_capacity || 0),
      // Effect fields
      wondrous_type: data.wondrous_type || null,
      effect_dice: data.effect_dice || null,
      effect_type: data.effect_type || null,
      effect_target: data.effect_target || null,
      spell_level: data.spell_level ? Number(data.spell_level) : null,
      spell_name: data.spell_name || null,
      spell_school: data.spell_school || null,
      effect_description: data.effect_description || null,
      // Combat stats
      damage_dice: data.damage_dice || null,
      damage_type: data.damage_type || null,
      armor_class: data.armor_class ? Number(data.armor_class) : null,
      // Weapon properties (D&D 2024)
      weapon_mastery: data.weapon_mastery || null,
      properties: data.properties || null,
      damage_dice_versatile: data.damage_dice_versatile || null,
      versatile_usage: (data.versatile_usage === "one-handed" || data.versatile_usage === "two-handed") ? data.versatile_usage : null,
      weapon_range_normal: data.weapon_range_normal ? Number(data.weapon_range_normal) : null,
      weapon_range_long: data.weapon_range_long ? Number(data.weapon_range_long) : null,
      // Attunement
      attunement: data.attunement ?? null,
      created_at: data.created_at,
      updated_at: data.updated_at || null,
    }
  }
}

