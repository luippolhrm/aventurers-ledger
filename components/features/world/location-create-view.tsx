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
import { LocationForm } from "./location-form"
import { ArrowLeft, MapPin } from "lucide-react"

interface LocationCreateViewProps {
  campaignId: string
}

export function LocationCreateView({ campaignId }: LocationCreateViewProps) {
  const { t } = useLanguage()
  const router = useRouter()
  const { user } = useAuth()
  const services = useServices()

  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isOwner, setIsOwner] = useState(false)

  useEffect(() => {
    if (user && campaignId) {
      loadCampaignData()
    }
  }, [user, campaignId])

  const loadCampaignData = async () => {
    if (!user || !campaignId) return

    setIsLoading(true)
    setError(null)
    try {
      const campaign = await services.campaign.getCampaign(campaignId)
      const owner = campaign.game_master_id === user.id
      setIsOwner(owner)
    } catch (err: any) {
      console.error("Error loading campaign:", err)
      setError(err?.message || "Error al cargar la campaña")
    } finally {
      setIsLoading(false)
    }
  }

  const handleSubmit = async (formData: { name: string; description: string; location_type: string }) => {
    if (!user) {
      setError("Debes estar autenticado para crear ubicaciones")
      return
    }

    setIsSaving(true)
    setError(null)
    try {
      const newLocation = await services.location.createLocation(
        {
          name: formData.name.trim(),
          description: formData.description || null,
          location_type: formData.location_type,
          campaign_id: campaignId,
        },
        user.id
      )

      router.push(`/campaigns/${campaignId}/locations/${newLocation.id}`)
    } catch (err: any) {
      console.error("Error creating location:", err)
      setError(err?.message || "Error al crear la ubicación")
    } finally {
      setIsSaving(false)
    }
  }

  const handleCancel = () => {
    router.push(`/campaigns/${campaignId}`)
  }

  if (isLoading) {
    return <LoadingState message="Cargando..." />
  }

  if (!isOwner) {
    return (
      <div className="w-full max-w-3xl mx-auto space-y-4 md:space-y-6">
        <Button variant="ghost" onClick={handleCancel} className="text-sm md:text-base">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Volver a Campaña
        </Button>
        <EmptyState
          title="Acceso Denegado"
          description="Solo el dueño de la campaña puede crear ubicaciones"
        />
      </div>
    )
  }

  return (
    <div className="w-full max-w-3xl mx-auto space-y-4 md:space-y-6">
      <Button variant="ghost" onClick={handleCancel} className="text-sm md:text-base">
        <ArrowLeft className="w-4 h-4 mr-2" />
        Volver a Campaña
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
            {t.marketplace?.createLocation || "Crear Ubicación"}
          </CardTitle>
          <CardDescription>
            {t.marketplace?.locationSubtitle || "Define una nueva ubicación en tu mapa"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <LocationForm onSubmit={handleSubmit} onCancel={handleCancel} isLoading={isSaving} />
        </CardContent>
      </Card>
    </div>
  )
}

