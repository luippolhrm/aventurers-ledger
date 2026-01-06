/**
 * Tipos relacionados con el repositorio de Transfers
 */

/**
 * Moneda válida
 */
export type Currency = "PP" | "GP" | "EP" | "SP" | "CP"

/**
 * Transfer - Representa una transferencia entre personajes
 */
export interface Transfer {
  id: string
  from_character_id: string
  to_character_id: string
  currency: Currency
  amount: number
  description?: string | null
  created_at: string
}

/**
 * Transfer con información enriquecida de personajes
 */
export interface TransferWithDetails extends Transfer {
  from_character?: {
    id: string
    name: string
  } | null
  to_character?: {
    id: string
    name: string
  } | null
}

/**
 * Datos para crear una nueva transferencia
 */
export interface CreateTransfer {
  from_character_id: string
  to_character_id: string
  currency: Currency
  amount: number
  description?: string | null
}

/**
 * Datos para actualizar una transferencia (rara vez se usa)
 */
export type UpdateTransfer = Partial<Omit<Transfer, "id" | "from_character_id" | "to_character_id" | "created_at">>

