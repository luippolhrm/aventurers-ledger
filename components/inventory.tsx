"use client"

/**
 * @deprecated Este componente está siendo refactorizado.
 * Por favor, usa InventoryView de @/components/features/inventory
 * 
 * Este componente actúa como wrapper temporal para mantener compatibilidad.
 */
import { InventoryView } from "@/components/features/inventory"
interface InventoryProps {
  language?: "es" // Mantener por compatibilidad, pero ya no se usa
  characterId: string
  campaignId: string
}

/**
 * @deprecated Este componente está siendo refactorizado.
 * Usa InventoryView directamente para mejor rendimiento.
 */
export function Inventory({ language, characterId, campaignId }: InventoryProps) {
  return <InventoryView language={language} characterId={characterId} campaignId={campaignId} />
}
