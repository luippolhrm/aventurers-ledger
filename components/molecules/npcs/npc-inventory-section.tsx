"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { LoadingState } from "@/components/molecules/loading"
import { EmptyState } from "@/components/molecules/empty"
import { useServices } from "@/hooks/use-services"
import { useLanguage } from "@/lib/language-context"
import { useToast } from "@/hooks/use-toast"
import { useAuth } from "@/lib/auth-context"
import type { NpcInventoryItem } from "@/lib/infrastructure/repositories/npc-inventory-repository"
import { Package, Plus, Trash2, Edit } from "lucide-react"

interface NpcInventorySectionProps {
  npcId: string
  campaignId: string
  isOwner: boolean
}

export function NpcInventorySection({ npcId, campaignId, isOwner }: NpcInventorySectionProps) {
  const { t } = useLanguage()
  const { user } = useAuth()
  const services = useServices()
  const { toast } = useToast()

  const [items, setItems] = useState<NpcInventoryItem[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (npcId) {
      loadInventory()
    }
  }, [npcId])

  const loadInventory = async () => {
    if (!npcId) return

    setLoading(true)
    try {
      const inventoryItems = await services.npc.getNpcInventory(npcId)
      setItems(inventoryItems)
    } catch (error: any) {
      console.error("Error loading NPC inventory:", error)
      toast({
        title: t.inventory?.error || "Error",
        description: error?.message || "Error al cargar el inventario",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (itemId: string) => {
    if (!user) return

    if (!confirm("¿Eliminar este item del inventario?")) return

    try {
      await services.npc.removeItemFromNpc(itemId, user.id)
      toast({
        title: "Éxito",
        description: "Item eliminado correctamente",
      })
      loadInventory()
    } catch (error: any) {
      console.error("Error deleting item:", error)
      toast({
        title: t.inventory?.error || "Error",
        description: error?.message || "Error al eliminar el item",
        variant: "destructive",
      })
    }
  }

  const copperToGold = (copper: number) => (copper / 100).toFixed(2)

  if (loading) {
    return <LoadingState message="Cargando inventario..." />
  }

  return (
    <div className="space-y-4">
      {isOwner && (
        <Button onClick={() => {/* TODO: Abrir modal de agregar item */}}>
          <Plus className="w-4 h-4 mr-2" />
          Agregar Item
        </Button>
      )}

      {items.length === 0 ? (
        <EmptyState
          icon={Package}
          title="Inventario vacío"
          description="Este NPC no tiene items en su inventario"
        />
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {items.map((item) => (
            <Card key={item.id}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-base">{item.item_name}</CardTitle>
                    <CardDescription>{item.item_type}</CardDescription>
                  </div>
                  {isOwner && (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => handleDelete(item.id)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 text-sm">
                  <div>
                    <span className="font-medium">Cantidad:</span> {item.quantity}
                  </div>
                  <div>
                    <span className="font-medium">Peso:</span> {item.weight} lbs
                  </div>
                  <div>
                    <span className="font-medium">Valor:</span> {copperToGold(item.value_in_copper)} GP
                  </div>
                  {item.description && (
                    <div>
                      <span className="font-medium">Descripción:</span> {item.description}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}

