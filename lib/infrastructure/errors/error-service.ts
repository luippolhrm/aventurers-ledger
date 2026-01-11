import { ErrorCode } from "./error-codes"
import { AppError } from "./app-error"
import type { PostgrestError, AuthApiError } from "@supabase/supabase-js"

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

    // Auth
    [ErrorCode.INVALID_EMAIL]: "El correo electrónico no es válido",
    [ErrorCode.INVALID_CREDENTIALS]: "Correo o contraseña incorrectos",
    [ErrorCode.INVALID_PASSWORD]: "La contraseña es incorrecta",
    [ErrorCode.EMAIL_ALREADY_EXISTS]: "Este correo electrónico ya está registrado",
    [ErrorCode.EMAIL_NOT_VERIFIED]: "Por favor verifica tu correo electrónico",
    [ErrorCode.WEAK_PASSWORD]: "La contraseña es muy débil",

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
   * Mapea errores de autenticación de Supabase a AppError
   * Convierte errores de AuthApiError a errores de aplicación estandarizados
   */
  static fromAuthError(error: AuthApiError | null | undefined): AppError {
    if (!error) {
      return this.create(ErrorCode.UNKNOWN_ERROR, "Error desconocido")
    }

    const errorMessage = error.message?.toLowerCase() || ""
    const status = error.status || 0

    // Errores de credenciales inválidas (400)
    if (status === 400) {
      if (
        errorMessage.includes("invalid login credentials") ||
        errorMessage.includes("invalid credentials") ||
        errorMessage.includes("email not confirmed") ||
        errorMessage.includes("incorrect email or password")
      ) {
        return this.create(ErrorCode.INVALID_CREDENTIALS, "Correo o contraseña incorrectos", error)
      }

      if (errorMessage.includes("password")) {
        return this.create(ErrorCode.INVALID_PASSWORD, "La contraseña es incorrecta", error)
      }

      if (errorMessage.includes("email")) {
        return this.create(ErrorCode.INVALID_EMAIL, "El correo electrónico no es válido", error)
      }

      if (errorMessage.includes("weak password") || errorMessage.includes("password is too weak")) {
        return this.create(ErrorCode.WEAK_PASSWORD, "La contraseña es muy débil. Debe tener al menos 6 caracteres", error)
      }
    }

    // Error de email ya existe (422 o 400)
    if (
      status === 422 ||
      (status === 400 && (errorMessage.includes("already registered") || errorMessage.includes("user already exists")))
    ) {
      return this.create(ErrorCode.EMAIL_ALREADY_EXISTS, "Este correo electrónico ya está registrado", error)
    }

    // Error de email no verificado
    if (errorMessage.includes("email not confirmed") || errorMessage.includes("email not verified")) {
      return this.create(ErrorCode.EMAIL_NOT_VERIFIED, "Por favor verifica tu correo electrónico antes de iniciar sesión", error)
    }

    // Error de formato de email inválido
    if (errorMessage.includes("invalid email") || errorMessage.includes("email format")) {
      return this.create(ErrorCode.INVALID_EMAIL, "El formato del correo electrónico no es válido", error)
    }

    // Para otros errores de auth, usar el mensaje original o genérico
    const message = error.message || "Error de autenticación"
    return this.create(ErrorCode.UNAUTHORIZED, message, error)
  }

  /**
   * Convierte cualquier error a AppError
   * Útil para manejar errores inesperados
   */
  static fromUnknownError(error: unknown): AppError {
    if (error instanceof AppError) {
      return error
    }

    // Intentar manejar AuthApiError
    if (error && typeof error === "object" && "status" in error && "message" in error) {
      const authError = error as AuthApiError
      if (authError.status && authError.message) {
        return this.fromAuthError(authError)
      }
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

