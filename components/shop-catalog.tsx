"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { ShoppingCart, ShoppingBag } from "lucide-react"
import { useAuth } from "@/lib/auth-context"
import { type Language, translations } from "@/lib/translations"
import { useShoppingCart } from "@/hooks/use-shopping-cart"
import { useToast } from "@/hooks/use-toast"
import { formatPriceInGold } from "@/lib/utils"
import { useServices } from "@/hooks/use-services"
import { ErrorService } from "@/lib/infrastructure/errors"

interface ShopItem {
  id: string
  item_name: string
  item_type: string | null
  description: string | null
  price_in_copper: number
  weight: number
  quantity_available: number
  image_url?: string | null
  rarity?: string | null
  item_category?: string | null
  damage_dice?: string | null
  damage_type?: string | null
  armor_class?: number | null
  properties?: string[] | null
  attunement?: boolean | null
}

interface ShopCatalogProps {
  language: Language
  shopId: string
  characterId: string
  isGm: boolean
}

export function ShopCatalog({ language, shopId, characterId, isGm }: ShopCatalogProps) {
  const t = translations[language]
  const services = useServices()
  const { user } = useAuth()
  const { addItem, itemCount } = useShoppingCart(shopId)
  const { toast } = useToast()

  const [items, setItems] = useState<ShopItem[]>([])
  const [selectedItem, setSelectedItem] = useState<ShopItem | null>(null)
  const [quantity, setQuantity] = useState(1)
  const [isLoading, setIsLoading] = useState(false)
  const [isAddToCartDialogOpen, setIsAddToCartDialogOpen] = useState(false)

  useEffect(() => {
    loadCatalog()
  }, [shopId])

  const loadCatalog = async () => {
    try {
      const availableItems = await services.shopItem.getAvailableShopItems(shopId)
      setItems(
        availableItems.map((item) => ({
          id: item.id,
          item_name: item.item_name,
          item_type: item.item_type,
          description: item.description,
          price_in_copper: item.price_in_copper,
          weight: item.weight,
          quantity_available: item.quantity_available,
          image_url: item.image_url,
          rarity: item.rarity,
          item_category: item.item_category,
        }))
      )
    } catch (error) {
      console.error("[v0] ShopCatalog: Error loading catalog:", error)
      const errorMessage =
        error instanceof Error
          ? error.message
          : ErrorService.fromUnknownError(error).message
      toast({
        title: "Error",
        description: errorMessage || "Failed to load shop catalog",
        variant: "destructive",
      })
    }
  }

  const handleAddToCart = async () => {
    if (!selectedItem || !characterId || isGm) return

    setIsLoading(true)
    const success = await addItem(selectedItem.id, quantity)
      setIsLoading(false)

    if (success) {
      setIsAddToCartDialogOpen(false)
      setSelectedItem(null)
      setQuantity(1)
    }
  }

  return (
    <div className="w-full max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
      <div>
        <h2 className="text-3xl font-bold flex items-center gap-2 text-foreground">
          <ShoppingCart className="w-8 h-8" />
          {t.marketplace?.catalog || "Shop Catalog"}
        </h2>
          <p className="text-muted-foreground mt-2">
            {t.marketplace?.catalogDescription || "Browse and purchase items"}
          </p>
        </div>
      </div>

      <div className="grid gap-4">
        {items.map((item) => (
          <Card key={item.id} className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className="flex gap-4 items-start">
                {item.image_url && (
                  <div className="w-24 h-24 flex-shrink-0 rounded-md overflow-hidden bg-muted">
                    <img src={item.image_url} alt={item.item_name} className="w-full h-full object-cover" />
                  </div>
                )}
                <div className="flex-1">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1">
                      <CardTitle className="flex items-center gap-2">
                        {item.item_name}
                        {item.rarity && (
                          <span className={`text-xs px-2 py-1 rounded-full ${getRarityColor(item.rarity)}`}>
                            {item.rarity}
                          </span>
                        )}
                      </CardTitle>
                      <CardDescription>
                        {item.item_type}
                        {item.item_category && ` • ${item.item_category}`}
                      </CardDescription>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-bold">{formatPriceInGold(item.price_in_copper)}</p>
                      <p className="text-xs text-muted-foreground">Stock: {item.quantity_available}</p>
                    </div>
                  </div>
                  <p className="text-sm text-muted-foreground mt-2">{item.description}</p>
                  
                  {/* Stats */}
                  {(item.damage_dice || item.armor_class) && (
                    <div className="flex gap-4 mt-2 text-sm">
                      {item.damage_dice && (
                        <div>
                          <span className="font-semibold">Damage:</span> {item.damage_dice}
                          {item.damage_type && ` (${item.damage_type})`}
                        </div>
                      )}
                      {item.armor_class && (
                        <div>
                          <span className="font-semibold">AC:</span> {item.armor_class}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Properties */}
                  {(() => {
                    let properties: string[] = []
                    if (item.properties) {
                      if (typeof item.properties === 'string') {
                        try {
                          const parsed = JSON.parse(item.properties)
                          // Asegurar que sea un array
                          if (Array.isArray(parsed)) {
                            properties = parsed.filter((p: any) => typeof p === 'string' && p.trim().length > 0)
                          } else if (typeof parsed === 'string' && parsed.trim().length > 0) {
                            properties = [parsed]
                          }
                        } catch {
                          // Si no es JSON válido, tratar como string simple solo si no está vacío
                          if (item.properties.trim().length > 0) {
                            properties = [item.properties]
                          }
                        }
                      } else if (Array.isArray(item.properties)) {
                        // Filtrar solo strings válidos (no vacíos, no solo comillas)
                        properties = item.properties.filter((p: any) => {
                          if (typeof p !== 'string') return false
                          const trimmed = p.trim()
                          // Filtrar strings vacíos, solo comillas, o valores malformados
                          return trimmed.length > 0 && 
                                 trimmed !== '"' && 
                                 trimmed !== '""' && 
                                 trimmed !== '"""' &&
                                 !trimmed.match(/^["\\]+$/) // No solo comillas y backslashes
                        })
                      }
                    }
                    // Asegurar que properties sea un array antes de usar .map()
                    if (!Array.isArray(properties)) {
                      properties = []
                    }
                    // Filtrar valores vacíos o inválidos una vez más antes de renderizar
                    properties = properties.filter(p => p && p.trim().length > 0)
                    return properties.length > 0 ? (
                    <div className="flex flex-wrap gap-1 mt-2">
                        {properties.map((prop, idx) => (
                        <span key={idx} className="text-xs px-2 py-1 rounded-md bg-secondary">
                          {prop}
                        </span>
                      ))}
                    </div>
                    ) : null
                  })()}

                  {/* Attunement */}
                  {item.attunement && (
                    <div className="text-xs text-amber-600 dark:text-amber-400 mt-2">
                      ⚠️ Requires Attunement
                    </div>
                  )}
                </div>
              </div>
            </CardHeader>
            {!isGm && (
            <CardContent>
              <Button
                onClick={() => {
                  setSelectedItem(item)
                  setQuantity(1)
                    setIsAddToCartDialogOpen(true)
                }}
                className="w-full"
                  disabled={item.quantity_available === 0}
              >
                  <ShoppingBag className="w-4 h-4 mr-2" />
                  {t.marketplace?.addToCart || "Add to Cart"}
              </Button>
            </CardContent>
            )}
          </Card>
        ))}
      </div>

      <Dialog open={isAddToCartDialogOpen} onOpenChange={setIsAddToCartDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t.marketplace?.addToCart || "Add to Cart"}</DialogTitle>
            <DialogDescription>{selectedItem?.item_name}</DialogDescription>
          </DialogHeader>

          {selectedItem && (
            <div className="space-y-4">
              <div>
                <Label>{t.marketplace?.quantity || "Quantity"}</Label>
                <Input
                  type="number"
                  min="1"
                  max={selectedItem.quantity_available}
                  value={quantity}
                  onChange={(e) => setQuantity(Math.max(1, Number.parseInt(e.target.value) || 1))}
                />
              </div>

              <div className="bg-muted p-4 rounded-lg">
                <p className="text-sm text-muted-foreground">
                  {t.marketplace?.pricePerUnit || "Price per unit"}: {formatPriceInGold(selectedItem.price_in_copper)}
                </p>
                <p className="text-lg font-bold">
                  {t.marketplace?.subtotal || "Subtotal"}: {formatPriceInGold(selectedItem.price_in_copper * quantity)}
                </p>
              </div>

              <Button onClick={handleAddToCart} disabled={isLoading} className="w-full">
                {isLoading ? (
                  t.marketplace?.adding || "Adding..."
                ) : (
                  <>
                    <ShoppingBag className="w-4 h-4 mr-2" />
                    {t.marketplace?.addToCart || "Add to Cart"}
                  </>
                )}
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}

function getRarityColor(rarity: string): string {
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
