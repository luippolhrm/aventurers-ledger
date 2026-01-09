"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { useAuth } from "@/lib/auth-context"
import { useServices } from "@/hooks/use-services"
import { useLanguage } from "@/lib/language-context"
import { LoadingState } from "@/components/molecules/loading"
import { EmptyState } from "@/components/molecules/empty"
import { NavigationCard } from "@/components/molecules/navigation-card"
import { PlayerCampaignTabs } from "@/components/features/campaigns"
import type { Campaign } from "@/lib/infrastructure/repositories"
import type { Character } from "@/lib/infrastructure/repositories/character-repository"
import { Crown, Sword, Settings, MapPin, Users, AlertCircle } from "lucide-react"

interface CampaignViewProps {
  campaignId: string
  language?: "es" // Mantener por compatibilidad, pero ya no se usa
}

export function CampaignView({ campaignId, language }: CampaignViewProps) {
  const { t } = useLanguage()
  const router = useRouter()
  const { user } = useAuth()
  const services = useServices()

  const [campaign, setCampaign] = useState<Campaign | null>(null)
  const [character, setCharacter] = useState<Character | null>(null)
  const [isOwner, setIsOwner] = useState(false)
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

      // Verificar ownership directo (como con personajes)
      const userIsOwner = campaignData.game_master_id === user.id
      setIsOwner(userIsOwner)

      // Si es jugador, obtener su personaje
      if (!userIsOwner) {
        const playerCharacter = await services.campaign.getPlayerCharacterInCampaign(campaignId, user.id)
        setCharacter(playerCharacter)
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
          icon={Sword}
          title="Error al cargar la campaña"
          description={error || "La campaña no existe o no tienes acceso"}
          action={{
            label: "Volver a Campañas",
            onClick: () => router.push("/campaigns"),
          }}
        />
      </div>
    )
  }

  return (
    <div className="w-full max-w-7xl mx-auto space-y-6 p-4 md:p-6">
      {/* Header de la Campaña */}
      <Card>
        <CardHeader>
          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-3 mb-2">
                <CardTitle className="text-2xl">{campaign.name}</CardTitle>
                <Badge variant={isOwner ? "default" : "secondary"}>
                  {isOwner ? (
                    <span className="flex items-center gap-1">
                      <Crown className="h-3 w-3" /> Game Master
                    </span>
                  ) : (
                    "Jugador"
                  )}
                </Badge>
              </div>
              <CardDescription>{campaign.description || "Sin descripción"}</CardDescription>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Vista del Game Master */}
      {isOwner && (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          <NavigationCard
            title="Gestionar Miembros"
            description="Administra jugadores y personajes"
            icon={Users}
            onClick={() => router.push(`/campaigns/${campaignId}/members`)}
          />

          <NavigationCard
            title="Explorar Mundo"
            description="Ubicaciones, mazmorras y NPCs"
            icon={MapPin}
            onClick={() => router.push(`/campaigns/${campaignId}/locations`)}
          />

          <NavigationCard
            title="Configuración"
            description="Ajustes de la campaña"
            icon={Settings}
            onClick={() => router.push(`/campaigns/${campaignId}/settings`)}
          />
        </div>
      )}

      {/* Vista del Jugador */}
      {!isOwner && character ? (
        <PlayerCampaignTabs
          characterId={character.id}
          campaignId={campaignId}
          language={language}
          variant="default"
        />
      ) : (
        <Card>
          <CardContent className="pt-6">
            <EmptyState
              icon={Sword}
              title="No tienes personaje asignado"
              description="No estás participando en esta campaña como jugador, o no tienes un personaje asignado."
            />
          </CardContent>
        </Card>
      )}
    </div>
  )
}

