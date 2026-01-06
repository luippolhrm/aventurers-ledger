"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useAuth } from "@/lib/auth-context"
import { useServices } from "@/hooks/use-services"
import { type Language, translations } from "@/lib/translations"
import { LoadingState } from "@/components/molecules/loading"
import { EmptyState } from "@/components/molecules/empty"
import { LocationsMap } from "@/components/locations-map"
import type { Campaign } from "@/lib/infrastructure/repositories"
import { Crown, MapPin, ArrowLeft, Settings } from "lucide-react"

interface CampaignAdminViewProps {
  campaignId: string
  language: Language
}

export function CampaignAdminView({ campaignId, language }: CampaignAdminViewProps) {
  const t = translations[language]
  const router = useRouter()
  const { user } = useAuth()
  const services = useServices()

  const [campaign, setCampaign] = useState<Campaign | null>(null)
  const [isGM, setIsGM] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (user && campaignId) {
      loadCampaignData()
    }
  }, [user, campaignId])

  const loadCampaignData = async () => {
    if (!user) return

    setLoading(true)
    setError(null)

    try {
      // Cargar campaña
      const campaignData = await services.campaign.getCampaign(campaignId)
      setCampaign(campaignData)

      // Verificar si es GM
      const userIsGM = await services.campaign.isGameMaster(user.id, campaignId)
      setIsGM(userIsGM)

      if (!userIsGM) {
        setError("No tienes permisos de administración para esta campaña")
      }
    } catch (err: any) {
      console.error("Error loading campaign:", err)
      setError(err?.message || "Error al cargar la campaña")
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="w-full max-w-6xl mx-auto p-6">
        <LoadingState message="Cargando campaña..." />
      </div>
    )
  }

  if (error || !campaign) {
    return (
      <div className="w-full max-w-6xl mx-auto p-6">
        <EmptyState
          icon={Crown}
          title="Error al cargar la campaña"
          description={error || "La campaña no existe o no tienes acceso"}
          action={{
            label: "Volver a Campaña",
            onClick: () => router.push(`/campaigns/${campaignId}`),
          }}
        />
      </div>
    )
  }

  if (!isGM) {
    return (
      <div className="w-full max-w-6xl mx-auto p-6">
        <EmptyState
          icon={Crown}
          title="Acceso Denegado"
          description="Solo el Game Master puede acceder a la administración de la campaña"
          action={{
            label: "Volver a Campaña",
            onClick: () => router.push(`/campaigns/${campaignId}`),
          }}
        />
      </div>
    )
  }

  return (
    <div className="w-full max-w-7xl mx-auto space-y-4 md:space-y-6 p-4 md:p-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 md:gap-4">
        <div className="w-full sm:flex-1">
          <Button
            variant="ghost"
            onClick={() => router.push(`/campaigns/${campaignId}`)}
            className="mb-2 md:mb-4 text-sm md:text-base"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Volver a Campaña
          </Button>
          <h1 className="text-2xl md:text-3xl font-bold">Administración de Campaña</h1>
          <p className="text-sm md:text-base text-muted-foreground mt-2">{campaign.name}</p>
        </div>
        <div className="flex items-center gap-2">
          <Crown className="w-4 h-4 md:w-5 md:h-5 text-purple-600" />
          <span className="font-semibold text-purple-600 text-sm md:text-base">Game Master</span>
        </div>
      </div>

      {/* Admin Tabs */}
      <Tabs defaultValue="map" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="map" className="flex items-center gap-2">
            <MapPin className="w-4 h-4" />
            Mapa y Ubicaciones
          </TabsTrigger>
          <TabsTrigger value="settings" className="flex items-center gap-2">
            <Settings className="w-4 h-4" />
            Configuración
          </TabsTrigger>
        </TabsList>

        <TabsContent value="map" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Mapa y Ubicaciones</CardTitle>
              <CardDescription>
                Gestiona ubicaciones, tiendas y NPCs de la campaña
              </CardDescription>
            </CardHeader>
            <CardContent>
              <LocationsMap language={language} campaignId={campaignId} />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="settings" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Configuración de Campaña</CardTitle>
              <CardDescription>
                Gestiona miembros y configuración general de la campaña
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                La configuración de miembros y otras opciones se gestionan desde la vista principal de campañas.
              </p>
              <Button
                variant="outline"
                onClick={() => router.push("/dashboard?module=campaigns")}
                className="mt-4"
              >
                Ir a Gestión de Campañas
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}

