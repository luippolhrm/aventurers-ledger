import { createBrowserClient } from "@/lib/supabase/client"
import type { SupabaseClient } from "@supabase/supabase-js"
import { ErrorService, ErrorCode } from "@/lib/infrastructure/errors"
import type { WalletData, WalletUpdateData } from "./wallet-repository.types"

/**
 * Interfaz del repositorio de Wallet
 * Define el contrato que deben cumplir todas las implementaciones
 */
export interface WalletRepository {
  /**
   * Obtiene el wallet de un personaje por su ID
   * @param characterId ID del personaje
   * @returns WalletData o null si no existe
   * @throws AppError si hay un error de infraestructura
   */
  getByCharacterId(characterId: string): Promise<WalletData | null>

  /**
   * Obtiene el wallet con reintentos (útil cuando el trigger puede tardar)
   * @param characterId ID del personaje
   * @param maxRetries Número máximo de reintentos (default: 3)
   * @returns WalletData (nunca null, retorna wallet vacío si no existe)
   * @throws AppError si hay un error de infraestructura
   */
  getByCharacterIdWithRetry(
    characterId: string,
    maxRetries?: number
  ): Promise<WalletData>

  /**
   * Actualiza el wallet de un personaje
   * @param characterId ID del personaje
   * @param wallet Datos parciales del wallet a actualizar
   * @returns WalletData actualizado
   * @throws AppError si hay un error de infraestructura
   */
  update(characterId: string, wallet: WalletUpdateData): Promise<WalletData>
}

/**
 * Implementación de WalletRepository usando Supabase
 */
export class SupabaseWalletRepository implements WalletRepository {
  constructor(private supabase: SupabaseClient = createBrowserClient()) {}

  async getByCharacterId(characterId: string): Promise<WalletData | null> {
    const { data, error } = await this.supabase
      .from("wallets")
      .select("*")
      .eq("character_id", characterId)
      .maybeSingle()

    if (error && error.code !== "PGRST116") {
      // PGRST116 = no rows returned, que es válido (wallet no existe)
      throw ErrorService.fromSupabaseError(error)
    }

    if (!data) return null

    return this.mapToWalletData(data)
  }

  async getByCharacterIdWithRetry(
    characterId: string,
    maxRetries = 3
  ): Promise<WalletData> {
    for (let i = 0; i < maxRetries; i++) {
      const wallet = await this.getByCharacterId(characterId)
      if (wallet) return wallet

      // Si no es el último intento, esperar antes de reintentar
      if (i < maxRetries - 1) {
        await new Promise((resolve) => setTimeout(resolve, 500))
      }
    }

    // Retornar wallet vacío si no existe después de los reintentos
    // El trigger debería haberlo creado, pero por si acaso
    return {
      platinum: 0,
      gold: 0,
      electrum: 0,
      silver: 0,
      copper: 0,
      total_wealth: 0,
    }
  }

  async update(
    characterId: string,
    wallet: WalletUpdateData
  ): Promise<WalletData> {
    const { data, error } = await this.supabase
      .from("wallets")
      .update(wallet)
      .eq("character_id", characterId)
      .select()
      .single()

    if (error) {
      throw ErrorService.fromSupabaseError(error)
    }

    if (!data) {
      throw ErrorService.create(ErrorCode.WALLET_NOT_FOUND)
    }

    return this.mapToWalletData(data)
  }

  /**
   * Mapea los datos de Supabase a WalletData
   * Asegura que todos los valores sean números
   */
  private mapToWalletData(data: any): WalletData {
    return {
      platinum: Number(data.platinum || 0),
      gold: Number(data.gold || 0),
      electrum: Number(data.electrum || 0),
      silver: Number(data.silver || 0),
      copper: Number(data.copper || 0),
      total_wealth: Number(data.total_wealth || 0),
    }
  }
}

