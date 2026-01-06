import { createBrowserClient } from "@/lib/supabase/client"
import type { SupabaseClient } from "@supabase/supabase-js"
import { ErrorService } from "@/lib/infrastructure/errors"
import type {
  Transfer,
  TransferWithDetails,
  CreateTransfer,
  UpdateTransfer,
} from "./transfer-repository.types"

// Re-exportar tipos para facilitar el uso
export type {
  Transfer,
  TransferWithDetails,
  CreateTransfer,
  UpdateTransfer,
  Currency,
} from "./transfer-repository.types"

/**
 * Interfaz del repositorio de Transfers
 * Define el contrato que deben cumplir todas las implementaciones
 */
export interface TransferRepository {
  /**
   * Obtiene todas las transferencias relacionadas con un personaje
   * (como remitente o destinatario)
   * @param characterId ID del personaje
   * @param limit Límite de resultados (opcional)
   * @returns Array de transferencias ordenadas por fecha descendente
   * @throws AppError si hay un error de infraestructura
   */
  getByCharacterId(characterId: string, limit?: number): Promise<Transfer[]>

  /**
   * Obtiene transferencias de un personaje con información enriquecida (nombres de personajes)
   * @param characterId ID del personaje
   * @param limit Límite de resultados (opcional)
   * @returns Array de transferencias con detalles
   * @throws AppError si hay un error de infraestructura
   */
  getByCharacterIdWithDetails(characterId: string, limit?: number): Promise<TransferWithDetails[]>

  /**
   * Obtiene una transferencia por su ID
   * @param transferId ID de la transferencia
   * @returns Transfer o null si no existe
   * @throws AppError si hay un error de infraestructura
   */
  getById(transferId: string): Promise<Transfer | null>

  /**
   * Crea una nueva transferencia
   * @param transfer Datos de la transferencia a crear
   * @returns Transfer creada
   * @throws AppError si hay un error de infraestructura
   */
  create(transfer: CreateTransfer): Promise<Transfer>

  /**
   * Actualiza una transferencia (rara vez se usa)
   * @param transferId ID de la transferencia
   * @param transfer Datos parciales a actualizar
   * @returns Transfer actualizada
   * @throws AppError si hay un error de infraestructura
   */
  update(transferId: string, transfer: UpdateTransfer): Promise<Transfer>

  /**
   * Elimina una transferencia
   * @param transferId ID de la transferencia
   * @throws AppError si hay un error de infraestructura
   */
  delete(transferId: string): Promise<void>
}

/**
 * Implementación de TransferRepository usando Supabase
 */
export class SupabaseTransferRepository implements TransferRepository {
  constructor(private supabase: SupabaseClient = createBrowserClient()) {}

  async getByCharacterId(characterId: string, limit?: number): Promise<Transfer[]> {
    if (!characterId || characterId.trim() === "") {
      throw ErrorService.create("VALIDATION_ERROR", "Character ID is required")
    }

    let query = this.supabase
      .from("transfers")
      .select("*")
      .or(`from_character_id.eq.${characterId},to_character_id.eq.${characterId}`)
      .order("created_at", { ascending: false })

    if (limit && limit > 0) {
      query = query.limit(limit)
    }

    const { data, error } = await query

    if (error) {
      throw ErrorService.fromSupabaseError(error)
    }

    return (data || []).map((item) => this.mapToTransfer(item))
  }

  async getByCharacterIdWithDetails(
    characterId: string,
    limit?: number
  ): Promise<TransferWithDetails[]> {
    if (!characterId || characterId.trim() === "") {
      throw ErrorService.create("VALIDATION_ERROR", "Character ID is required")
    }

    let query = this.supabase
      .from("transfers")
      .select(
        `
        *,
        from_character:characters!from_character_id(id, name),
        to_character:characters!to_character_id(id, name)
      `
      )
      .or(`from_character_id.eq.${characterId},to_character_id.eq.${characterId}`)
      .order("created_at", { ascending: false })

    if (limit && limit > 0) {
      query = query.limit(limit)
    }

    const { data, error } = await query

    if (error) {
      throw ErrorService.fromSupabaseError(error)
    }

    return (data || []).map((item) => this.mapToTransferWithDetails(item))
  }

  async getById(transferId: string): Promise<Transfer | null> {
    if (!transferId || transferId.trim() === "") {
      throw ErrorService.create("VALIDATION_ERROR", "Transfer ID is required")
    }

    const { data, error } = await this.supabase
      .from("transfers")
      .select("*")
      .eq("id", transferId)
      .maybeSingle()

    if (error && error.code !== "PGRST116") {
      // PGRST116 = no rows returned, que es válido
      throw ErrorService.fromSupabaseError(error)
    }

    if (!data) return null

    return this.mapToTransfer(data)
  }

  async create(transfer: CreateTransfer): Promise<Transfer> {
    if (!transfer.from_character_id || transfer.from_character_id.trim() === "") {
      throw ErrorService.create("VALIDATION_ERROR", "From character ID is required")
    }

    if (!transfer.to_character_id || transfer.to_character_id.trim() === "") {
      throw ErrorService.create("VALIDATION_ERROR", "To character ID is required")
    }

    if (transfer.from_character_id === transfer.to_character_id) {
      throw ErrorService.create("VALIDATION_ERROR", "Cannot transfer to the same character")
    }

    if (!transfer.amount || transfer.amount <= 0) {
      throw ErrorService.create("VALIDATION_ERROR", "Amount must be greater than 0")
    }

    const { data, error } = await this.supabase
      .from("transfers")
      .insert(transfer)
      .select()
      .single()

    if (error) {
      throw ErrorService.fromSupabaseError(error)
    }

    if (!data) {
      throw ErrorService.create("INTERNAL_ERROR", "Failed to create transfer")
    }

    return this.mapToTransfer(data)
  }

  async update(transferId: string, transfer: UpdateTransfer): Promise<Transfer> {
    if (!transferId || transferId.trim() === "") {
      throw ErrorService.create("VALIDATION_ERROR", "Transfer ID is required")
    }

    const { data, error } = await this.supabase
      .from("transfers")
      .update(transfer)
      .eq("id", transferId)
      .select()
      .single()

    if (error) {
      throw ErrorService.fromSupabaseError(error)
    }

    if (!data) {
      throw ErrorService.create("TRANSFER_NOT_FOUND", "Transfer not found")
    }

    return this.mapToTransfer(data)
  }

  async delete(transferId: string): Promise<void> {
    if (!transferId || transferId.trim() === "") {
      throw ErrorService.create("VALIDATION_ERROR", "Transfer ID is required")
    }

    const { error } = await this.supabase.from("transfers").delete().eq("id", transferId)

    if (error) {
      throw ErrorService.fromSupabaseError(error)
    }
  }

  /**
   * Mapea los datos de Supabase a Transfer
   */
  private mapToTransfer(data: any): Transfer {
    return {
      id: data.id,
      from_character_id: data.from_character_id,
      to_character_id: data.to_character_id,
      currency: data.currency,
      amount: Number(data.amount || 0),
      description: data.description || null,
      created_at: data.created_at,
    }
  }

  /**
   * Mapea los datos de Supabase a TransferWithDetails
   */
  private mapToTransferWithDetails(data: any): TransferWithDetails {
    const transfer = this.mapToTransfer(data)

    return {
      ...transfer,
      from_character: data.from_character
        ? {
            id: data.from_character.id,
            name: data.from_character.name,
          }
        : null,
      to_character: data.to_character
        ? {
            id: data.to_character.id,
            name: data.to_character.name,
          }
        : null,
    }
  }
}

