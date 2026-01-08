import { createBrowserClient } from "@/lib/supabase/client"
import type { SupabaseClient } from "@supabase/supabase-js"
import { ErrorService, ErrorCode } from "@/lib/infrastructure/errors"
import type { Location, LocationWithShops, CreateLocation, UpdateLocation } from "./location-repository.types"

// Re-export types
export type { Location, LocationWithShops, CreateLocation, UpdateLocation } from "./location-repository.types"

/**
 * Interfaz del repositorio de Locations
 */
export interface LocationRepository {
  /**
   * Obtiene una ubicación por su ID
   */
  getById(locationId: string): Promise<Location | null>

  /**
   * Obtiene una ubicación con sus tiendas
   */
  getByIdWithShops(locationId: string): Promise<LocationWithShops | null>

  /**
   * Obtiene todas las ubicaciones de una campaña
   */
  getByCampaignId(campaignId: string): Promise<Location[]>

  /**
   * Crea una nueva ubicación
   */
  create(location: CreateLocation): Promise<Location>

  /**
   * Actualiza una ubicación
   */
  update(locationId: string, updates: UpdateLocation): Promise<Location>

  /**
   * Elimina una ubicación
   */
  delete(locationId: string): Promise<void>
}

/**
 * Implementación de LocationRepository usando Supabase
 */
export class SupabaseLocationRepository implements LocationRepository {
  constructor(private supabase: SupabaseClient = createBrowserClient()) {}

  async getById(locationId: string): Promise<Location | null> {
    const { data, error } = await this.supabase
      .from("locations")
      .select("*")
      .eq("id", locationId)
      .maybeSingle()

    if (error && error.code !== "PGRST116") {
      throw ErrorService.fromSupabaseError(error)
    }

    return data ? this.mapToLocation(data) : null
  }

  async getByIdWithShops(locationId: string): Promise<LocationWithShops | null> {
    const { data, error } = await this.supabase
      .from("locations")
      .select(
        `
        *,
        shops (
          id,
          name,
          description,
          shopkeeper_name
        )
      `
      )
      .eq("id", locationId)
      .maybeSingle()

    if (error && error.code !== "PGRST116") {
      throw ErrorService.fromSupabaseError(error)
    }

    if (!data) {
      return null
    }

    return {
      ...this.mapToLocation(data),
      shops: data.shops
        ? data.shops.map((shop: any) => ({
            id: shop.id,
            name: shop.name,
            description: shop.description || null,
            shopkeeper_name: shop.shopkeeper_name || null,
          }))
        : undefined,
    }
  }

  async getByCampaignId(campaignId: string): Promise<Location[]> {
    const { data, error } = await this.supabase
      .from("locations")
      .select("*")
      .eq("campaign_id", campaignId)
      .order("name", { ascending: true })

    if (error) {
      throw ErrorService.fromSupabaseError(error)
    }

    return (data || []).map((location) => this.mapToLocation(location))
  }

  async create(location: CreateLocation): Promise<Location> {
    const { data, error } = await this.supabase
      .from("locations")
      .insert({
        name: location.name,
        description: location.description,
        campaign_id: location.campaign_id,
        location_type: (location as any).location_type || null,
      })
      .select()
      .single()

    if (error) {
      throw ErrorService.fromSupabaseError(error)
    }

    if (!data) {
      throw ErrorService.create(ErrorCode.VALIDATION_ERROR, "Failed to create location")
    }

    return this.mapToLocation(data)
  }

  async update(locationId: string, updates: UpdateLocation): Promise<Location> {
    const { data, error } = await this.supabase
      .from("locations")
      .update({
        ...updates,
        updated_at: new Date().toISOString(),
      })
      .eq("id", locationId)
      .select()
      .single()

    if (error) {
      throw ErrorService.fromSupabaseError(error)
    }

    if (!data) {
      throw ErrorService.create(ErrorCode.NOT_FOUND, "Location not found")
    }

    return this.mapToLocation(data)
  }

  async delete(locationId: string): Promise<void> {
    const { error } = await this.supabase.from("locations").delete().eq("id", locationId)

    if (error) {
      throw ErrorService.fromSupabaseError(error)
    }
  }

  private mapToLocation(data: any): Location {
    return {
      id: data.id,
      name: data.name,
      description: data.description || null,
      campaign_id: data.campaign_id,
      location_type: data.location_type || null,
      created_at: data.created_at,
      updated_at: data.updated_at || null,
    }
  }
}

