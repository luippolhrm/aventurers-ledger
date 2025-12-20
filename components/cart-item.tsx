"use client"

import { useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Trash2, Minus, Plus } from "lucide-react"
import type { ShoppingCartItem } from "@/lib/services/shopping-cart-service"
import { type Language, translations } from "@/lib/translations"
import { formatPriceInGold } from "@/lib/utils"

interface CartItemProps {
  item: ShoppingCartItem
  onUpdateQuantity: (cartItemId: string, quantity: number) => Promise<void>
  onRemove: (cartItemId: string) => Promise<void>
  language: Language
}

function getRarityColor(rarity: string | null | undefined): string {
  if (!rarity) return "bg-gray-200 text-gray-800 dark:bg-gray-700 dark:text-gray-200"
  
  const colors: Record<string, string> = {
    common: "bg-gray-200 text-gray-800 dark:bg-gray-700 dark:text-gray-200",
    uncommon: "bg-green-200 text-green-800 dark:bg-green-700 dark:text-green-200",
    rare: "bg-blue-200 text-blue-800 dark:bg-blue-700 dark:text-blue-200",
    very_rare: "bg-purple-200 text-purple-800 dark:bg-purple-700 dark:text-purple-200",
    legendary: "bg-orange-200 text-orange-800 dark:bg-orange-700 dark:text-orange-200",
    artifact: "bg-red-200 text-red-800 dark:bg-red-700 dark:text-red-200",
  }
  return colors[rarity.toLowerCase()] || colors.common
}

export function CartItem({ item, onUpdateQuantity, onRemove, language }: CartItemProps) {
  const t = translations[language]
  const shopItem = item.shop_item
  const [quantity, setQuantity] = useState(item.quantity.toString())
  const [isUpdating, setIsUpdating] = useState(false)

  if (!shopItem) {
    return null
  }

  const handleQuantityChange = async (newQuantity: number) => {
    if (newQuantity < 1) {
      setIsUpdating(true)
      try {
        await onRemove(item.id)
      } finally {
        setIsUpdating(false)
      }
      return
    }

    if (newQuantity > shopItem.quantity_available) {
      setQuantity(item.quantity.toString())
      return
    }

    setIsUpdating(true)
    try {
      // Actualizar el estado local optimísticamente
      setQuantity(newQuantity.toString())
      await onUpdateQuantity(item.id, newQuantity)
      // Si falla, restaurar el valor original
    } catch (error) {
      console.error("[CartItem] Error updating quantity:", error)
      setQuantity(item.quantity.toString())
    } finally {
      setIsUpdating(false)
    }
  }

  const handleInputChange = (value: string) => {
    const numValue = Number.parseInt(value) || 0
    if (numValue >= 0) {
      setQuantity(value)
    }
  }

  const handleInputBlur = () => {
    const numValue = Number.parseInt(quantity) || 1
    handleQuantityChange(Math.max(1, Math.min(numValue, shopItem.quantity_available)))
  }

  const subtotal = shopItem.price_in_copper * item.quantity

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardContent className="p-4">
        <div className="flex gap-4 items-start">
          {shopItem.image_url && (
            <div className="w-20 h-20 flex-shrink-0 rounded-md overflow-hidden bg-muted">
              <img src={shopItem.image_url} alt={shopItem.item_name} className="w-full h-full object-cover" />
            </div>
          )}
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="font-semibold text-lg truncate">{shopItem.item_name}</h3>
                  {shopItem.rarity && (
                    <span className={`text-xs px-2 py-1 rounded-full ${getRarityColor(shopItem.rarity)}`}>
                      {shopItem.rarity}
                    </span>
                  )}
                </div>
                <p className="text-sm text-muted-foreground">
                  {shopItem.item_type}
                  {shopItem.item_category && ` • ${shopItem.item_category}`}
                </p>
                <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{shopItem.description}</p>
              </div>
              <div className="text-right flex-shrink-0">
                <p className="text-lg font-bold">{formatPriceInGold(subtotal)}</p>
                <p className="text-xs text-muted-foreground">
                  {formatPriceInGold(shopItem.price_in_copper)} each
                </p>
              </div>
            </div>

            <div className="flex items-center justify-between mt-4 gap-4">
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => handleQuantityChange(item.quantity - 1)}
                  disabled={isUpdating || item.quantity <= 1}
                >
                  <Minus className="w-4 h-4" />
                </Button>
                <Input
                  type="number"
                  min="1"
                  max={shopItem.quantity_available}
                  value={quantity}
                  onChange={(e) => handleInputChange(e.target.value)}
                  onBlur={handleInputBlur}
                  className="w-20 text-center"
                  disabled={isUpdating}
                />
                <Button
                  variant="outline"
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => handleQuantityChange(item.quantity + 1)}
                  disabled={isUpdating || item.quantity >= shopItem.quantity_available}
                >
                  <Plus className="w-4 h-4" />
                </Button>
                <span className="text-xs text-muted-foreground ml-2">
                  {t.marketplace?.stock || "Stock"}: {shopItem.quantity_available}
                </span>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => onRemove(item.id)}
                disabled={isUpdating}
                className="text-destructive hover:text-destructive"
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
