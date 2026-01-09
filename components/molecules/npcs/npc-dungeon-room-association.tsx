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
import type { DungeonRoom } from "@/lib/infrastructure/repositories/dungeon-repository.types"
import { MapPin, X } from "lucide-react"

interface NpcDungeonRoomAssociationProps {
  npcId: string
  campaignId: string
  isOwner: boolean
  onUpdate: () => void
}

export function NpcDungeonRoomAssociation({ npcId, campaignId, isOwner, onUpdate }: NpcDungeonRoomAssociationProps) {
  const { t } = useLanguage()
  const { user } = useAuth()
  const services = useServices()
  const { toast } = useToast()

  const [rooms, setRooms] = useState<DungeonRoom[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (npcId) {
      loadRooms()
    }
  }, [npcId])

  const loadRooms = async () => {
    if (!npcId) return

    setLoading(true)
    try {
      const roomsData = await services.npc.getDungeonRoomsByNpc(npcId)
      setRooms(roomsData)
    } catch (error: any) {
      console.error("Error loading dungeon rooms:", error)
      toast({
        title: t.inventory?.error || "Error",
        description: error?.message || "Error al cargar las salas",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleDisassociate = async (roomId: string) => {
    if (!user) return

    if (!confirm("¿Desasociar este NPC de la sala?")) return

    try {
      await services.dungeon.disassociateNpcFromRoom(npcId, roomId, user.id)
      toast({
        title: "Éxito",
        description: "NPC desasociado correctamente",
      })
      loadRooms()
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
    return <LoadingState message="Cargando salas..." />
  }

  return (
    <div className="space-y-4">
      {rooms.length === 0 ? (
        <EmptyState
          icon={MapPin}
          title="Sin salas asociadas"
          description="Este NPC no está asociado a ninguna sala de dungeon"
        />
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {rooms.map((room) => (
            <Card key={room.id}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-base">{room.name}</CardTitle>
                    {room.description && <CardDescription>{room.description}</CardDescription>}
                    {room.room_type && (
                      <span className="inline-block mt-2 text-xs px-2 py-1 rounded-full bg-primary/10 text-primary">
                        {t.marketplace?.roomTypes?.[room.room_type] || room.room_type}
                      </span>
                    )}
                  </div>
                  {isOwner && (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => handleDisassociate(room.id)}
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

