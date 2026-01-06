import { ErrorCode } from "./error-codes"

/**
 * Error personalizado de la aplicación
 * Extiende Error estándar con información adicional estructurada
 */
export class AppError extends Error {
  constructor(
    public code: ErrorCode,
    message: string,
    public details?: unknown,
    public originalError?: unknown
  ) {
    super(message)
    this.name = "AppError"

    // Mantiene el stack trace correcto
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, AppError)
    }
  }

  /**
   * Convierte el error a un objeto plano para logging/serialización
   */
  toJSON() {
    return {
      name: this.name,
      code: this.code,
      message: this.message,
      details: this.details,
      stack: this.stack,
    }
  }
}

