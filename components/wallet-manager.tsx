"use client"

/**
 * @deprecated Este componente está siendo refactorizado.
 * Por favor, usa WalletView de @/components/features/wallet
 * 
 * Este componente actúa como wrapper temporal para mantener compatibilidad.
 */
import { WalletView } from "@/components/features/wallet"
interface WalletManagerProps {
  language?: "es" // Mantener por compatibilidad, pero ya no se usa
  characterId: string
}

/**
 * @deprecated Este componente está siendo refactorizado.
 * Usa WalletView directamente para mejor rendimiento.
 */
export function WalletManager({ language, characterId }: WalletManagerProps) {
  return <WalletView language={language} characterId={characterId} />
}
