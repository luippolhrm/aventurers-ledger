"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { LoadingState } from "@/components/molecules/loading"
import { EmptyState } from "@/components/molecules/empty"
import { useAuth } from "@/lib/auth-context"
import { useServices } from "@/hooks/use-services"
import { useLanguage } from "@/lib/language-context"
import { useToast } from "@/hooks/use-toast"
import type { Location } from "@/lib/infrastructure/repositories/location-repository"
import type { Shop } from "@/lib/infrastructure/repositories/shop-repository"
import type { Dungeon } from "@/lib/infrastructure/repositories/dungeon-repository.types"
import type { DungeonRoom } from "@/lib/infrastructure/repositories/dungeon-repository.types"
import { MapPin, Store, Edit, Trash2, Plus, Skull } from "lucide-react"

interface UnifiedDungeonViewProps {
  campaignId: string
  locationId: string
  location: Location
  shops: Shop[]
  isOwner: boolean
  onUpdate: () => void
}

export function UnifiedDungeonView({
  campaignId,
  locationId,
  location,
  shops,
  isOwner,
  onUpdate,
}: UnifiedDungeonViewProps) {
  const { t } = useLanguage()
  const router = useRouter()
  const { user } = useAuth()
  const services = useServices()
  const { toast } = useToast()

  const [dungeon, setDungeon] = useState<Dungeon | null>(null)
  const [rooms, setRooms] = useState<DungeonRoom[]>([])
  const [loading, setLoading] = useState(true)
  const [isDeleting, setIsDeleting] = useState(false)

  useEffect(() => {
    if (user && locationId) {
      loadDungeonData()
    }
  }, [user, locationId])

  const loadDungeonData = async () => {
    if (!user || !locationId) return

    setLoading(true)
    try {
      const dungeonData = await services.dungeon.getDungeonByLocation(locationId)
      setDungeon(dungeonData)

      if (dungeonData) {
        const roomsData = await services.dungeon.getRoomsByDungeon(dungeonData.id)
        setRooms(roomsData)
      }
    } catch (error: any) {
      console.error("[v0] UnifiedDungeonView: Error loading dungeon:", error)
      // No mostrar error si simplemente no existe el dungeon
      setDungeon(null)
      setRooms([])
    } finally {
      setLoading(false)
    }
  }

  const handleEdit = () => {
    // TODO: Implementar edición inline o modal
    toast({
      title: "Función en desarrollo",
      description: "La edición de mazmorras estará disponible próximamente",
    })
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
      onUpdate()
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
    return <LoadingState message="Cargando detalles de la mazmorra..." />
  }

  // Caso 1: Location tipo "dungeon" pero sin Dungeon asociado
  if (!dungeon) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MapPin className="w-5 h-5" />
            {location.name}
          </CardTitle>
          <CardDescription>
            {location.description || "Sin descripción"}
          </CardDescription>
        </CardHeader>
        <Separator />
        <CardContent className="pt-6">
          <div className="text-center space-y-4">
            <p className="text-muted-foreground">
              Esta ubicación está marcada como mazmorra pero no tiene configuración asociada
            </p>
            {isOwner && (
              <Button
                onClick={() =>
                  router.push(`/campaigns/${campaignId}/locations/${locationId}/dungeon/create`)
                }
              >
                <Plus className="w-4 h-4 mr-2" />
                Configurar Detalles de Mazmorra
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    )
  }

  // Caso 2 y 3: Dungeon existe - renderizar vista completa
  return (
    <>
      {/* Card 1: Información de la Mazmorra */}
      <Card>
        <CardHeader>
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <CardTitle className="flex items-center gap-2 text-2xl">
                <Skull className="w-6 h-6 text-purple-600" />
                {location.name}
              </CardTitle>
              <CardDescription className="mt-2">
                {location.description || "Sin descripción"}
              </CardDescription>
              <div className="flex gap-2 mt-3 flex-wrap">
                <Badge variant="secondary">
                  <Skull className="w-3 h-3 mr-1 text-purple-600" />
                  Mazmorra
                </Badge>
                {dungeon.recommended_level && (
                  <Badge variant="outline">Nivel {dungeon.recommended_level}</Badge>
                )}
                {dungeon.difficulty_level && (
                  <Badge variant="outline">
                    {t.marketplace?.difficultyLevels?.[dungeon.difficulty_level as keyof typeof t.marketplace.difficultyLevels] ||
                      dungeon.difficulty_level}
                  </Badge>
                )}
                {dungeon.is_cleared && <Badge variant="outline">✓ Limpiada</Badge>}
              </div>
            </div>
            {isOwner && (
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={handleEdit}>
                  <Edit className="w-4 h-4 mr-2" />
                  Editar
                </Button>
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={handleDelete}
                  disabled={isDeleting}
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  {isDeleting ? "Eliminando..." : "Eliminar"}
                </Button>
              </div>
            )}
          </div>
        </CardHeader>
      </Card>

      {/* Card 2: Comercio en la Entrada (solo si hay tiendas) */}
      {shops.length > 0 && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between gap-4 flex-wrap">
              <div className="space-y-1 flex-1 min-w-0">
                <CardTitle className="flex items-center gap-2">
                  <Store className="w-5 h-5" />
                  Comercio en la Entrada
                </CardTitle>
                <CardDescription>
                  Tiendas disponibles para los jugadores antes de explorar ({shops.length} {shops.length === 1 ? "tienda" : "tiendas"})
                </CardDescription>
              </div>
              {isOwner && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    router.push(`/campaigns/${campaignId}/locations/${locationId}/shops/new`)
                  }
                  className="shrink-0"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  <span className="hidden sm:inline">Añadir Tienda</span>
                  <span className="sm:hidden">Añadir</span>
                </Button>
              )}
            </div>
          </CardHeader>
          <Separator />
          <CardContent className="pt-6">
            <div className="grid gap-4 sm:grid-cols-1 md:grid-cols-2 xl:grid-cols-3">
              {shops.map((shop) => (
                <Card
                  key={shop.id}
                  className="cursor-pointer hover:bg-muted/50 transition-colors"
                  onClick={() =>
                    router.push(`/campaigns/${campaignId}/locations/${locationId}/shops/${shop.id}`)
                  }
                >
                  <CardHeader>
                    <CardTitle className="text-base">{shop.name}</CardTitle>
                    <CardDescription>{shop.description || "Sin descripción"}</CardDescription>
                    {shop.shop_type && (
                      <Badge className="mt-2 w-fit" variant="secondary">
                        {shop.shop_type}
                      </Badge>
                    )}
                  </CardHeader>
                </Card>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Card 3: Salas de Exploración */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <div className="space-y-1 flex-1 min-w-0">
              <CardTitle className="flex items-center gap-2">
                <MapPin className="w-5 h-5" />
                Salas de Exploración
              </CardTitle>
              <CardDescription>
                Gestiona las salas y encuentros de la mazmorra ({rooms.length} {rooms.length === 1 ? "sala" : "salas"})
              </CardDescription>
            </div>
            {isOwner && (
              <Button
                onClick={() =>
                  router.push(`/campaigns/${campaignId}/locations/${locationId}/dungeon/rooms/new`)
                }
                className="shrink-0"
              >
                <Plus className="w-4 h-4 mr-2" />
                <span className="hidden sm:inline">Crear Sala</span>
                <span className="sm:hidden">Crear</span>
              </Button>
            )}
          </div>
        </CardHeader>
        <Separator />
        <CardContent className="pt-6">
          {rooms.length === 0 ? (
            <EmptyState
              icon={MapPin}
              title="Sin salas"
              description="Esta mazmorra no tiene salas creadas aún. Crea salas para diseñar encuentros y exploración."
            >
              {isOwner && (
                <Button
                  onClick={() =>
                    router.push(
                      `/campaigns/${campaignId}/locations/${locationId}/dungeon/rooms/new`
                    )
                  }
                  className="mt-4"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Crear Primera Sala
                </Button>
              )}
            </EmptyState>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {rooms.map((room) => (
                <Card
                  key={room.id}
                  className="cursor-pointer hover:bg-muted/50 transition-colors"
                  onClick={() =>
                    router.push(
                      `/campaigns/${campaignId}/locations/${locationId}/dungeon/rooms/${room.id}`
                    )
                  }
                >
                  <CardHeader>
                    <CardTitle className="text-base">{room.name}</CardTitle>
                    {room.description && <CardDescription>{room.description}</CardDescription>}
                    {room.room_type && (
                      <Badge className="mt-2" variant="secondary">
                        {t.marketplace?.roomTypes?.[room.room_type as keyof typeof t.marketplace.roomTypes] || room.room_type}
                      </Badge>
                    )}
                  </CardHeader>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </>
  )
}

