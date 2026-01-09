"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { LoadingState } from "@/components/molecules/loading"
import { EmptyState } from "@/components/molecules/empty"
import { useAuth } from "@/lib/auth-context"
import { useServices } from "@/hooks/use-services"
import { useLanguage } from "@/lib/language-context"
import { useToast } from "@/hooks/use-toast"
import type { Npc } from "@/lib/infrastructure/repositories/npc-repository"
import type { Shop } from "@/lib/infrastructure/repositories/shop-repository"
import type { DungeonRoom } from "@/lib/infrastructure/repositories/dungeon-repository.types"
import { ArrowLeft, Users, Edit, Trash2, Package, Store, MapPin } from "lucide-react"
import { NpcInventorySection } from "@/components/molecules/npcs/npc-inventory-section"
import { NpcShopAssociation } from "@/components/molecules/npcs/npc-shop-association"
import { NpcDungeonRoomAssociation } from "@/components/molecules/npcs/npc-dungeon-room-association"

interface NpcDetailViewProps {
  campaignId: string
  npcId: string
}

export function NpcDetailView({ campaignId, npcId }: NpcDetailViewProps) {
  const { t } = useLanguage()
  const router = useRouter()
  const { user } = useAuth()
  const services = useServices()
  const { toast } = useToast()

  const [npc, setNpc] = useState<Npc | null>(null)
  const [shops, setShops] = useState<Shop[]>([])
  const [dungeonRooms, setDungeonRooms] = useState<DungeonRoom[]>([])
  const [loading, setLoading] = useState(true)
  const [isOwner, setIsOwner] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)

  useEffect(() => {
    if (user && campaignId && npcId) {
      loadData()
    }
  }, [user, campaignId, npcId])

  const loadData = async () => {
    if (!user || !campaignId || !npcId) return

    setLoading(true)
    try {
      const [campaign, npcData, shopsData, roomsData] = await Promise.all([
        services.campaign.getCampaign(campaignId),
        services.npc.getNpc(npcId),
        services.npc.getShopsByNpc(npcId),
        services.npc.getDungeonRoomsByNpc(npcId),
      ])

      setIsOwner(campaign.game_master_id === user.id)
      setNpc(npcData)
      setShops(shopsData)
      setDungeonRooms(roomsData)
    } catch (error: any) {
      console.error("[v0] NpcDetailView: Error loading data:", error)
      toast({
        title: t.inventory?.error || "Error",
        description: error?.message || "Error al cargar el NPC",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async () => {
    if (!user || !npc) return

    const confirmMessage = `¿Eliminar "${npc.name}"? Esta acción no se puede deshacer.`
    if (!confirm(confirmMessage)) return

    setIsDeleting(true)
    try {
      await services.npc.deleteNpc(npcId, user.id)
      toast({
        title: "Éxito",
        description: "NPC eliminado correctamente",
      })
      router.push(`/campaigns/${campaignId}/npcs`)
    } catch (error: any) {
      console.error("Error deleting NPC:", error)
      toast({
        title: t.inventory?.error || "Error",
        description: error?.message || "Error al eliminar el NPC",
        variant: "destructive",
      })
      setIsDeleting(false)
    }
  }

  if (loading) {
    return <LoadingState message="Cargando NPC..." />
  }

  if (!npc) {
    return (
      <div className="w-full max-w-3xl mx-auto space-y-4 md:space-y-6">
        <Button variant="ghost" onClick={() => router.push(`/campaigns/${campaignId}/npcs`)} className="text-sm md:text-base">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Volver a NPCs
        </Button>
        <EmptyState title="NPC no encontrado" description="El NPC solicitado no existe" />
      </div>
    )
  }

  return (
    <div className="w-full max-w-4xl mx-auto space-y-4 md:space-y-6">
      <Button variant="ghost" onClick={() => router.push(`/campaigns/${campaignId}/npcs`)} className="text-sm md:text-base">
        <ArrowLeft className="w-4 h-4 mr-2" />
        Volver a NPCs
      </Button>

      <Card>
        <CardHeader>
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <CardTitle className="flex items-center gap-2 text-2xl">
                <Users className="w-6 h-6" />
                {npc.name}
              </CardTitle>
              {npc.title && <CardDescription className="mt-2">{npc.title}</CardDescription>}
              {npc.resistances && (
                <div className="mt-2">
                  <Badge variant="secondary">Resistencias: {npc.resistances}</Badge>
                </div>
              )}
              {npc.story && <p className="mt-4 text-sm text-muted-foreground">{npc.story}</p>}
            </div>
            {isOwner && (
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={() => router.push(`/campaigns/${campaignId}/npcs/${npcId}/edit`)}>
                  <Edit className="w-4 h-4 mr-2" />
                  Editar
                </Button>
                <Button variant="destructive" size="sm" onClick={handleDelete} disabled={isDeleting}>
                  <Trash2 className="w-4 h-4 mr-2" />
                  {isDeleting ? "Eliminando..." : "Eliminar"}
                </Button>
              </div>
            )}
          </div>
        </CardHeader>
      </Card>

      <Tabs defaultValue="inventory" className="w-full">
        <TabsList>
          <TabsTrigger value="inventory">
            <Package className="w-4 h-4 mr-2" />
            {t.marketplace?.npcs?.inventory || "Inventario"}
          </TabsTrigger>
          <TabsTrigger value="shops">
            <Store className="w-4 h-4 mr-2" />
            {t.marketplace?.npcs?.shops || "Tiendas"} ({shops.length})
          </TabsTrigger>
          <TabsTrigger value="dungeonRooms">
            <MapPin className="w-4 h-4 mr-2" />
            {t.marketplace?.npcs?.dungeonRooms || "Salas"} ({dungeonRooms.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="inventory" className="space-y-4">
          <NpcInventorySection npcId={npcId} campaignId={campaignId} isOwner={isOwner} />
          {isOwner && (
            <Button onClick={() => router.push(`/campaigns/${campaignId}/npcs/${npcId}/loot`)} variant="outline" className="w-full">
              Distribuir Tesoro
            </Button>
          )}
        </TabsContent>

        <TabsContent value="shops" className="space-y-4">
          <NpcShopAssociation npcId={npcId} campaignId={campaignId} isOwner={isOwner} onUpdate={loadData} />
        </TabsContent>

        <TabsContent value="dungeonRooms" className="space-y-4">
          <NpcDungeonRoomAssociation npcId={npcId} campaignId={campaignId} isOwner={isOwner} onUpdate={loadData} />
        </TabsContent>
      </Tabs>
    </div>
  )
}

