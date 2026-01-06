import { ErrorCode } from "./error-codes"
import { AppError } from "./app-error"
import type { PostgrestError } from "@supabase/supabase-js"

/**
 * Servicio centralizado para manejo de errores
 * Proporciona métodos para crear errores estandarizados y mapear errores de infraestructura
 */
export class ErrorService {
  /**
   * Mensajes de error en español (pueden extenderse para i18n)
   */
  private static errorMessages: Record<ErrorCode, string> = {
    // Wallet
    [ErrorCode.WALLET_NOT_FOUND]: "Wallet no encontrado",
    [ErrorCode.INSUFFICIENT_FUNDS]: "Fondos insuficientes",

    // Character
    [ErrorCode.CHARACTER_NOT_FOUND]: "Personaje no encontrado",
    [ErrorCode.CHARACTER_ACCESS_DENIED]: "No tienes acceso a este personaje",

    // Inventory
    [ErrorCode.ITEM_NOT_FOUND]: "Item no encontrado",
    [ErrorCode.INSUFFICIENT_QUANTITY]: "Cantidad insuficiente",
    [ErrorCode.ITEM_ALREADY_EQUIPPED]: "El item ya está equipado",
    [ErrorCode.INVALID_EQUIPMENT_SLOT]: "Slot de equipamiento inválido",

    // Campaign
    [ErrorCode.CAMPAIGN_NOT_FOUND]: "Campaña no encontrada",
    [ErrorCode.CAMPAIGN_ACCESS_DENIED]: "No tienes acceso a esta campaña",
    [ErrorCode.CAMPAIGN_ALREADY_JOINED]: "Ya estás en esta campaña",

    // Shop
    [ErrorCode.SHOP_NOT_FOUND]: "Tienda no encontrada",
    [ErrorCode.INSUFFICIENT_STOCK]: "Stock insuficiente",
    [ErrorCode.ITEM_NOT_AVAILABLE]: "Item no disponible",

    // Shopping Cart
    [ErrorCode.CART_NOT_FOUND]: "Carrito no encontrado",
    [ErrorCode.CART_EMPTY]: "El carrito está vacío",
    [ErrorCode.CHECKOUT_FAILED]: "Error al procesar la compra",

    // Transfer
    [ErrorCode.TRANSFER_FAILED]: "Error al transferir fondos",
    [ErrorCode.INVALID_TRANSFER_AMOUNT]: "Cantidad de transferencia inválida",

    // Generic
    [ErrorCode.VALIDATION_ERROR]: "Error de validación",
    [ErrorCode.UNAUTHORIZED]: "No autorizado",
    [ErrorCode.FORBIDDEN]: "Acceso prohibido",
    [ErrorCode.NOT_FOUND]: "Recurso no encontrado",
    [ErrorCode.UNKNOWN_ERROR]: "Error desconocido",
  }

  /**
   * Crea un AppError con un código y detalles opcionales
   */
  static create(
    code: ErrorCode,
    details?: unknown,
    originalError?: unknown
  ): AppError {
    return new AppError(code, this.errorMessages[code], details, originalError)
  }

  /**
   * Mapea errores de Supabase a AppError
   * Convierte errores de la base de datos a errores de aplicación estandarizados
   */
  static fromSupabaseError(
    error: PostgrestError | null | undefined
  ): AppError {
    if (!error) {
      return this.create(ErrorCode.UNKNOWN_ERROR, "Error desconocido")
    }

    // Mapear códigos específicos de Supabase/PostgreSQL
    switch (error.code) {
      // PGRST116 = No rows returned (no encontrado)
      case "PGRST116":
        return this.create(ErrorCode.NOT_FOUND, undefined, error)

      // 23505 = Unique violation (duplicado)
      case "23505":
        return this.create(
          ErrorCode.VALIDATION_ERROR,
          "El registro ya existe",
          error
        )

      // 23503 = Foreign key violation (referencia inválida)
      case "23503":
        return this.create(
          ErrorCode.VALIDATION_ERROR,
          "Referencia inválida",
          error
        )

      // 23502 = Not null violation (campo requerido)
      case "23502":
        return this.create(
          ErrorCode.VALIDATION_ERROR,
          "Campo requerido faltante",
          error
        )

      // 42501 = Insufficient privilege (permisos)
      case "42501":
        return this.create(ErrorCode.FORBIDDEN, "Permisos insuficientes", error)

      // 28P01 = Invalid password (autenticación)
      case "28P01":
        return this.create(ErrorCode.UNAUTHORIZED, "Credenciales inválidas", error)

      default:
        // Para otros errores, intentar extraer información útil
        const message = error.message || "Error desconocido"
        return this.create(ErrorCode.UNKNOWN_ERROR, message, error)
    }
  }

  /**
   * Obtiene el mensaje de error para un código específico
   */
  static getMessage(code: ErrorCode): string {
    return this.errorMessages[code] || "Error desconocido"
  }

  /**
   * Verifica si un error es de un tipo específico
   */
  static isErrorCode(error: unknown, code: ErrorCode): error is AppError {
    return error instanceof AppError && error.code === code
  }

  /**
   * Convierte cualquier error a AppError
   * Útil para manejar errores inesperados
   */
  static fromUnknownError(error: unknown): AppError {
    if (error instanceof AppError) {
      return error
    }

    if (error instanceof Error) {
      return this.create(ErrorCode.UNKNOWN_ERROR, error.message, error)
    }

    return this.create(
      ErrorCode.UNKNOWN_ERROR,
      String(error),
      error
    )
  }
}

