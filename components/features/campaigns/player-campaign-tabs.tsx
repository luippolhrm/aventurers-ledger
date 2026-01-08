"use client"

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { WalletManager } from "@/components/wallet-manager"
import { Inventory } from "@/components/inventory"
import { Movements } from "@/components/movements"
import { CampaignWorldView } from "@/components/campaign-world-view"
import { CharacterSummaryView } from "@/components/features/character"
import { Globe, Coins, Package, ArrowRightLeft } from "lucide-react"
interface PlayerCampaignTabsProps {
  characterId: string
  campaignId: string
  language?: "es" // Mantener por compatibilidad, pero ya no se usa
  variant?: "default" | "compact"
}

export function PlayerCampaignTabs({
  characterId,
  campaignId,
  language,
  variant = "default",
}: PlayerCampaignTabsProps) {
  const isCompact = variant === "compact"

  return (
    <Tabs defaultValue="overview" className="w-full">
      {isCompact ? (
        <TabsList className="grid w-full grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-1 h-auto">
          <TabsTrigger value="overview" className="text-xs sm:text-sm py-2">
            <span className="hidden sm:inline">Resumen</span>
            <span className="sm:hidden">Res.</span>
          </TabsTrigger>
          <TabsTrigger value="wallet" className="text-xs sm:text-sm py-2">
            <Coins className="w-3 h-3 sm:w-4 sm:h-4 sm:mr-1.5" />
            <span className="hidden sm:inline">Monedero</span>
          </TabsTrigger>
          <TabsTrigger value="inventory" className="text-xs sm:text-sm py-2">
            <Package className="w-3 h-3 sm:w-4 sm:h-4 sm:mr-1.5" />
            <span className="hidden sm:inline">Inventario</span>
          </TabsTrigger>
          <TabsTrigger value="movements" className="text-xs sm:text-sm py-2">
            <ArrowRightLeft className="w-3 h-3 sm:w-4 sm:h-4 sm:mr-1.5" />
            <span className="hidden sm:inline">Movimientos</span>
          </TabsTrigger>
          <TabsTrigger value="world" className="text-xs sm:text-sm py-2">
            <Globe className="w-3 h-3 sm:w-4 sm:h-4 sm:mr-1.5" />
            <span className="hidden sm:inline">Mundo</span>
          </TabsTrigger>
        </TabsList>
      ) : (
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="overview">Resumen</TabsTrigger>
          <TabsTrigger value="wallet">Monedero</TabsTrigger>
          <TabsTrigger value="inventory">Inventario</TabsTrigger>
          <TabsTrigger value="movements">Movimientos</TabsTrigger>
          <TabsTrigger value="world">
            <Globe className="w-4 h-4 mr-2" />
            Mundo
          </TabsTrigger>
        </TabsList>
      )}

      <TabsContent value="overview" className="space-y-4">
        <CharacterSummaryView characterId={characterId} campaignId={campaignId} language={language} />
      </TabsContent>

      <TabsContent value="wallet" className="space-y-4">
        <WalletManager language={language} characterId={characterId} />
      </TabsContent>

      <TabsContent value="inventory" className="space-y-4">
        <Inventory language={language} characterId={characterId} campaignId={campaignId} />
      </TabsContent>

      <TabsContent value="movements" className="space-y-4">
        <Movements language={language} characterId={characterId} />
      </TabsContent>

      <TabsContent value="world" className="space-y-4">
        <CampaignWorldView campaignId={campaignId} language={language} />
      </TabsContent>
    </Tabs>
  )
}

