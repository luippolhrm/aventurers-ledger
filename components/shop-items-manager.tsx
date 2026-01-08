"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Package, Pencil, Trash2, Plus, Edit } from "lucide-react"
import { createBrowserClient } from "@/lib/supabase/client"
import { useAuth } from "@/lib/auth-context"
import { useToast } from "@/hooks/use-toast"
import { useLanguage } from "@/lib/language-context"
import type { ShopItemExtended } from "@/lib/types/shop-item"
import { ShopItemForm } from "./shop-item-form"

interface ShopItemsManagerProps {
  shopId: string
  shopName: string
  language?: "es" // Mantener por compatibilidad, pero ya no se usa
  isGm: boolean
}

interface ShopItemRow extends ShopItemExtended {
  id: string
  shop_id: string
  created_at?: string
  updated_at?: string
}

export function ShopItemsManager({ shopId, shopName, language, isGm }: ShopItemsManagerProps) {
  const { t } = useLanguage()
  const supabase = createBrowserClient()
  const { user } = useAuth()
  const { toast } = useToast()

  const [items, setItems] = useState<ShopItemRow[]>([])
  const [isLoading, setIsLoading] = useState(true)
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
  }

  const handleEditItem = (item: ShopItemRow) => {
    setEditingItem(item)
  }

  const handleCancelEdit = () => {
    setEditingItem(null)
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


  const copperToGold = (copper: number) => (copper / 100).toFixed(2)

  return (
    <Card className="w-full max-w-6xl">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Package className="w-6 h-6" />
          {shopName}
        </CardTitle>
        <CardDescription>
          {t.marketplace?.manageItemsDescription || "Manage items available in this shop"}
        </CardDescription>
      </CardHeader>

      <CardContent>
        <Tabs defaultValue="items" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="items">{t.inventory?.tabs?.items || "Lista de artículos"}</TabsTrigger>
            <TabsTrigger value="add">{isGm ? (editingItem ? t.marketplace?.editItem : t.marketplace?.addItem) : t.inventory?.tabs?.items || "Lista de artículos"}</TabsTrigger>
          </TabsList>

          {/* Items List Tab */}
          <TabsContent value="items" className="space-y-4">
            {isLoading ? (
              <p className="text-center py-8 text-muted-foreground">{t.inventory?.loading || "Loading..."}</p>
            ) : items.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <Package className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                  <p className="text-lg font-semibold">{t.marketplace?.noItemsYet || "No items yet"}</p>
                  <p className="text-muted-foreground mt-1">
                    {isGm
                      ? "Agrega tu primer artículo usando el formulario en la pestaña Agregar"
                      : "El dueño de la tienda aún no ha agregado artículos"}
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>{t.marketplace?.itemName || "Item Name"}</TableHead>
                      <TableHead>{t.inventory?.type || "Type"}</TableHead>
                      <TableHead>{t.marketplace?.itemCategory || "Category"}</TableHead>
                      <TableHead>{t.marketplace?.rarity || "Rarity"}</TableHead>
                      <TableHead className="text-right">{t.marketplace?.pricePerUnit || "Price"}</TableHead>
                      <TableHead className="text-right">{t.marketplace?.quantity || "Stock"}</TableHead>
                      {isGm && <TableHead className="text-right">{t.inventory?.actions || "Actions"}</TableHead>}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {items.map((item) => (
                      <TableRow key={item.id}>
                        <TableCell className="font-medium">
                          <div className="flex flex-col">
                            <span>{item.item_name}</span>
                            {item.description && (
                              <span className="text-xs text-muted-foreground line-clamp-1 mt-1">
                                {item.description}
                              </span>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>{item.item_type || "—"}</TableCell>
                        <TableCell>
                          {item.item_category ? (
                            <span className="text-xs px-2 py-1 rounded-full bg-primary/10 text-primary">
                              {(t.marketplace as any)?.categories?.[item.item_category as string] ||
                                item.item_category}
                            </span>
                          ) : (
                            "—"
                          )}
                        </TableCell>
                        <TableCell>
                          {item.rarity && (
                            <span className={`text-xs px-2 py-1 rounded-full ${getRarityColor(item.rarity)}`}>
                              {t.marketplace?.rarities?.[item.rarity] || item.rarity}
                            </span>
                          )}
                          {!item.rarity && "—"}
                        </TableCell>
                        <TableCell className="text-right font-semibold text-primary">
                          {copperToGold(item.price_in_copper || 0)} gp
                        </TableCell>
                        <TableCell className="text-right">{item.quantity_available || 0}</TableCell>
                        {isGm && (
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-1">
                              <Button variant="ghost" size="sm" onClick={() => handleEditItem(item)}>
                                <Edit className="w-4 h-4" />
                              </Button>
                              <Button variant="ghost" size="sm" onClick={() => handleDeleteItem(item.id)}>
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>
                          </TableCell>
                        )}
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </TabsContent>

          {/* Add/Edit Item Tab */}
          {isGm && (
            <TabsContent value="add" className="space-y-4">
              <div className="space-y-4">
                {editingItem && (
                  <div className="p-4 bg-muted rounded-lg flex justify-between items-center">
                    <p className="text-sm">
                      {t.inventory?.editingItem || "Editing item"}: {editingItem.item_name}
                    </p>
                    <Button variant="outline" size="sm" onClick={handleCancelEdit}>
                      {t.inventory?.cancelEdit || "Cancel Edit"}
                    </Button>
                  </div>
                )}

                <ShopItemForm
                  language={language}
                  initialData={editingItem || undefined}
                  onSubmit={handleSaveItem}
                  onCancel={handleCancelEdit}
                  isLoading={isSaving}
                />
              </div>
            </TabsContent>
          )}
        </Tabs>
      </CardContent>
    </Card>
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
