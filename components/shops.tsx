"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Store, Plus, Trash2 } from "lucide-react"
import { createBrowserClient } from "@/lib/supabase/client"
import { type Language, translations } from "@/lib/translations"

interface Shop {
  id: string
  name: string
  description: string | null
  shopkeeper_name: string | null
  location_id: string
  created_at: string
}

interface ShopsProps {
  language: Language
  locationId: string
  onSelectShop?: (shopId: string) => void
}

export function Shops({ language, locationId, onSelectShop }: ShopsProps) {
  const t = translations[language]
  const supabase = createBrowserClient()

  const [shops, setShops] = useState<Shop[]>([])
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [newShopName, setNewShopName] = useState("")
  const [newShopDescription, setNewShopDescription] = useState("")
  const [newShopkeeperName, setNewShopkeeperName] = useState("")
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    loadShops()
  }, [locationId])

  const loadShops = async () => {
    const { data, error } = await supabase
      .from("shops")
      .select("*")
      .eq("location_id", locationId)
      .order("created_at", { ascending: false })

    if (!error && data) {
      setShops(data)
    }
  }

  const handleCreateShop = async () => {
    if (!newShopName.trim()) return

    setIsLoading(true)
    const { data, error } = await supabase
      .from("shops")
      .insert({
        name: newShopName,
        description: newShopDescription,
        shopkeeper_name: newShopkeeperName,
        location_id: locationId,
      })
      .select()

    if (!error && data) {
      setShops([data[0], ...shops])
      setNewShopName("")
      setNewShopDescription("")
      setNewShopkeeperName("")
      setIsCreateDialogOpen(false)
    }
    setIsLoading(false)
  }

  const handleDeleteShop = async (shopId: string) => {
    const { error } = await supabase.from("shops").delete().eq("id", shopId)

    if (!error) {
      setShops(shops.filter((s) => s.id !== shopId))
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
