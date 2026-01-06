import { ErrorService, ErrorCode } from "@/lib/infrastructure/errors"
import type { Language } from "@/lib/translations"
import { translations } from "@/lib/translations"

export type CurrencyType = "PP" | "GP" | "EP" | "SP" | "CP"

export interface Currency {
  id: CurrencyType
  text: string
  valueInCP: number
}

/**
 * Servicio para conversión de monedas
 * Maneja la lógica de conversión entre diferentes tipos de moneda de D&D
 */
export class CurrencyConverterService {
  /**
   * Tasas de conversión a copper pieces (CP)
   */
  private readonly conversionRates: Record<CurrencyType, number> = {
    PP: 1000, // Platinum Piece
    GP: 100,  // Gold Piece
    EP: 50,   // Electrum Piece
    SP: 10,   // Silver Piece
    CP: 1,    // Copper Piece
  }

  /**
   * Obtiene la lista de monedas con sus traducciones
   * @param language Idioma para las traducciones
   * @returns Array de Currency con traducciones
   */
  getCurrencies(language: Language): Currency[] {
    const t = translations[language].currencies

    return [
      { id: "PP", text: t.platinum, valueInCP: this.conversionRates.PP },
      { id: "GP", text: t.gold, valueInCP: this.conversionRates.GP },
      { id: "EP", text: t.electrum, valueInCP: this.conversionRates.EP },
      { id: "SP", text: t.silver, valueInCP: this.conversionRates.SP },
      { id: "CP", text: t.copper, valueInCP: this.conversionRates.CP },
    ]
  }

  /**
   * Convierte una cantidad de una moneda a otra
   * @param amount Cantidad a convertir
   * @param fromCurrency Moneda origen
   * @param toCurrency Moneda destino
   * @returns Cantidad convertida
   * @throws AppError si la cantidad es inválida
   */
  convert(
    amount: number,
    fromCurrency: CurrencyType,
    toCurrency: CurrencyType
  ): number {
    if (isNaN(amount) || amount < 0) {
      throw ErrorService.create(
        ErrorCode.VALIDATION_ERROR,
        "Amount must be a positive number"
      )
    }

    if (amount === 0) {
      return 0
    }

    // Convertir a copper pieces primero
    const amountInCP = amount * this.conversionRates[fromCurrency]

    // Convertir de copper pieces a la moneda destino
    return amountInCP / this.conversionRates[toCurrency]
  }

  /**
   * Obtiene la tasa de conversión entre dos monedas
   * @param fromCurrency Moneda origen
   * @param toCurrency Moneda destino
   * @returns Tasa de conversión (cuántas unidades de 'to' equivalen a 1 unidad de 'from')
   */
  getConversionRate(
    fromCurrency: CurrencyType,
    toCurrency: CurrencyType
  ): number {
    if (fromCurrency === toCurrency) {
      return 1
    }

    return (
      this.conversionRates[fromCurrency] / this.conversionRates[toCurrency]
    )
  }

  /**
   * Formatea el resultado de una conversión
   * @param result Resultado numérico de la conversión
   * @returns String formateado (sin decimales si es entero, 2 decimales si no)
   */
  formatResult(result: number): string {
    return Number.isInteger(result) ? result.toString() : result.toFixed(2)
  }

  /**
   * Valida si un string es un tipo de moneda válido
   * @param currency String a validar
   * @returns true si es válido, false en caso contrario
   */
  isValidCurrency(currency: string): currency is CurrencyType {
    return ["PP", "GP", "EP", "SP", "CP"].includes(currency)
  }
}

