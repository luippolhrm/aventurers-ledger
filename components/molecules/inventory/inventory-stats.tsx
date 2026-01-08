"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { StatCard } from "@/components/molecules/item/stat-card"
import type { InventoryItem } from "@/lib/infrastructure/repositories"
import { Package, Shield, TrendingUp } from "lucide-react"
import { useLanguage } from "@/lib/language-context"

interface InventoryStatsProps {
  items: InventoryItem[]
  language?: "es" // Mantener por compatibilidad, pero ya no se usa
  copperToGold: (copper: number) => string
}

export function InventoryStats({ items, language, copperToGold }: InventoryStatsProps) {
  const { t } = useLanguage()

  const totalItems = items.length
  const equippedItems = items.filter((item) => item.equipped).length
  const totalWeight = items.reduce((sum, item) => sum + item.weight * item.quantity, 0).toFixed(2)
  const totalValue = items.reduce((sum, item) => sum + item.value_in_copper * item.quantity, 0)

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      <StatCard
        title={t.inventory.totalItems}
        value={totalItems.toString()}
        icon={Package}
        description={`${equippedItems} ${t.inventory.equippedCount}`}
      />
      <StatCard
        title={t.inventory.totalWeight}
        value={totalWeight}
        icon={Shield}
        description={t.inventory.pounds}
      />
      <StatCard
        title={t.inventory.totalValue}
        value={copperToGold(totalValue)}
        icon={TrendingUp}
        description={t.inventory.goldPieces}
      />
    </div>
  )
}

