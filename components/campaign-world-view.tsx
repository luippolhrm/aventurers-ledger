"use client"

/**
 * @deprecated Este componente está siendo refactorizado.
 * Por favor, usa WorldView de @/components/features/world
 * 
 * Este componente actúa como wrapper temporal para mantener compatibilidad.
 */
import { WorldView } from "@/components/features/world"
interface CampaignWorldViewProps {
  campaignId: string
  language?: "es" // Mantener por compatibilidad, pero ya no se usa
}

/**
 * @deprecated Este componente está siendo refactorizado.
 * Usa WorldView directamente para mejor rendimiento.
 */
export function CampaignWorldView({ campaignId, language }: CampaignWorldViewProps) {
  return <WorldView campaignId={campaignId} language={language} />
}
