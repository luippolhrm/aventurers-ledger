"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { LoadingState } from "@/components/molecules/loading"
import { EmptyState } from "@/components/molecules/empty"
import { useAuth } from "@/lib/auth-context"
import { useServices } from "@/hooks/use-services"
import { useLanguage } from "@/lib/language-context"
import { useToast } from "@/hooks/use-toast"
import { DungeonRoomForm } from "./dungeon-room-form"
import { ArrowLeft, MapPin, Skull } from "lucide-react"

interface DungeonRoomCreateViewProps {
  campaignId: string
  locationId: string
}

export function DungeonRoomCreateView({ campaignId, locationId }: DungeonRoomCreateViewProps) {
  const { t } = useLanguage()
  const router = useRouter()
  const { user } = useAuth()
  const services = useServices()
  const { toast } = useToast()

  const [dungeonId, setDungeonId] = useState<string>("")
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isOwner, setIsOwner] = useState(false)

  useEffect(() => {
    if (user && campaignId && locationId) {
      loadData()
    }
  }, [user, campaignId, locationId])

  const loadData = async () => {
    if (!user || !campaignId || !locationId) return

    setIsLoading(true)
    setError(null)
    try {
      const [campaign, dungeon] = await Promise.all([
        services.campaign.getCampaign(campaignId),
        services.dungeon.getDungeonByLocation(locationId),
      ])

      const owner = campaign.game_master_id === user.id
      setIsOwner(owner)

      if (!dungeon) {
        setError("No se encontró una mazmorra para esta ubicación")
      } else {
        setDungeonId(dungeon.id)
      }
    } catch (err: any) {
      console.error("Error loading data:", err)
      setError(err?.message || "Error al cargar los datos")
    } finally {
      setIsLoading(false)
    }
  }

  const handleSubmit = async (formData: { name: string; description: string; room_type: string; order_index: number }) => {
    if (!user || !dungeonId) {
      setError("Debes estar autenticado para crear salas")
      return
    }

    setIsSaving(true)
    setError(null)
    try {
      const newRoom = await services.dungeon.createRoom(
        dungeonId,
        {
          dungeon_id: dungeonId,
          name: formData.name.trim(),
          description: formData.description || null,
          room_type: formData.room_type || null,
          order_index: formData.order_index,
          position_x: null,
          position_y: null,
          connections: null,
        },
        user.id
      )

      router.push(`/campaigns/${campaignId}/locations/${locationId}/dungeon/rooms/${newRoom.id}`)
    } catch (err: any) {
      console.error("Error creating room:", err)
      setError(err?.message || "Error al crear la sala")
    } finally {
      setIsSaving(false)
    }
  }

  const handleCancel = () => {
    router.push(`/campaigns/${campaignId}/locations/${locationId}/dungeon`)
  }

  if (isLoading) {
    return <LoadingState message="Cargando..." />
  }

  if (!isOwner) {
    return (
      <div className="w-full max-w-3xl mx-auto space-y-4 md:space-y-6">
        <Button variant="ghost" onClick={handleCancel} className="text-sm md:text-base">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Volver a Mazmorra
        </Button>
        <EmptyState icon={Skull} title="Acceso Denegado" description="Solo el Game Master puede crear salas" />
      </div>
    )
  }

  if (!dungeonId) {
    return (
      <div className="w-full max-w-3xl mx-auto space-y-4 md:space-y-6">
        <Button variant="ghost" onClick={handleCancel} className="text-sm md:text-base">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Volver a Mazmorra
        </Button>
        <EmptyState icon={Skull} title="Mazmorra no encontrada" description="Esta ubicación no tiene una mazmorra asociada" />
      </div>
    )
  }

  return (
    <div className="w-full max-w-3xl mx-auto space-y-4 md:space-y-6">
      <Button variant="ghost" onClick={handleCancel} className="text-sm md:text-base">
        <ArrowLeft className="w-4 h-4 mr-2" />
        Volver a Mazmorra
      </Button>

      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MapPin className="w-5 h-5" />
            {t.marketplace?.dungeons?.createRoom || "Crear Sala"}
          </CardTitle>
          <CardDescription>
            {t.marketplace?.dungeons?.description || "Crea una nueva sala para esta mazmorra"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <DungeonRoomForm onSubmit={handleSubmit} onCancel={handleCancel} isLoading={isSaving} />
        </CardContent>
      </Card>
    </div>
  )
}

