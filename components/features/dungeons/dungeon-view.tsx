"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { LoadingState } from "@/components/molecules/loading"
import { EmptyState } from "@/components/molecules/empty"
import { useAuth } from "@/lib/auth-context"
import { useServices } from "@/hooks/use-services"
import { useLanguage } from "@/lib/language-context"
import { useToast } from "@/hooks/use-toast"
import type { Dungeon } from "@/lib/infrastructure/repositories/dungeon-repository.types"
import type { DungeonRoom } from "@/lib/infrastructure/repositories/dungeon-repository.types"
import { ArrowLeft, MapPin, Plus, Edit, Trash2, Skull } from "lucide-react"
import { DIFFICULTY_LEVEL_OPTIONS, ROOM_TYPE_OPTIONS } from "@/lib/constants/dungeon-constants"

interface DungeonViewProps {
  campaignId: string
  locationId: string
}

export function DungeonView({ campaignId, locationId }: DungeonViewProps) {
  const { t } = useLanguage()
  const router = useRouter()
  const { user } = useAuth()
  const services = useServices()
  const { toast } = useToast()

  const [dungeon, setDungeon] = useState<Dungeon | null>(null)
  const [rooms, setRooms] = useState<DungeonRoom[]>([])
  const [loading, setLoading] = useState(true)
  const [isOwner, setIsOwner] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)

  useEffect(() => {
    if (user && campaignId && locationId) {
      loadData()
    }
  }, [user, campaignId, locationId])

  const loadData = async () => {
    if (!user || !campaignId || !locationId) return

    setLoading(true)
    try {
      const [campaign, location, dungeonData] = await Promise.all([
        services.campaign.getCampaign(campaignId),
        services.location.getLocation(locationId),
        services.dungeon.getDungeonByLocation(locationId),
      ])

      setIsOwner(campaign.game_master_id === user.id)

      if (dungeonData) {
        setDungeon(dungeonData)
        const roomsData = await services.dungeon.getRoomsByDungeon(dungeonData.id)
        setRooms(roomsData)
      }
    } catch (error: any) {
      console.error("[v0] DungeonView: Error loading data:", error)
      toast({
        title: t.inventory?.error || "Error",
        description: error?.message || "Error al cargar la mazmorra",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async () => {
    if (!user || !dungeon) return

    const confirmMessage = `¿Eliminar esta mazmorra? Esta acción eliminará también todas las salas asociadas. Esta acción no se puede deshacer.`
    if (!confirm(confirmMessage)) return

    setIsDeleting(true)
    try {
      await services.dungeon.deleteDungeon(dungeon.id, user.id)
      toast({
        title: "Éxito",
        description: "Mazmorra eliminada correctamente",
      })
      router.push(`/campaigns/${campaignId}/locations/${locationId}`)
    } catch (error: any) {
      console.error("Error deleting dungeon:", error)
      toast({
        title: t.inventory?.error || "Error",
        description: error?.message || "Error al eliminar la mazmorra",
        variant: "destructive",
      })
      setIsDeleting(false)
    }
  }

  if (loading) {
    return <LoadingState message="Cargando mazmorra..." />
  }

  if (!dungeon) {
    return (
      <div className="w-full max-w-3xl mx-auto space-y-4 md:space-y-6">
        <Button variant="ghost" onClick={() => router.push(`/campaigns/${campaignId}/locations/${locationId}`)} className="text-sm md:text-base">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Volver a Ubicación
        </Button>
        {isOwner && (
          <Card>
            <CardHeader>
              <CardTitle>{t.marketplace?.dungeons?.noDungeon || "Mazmorra no encontrada"}</CardTitle>
              <CardDescription>
                {t.marketplace?.dungeons?.noDungeon || "Esta ubicación no tiene una mazmorra asociada"}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button onClick={() => router.push(`/campaigns/${campaignId}/locations/${locationId}/dungeon/create`)}>
                <Plus className="w-4 h-4 mr-2" />
                {t.marketplace?.dungeons?.createDungeon || "Crear Mazmorra"}
              </Button>
            </CardContent>
          </Card>
        )}
        {!isOwner && (
          <EmptyState icon={Skull} title="Mazmorra no encontrada" description="Esta ubicación no tiene una mazmorra asociada" />
        )}
      </div>
    )
  }

  return (
    <div className="w-full max-w-4xl mx-auto space-y-4 md:space-y-6">
      <Button variant="ghost" onClick={() => router.push(`/campaigns/${campaignId}/locations/${locationId}`)} className="text-sm md:text-base">
        <ArrowLeft className="w-4 h-4 mr-2" />
        Volver a Ubicación
      </Button>

      <Card>
        <CardHeader>
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <CardTitle className="flex items-center gap-2 text-2xl">
                <Skull className="w-6 h-6 text-purple-600" />
                Mazmorra
              </CardTitle>
              {dungeon.recommended_level && (
                <CardDescription className="mt-2">
                  Nivel recomendado: {dungeon.recommended_level}
                </CardDescription>
              )}
              {dungeon.difficulty_level && (
                <Badge className="mt-2" variant="secondary">
                  {t.marketplace?.difficultyLevels?.[dungeon.difficulty_level] || dungeon.difficulty_level}
                </Badge>
              )}
              {dungeon.is_cleared && (
                <Badge className="mt-2 ml-2" variant="outline">
                  Limpiada
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

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Salas ({rooms.length})</CardTitle>
            {isOwner && (
              <Button onClick={() => router.push(`/campaigns/${campaignId}/locations/${locationId}/dungeon/rooms/new`)}>
                <Plus className="w-4 h-4 mr-2" />
                Crear Sala
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {rooms.length === 0 ? (
            <EmptyState
              icon={Skull}
              title="Sin salas"
              description="Esta mazmorra no tiene salas creadas aún"
            />
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {rooms.map((room) => (
                <Card
                  key={room.id}
                  className="cursor-pointer hover:bg-muted/50 transition-colors"
                  onClick={() => router.push(`/campaigns/${campaignId}/locations/${locationId}/dungeon/rooms/${room.id}`)}
                >
                  <CardHeader>
                    <CardTitle className="text-base">{room.name}</CardTitle>
                    {room.description && <CardDescription>{room.description}</CardDescription>}
                    {room.room_type && (
                      <Badge className="mt-2" variant="secondary">
                        {t.marketplace?.roomTypes?.[room.room_type] || room.room_type}
                      </Badge>
                    )}
                  </CardHeader>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

