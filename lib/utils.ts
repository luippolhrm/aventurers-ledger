import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Formatea un precio en cobre a oro, mostrando enteros sin decimales cuando corresponda
 * @param priceInCopper Precio en cobre (copper pieces)
 * @returns String formateado en oro (ej: "1 gp" o "0.35 gp")
 */
export function formatPriceInGold(priceInCopper: number): string {
  const priceInGold = priceInCopper / 100
  // Si es un número entero, mostrar sin decimales
  if (Number.isInteger(priceInGold)) {
    return `${priceInGold} gp`
  }
  // Si no, mostrar con 2 decimales
  return `${priceInGold.toFixed(2)} gp`
}
