"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Package, Pencil, Trash2, Plus } from "lucide-react"
import { createBrowserClient } from "@/lib/supabase/client"
import { useAuth } from "@/lib/auth-context"
import { useToast } from "@/hooks/use-toast"
import { translations, type Language } from "@/lib/translations"
import type { ShopItemExtended } from "@/lib/types/shop-item"
import { ShopItemForm } from "./shop-item-form"

interface ShopItemsManagerProps {
  shopId: string
  shopName: string
  language: Language
  isGm: boolean
}

interface ShopItemRow extends ShopItemExtended {
  id: string
  shop_id: string
  created_at?: string
  updated_at?: string
}

export function ShopItemsManager({ shopId, shopName, language, isGm }: ShopItemsManagerProps) {
  const t = translations[language]
  const supabase = createBrowserClient()
  const { user } = useAuth()
  const { toast } = useToast()

  const [items, setItems] = useState<ShopItemRow[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingItem, setEditingItem] = useState<ShopItemRow | null>(null)
  const [isSaving, setIsSaving] = useState(false)

  useEffect(() => {
    loadItems()
  }, [shopId])

  const loadItems = async () => {
    setIsLoading(true)
    try {
      const { data, error } = await supabase
        .from("shop_items")
        .select("*")
        .eq("shop_id", shopId)
        .order("created_at", { ascending: false })

      if (error) throw error

      setItems((data as ShopItemRow[]) || [])
    } catch (error) {
      console.error("Error loading items:", error)
      toast({
        title: t.inventory?.error || "Error",
        description: "Failed to load items",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleCreateItem = () => {
    setEditingItem(null)
    setIsDialogOpen(true)
  }

  const handleEditItem = (item: ShopItemRow) => {
    setEditingItem(item)
    setIsDialogOpen(true)
  }

  const handleDeleteItem = async (itemId: string) => {
    if (!confirm(t.marketplace?.confirmDeleteItem || "Are you sure you want to delete this item?")) {
      return
    }

    try {
      const { error } = await supabase.from("shop_items").delete().eq("id", itemId)

      if (error) throw error

      setItems(items.filter((item) => item.id !== itemId))
      toast({
        title: t.marketplace?.itemDeleted || "Item Deleted",
        description: "The item has been removed from the shop",
      })
    } catch (error) {
      console.error("Error deleting item:", error)
      toast({
        title: t.inventory?.error || "Error",
        description: "Failed to delete item",
        variant: "destructive",
      })
    }
  }

  const handleSaveItem = async (itemData: Partial<ShopItemExtended>) => {
    setIsSaving(true)

    try {
      const payload = {
        ...itemData,
        shop_id: shopId,
        properties: itemData.properties ? JSON.stringify(itemData.properties) : "[]",
      }

      if (editingItem) {
        // Update existing item
        const { error } = await supabase.from("shop_items").update(payload).eq("id", editingItem.id)

        if (error) throw error

        toast({
          title: t.marketplace?.itemUpdated || "Item Updated",
          description: "The item has been updated successfully",
        })
      } else {
        // Create new item
        const { error } = await supabase.from("shop_items").insert(payload)

        if (error) throw error

        toast({
          title: t.marketplace?.itemCreated || "Item Created",
          description: "The item has been added to the shop",
        })
      }

      setIsDialogOpen(false)
      setEditingItem(null)
      loadItems()
    } catch (error) {
      console.error("Error saving item:", error)
      toast({
        title: t.inventory?.error || "Error",
        description: "Failed to save item",
        variant: "destructive",
      })
    } finally {
      setIsSaving(false)
    }
  }


  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold flex items-center gap-2">
            <Package className="w-8 h-8" />
            {shopName}
          </h2>
          <p className="text-muted-foreground mt-1">
            {t.marketplace?.manageItemsDescription || "Manage items available in this shop"}
          </p>
        </div>
        {isGm && (
          <Button onClick={handleCreateItem}>
            <Plus className="w-4 h-4 mr-2" />
            {t.marketplace?.addItem || "Add Item"}
          </Button>
        )}
      </div>

      {/* Items List */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {items.map((item) => (
          <Card key={item.id} className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <CardTitle className="text-lg flex items-center gap-2">
                    {item.item_name}
                    {item.rarity && (
                      <span className={`text-xs px-2 py-1 rounded-full ${getRarityColor(item.rarity)}`}>
                        {t.marketplace?.rarities?.[item.rarity] || item.rarity}
                      </span>
                    )}
                  </CardTitle>
                  <CardDescription>
                    {item.item_type}
                    {item.item_category && ` • ${item.item_category}`}
                  </CardDescription>
                </div>
                {isGm && (
                  <div className="flex gap-1">
                    <Button size="icon" variant="ghost" onClick={() => handleEditItem(item)}>
                      <Pencil className="w-4 h-4" />
                    </Button>
                    <Button size="icon" variant="ghost" onClick={() => handleDeleteItem(item.id)}>
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                )}
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 text-sm">
                {item.description && (
                  <p className="text-muted-foreground line-clamp-2">{item.description}</p>
                )}
                <div className="flex justify-between items-center pt-2 border-t">
                  <span className="font-semibold text-primary">
                    {((item.price_in_copper || 0) / 100).toFixed(2)} gp
                  </span>
                  <span className="text-muted-foreground">Stock: {item.quantity_available}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Empty State */}
      {items.length === 0 && !isLoading && (
        <Card>
          <CardContent className="py-12 text-center">
            <Package className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-lg font-semibold">{t.marketplace?.noItemsYet || "No items yet"}</p>
            <p className="text-muted-foreground mt-1">
              {isGm
                ? "Add your first item using the manual entry form"
                : "The shop owner hasn't added any items yet"}
            </p>
            {isGm && (
              <Button onClick={handleCreateItem} className="mt-4">
                <Plus className="w-4 h-4 mr-2" />
                {t.marketplace?.addItem || "Add Item"}
              </Button>
            )}
          </CardContent>
        </Card>
      )}

      {/* Create/Edit Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-7xl max-h-[90vh] overflow-y-auto w-[95vw]">
          <DialogHeader>
            <DialogTitle>
              {editingItem ? t.marketplace?.editItem || "Edit Item" : t.marketplace?.addItem || "Add Item"}
            </DialogTitle>
            <DialogDescription>
              {editingItem
                ? "Update the item details below"
                : "Add a new item using the manual entry form"}
            </DialogDescription>
          </DialogHeader>

            <ShopItemForm
              language={language}
            initialData={editingItem || undefined}
                  onSubmit={handleSaveItem}
                  onCancel={() => setIsDialogOpen(false)}
                  isLoading={isSaving}
                />
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
  return colors[rarity] || colors.common
}
