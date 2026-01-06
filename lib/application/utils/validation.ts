import { ErrorService, ErrorCode } from "@/lib/infrastructure/errors"

/**
 * Utilidades de validación compartidas para servicios de aplicación
 * Centraliza validaciones comunes para evitar duplicación
 */
export class ValidationUtils {
  /**
   * Valida que un ID no esté vacío
   * @param id ID a validar
   * @param fieldName Nombre del campo para el mensaje de error
   * @throws AppError si el ID es inválido
   */
  static validateId(id: string | null | undefined, fieldName: string = "ID"): void {
    if (!id || id.trim() === "") {
      throw ErrorService.create(
        ErrorCode.VALIDATION_ERROR,
        `${fieldName} is required`
      )
    }
  }

  /**
   * Valida que un número sea positivo (mayor que 0)
   * @param amount Número a validar
   * @param fieldName Nombre del campo para el mensaje de error
   * @throws AppError si el número no es positivo
   */
  static validatePositiveNumber(
    amount: number,
    fieldName: string = "Amount"
  ): void {
    if (!amount || amount <= 0 || isNaN(amount)) {
      throw ErrorService.create(
        ErrorCode.VALIDATION_ERROR,
        `${fieldName} must be greater than 0`
      )
    }
  }

  /**
   * Valida que un número no sea negativo (>= 0)
   * @param amount Número a validar
   * @param fieldName Nombre del campo para el mensaje de error
   * @throws AppError si el número es negativo
   */
  static validateNonNegativeNumber(
    amount: number,
    fieldName: string = "Amount"
  ): void {
    if (amount < 0 || isNaN(amount)) {
      throw ErrorService.create(
        ErrorCode.VALIDATION_ERROR,
        `${fieldName} cannot be negative`
      )
    }
  }

  /**
   * Valida que una cadena no esté vacía
   * @param value Cadena a validar
   * @param fieldName Nombre del campo para el mensaje de error
   * @throws AppError si la cadena está vacía
   */
  static validateNonEmptyString(
    value: string | null | undefined,
    fieldName: string = "Field"
  ): void {
    if (!value || value.trim() === "") {
      throw ErrorService.create(
        ErrorCode.VALIDATION_ERROR,
        `${fieldName} is required`
      )
    }
  }
}

