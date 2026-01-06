/**
 * Tipos relacionados con el repositorio de Movements
 */

/**
 * Tipo de movimiento financiero
 */
export type MovementType = "add" | "remove" | "conversion" | "purchase"

/**
 * Moneda válida
 */
export type Currency = "PP" | "GP" | "EP" | "SP" | "CP"

/**
 * Movement - Representa un movimiento financiero en el historial
 */
export interface Movement {
  id: string
  character_id: string
  from_currency: Currency
  to_currency: Currency
  amount_from: number
  amount_to: number
  movement_type: MovementType
  description?: string | null
  shop_id?: string | null
  location_id?: string | null
  created_at: string
}

/**
 * Movement con información enriquecida de shop y location
 */
export interface MovementWithDetails extends Movement {
  shop?: {
    id: string
    name: string
  } | null
  location?: {
    id: string
    name: string
  } | null
}

/**
 * Datos para crear un nuevo movimiento
 */
export interface CreateMovement {
  character_id: string
  from_currency: Currency
  to_currency: Currency
  amount_from: number
  amount_to: number
  movement_type: MovementType
  description?: string | null
  shop_id?: string | null
  location_id?: string | null
}

/**
 * Datos para actualizar un movimiento (rara vez se usa, pero por consistencia)
 */
export type UpdateMovement = Partial<Omit<Movement, "id" | "character_id" | "created_at">>

