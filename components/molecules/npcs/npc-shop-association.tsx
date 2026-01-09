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
import type { Shop } from "@/lib/infrastructure/repositories/shop-repository"
import { Store, X } from "lucide-react"

interface NpcShopAssociationProps {
  npcId: string
  campaignId: string
  isOwner: boolean
  onUpdate: () => void
}

export function NpcShopAssociation({ npcId, campaignId, isOwner, onUpdate }: NpcShopAssociationProps) {
  const { t } = useLanguage()
  const { user } = useAuth()
  const services = useServices()
  const { toast } = useToast()

  const [shops, setShops] = useState<Shop[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (npcId) {
      loadShops()
    }
  }, [npcId])

  const loadShops = async () => {
    if (!npcId) return

    setLoading(true)
    try {
      const shopsData = await services.npc.getShopsByNpc(npcId)
      setShops(shopsData)
    } catch (error: any) {
      console.error("Error loading shops:", error)
      toast({
        title: t.inventory?.error || "Error",
        description: error?.message || "Error al cargar las tiendas",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleDisassociate = async (shopId: string) => {
    if (!user) return

    if (!confirm("¿Desasociar este NPC de la tienda?")) return

    try {
      await services.npc.disassociateNpcFromShop(npcId, shopId, user.id)
      toast({
        title: "Éxito",
        description: "NPC desasociado correctamente",
      })
      loadShops()
      onUpdate()
    } catch (error: any) {
      console.error("Error disassociating NPC:", error)
      toast({
        title: t.inventory?.error || "Error",
        description: error?.message || "Error al desasociar el NPC",
        variant: "destructive",
      })
    }
  }

  if (loading) {
    return <LoadingState message="Cargando tiendas..." />
  }

  return (
    <div className="space-y-4">
      {shops.length === 0 ? (
        <EmptyState
          icon={Store}
          title="Sin tiendas asociadas"
          description="Este NPC no está asociado a ninguna tienda"
        />
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {shops.map((shop) => (
            <Card key={shop.id}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-base">{shop.name}</CardTitle>
                    {shop.description && <CardDescription>{shop.description}</CardDescription>}
                  </div>
                  {isOwner && (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => handleDisassociate(shop.id)}
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  )}
                </div>
              </CardHeader>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}

