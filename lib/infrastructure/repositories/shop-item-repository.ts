import { createBrowserClient } from "@/lib/supabase/client"
import type { SupabaseClient } from "@supabase/supabase-js"
import { ErrorService, ErrorCode } from "@/lib/infrastructure/errors"
import type { ShopItem, CreateShopItem, UpdateShopItem } from "./shop-item-repository.types"

// Re-export types
export type { ShopItem, CreateShopItem, UpdateShopItem } from "./shop-item-repository.types"

/**
 * Interfaz del repositorio de Shop Items
 */
export interface ShopItemRepository {
  /**
   * Obtiene un item de tienda por su ID
   */
  getById(shopItemId: string): Promise<ShopItem | null>

  /**
   * Obtiene todos los items de una tienda
   */
  getByShopId(shopId: string): Promise<ShopItem[]>

  /**
   * Obtiene items disponibles (quantity_available > 0) de una tienda
   */
  getAvailableByShopId(shopId: string): Promise<ShopItem[]>

  /**
   * Crea un nuevo item de tienda
   */
  create(item: CreateShopItem): Promise<ShopItem>

  /**
   * Actualiza un item de tienda
   */
  update(shopItemId: string, updates: UpdateShopItem): Promise<ShopItem>

  /**
   * Elimina un item de tienda
   */
  delete(shopItemId: string): Promise<void>

  /**
   * Actualiza el stock disponible de un item
   */
  updateStock(shopItemId: string, quantityChange: number): Promise<ShopItem>
}

/**
 * Implementación de ShopItemRepository usando Supabase
 */
export class SupabaseShopItemRepository implements ShopItemRepository {
  constructor(private supabase: SupabaseClient = createBrowserClient()) {}

  async getById(shopItemId: string): Promise<ShopItem | null> {
    const { data, error } = await this.supabase
      .from("shop_items")
      .select("*")
      .eq("id", shopItemId)
      .maybeSingle()

    if (error && error.code !== "PGRST116") {
      throw ErrorService.fromSupabaseError(error)
    }

    return data ? this.mapToShopItem(data) : null
  }

  async getByShopId(shopId: string): Promise<ShopItem[]> {
    const { data, error } = await this.supabase
      .from("shop_items")
      .select("*")
      .eq("shop_id", shopId)
      .order("item_name", { ascending: true })

    if (error) {
      throw ErrorService.fromSupabaseError(error)
    }

    return (data || []).map((item) => this.mapToShopItem(item))
  }

  async getAvailableByShopId(shopId: string): Promise<ShopItem[]> {
    const { data, error } = await this.supabase
      .from("shop_items")
      .select("*")
      .eq("shop_id", shopId)
      .gt("quantity_available", 0)
      .order("item_name", { ascending: true })

    if (error) {
      throw ErrorService.fromSupabaseError(error)
    }

    return (data || []).map((item) => this.mapToShopItem(item))
  }

  async create(item: CreateShopItem): Promise<ShopItem> {
    const { data, error } = await this.supabase
      .from("shop_items")
      .insert({
        shop_id: item.shop_id,
        item_name: item.item_name,
        item_type: item.item_type,
        description: item.description,
        price_in_copper: item.price_in_copper,
        weight: item.weight,
        quantity_available: item.quantity_available,
        image_url: item.image_url,
        rarity: item.rarity,
        item_category: item.item_category,
      })
      .select()
      .single()

    if (error) {
      throw ErrorService.fromSupabaseError(error)
    }

    if (!data) {
      throw ErrorService.create(ErrorCode.VALIDATION_ERROR, "Failed to create shop item")
    }

    return this.mapToShopItem(data)
  }

  async update(shopItemId: string, updates: UpdateShopItem): Promise<ShopItem> {
    const { data, error } = await this.supabase
      .from("shop_items")
      .update({
        ...updates,
        updated_at: new Date().toISOString(),
      })
      .eq("id", shopItemId)
      .select()
      .single()

    if (error) {
      throw ErrorService.fromSupabaseError(error)
    }

    if (!data) {
      throw ErrorService.create(ErrorCode.NOT_FOUND, "Shop item not found")
    }

    return this.mapToShopItem(data)
  }

  async delete(shopItemId: string): Promise<void> {
    const { error } = await this.supabase.from("shop_items").delete().eq("id", shopItemId)

    if (error) {
      throw ErrorService.fromSupabaseError(error)
    }
  }

  async updateStock(shopItemId: string, quantityChange: number): Promise<ShopItem> {
    // Primero obtener el item actual
    const currentItem = await this.getById(shopItemId)
    if (!currentItem) {
      throw ErrorService.create(ErrorCode.NOT_FOUND, "Shop item not found")
    }

    const newQuantity = currentItem.quantity_available + quantityChange
    if (newQuantity < 0) {
      throw ErrorService.create(
        ErrorCode.VALIDATION_ERROR,
        "Cannot reduce stock below 0"
      )
    }

    return this.update(shopItemId, { quantity_available: newQuantity })
  }

  private mapToShopItem(data: any): ShopItem {
    return {
      id: data.id,
      shop_id: data.shop_id,
      item_name: data.item_name,
      item_type: data.item_type || null,
      description: data.description || null,
      price_in_copper: data.price_in_copper,
      weight: data.weight || 0,
      quantity_available: data.quantity_available || 0,
      image_url: data.image_url || null,
      rarity: data.rarity || null,
      item_category: data.item_category || null,
      created_at: data.created_at,
      updated_at: data.updated_at || null,
    }
  }
}

