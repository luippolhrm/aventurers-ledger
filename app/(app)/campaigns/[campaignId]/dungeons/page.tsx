"use client"

import { use, useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { LoadingState } from "@/components/molecules/loading"
import { EmptyState } from "@/components/molecules/empty"
import { useAuth } from "@/lib/auth-context"
import { useServices } from "@/hooks/use-services"
import { ArrowLeft, Skull, Plus, MapPin } from "lucide-react"
import type { Location } from "@/lib/infrastructure/repositories/location-repository"

export default function CampaignDungeonsPage({ params }: { params: Promise<{ campaignId: string }> }) {
  const { campaignId } = use(params)
  const router = useRouter()
  const { user } = useAuth()
  const services = useServices()

  const [loading, setLoading] = useState(true)
  const [dungeonLocations, setDungeonLocations] = useState<Location[]>([])
  const [isOwner, setIsOwner] = useState(false)

  useEffect(() => {
    if (user && campaignId) {
      loadData()
    }
  }, [user, campaignId])

  const loadData = async () => {
    if (!user) return

    setLoading(true)
    try {
      const [campaign, locations] = await Promise.all([
        services.campaign.getCampaign(campaignId),
        services.location.getLocationsByCampaign(campaignId),
      ])

      setIsOwner(campaign.game_master_id === user.id)
      
      // Filtrar solo ubicaciones tipo dungeon
      const dungeons = locations.filter((loc) => loc.location_type === "dungeon")
      setDungeonLocations(dungeons)
    } catch (error: any) {
      console.error("Error loading dungeons:", error)
    } finally {
      setLoading(false)
    }
  }

  const getDifficultyColor = (difficulty: string | null | undefined) => {
    if (!difficulty) return "secondary"
    switch (difficulty) {
      case "easy": return "default"
      case "medium": return "secondary"
      case "hard": return "destructive"
      case "deadly": return "destructive"
      default: return "secondary"
    }
  }

  return (
    <div className="w-full max-w-7xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <Button variant="ghost" onClick={() => router.push(`/campaigns/${campaignId}`)}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          Volver a Campaña
        </Button>
        {isOwner && (
          <Button onClick={() => router.push(`/campaigns/${campaignId}/dungeons/new`)}>
            <Plus className="w-4 h-4 mr-2" />
            Crear Mazmorra
          </Button>
        )}
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Skull className="w-5 h-5 text-purple-600" />
            Mazmorras de la Campaña
          </CardTitle>
          <CardDescription>
            Gestiona las mazmorras y dungeons de tu campaña
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <LoadingState message="Cargando mazmorras..." />
          ) : dungeonLocations.length === 0 ? (
            <EmptyState
              icon={Skull}
              title="No hay mazmorras"
              description={isOwner ? "Crea la primera mazmorra para tu campaña" : "Aún no hay mazmorras creadas"}
            >
              {isOwner && (
                <Button onClick={() => router.push(`/campaigns/${campaignId}/dungeons/new`)} className="mt-4">
                  <Plus className="w-4 h-4 mr-2" />
                  Crear Primera Mazmorra
                </Button>
              )}
            </EmptyState>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {dungeonLocations.map((location) => (
                <Card
                  key={location.id}
                  className="cursor-pointer hover:bg-muted/50 transition-colors"
                  onClick={() => router.push(`/campaigns/${campaignId}/locations/${location.id}`)}
                >
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <CardTitle className="text-base flex items-center gap-2">
                          <MapPin className="w-4 h-4" />
                          {location.name}
                        </CardTitle>
                        {location.description && (
                          <CardDescription className="mt-2">{location.description}</CardDescription>
                        )}
                      </div>
                    </div>
                    <div className="flex gap-2 mt-3 flex-wrap">
                      <Badge variant="secondary">
                        <Skull className="w-3 h-3 mr-1 text-purple-600" />
                        Mazmorra
                      </Badge>
                      {location.is_active !== undefined && (
                        <Badge variant={location.is_active ? "default" : "outline"}>
                          {location.is_active ? "Activa" : "Inactiva"}
                        </Badge>
                      )}
                    </div>
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

