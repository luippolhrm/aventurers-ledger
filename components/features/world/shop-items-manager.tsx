"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { LoadingState } from "@/components/molecules/loading"
import { EmptyState } from "@/components/molecules/empty"
import { Package, Edit, Trash2 } from "lucide-react"
import { createBrowserClient } from "@/lib/supabase/client"
import { useAuth } from "@/lib/auth-context"
import { useToast } from "@/hooks/use-toast"
import { useLanguage } from "@/lib/language-context"
import type { ShopItemExtended } from "@/lib/types/shop-item"
import { ShopItemForm } from "@/components/shop-item-form"

interface ShopItemsManagerProps {
  shopId: string
  shopName: string
  isGm: boolean
}

interface ShopItemRow extends ShopItemExtended {
  id: string
  shop_id: string
  created_at?: string
  updated_at?: string
}

export function ShopItemsManager({ shopId, shopName, isGm }: ShopItemsManagerProps) {
  const { t } = useLanguage()
  const supabase = createBrowserClient()
  const { user } = useAuth()
  const { toast } = useToast()

  const [items, setItems] = useState<ShopItemRow[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [editingItem, setEditingItem] = useState<ShopItemRow | null>(null)
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    loadItems()
  }, [shopId])

  const loadItems = async () => {
    setIsLoading(true)
    setError(null)
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
      setError(t.marketplace?.errorLoadingItems || "Error al cargar los items")
      toast({
        title: t.inventory?.error || "Error",
        description: t.marketplace?.errorLoadingItems || "Error al cargar los items",
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
    if (!confirm(t.marketplace?.confirmDeleteItem || "¿Estás seguro de que quieres eliminar este item?")) {
      return
    }

    try {
      const { error } = await supabase.from("shop_items").delete().eq("id", itemId)

      if (error) throw error

      setItems(items.filter((item) => item.id !== itemId))
      toast({
        title: t.marketplace?.itemDeleted || "Item eliminado",
        description: "El item ha sido eliminado de la tienda",
      })
    } catch (error) {
      console.error("Error deleting item:", error)
      toast({
        title: t.inventory?.error || "Error",
        description: "Error al eliminar el item",
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
          title: t.marketplace?.itemUpdated || "Item actualizado",
          description: "El item ha sido actualizado exitosamente",
        })
      } else {
        // Create new item
        const { error } = await supabase.from("shop_items").insert(payload)

        if (error) throw error

        toast({
          title: t.marketplace?.itemCreated || "Item creado",
          description: "El item ha sido agregado a la tienda",
        })
      }

      setEditingItem(null)
      loadItems()
    } catch (error) {
      console.error("Error saving item:", error)
      toast({
        title: t.inventory?.error || "Error",
        description: "Error al guardar el item",
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
          {t.marketplace?.manageItemsDescription || "Gestiona los items disponibles en esta tienda"}
        </CardDescription>
      </CardHeader>

      <CardContent>
        {error && (
          <Alert variant="destructive" className="mb-4">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <Tabs defaultValue="items" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="items">{t.inventory?.tabs?.items || "Lista de artículos"}</TabsTrigger>
            <TabsTrigger value="add">
              {isGm ? (editingItem ? t.marketplace?.editItem : t.marketplace?.addItem) : t.inventory?.tabs?.items || "Lista de artículos"}
            </TabsTrigger>
          </TabsList>

          {/* Items List Tab */}
          <TabsContent value="items" className="space-y-4">
            {isLoading ? (
              <LoadingState message={t.marketplace?.loadingItems || "Cargando items..."} />
            ) : items.length === 0 ? (
              <EmptyState
                icon={Package}
                title={t.marketplace?.noItemsYet || "No hay items aún"}
                description={
                  isGm
                    ? "Agrega tu primer artículo usando el formulario en la pestaña Agregar"
                    : "El dueño de la tienda aún no ha agregado artículos"
                }
              />
            ) : (
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>{t.marketplace?.itemName || "Nombre del Item"}</TableHead>
                      <TableHead>{t.inventory?.type || "Tipo"}</TableHead>
                      <TableHead>{t.marketplace?.itemCategory || "Categoría"}</TableHead>
                      <TableHead>{t.marketplace?.rarity || "Rareza"}</TableHead>
                      <TableHead className="text-right">{t.marketplace?.pricePerUnit || "Precio"}</TableHead>
                      <TableHead className="text-right">{t.marketplace?.quantity || "Stock"}</TableHead>
                      {isGm && <TableHead className="text-right">{t.inventory?.actions || "Acciones"}</TableHead>}
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
                      {t.inventory?.editingItem || "Editando item"}: {editingItem.item_name}
                    </p>
                    <Button variant="outline" size="sm" onClick={handleCancelEdit}>
                      {t.inventory?.cancelEdit || "Cancelar Edición"}
                    </Button>
                  </div>
                )}

                <ShopItemForm
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

