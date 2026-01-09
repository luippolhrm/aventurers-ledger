"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { LoadingState } from "@/components/molecules/loading"
import { EmptyState } from "@/components/molecules/empty"
import { useAuth } from "@/lib/auth-context"
import { useServices } from "@/hooks/use-services"
import { useLanguage } from "@/lib/language-context"
import { useToast } from "@/hooks/use-toast"
import type { DungeonRoom } from "@/lib/infrastructure/repositories/dungeon-repository.types"
import type { Npc } from "@/lib/infrastructure/repositories/npc-repository"
import { ArrowLeft, MapPin, Edit, Trash2, Users } from "lucide-react"
import { NpcInventorySection } from "@/components/molecules/npcs/npc-inventory-section"

interface DungeonRoomViewProps {
  campaignId: string
  locationId: string
  roomId: string
}

export function DungeonRoomView({ campaignId, locationId, roomId }: DungeonRoomViewProps) {
  const { t } = useLanguage()
  const router = useRouter()
  const { user } = useAuth()
  const services = useServices()
  const { toast } = useToast()

  const [room, setRoom] = useState<DungeonRoom | null>(null)
  const [npcs, setNpcs] = useState<Npc[]>([])
  const [loading, setLoading] = useState(true)
  const [isOwner, setIsOwner] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)

  useEffect(() => {
    if (user && campaignId && locationId && roomId) {
      loadData()
    }
  }, [user, campaignId, locationId, roomId])

  const loadData = async () => {
    if (!user || !campaignId || !locationId || !roomId) return

    setLoading(true)
    try {
      const [campaign, roomData, npcsData] = await Promise.all([
        services.campaign.getCampaign(campaignId),
        services.dungeon.getRoomById(roomId),
        services.dungeon.getNpcsByRoom(roomId).then(async (npcRefs) => {
          const npcPromises = npcRefs
            .filter((ref) => ref.npc_id)
            .map((ref) => services.npc.getNpc(ref.npc_id!))
          return Promise.all(npcPromises)
        }),
      ])

      setIsOwner(campaign.game_master_id === user.id)
      setRoom(roomData)
      setNpcs(npcsData)
    } catch (error: any) {
      console.error("[v0] DungeonRoomView: Error loading data:", error)
      toast({
        title: t.inventory?.error || "Error",
        description: error?.message || "Error al cargar la sala",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async () => {
    if (!user || !room) return

    const confirmMessage = `¿Eliminar "${room.name}"? Esta acción no se puede deshacer.`
    if (!confirm(confirmMessage)) return

    setIsDeleting(true)
    try {
      await services.dungeon.deleteRoom(roomId, user.id)
      toast({
        title: "Éxito",
        description: "Sala eliminada correctamente",
      })
      router.push(`/campaigns/${campaignId}/locations/${locationId}/dungeon`)
    } catch (error: any) {
      console.error("Error deleting room:", error)
      toast({
        title: t.inventory?.error || "Error",
        description: error?.message || "Error al eliminar la sala",
        variant: "destructive",
      })
      setIsDeleting(false)
    }
  }

  if (loading) {
    return <LoadingState message="Cargando sala..." />
  }

  if (!room) {
    return (
      <div className="w-full max-w-3xl mx-auto space-y-4 md:space-y-6">
        <Button variant="ghost" onClick={() => router.push(`/campaigns/${campaignId}/locations/${locationId}/dungeon`)} className="text-sm md:text-base">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Volver a Mazmorra
        </Button>
        <EmptyState icon={MapPin} title="Sala no encontrada" description="La sala solicitada no existe" />
      </div>
    )
  }

  return (
    <div className="w-full max-w-4xl mx-auto space-y-4 md:space-y-6">
      <Button variant="ghost" onClick={() => router.push(`/campaigns/${campaignId}/locations/${locationId}/dungeon`)} className="text-sm md:text-base">
        <ArrowLeft className="w-4 h-4 mr-2" />
        Volver a Mazmorra
      </Button>

      <Card>
        <CardHeader>
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <CardTitle className="flex items-center gap-2 text-2xl">
                <MapPin className="w-6 h-6" />
                {room.name}
              </CardTitle>
              {room.description && <CardDescription className="mt-2">{room.description}</CardDescription>}
              {room.room_type && (
                <Badge className="mt-2" variant="secondary">
                  {t.marketplace?.roomTypes?.[room.room_type] || room.room_type}
                </Badge>
              )}
            </div>
            {isOwner && (
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={() => {/* TODO: Editar */}}>
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

      <Tabs defaultValue="npcs" className="w-full">
        <TabsList>
          <TabsTrigger value="npcs">
            <Users className="w-4 h-4 mr-2" />
            NPCs ({npcs.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="npcs" className="space-y-4">
          {npcs.length === 0 ? (
            <EmptyState icon={Users} title="Sin NPCs" description="Esta sala no tiene NPCs asociados" />
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {npcs.map((npc) => (
                <Card
                  key={npc.id}
                  className="cursor-pointer hover:bg-muted/50 transition-colors"
                  onClick={() => router.push(`/campaigns/${campaignId}/npcs/${npc.id}`)}
                >
                  <CardHeader>
                    <CardTitle className="text-base">{npc.name}</CardTitle>
                    {npc.title && <CardDescription>{npc.title}</CardDescription>}
                  </CardHeader>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}

