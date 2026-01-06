/**
 * Tipos y interfaces para WalletRepository
 */

export interface WalletData {
  platinum: number
  gold: number
  electrum: number
  silver: number
  copper: number
  total_wealth: number
}

/**
 * Datos parciales para actualizar un wallet
 */
export type WalletUpdateData = Partial<Omit<WalletData, "total_wealth">>

