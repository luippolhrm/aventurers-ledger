"use client"

import { useState, useEffect } from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { WalletDisplay } from "@/components/molecules/wallet"
import { LoadingState } from "@/components/molecules/loading"
import { EmptyState } from "@/components/molecules/empty"
import { useServices } from "@/hooks/use-services"
import { useActiveCharacter } from "@/lib/active-character-context"
import { Coins } from "lucide-react"
import { useLanguage } from "@/lib/language-context"
import type { WalletData } from "@/lib/infrastructure/repositories"
// Por ahora, importamos el componente original para mantener la funcionalidad
// En el futuro, estos tabs se pueden refactorizar en componentes separados
import { Finances } from "@/components/finances"

interface FinancesViewProps {
  language?: "es" // Mantener por compatibilidad, pero ya no se usa
}

/**
 * Vista refactorizada de Finances usando nuevos componentes y servicios
 * Por ahora mantiene la funcionalidad original pero con mejor arquitectura
 */
export function FinancesView({ language }: FinancesViewProps) {
  const { activeCharacter } = useActiveCharacter()
  const [wallet, setWallet] = useState<WalletData | null>(null)
  const [loading, setLoading] = useState(true)
  const services = useServices()
  const { t } = useLanguage()

  useEffect(() => {
    if (activeCharacter) {
      loadWallet()
    } else {
      setLoading(false)
    }
  }, [activeCharacter])

  const loadWallet = async () => {
    if (!activeCharacter) return
    setLoading(true)
    try {
      const walletData = await services.wallet.getWallet(activeCharacter.id)
      setWallet(walletData)
    } catch (error) {
      console.error("Error loading wallet:", error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return <LoadingState message="Cargando finanzas..." />
  }

  if (!activeCharacter) {
    return (
      <EmptyState
        icon={Coins}
        title="No hay personaje activo"
        description="Selecciona un personaje para ver sus finanzas"
      />
    )
  }

  // Por ahora, mostramos el componente original pero con el wallet cargado usando el servicio
  // Esto permite que la refactorización sea gradual
  return (
    <div className="w-full max-w-6xl space-y-6">
      <WalletDisplay
        platinum={wallet?.platinum}
        gold={wallet?.gold}
        electrum={wallet?.electrum}
        silver={wallet?.silver}
        copper={wallet?.copper}
        totalWealth={wallet?.total_wealth}
        variant="detailed"
      />
      {/* Mantener el componente original por ahora */}
      <Finances language={language} />
    </div>
  )
}

