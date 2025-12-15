"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { ShoppingCart } from "lucide-react"
import { createBrowserClient } from "@/lib/supabase/client"
import { useAuth } from "@/lib/auth-context"
import { type Language, translations } from "@/lib/translations"

interface ShopItem {
  id: string
  item_name: string
  item_type: string | null
  description: string | null
  price_in_copper: number
  weight: number
  quantity_available: number
}

interface ShopCatalogProps {
  language: Language
  shopId: string
  characterId: string
}

export function ShopCatalog({ language, shopId, characterId }: ShopCatalogProps) {
  const t = translations[language]
  const supabase = createBrowserClient()
  const { user } = useAuth()

  const [items, setItems] = useState<ShopItem[]>([])
  const [selectedItem, setSelectedItem] = useState<ShopItem | null>(null)
  const [quantity, setQuantity] = useState(1)
  const [isLoading, setIsLoading] = useState(false)
  const [isBuyDialogOpen, setIsBuyDialogOpen] = useState(false)

  useEffect(() => {
    loadCatalog()
  }, [shopId])

  const loadCatalog = async () => {
    const { data, error } = await supabase
      .from("shop_items")
      .select("*")
      .eq("shop_id", shopId)
      .gt("quantity_available", 0)
      .order("item_name")

    if (!error && data) {
      setItems(data)
    }
  }

  const handleBuyItem = async () => {
    if (!selectedItem || !characterId) return

    const totalCost = selectedItem.price_in_copper * quantity

    setIsLoading(true)

    // Get wallet balance
    const { data: walletData, error: walletError } = await supabase
      .from("wallets")
      .select("*")
      .eq("character_id", characterId)
      .maybeSingle()

    if (walletError || !walletData) {
      console.error("[v0] Error loading wallet:", walletError)
      setIsLoading(false)
      return
    }

    const totalInCopper =
      walletData.copper +
      walletData.silver * 10 +
      walletData.electrum * 50 +
      walletData.gold * 100 +
      walletData.platinum * 1000

    if (totalInCopper < totalCost) {
      console.error("[v0] Insufficient funds for purchase")
      setIsLoading(false)
      return
    }

    // Add item to inventory
    const { error: inventoryError } = await supabase.from("inventory").insert({
      character_id: characterId,
      item_name: selectedItem.item_name,
      item_type: selectedItem.item_type,
      quantity,
      weight: selectedItem.weight * quantity,
      value_in_copper: selectedItem.price_in_copper * quantity,
      description: selectedItem.description,
    })

    if (inventoryError) {
      console.error("[v0] Error adding item to inventory:", inventoryError)
      setIsLoading(false)
      return
    }

    // Deduct from wallet (prioritize gold)
    let remaining = totalCost
    let newCopper = walletData.copper
    let newSilver = walletData.silver
    let newElectrum = walletData.electrum
    let newGold = walletData.gold
    let newPlatinum = walletData.platinum

    if (remaining >= 1000 && newPlatinum > 0) {
      const platinumSpend = Math.min(Math.floor(remaining / 1000), newPlatinum)
      newPlatinum -= platinumSpend
      remaining -= platinumSpend * 1000
    }

    if (remaining >= 100 && newGold > 0) {
      const goldSpend = Math.min(Math.floor(remaining / 100), newGold)
      newGold -= goldSpend
      remaining -= goldSpend * 100
    }

    if (remaining >= 50 && newElectrum > 0) {
      const electrumSpend = Math.min(Math.floor(remaining / 50), newElectrum)
      newElectrum -= electrumSpend
      remaining -= electrumSpend * 50
    }

    if (remaining >= 10 && newSilver > 0) {
      const silverSpend = Math.min(Math.floor(remaining / 10), newSilver)
      newSilver -= silverSpend
      remaining -= silverSpend * 10
    }

    newCopper -= remaining

    // Update wallet
    const { error: updateError } = await supabase
      .from("wallets")
      .update({
        copper: Math.max(0, newCopper),
        silver: Math.max(0, newSilver),
        electrum: Math.max(0, newElectrum),
        gold: Math.max(0, newGold),
        platinum: Math.max(0, newPlatinum),
        total_wealth: totalInCopper - totalCost,
      })
      .eq("character_id", characterId)

    if (!updateError) {
      setIsBuyDialogOpen(false)
      setSelectedItem(null)
      setQuantity(1)
    }

    setIsLoading(false)
  }

  return (
    <div className="w-full max-w-4xl mx-auto space-y-6">
      <div>
        <h2 className="text-3xl font-bold flex items-center gap-2 text-foreground">
          <ShoppingCart className="w-8 h-8" />
          {t.marketplace?.catalog || "Shop Catalog"}
        </h2>
        <p className="text-muted-foreground mt-2">{t.marketplace?.catalogDescription || "Browse and purchase items"}</p>
      </div>

      <div className="grid gap-4">
        {items.map((item) => (
          <Card key={item.id} className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <CardTitle>{item.item_name}</CardTitle>
                  <CardDescription>{item.item_type}</CardDescription>
                  <p className="text-sm text-muted-foreground mt-2">{item.description}</p>
                </div>
                <div className="text-right">
                  <p className="text-lg font-bold">{(item.price_in_copper / 100).toFixed(2)} gp</p>
                  <p className="text-sm text-muted-foreground">Weight: {item.weight}</p>
                  <p className="text-sm text-muted-foreground">Stock: {item.quantity_available}</p>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <Button
                onClick={() => {
                  setSelectedItem(item)
                  setQuantity(1)
                  setIsBuyDialogOpen(true)
                }}
                className="w-full"
              >
                {t.marketplace?.buy || "Buy"}
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>

      <Dialog open={isBuyDialogOpen} onOpenChange={setIsBuyDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t.marketplace?.purchaseItem || "Purchase Item"}</DialogTitle>
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
                  {t.marketplace?.pricePerUnit || "Price per unit"}: {(selectedItem.price_in_copper / 100).toFixed(2)}{" "}
                  gp
                </p>
                <p className="text-lg font-bold">
                  {t.marketplace?.totalPrice || "Total"}: {((selectedItem.price_in_copper * quantity) / 100).toFixed(2)}{" "}
                  gp
                </p>
              </div>

              <Button onClick={handleBuyItem} disabled={isLoading} className="w-full">
                {t.marketplace?.confirmPurchase || "Confirm Purchase"}
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
