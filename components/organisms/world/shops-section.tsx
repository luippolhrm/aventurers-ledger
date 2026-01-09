"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { EmptyState } from "@/components/molecules/empty"
import { ShopCard } from "@/components/molecules/world/shop-card"
import type { Shop } from "@/lib/infrastructure/repositories/shop-repository"
import type { Location } from "@/lib/infrastructure/repositories/location-repository"
import { Store, Plus } from "lucide-react"
import { useLanguage } from "@/lib/language-context"
import { useRouter } from "next/navigation"

interface ShopsSectionProps {
  shops: Shop[]
  selectedLocation: Location
  language?: "es" // Mantener por compatibilidad, pero ya no se usa
  onViewItems: (shopId: string) => void
  getShopTypeLabel: (type: string) => string
  campaignId: string
  isOwner: boolean
}

export function ShopsSection({
  shops,
  selectedLocation,
  language,
  onViewItems,
  getShopTypeLabel,
  campaignId,
  isOwner,
}: ShopsSectionProps) {
  const { t } = useLanguage()
  const router = useRouter()

  if (!selectedLocation) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Store className="w-5 h-5" />
            {t.marketplace?.shops || "Tiendas"}
          </CardTitle>
          <CardDescription>
            {t.marketplace?.selectLocationFirst || "Selecciona una ubicación para ver sus tiendas"}
          </CardDescription>
        </CardHeader>
        <Separator />
        <CardContent className="pt-6">
          <EmptyState
            icon={Store}
            title={t.marketplace?.selectLocationFirst || "Selecciona una ubicación"}
            description="Selecciona una ubicación del mapa para ver sus tiendas."
          />
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div className="space-y-1 flex-1 min-w-0">
            <CardTitle className="flex items-center gap-2">
              <Store className="w-5 h-5" />
              {t.marketplace?.shops || "Tiendas"} ({shops.length})
            </CardTitle>
            <CardDescription>
              {selectedLocation.name} • {t.marketplace?.shopsDescription || "Gestiona las tiendas de esta ubicación"}
            </CardDescription>
          </div>
          {isOwner && (
            <Button
              onClick={() => router.push(`/campaigns/${campaignId}/locations/${selectedLocation.id}/shops/new`)}
              className="shrink-0"
            >
              <Plus className="w-4 h-4 mr-2" />
              <span className="hidden sm:inline">{t.marketplace?.createShop || "Crear Tienda"}</span>
              <span className="sm:hidden">Crear</span>
            </Button>
          )}
        </div>
      </CardHeader>
      <Separator />
      <CardContent className="pt-6">
        {shops.length === 0 ? (
          <EmptyState
            icon={Store}
            title={t.marketplace?.emptyShops || "No hay tiendas"}
            description={`Esta ubicación aún no tiene tiendas registradas. ${isOwner ? 'Crea la primera tienda para comenzar a gestionar tu comercio.' : ''}`}
          >
            {isOwner && (
              <Button
                onClick={() => router.push(`/campaigns/${campaignId}/locations/${selectedLocation.id}/shops/new`)}
                className="mt-4"
              >
                <Plus className="w-4 h-4 mr-2" />
                {t.marketplace?.createFirstShop || "Crear Primera Tienda"}
              </Button>
            )}
          </EmptyState>
        ) : (
          <div className="grid gap-4 sm:grid-cols-1 md:grid-cols-2 xl:grid-cols-3">
            {shops.map((shop) => (
              <ShopCard
                key={shop.id}
                shop={shop}
                isSelected={false}
                language={language}
                onClick={() => router.push(`/campaigns/${campaignId}/locations/${selectedLocation.id}/shops/${shop.id}`)}
                onViewItems={() => onViewItems(shop.id)}
                getShopTypeLabel={getShopTypeLabel}
                onEdit={isOwner ? () => router.push(`/campaigns/${campaignId}/locations/${selectedLocation.id}/shops/${shop.id}`) : undefined}
                campaignId={campaignId}
                locationId={selectedLocation.id}
              />
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}

