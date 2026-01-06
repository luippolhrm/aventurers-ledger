import {
  SupabaseWalletRepository,
  type WalletRepository,
  type WalletData,
} from "@/lib/infrastructure/repositories"
import { ErrorService, ErrorCode } from "@/lib/infrastructure/errors"
import { CurrencyConverterService } from "./currency-converter-service"
import { ValidationUtils } from "../utils/validation"

/**
 * Servicio de aplicación para manejo de wallets
 * Contiene la lógica de negocio relacionada con wallets
 */
export class WalletService {
  constructor(
    private walletRepo: WalletRepository = new SupabaseWalletRepository(),
    private currencyConverter: CurrencyConverterService = new CurrencyConverterService()
  ) {}

  /**
   * Obtiene el wallet de un personaje
   * @param characterId ID del personaje
   * @returns WalletData del personaje
   * @throws AppError si el characterId es inválido o hay un error
   */
  async getWallet(characterId: string): Promise<WalletData> {
    ValidationUtils.validateId(characterId, "Character ID")
    return this.walletRepo.getByCharacterIdWithRetry(characterId)
  }

  /**
   * Calcula el total de fondos en copper pieces (CP)
   * @param wallet Datos del wallet
   * @returns Total en copper pieces
   */
  calculateTotalInCopper(wallet: WalletData): number {
    return (
      wallet.copper +
      wallet.silver * 10 +
      wallet.electrum * 50 +
      wallet.gold * 100 +
      wallet.platinum * 1000
    )
  }

  /**
   * Verifica si el wallet tiene fondos suficientes
   * @param wallet Datos del wallet
   * @param requiredCopper Cantidad requerida en copper pieces
   * @returns true si tiene fondos suficientes, false en caso contrario
   */
  hasEnoughFunds(wallet: WalletData, requiredCopper: number): boolean {
    if (requiredCopper < 0) {
      return false
    }

    return this.calculateTotalInCopper(wallet) >= requiredCopper
  }

  /**
   * Formatea el wallet como string legible
   * @param wallet Datos del wallet
   * @returns String formateado (ej: "10 GP, 5 SP, 3 CP")
   */
  formatWallet(wallet: WalletData): string {
    const parts: string[] = []

    if (wallet.platinum > 0) parts.push(`${wallet.platinum} PP`)
    if (wallet.gold > 0) parts.push(`${wallet.gold} GP`)
    if (wallet.electrum > 0) parts.push(`${wallet.electrum} EP`)
    if (wallet.silver > 0) parts.push(`${wallet.silver} SP`)
    if (wallet.copper > 0) parts.push(`${wallet.copper} CP`)

    return parts.length > 0 ? parts.join(", ") : "0 GP"
  }

  /**
   * Convierte una cantidad de una moneda a otra
   * Wrapper sobre CurrencyConverterService para mantener compatibilidad
   * @param amount Cantidad a convertir
   * @param fromCurrency Moneda origen (PP, GP, EP, SP, CP)
   * @param toCurrency Moneda destino (PP, GP, EP, SP, CP)
   * @returns Cantidad convertida
   */
  convertCurrency(
    amount: number,
    fromCurrency: "PP" | "GP" | "EP" | "SP" | "CP",
    toCurrency: "PP" | "GP" | "EP" | "SP" | "CP"
  ): number {
    ValidationUtils.validateNonNegativeNumber(amount, "Amount")
    return this.currencyConverter.convert(amount, fromCurrency, toCurrency)
  }

  /**
   * Actualiza el wallet de un personaje
   * @param characterId ID del personaje
   * @param wallet Datos parciales del wallet a actualizar
   * @returns WalletData actualizado
   * @throws AppError si hay un error
   */
  async updateWallet(
    characterId: string,
    wallet: Partial<Omit<WalletData, "total_wealth">>
  ): Promise<WalletData> {
    ValidationUtils.validateId(characterId, "Character ID")
    return this.walletRepo.update(characterId, wallet)
  }
}

