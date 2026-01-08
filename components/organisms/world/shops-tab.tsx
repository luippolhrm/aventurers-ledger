"use client"

import { Card, CardContent } from "@/components/ui/card"
import { EmptyState } from "@/components/molecules/empty"
import { ShopCard } from "@/components/molecules/world/shop-card"
import type { Shop } from "@/lib/infrastructure/repositories/shop-repository"
import type { Location } from "@/lib/infrastructure/repositories/location-repository"
import { Store } from "lucide-react"
import { useLanguage } from "@/lib/language-context"

interface ShopsTabProps {
  shops: Shop[]
  selectedShopId: string
  selectedLocation: Location | undefined
  language?: "es" // Mantener por compatibilidad, pero ya no se usa
  onShopSelect: (shopId: string) => void
  onViewItems: (shopId: string) => void
  getShopTypeLabel: (type: string) => string
}

export function ShopsTab({
  shops,
  selectedShopId,
  selectedLocation,
  language,
  onShopSelect,
  onViewItems,
  getShopTypeLabel,
}: ShopsTabProps) {
  const { t } = useLanguage()

  if (!selectedLocation) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-base md:text-lg font-semibold flex items-center gap-2">
              <Store className="w-4 h-4 md:w-5 md:h-5" />
              {t.marketplace?.shops || "Tiendas"}
            </h3>
          </div>
        </div>
        <EmptyState
          icon={Store}
          title={t.marketplace?.selectLocationFirst || "Selecciona una ubicación"}
          description={t.marketplace?.selectLocationFirst || "Selecciona una ubicación para ver sus tiendas."}
        />
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-base md:text-lg font-semibold flex items-center gap-2">
            <Store className="w-4 h-4 md:w-5 md:h-5" />
            {t.marketplace?.shops || "Tiendas"}
          </h3>
          <p className="text-xs md:text-sm text-muted-foreground mt-1">
            {selectedLocation.name || "Ubicación seleccionada"}
          </p>
        </div>
      </div>
      {shops.length === 0 ? (
        <EmptyState
          icon={Store}
          title={t.marketplace?.emptyShops || "No hay tiendas"}
          description={t.marketplace?.emptyShops || "No hay tiendas en esta ubicación."}
        />
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {shops.map((shop) => (
            <ShopCard
              key={shop.id}
              shop={shop}
              isSelected={selectedShopId === shop.id}
              language={language}
              onClick={() => onShopSelect(shop.id)}
              onViewItems={() => onViewItems(shop.id)}
              getShopTypeLabel={getShopTypeLabel}
            />
          ))}
        </div>
      )}
    </div>
  )
}

