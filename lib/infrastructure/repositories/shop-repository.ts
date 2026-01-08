import { createBrowserClient } from "@/lib/supabase/client"
import type { SupabaseClient } from "@supabase/supabase-js"
import { ErrorService, ErrorCode } from "@/lib/infrastructure/errors"
import type { Shop, ShopWithLocation, CreateShop, UpdateShop } from "./shop-repository.types"

// Re-export types
export type { Shop, ShopWithLocation, CreateShop, UpdateShop } from "./shop-repository.types"

/**
 * Interfaz del repositorio de Shops
 */
export interface ShopRepository {
  /**
   * Obtiene una tienda por su ID
   */
  getById(shopId: string): Promise<Shop | null>

  /**
   * Obtiene una tienda con información de su ubicación
   */
  getByIdWithLocation(shopId: string): Promise<ShopWithLocation | null>

  /**
   * Obtiene todas las tiendas de una ubicación
   */
  getByLocationId(locationId: string): Promise<Shop[]>

  /**
   * Crea una nueva tienda
   */
  create(shop: CreateShop): Promise<Shop>

  /**
   * Actualiza una tienda
   */
  update(shopId: string, updates: UpdateShop): Promise<Shop>

  /**
   * Elimina una tienda
   */
  delete(shopId: string): Promise<void>
}

/**
 * Implementación de ShopRepository usando Supabase
 */
export class SupabaseShopRepository implements ShopRepository {
  constructor(private supabase: SupabaseClient = createBrowserClient()) {}

  async getById(shopId: string): Promise<Shop | null> {
    const { data, error } = await this.supabase
      .from("shops")
      .select("*")
      .eq("id", shopId)
      .maybeSingle()

    if (error && error.code !== "PGRST116") {
      throw ErrorService.fromSupabaseError(error)
    }

    return data ? this.mapToShop(data) : null
  }

  async getByIdWithLocation(shopId: string): Promise<ShopWithLocation | null> {
    const { data, error } = await this.supabase
      .from("shops")
      .select(
        `
        *,
        locations (
          id,
          name,
          description,
          campaign_id
        )
      `
      )
      .eq("id", shopId)
      .maybeSingle()

    if (error && error.code !== "PGRST116") {
      throw ErrorService.fromSupabaseError(error)
    }

    if (!data) {
      return null
    }

    return {
      ...this.mapToShop(data),
      location: data.locations
        ? {
            id: data.locations.id,
            name: data.locations.name,
            description: data.locations.description,
            campaign_id: data.locations.campaign_id,
          }
        : undefined,
    }
  }

  async getByLocationId(locationId: string): Promise<Shop[]> {
    const { data, error } = await this.supabase
      .from("shops")
      .select("*")
      .eq("location_id", locationId)
      .order("name", { ascending: true })

    if (error) {
      throw ErrorService.fromSupabaseError(error)
    }

    return (data || []).map((shop) => this.mapToShop(shop))
  }

  async create(shop: CreateShop): Promise<Shop> {
    const { data, error } = await this.supabase
      .from("shops")
      .insert({
        name: shop.name,
        description: shop.description,
        location_id: shop.location_id,
        shopkeeper_name: shop.shopkeeper_name,
        shop_type: (shop as any).shop_type || null,
      })
      .select()
      .single()

    if (error) {
      throw ErrorService.fromSupabaseError(error)
    }

    if (!data) {
      throw ErrorService.create(ErrorCode.VALIDATION_ERROR, "Failed to create shop")
    }

    return this.mapToShop(data)
  }

  async update(shopId: string, updates: UpdateShop): Promise<Shop> {
    const { data, error } = await this.supabase
      .from("shops")
      .update({
        ...updates,
        updated_at: new Date().toISOString(),
      })
      .eq("id", shopId)
      .select()
      .single()

    if (error) {
      throw ErrorService.fromSupabaseError(error)
    }

    if (!data) {
      throw ErrorService.create(ErrorCode.NOT_FOUND, "Shop not found")
    }

    return this.mapToShop(data)
  }

  async delete(shopId: string): Promise<void> {
    const { error } = await this.supabase.from("shops").delete().eq("id", shopId)

    if (error) {
      throw ErrorService.fromSupabaseError(error)
    }
  }

  private mapToShop(data: any): Shop {
    return {
      id: data.id,
      name: data.name,
      description: data.description || null,
      location_id: data.location_id,
      shopkeeper_name: data.shopkeeper_name || null,
      shop_type: data.shop_type || null,
      created_at: data.created_at,
      updated_at: data.updated_at || null,
    }
  }
}

