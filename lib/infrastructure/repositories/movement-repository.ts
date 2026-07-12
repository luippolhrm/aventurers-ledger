import { createBrowserClient } from "@/lib/supabase/client"
import type { SupabaseClient } from "@supabase/supabase-js"
import { ErrorService, ErrorCode } from "@/lib/infrastructure/errors"
import type {
  Movement,
  MovementWithDetails,
  CreateMovement,
  UpdateMovement,
} from "./movement-repository.types"

// Re-exportar tipos para facilitar el uso
export type {
  Movement,
  MovementWithDetails,
  CreateMovement,
  UpdateMovement,
  MovementType,
  Currency,
} from "./movement-repository.types"

/**
 * Interfaz del repositorio de Movements
 * Define el contrato que deben cumplir todas las implementaciones
 */
export interface MovementRepository {
  /**
   * Obtiene todos los movimientos de un personaje
   * @param characterId ID del personaje
   * @param limit Límite de resultados (opcional)
   * @returns Array de movimientos ordenados por fecha descendente
   * @throws AppError si hay un error de infraestructura
   */
  getByCharacterId(characterId: string, limit?: number): Promise<Movement[]>

  /**
   * Obtiene movimientos de un personaje con información enriquecida (shop, location)
   * @param characterId ID del personaje
   * @param limit Límite de resultados (opcional)
   * @returns Array de movimientos con detalles
   * @throws AppError si hay un error de infraestructura
   */
  getByCharacterIdWithDetails(characterId: string, limit?: number): Promise<MovementWithDetails[]>

  /**
   * Obtiene un movimiento por su ID
   * @param movementId ID del movimiento
   * @returns Movement o null si no existe
   * @throws AppError si hay un error de infraestructura
   */
  getById(movementId: string): Promise<Movement | null>

  /**
   * Crea un nuevo movimiento
   * @param movement Datos del movimiento a crear
   * @returns Movement creado
   * @throws AppError si hay un error de infraestructura
   */
  create(movement: CreateMovement): Promise<Movement>

  /**
   * Actualiza un movimiento (rara vez se usa)
   * @param movementId ID del movimiento
   * @param movement Datos parciales a actualizar
   * @returns Movement actualizado
   * @throws AppError si hay un error de infraestructura
   */
  update(movementId: string, movement: UpdateMovement): Promise<Movement>

  /**
   * Elimina un movimiento
   * @param movementId ID del movimiento
   * @throws AppError si hay un error de infraestructura
   */
  delete(movementId: string): Promise<void>
}

/**
 * Implementación de MovementRepository usando Supabase
 */
export class SupabaseMovementRepository implements MovementRepository {
  constructor(private supabase: SupabaseClient = createBrowserClient()) {}

  async getByCharacterId(characterId: string, limit?: number): Promise<Movement[]> {
    if (!characterId || characterId.trim() === "") {
      throw ErrorService.create(ErrorCode.VALIDATION_ERROR, "Character ID is required")
    }

    let query = this.supabase
      .from("movements")
      .select("*")
      .eq("character_id", characterId)
      .order("created_at", { ascending: false })

    if (limit && limit > 0) {
      query = query.limit(limit)
    }

    const { data, error } = await query

    if (error) {
      throw ErrorService.fromSupabaseError(error)
    }

    return (data || []).map((item) => this.mapToMovement(item))
  }

  async getByCharacterIdWithDetails(
    characterId: string,
    limit?: number
  ): Promise<MovementWithDetails[]> {
    if (!characterId || characterId.trim() === "") {
      throw ErrorService.create(ErrorCode.VALIDATION_ERROR, "Character ID is required")
    }

    let query = this.supabase
      .from("movements")
      .select(
        `
        *,
        shop:shops(id, name),
        location:locations(id, name)
      `
      )
      .eq("character_id", characterId)
      .order("created_at", { ascending: false })

    if (limit && limit > 0) {
      query = query.limit(limit)
    }

    const { data, error } = await query

    if (error) {
      throw ErrorService.fromSupabaseError(error)
    }

    return (data || []).map((item) => this.mapToMovementWithDetails(item))
  }

  async getById(movementId: string): Promise<Movement | null> {
    if (!movementId || movementId.trim() === "") {
      throw ErrorService.create(ErrorCode.VALIDATION_ERROR, "Movement ID is required")
    }

    const { data, error } = await this.supabase
      .from("movements")
      .select("*")
      .eq("id", movementId)
      .maybeSingle()

    if (error && error.code !== "PGRST116") {
      // PGRST116 = no rows returned, que es válido
      throw ErrorService.fromSupabaseError(error)
    }

    if (!data) return null

    return this.mapToMovement(data)
  }

  async create(movement: CreateMovement): Promise<Movement> {
    if (!movement.character_id || movement.character_id.trim() === "") {
      throw ErrorService.create(ErrorCode.VALIDATION_ERROR, "Character ID is required")
    }

    const { data, error } = await this.supabase
      .from("movements")
      .insert(movement)
      .select()
      .single()

    if (error) {
      throw ErrorService.fromSupabaseError(error)
    }

    if (!data) {
      throw ErrorService.create(ErrorCode.INTERNAL_ERROR, "Failed to create movement")
    }

    return this.mapToMovement(data)
  }

  async update(movementId: string, movement: UpdateMovement): Promise<Movement> {
    if (!movementId || movementId.trim() === "") {
      throw ErrorService.create(ErrorCode.VALIDATION_ERROR, "Movement ID is required")
    }

    const { data, error } = await this.supabase
      .from("movements")
      .update(movement)
      .eq("id", movementId)
      .select()
      .single()

    if (error) {
      throw ErrorService.fromSupabaseError(error)
    }

    if (!data) {
      throw ErrorService.create(ErrorCode.MOVEMENT_NOT_FOUND, "Movement not found")
    }

    return this.mapToMovement(data)
  }

  async delete(movementId: string): Promise<void> {
    if (!movementId || movementId.trim() === "") {
      throw ErrorService.create(ErrorCode.VALIDATION_ERROR, "Movement ID is required")
    }

    const { error } = await this.supabase.from("movements").delete().eq("id", movementId)

    if (error) {
      throw ErrorService.fromSupabaseError(error)
    }
  }

  /**
   * Mapea los datos de Supabase a Movement
   */
  private mapToMovement(data: any): Movement {
    return {
      id: data.id,
      character_id: data.character_id,
      from_currency: data.from_currency,
      to_currency: data.to_currency,
      amount_from: Number(data.amount_from || 0),
      amount_to: Number(data.amount_to || 0),
      movement_type: data.movement_type,
      description: data.description || null,
      shop_id: data.shop_id || null,
      location_id: data.location_id || null,
      created_at: data.created_at,
    }
  }

  /**
   * Mapea los datos de Supabase a MovementWithDetails
   */
  private mapToMovementWithDetails(data: any): MovementWithDetails {
    const movement = this.mapToMovement(data)

    return {
      ...movement,
      shop: data.shop
        ? {
            id: data.shop.id,
            name: data.shop.name,
          }
        : null,
      location: data.location
        ? {
            id: data.location.id,
            name: data.location.name,
          }
        : null,
    }
  }
}

