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

  /**
   * Valida que un correo electrónico tenga un formato válido
   * @param email Correo electrónico a validar
   * @param fieldName Nombre del campo para el mensaje de error
   * @throws AppError si el correo no es válido
   */
  static validateEmail(
    email: string | null | undefined,
    fieldName: string = "Email"
  ): void {
    // Primero validar que no esté vacío
    this.validateNonEmptyString(email, fieldName)

    // Expresión regular para validar formato de email
    // Basada en el estándar RFC 5322 simplificado
    const emailRegex =
      /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/

    if (!emailRegex.test(email!.trim())) {
      throw ErrorService.create(
        ErrorCode.INVALID_EMAIL,
        `${fieldName} no tiene un formato válido`
      )
    }

    // Validaciones adicionales
    const trimmedEmail = email!.trim()
    const parts = trimmedEmail.split("@")

    if (parts.length !== 2) {
      throw ErrorService.create(
        ErrorCode.INVALID_EMAIL,
        `${fieldName} debe contener exactamente un símbolo @`
      )
    }

    const [localPart, domain] = parts

    // Validar parte local (antes del @)
    if (localPart.length === 0 || localPart.length > 64) {
      throw ErrorService.create(
        ErrorCode.INVALID_EMAIL,
        `${fieldName} tiene una parte local inválida`
      )
    }

    // Validar dominio (después del @)
    if (domain.length === 0 || domain.length > 255) {
      throw ErrorService.create(
        ErrorCode.INVALID_EMAIL,
        `${fieldName} tiene un dominio inválido`
      )
    }

    // Validar que el dominio tenga al menos un punto
    if (!domain.includes(".")) {
      throw ErrorService.create(
        ErrorCode.INVALID_EMAIL,
        `${fieldName} debe tener un dominio válido (ejemplo: ejemplo.com)`
      )
    }

    // Validar que no tenga puntos consecutivos
    if (localPart.includes("..") || domain.includes("..")) {
      throw ErrorService.create(
        ErrorCode.INVALID_EMAIL,
        `${fieldName} no puede tener puntos consecutivos`
      )
    }

    // Validar que no empiece o termine con punto
    if (localPart.startsWith(".") || localPart.endsWith(".") || domain.startsWith(".") || domain.endsWith(".")) {
      throw ErrorService.create(
        ErrorCode.INVALID_EMAIL,
        `${fieldName} no puede empezar o terminar con punto`
      )
    }
  }
}

