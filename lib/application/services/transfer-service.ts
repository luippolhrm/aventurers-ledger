import {
  SupabaseTransferRepository,
  type TransferRepository,
  type Transfer,
  type TransferWithDetails,
  type CreateTransfer,
} from "@/lib/infrastructure/repositories"
import { ErrorService, ErrorCode } from "@/lib/infrastructure/errors"
import { WalletService } from "./wallet-service"
import type { WalletData } from "@/lib/infrastructure/repositories"
import { ValidationUtils } from "../utils/validation"
import { PermissionUtils } from "../utils/permissions"

/**
 * Servicio de aplicación para manejo de transferencias entre personajes
 * Contiene la lógica de negocio relacionada con transferencias
 */
export class TransferService {
  constructor(
    private transferRepo: TransferRepository = new SupabaseTransferRepository(),
    private walletService: WalletService = new WalletService()
  ) {}

  /**
   * Obtiene todas las transferencias relacionadas con un personaje
   * @param characterId ID del personaje
   * @param limit Límite de resultados (opcional, default: sin límite)
   * @returns Array de transferencias
   * @throws AppError si el characterId es inválido o hay un error
   */
  async getTransfers(characterId: string, limit?: number): Promise<Transfer[]> {
    ValidationUtils.validateId(characterId, "Character ID")
    return this.transferRepo.getByCharacterId(characterId, limit)
  }

  /**
   * Obtiene transferencias de un personaje con información enriquecida
   * @param characterId ID del personaje
   * @param limit Límite de resultados (opcional, default: sin límite)
   * @returns Array de transferencias con detalles
   * @throws AppError si el characterId es inválido o hay un error
   */
  async getTransfersWithDetails(
    characterId: string,
    limit?: number
  ): Promise<TransferWithDetails[]> {
    ValidationUtils.validateId(characterId, "Character ID")
    return this.transferRepo.getByCharacterIdWithDetails(characterId, limit)
  }

  /**
   * Crea una transferencia entre dos personajes
   * Valida fondos, actualiza wallets y crea el registro de transferencia
   * @param userId ID del usuario autenticado (debe ser dueño del remitente)
   * @param fromCharacterId ID del personaje remitente
   * @param toCharacterId ID del personaje destinatario
   * @param currency Moneda a transferir
   * @param amount Cantidad a transferir
   * @param description Descripción opcional
   * @returns Transfer creada
   * @throws AppError si hay un error de validación o infraestructura
   */
  async createTransfer(
    userId: string,
    fromCharacterId: string,
    toCharacterId: string,
    currency: "PP" | "GP" | "EP" | "SP" | "CP",
    amount: number,
    description?: string | null
  ): Promise<Transfer> {
    ValidationUtils.validateUuid(userId, "User ID")
    ValidationUtils.validateUuid(fromCharacterId, "From character ID")
    ValidationUtils.validateUuid(toCharacterId, "To character ID")
    ValidationUtils.validatePositiveNumber(amount, "Amount")

    await PermissionUtils.ensureCharacterOwner(userId, fromCharacterId)

    if (fromCharacterId === toCharacterId) {
      throw ErrorService.create(ErrorCode.VALIDATION_ERROR, "Cannot transfer to the same character")
    }

    // Validar que el remitente tenga fondos suficientes
    const senderWallet = await this.walletService.getWallet(fromCharacterId)
    const currencyMap: Record<string, keyof Omit<WalletData, "total_wealth">> = {
      PP: "platinum",
      GP: "gold",
      EP: "electrum",
      SP: "silver",
      CP: "copper",
    }

    const walletKey = currencyMap[currency]
    const currentBalance = senderWallet[walletKey]

    if (currentBalance < amount) {
      throw ErrorService.create(ErrorCode.INSUFFICIENT_FUNDS, "Insufficient funds")
    }

    // Obtener wallet del destinatario (crear si no existe)
    let recipientWallet: WalletData
    try {
      recipientWallet = await this.walletService.getWallet(toCharacterId)
    } catch (error: any) {
      // Si el wallet no existe, el servicio lo crea automáticamente
      recipientWallet = await this.walletService.getWallet(toCharacterId)
    }

    // Actualizar wallets
    const senderNewBalance = currentBalance - amount
    const recipientNewBalance = recipientWallet[walletKey] + amount

    await this.walletService.updateWallet(fromCharacterId, {
      [walletKey]: senderNewBalance,
    })

    await this.walletService.updateWallet(toCharacterId, {
      [walletKey]: recipientNewBalance,
    })

    // Crear registro de transferencia
    const transfer: CreateTransfer = {
      from_character_id: fromCharacterId,
      to_character_id: toCharacterId,
      currency,
      amount,
      description: description || null,
    }

    return this.transferRepo.create(transfer)
  }
}

