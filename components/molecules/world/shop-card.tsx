"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import type { Shop } from "@/lib/infrastructure/repositories/shop-repository"
import { Package, Edit } from "lucide-react"
import { useLanguage } from "@/lib/language-context"

interface ShopCardProps {
  shop: Shop
  isSelected: boolean
  language?: "es" // Mantener por compatibilidad, pero ya no se usa
  onClick: () => void
  onViewItems: () => void
  getShopTypeLabel: (type: string) => string
  onEdit?: () => void
  campaignId?: string
  locationId?: string
}

export function ShopCard({
  shop,
  isSelected,
  language,
  onClick,
  onViewItems,
  getShopTypeLabel,
  onEdit,
  campaignId,
  locationId,
}: ShopCardProps) {
  const { t } = useLanguage()

  return (
    <Card
      className={`transition-shadow cursor-pointer ${
        isSelected ? "border-2 border-primary" : "border"
      }`}
      onClick={onClick}
    >
      <CardHeader>
        <div className="flex justify-between items-start">
          <div className="flex-1">
            <CardTitle className="text-base md:text-lg">{shop.name}</CardTitle>
            <CardDescription className="text-xs md:text-sm">{shop.description}</CardDescription>
            {shop.shopkeeper_name && (
              <p className="text-xs md:text-sm text-muted-foreground mt-1">Tendero: {shop.shopkeeper_name}</p>
            )}
            {(shop as any).shop_type && (
              <span className="inline-block mt-2 text-xs px-2 py-1 rounded-full bg-primary/10 text-primary uppercase">
                {getShopTypeLabel((shop as any).shop_type)}
              </span>
            )}
          </div>
          {onEdit && (
            <Button
              size="icon"
              variant="ghost"
              className="h-8 w-8"
              onClick={(e) => {
                e.stopPropagation()
                onEdit()
              }}
            >
              <Edit className="w-4 h-4" />
            </Button>
          )}
        </div>
      </CardHeader>
      {isSelected && (
        <CardContent>
          <Button variant="outline" className="w-full" onClick={onViewItems}>
            <Package className="w-4 h-4 mr-2" />
            {t.marketplace?.viewItems || "Ver Items"}
          </Button>
        </CardContent>
      )}
    </Card>
  )
}

