"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Store, Plus, Trash2 } from "lucide-react"
import { useAuth } from "@/lib/auth-context"
import { useLanguage } from "@/lib/language-context"
import { useServices } from "@/hooks/use-services"
import { ErrorService } from "@/lib/infrastructure/errors"

interface Shop {
  id: string
  name: string
  description: string | null
  shopkeeper_name: string | null
  location_id: string
  created_at: string
}

interface ShopsProps {
  language?: "es" // Mantener por compatibilidad, pero ya no se usa
  locationId: string
  onSelectShop?: (shopId: string) => void
}

export function Shops({ language, locationId, onSelectShop }: ShopsProps) {
  const { t } = useLanguage()
  const services = useServices()
  const { user } = useAuth()

  const [shops, setShops] = useState<Shop[]>([])
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [newShopName, setNewShopName] = useState("")
  const [newShopDescription, setNewShopDescription] = useState("")
  const [newShopkeeperName, setNewShopkeeperName] = useState("")
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    if (locationId) {
      loadShops()
    } else {
      setShops([])
    }
  }, [locationId, user])

  const loadShops = async () => {
    if (!locationId || !user) {
      setShops([])
      return
    }

    try {
      // Obtener tiendas usando ShopService
      const shopsData = await services.shop.getShopsByLocation(locationId)
      setShops(shopsData.map((shop) => ({
        id: shop.id,
        name: shop.name,
        description: shop.description,
        shopkeeper_name: shop.shopkeeper_name,
        location_id: shop.location_id,
        created_at: shop.created_at,
      })))
    } catch (error) {
      console.error("[v0] Shops: Error loading shops:", error)
      setShops([])
    }
  }

  const handleCreateShop = async () => {
    if (!newShopName.trim() || !user) return

    setIsLoading(true)
    try {
      const newShop = await services.shop.createShop(
        {
          name: newShopName,
          description: newShopDescription || null,
          shopkeeper_name: newShopkeeperName || null,
          location_id: locationId,
          shop_type: null,
        },
        user.id
      )

      setShops([
        {
          id: newShop.id,
          name: newShop.name,
          description: newShop.description,
          shopkeeper_name: newShop.shopkeeper_name,
          location_id: newShop.location_id,
          created_at: newShop.created_at,
        },
        ...shops,
      ])
      setNewShopName("")
      setNewShopDescription("")
      setNewShopkeeperName("")
      setIsCreateDialogOpen(false)
    } catch (error) {
      console.error("[v0] Shops: Error creating shop:", error)
      const errorMessage =
        error instanceof Error
          ? error.message
          : ErrorService.fromUnknownError(error).message
      alert(errorMessage || "Error creating shop")
    } finally {
      setIsLoading(false)
    }
  }

  const handleDeleteShop = async (shopId: string) => {
    try {
      await services.shop.deleteShop(shopId)
      setShops(shops.filter((s) => s.id !== shopId))
    } catch (error) {
      console.error("[v0] Shops: Error deleting shop:", error)
      const errorMessage =
        error instanceof Error
          ? error.message
          : ErrorService.fromUnknownError(error).message
      alert(errorMessage || "Error deleting shop")
    }
  }

  return (
    <div className="w-full max-w-4xl mx-auto space-y-6">
      <div className="space-y-4">
        <div>
          <h2 className="text-3xl font-bold flex items-center gap-2 text-foreground">
            <Store className="w-8 h-8" />
            {t.marketplace?.shops || "Shops"}
          </h2>
          <p className="text-muted-foreground mt-2">
            {t.marketplace?.shopsDescription || "Browse shops in this location"}
          </p>
        </div>

        <Button onClick={() => setIsCreateDialogOpen(true)} className="w-full">
          <Plus className="w-4 h-4 mr-2" />
          {t.marketplace?.createShop || "Create Shop"}
        </Button>
      </div>

      <div className="grid gap-4">
        {shops.map((shop) => (
          <Card
            key={shop.id}
            className="cursor-pointer hover:shadow-lg transition-shadow"
            onClick={() => onSelectShop?.(shop.id)}
          >
            <CardHeader>
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle>{shop.name}</CardTitle>
                  <CardDescription>{shop.shopkeeper_name && `Shopkeeper: ${shop.shopkeeper_name}`}</CardDescription>
                  <p className="text-sm text-muted-foreground mt-2">{shop.description}</p>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation()
                    handleDeleteShop(shop.id)
                  }}
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </CardHeader>
          </Card>
        ))}
      </div>

      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t.marketplace?.createShop || "Create Shop"}</DialogTitle>
            <DialogDescription>{t.marketplace?.shopSubtitle || "Add a new shop to this location"}</DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <Label>{t.marketplace?.shopName || "Shop Name"}</Label>
              <Input
                placeholder={t.marketplace?.enterShopName || "Enter shop name"}
                value={newShopName}
                onChange={(e) => setNewShopName(e.target.value)}
              />
            </div>

            <div>
              <Label>{t.marketplace?.shopkeeperName || "Shopkeeper Name"}</Label>
              <Input
                placeholder={t.marketplace?.enterShopkeeperName || "Enter shopkeeper name"}
                value={newShopkeeperName}
                onChange={(e) => setNewShopkeeperName(e.target.value)}
              />
            </div>

            <div>
              <Label>{t.marketplace?.description || "Description"}</Label>
              <Textarea
                placeholder={t.marketplace?.describeShop || "Describe this shop"}
                value={newShopDescription}
                onChange={(e) => setNewShopDescription(e.target.value)}
              />
            </div>

            <Button onClick={handleCreateShop} disabled={isLoading || !newShopName.trim()} className="w-full">
              {t.campaigns?.create || "Create"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
