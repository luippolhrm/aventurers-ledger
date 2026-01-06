import {
  SupabaseMovementRepository,
  type MovementRepository,
  type Movement,
  type MovementWithDetails,
  type CreateMovement,
} from "@/lib/infrastructure/repositories"
import { ErrorService, ErrorCode } from "@/lib/infrastructure/errors"
import { CurrencyConverterService } from "./currency-converter-service"
import { ValidationUtils } from "../utils/validation"

/**
 * Servicio de aplicación para manejo de movimientos financieros
 * Contiene la lógica de negocio relacionada con movimientos
 */
export class MovementService {
  constructor(
    private movementRepo: MovementRepository = new SupabaseMovementRepository(),
    private currencyConverter: CurrencyConverterService = new CurrencyConverterService()
  ) {}

  /**
   * Obtiene todos los movimientos de un personaje
   * @param characterId ID del personaje
   * @param limit Límite de resultados (opcional, default: sin límite)
   * @returns Array de movimientos
   * @throws AppError si el characterId es inválido o hay un error
   */
  async getMovements(characterId: string, limit?: number): Promise<Movement[]> {
    ValidationUtils.validateId(characterId, "Character ID")
    return this.movementRepo.getByCharacterId(characterId, limit)
  }

  /**
   * Obtiene movimientos de un personaje con información enriquecida
   * @param characterId ID del personaje
   * @param limit Límite de resultados (opcional, default: sin límite)
   * @returns Array de movimientos con detalles
   * @throws AppError si el characterId es inválido o hay un error
   */
  async getMovementsWithDetails(
    characterId: string,
    limit?: number
  ): Promise<MovementWithDetails[]> {
    ValidationUtils.validateId(characterId, "Character ID")
    return this.movementRepo.getByCharacterIdWithDetails(characterId, limit)
  }

  /**
   * Crea un movimiento de conversión de moneda
   * @param characterId ID del personaje
   * @param fromCurrency Moneda origen
   * @param toCurrency Moneda destino
   * @param amount Cantidad a convertir
   * @returns Movement creado
   * @throws AppError si hay un error de validación o infraestructura
   */
  async createConversion(
    characterId: string,
    fromCurrency: "PP" | "GP" | "EP" | "SP" | "CP",
    toCurrency: "PP" | "GP" | "EP" | "SP" | "CP",
    amount: number
  ): Promise<Movement> {
    ValidationUtils.validateId(characterId, "Character ID")
    ValidationUtils.validatePositiveNumber(amount, "Amount")

    if (fromCurrency === toCurrency) {
      throw ErrorService.create(ErrorCode.VALIDATION_ERROR, "Cannot convert to the same currency")
    }

    // Usar CurrencyConverterService para conversión consistente
    const convertedAmount = this.currencyConverter.convert(amount, fromCurrency, toCurrency)

    const movement: CreateMovement = {
      character_id: characterId,
      from_currency: fromCurrency,
      to_currency: toCurrency,
      amount_from: amount,
      amount_to: convertedAmount,
      movement_type: "conversion",
    }

    return this.movementRepo.create(movement)
  }

  /**
   * Crea un movimiento de adición de moneda
   * @param characterId ID del personaje
   * @param currency Moneda a agregar
   * @param amount Cantidad a agregar
   * @returns Movement creado
   * @throws AppError si hay un error de validación o infraestructura
   */
  async createAdd(
    characterId: string,
    currency: "PP" | "GP" | "EP" | "SP" | "CP",
    amount: number
  ): Promise<Movement> {
    ValidationUtils.validateId(characterId, "Character ID")
    ValidationUtils.validatePositiveNumber(amount, "Amount")

    const movement: CreateMovement = {
      character_id: characterId,
      from_currency: currency,
      to_currency: currency,
      amount_from: amount,
      amount_to: amount,
      movement_type: "add",
    }

    return this.movementRepo.create(movement)
  }

  /**
   * Crea un movimiento de remoción de moneda
   * @param characterId ID del personaje
   * @param currency Moneda a remover
   * @param amount Cantidad a remover
   * @returns Movement creado
   * @throws AppError si hay un error de validación o infraestructura
   */
  async createRemove(
    characterId: string,
    currency: "PP" | "GP" | "EP" | "SP" | "CP",
    amount: number
  ): Promise<Movement> {
    ValidationUtils.validateId(characterId, "Character ID")
    ValidationUtils.validatePositiveNumber(amount, "Amount")

    const movement: CreateMovement = {
      character_id: characterId,
      from_currency: currency,
      to_currency: currency,
      amount_from: amount,
      amount_to: amount,
      movement_type: "remove",
    }

    return this.movementRepo.create(movement)
  }

  /**
   * Calcula la conversión de una cantidad entre monedas
   * Wrapper sobre CurrencyConverterService para mantener compatibilidad
   * @param amount Cantidad a convertir
   * @param fromCurrency Moneda origen
   * @param toCurrency Moneda destino
   * @returns Cantidad convertida
   */
  calculateConversion(
    amount: number,
    fromCurrency: "PP" | "GP" | "EP" | "SP" | "CP",
    toCurrency: "PP" | "GP" | "EP" | "SP" | "CP"
  ): number {
    ValidationUtils.validateNonNegativeNumber(amount, "Amount")
    return this.currencyConverter.convert(amount, fromCurrency, toCurrency)
  }
}

