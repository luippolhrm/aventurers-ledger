"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { LoadingState } from "@/components/molecules/loading"
import { EmptyState } from "@/components/molecules/empty"
import { useAuth } from "@/lib/auth-context"
import { useServices } from "@/hooks/use-services"
import { useLanguage } from "@/lib/language-context"
import { useToast } from "@/hooks/use-toast"
import type { Location } from "@/lib/infrastructure/repositories/location-repository"
import type { Dungeon } from "@/lib/infrastructure/repositories/dungeon-repository.types"
import { MapPin, Plus, Settings, Skull } from "lucide-react"

interface WorldSettingsViewProps {
  campaignId: string
}

export function WorldSettingsView({ campaignId }: WorldSettingsViewProps) {
  const { t } = useLanguage()
  const router = useRouter()
  const { user } = useAuth()
  const services = useServices()
  const { toast } = useToast()

  const [locations, setLocations] = useState<Location[]>([])
  const [dungeons, setDungeons] = useState<Dungeon[]>([])
  const [loading, setLoading] = useState(true)
  const [isOwner, setIsOwner] = useState(false)
  const [updating, setUpdating] = useState<string | null>(null)

  useEffect(() => {
    if (user && campaignId) {
      loadData()
    }
  }, [user, campaignId])

  const loadData = async () => {
    if (!user || !campaignId) return

    setLoading(true)
    try {
      const [campaign, locationsData] = await Promise.all([
        services.campaign.getCampaign(campaignId),
        services.location.getLocationsByCampaign(campaignId),
      ])

      setIsOwner(campaign.game_master_id === user.id)

      // Cargar dungeons para cada location tipo dungeon
      const dungeonLocations = locationsData.filter((loc) => loc.location_type === "dungeon")
      const dungeonsData = await Promise.all(
        dungeonLocations.map(async (loc) => {
          try {
            return await services.dungeon.getDungeonByLocation(loc.id)
          } catch {
            return null
          }
        })
      )

      setLocations(locationsData)
      setDungeons(dungeonsData.filter((d): d is Dungeon => d !== null))
    } catch (error: any) {
      console.error("[v0] WorldSettingsView: Error loading data:", error)
      toast({
        title: t.inventory?.error || "Error",
        description: error?.message || "Error al cargar los datos",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleToggleLocation = async (locationId: string, currentValue: boolean) => {
    if (!user || !isOwner) return

    setUpdating(`location-${locationId}`)
    try {
      await services.location.updateLocation(
        locationId,
        {
          is_active: !currentValue,
        },
        user.id
      )
      setLocations(
        locations.map((loc) =>
          loc.id === locationId ? { ...loc, is_active: !currentValue } : loc
        )
      )
      toast({
        title: "Éxito",
        description: `Ubicación ${!currentValue ? "activada" : "desactivada"}`,
      })
    } catch (error: any) {
      console.error("Error updating location:", error)
      toast({
        title: t.inventory?.error || "Error",
        description: error?.message || "Error al actualizar la ubicación",
        variant: "destructive",
      })
    } finally {
      setUpdating(null)
    }
  }

  const handleToggleDungeon = async (dungeonId: string, currentValue: boolean) => {
    if (!user || !isOwner) return

    setUpdating(`dungeon-${dungeonId}`)
    try {
      await services.dungeon.updateDungeon(
        dungeonId,
        {
          is_active: !currentValue,
        },
        user.id
      )
      setDungeons(
        dungeons.map((d) => (d.id === dungeonId ? { ...d, is_active: !currentValue } : d))
      )
      toast({
        title: "Éxito",
        description: `Mazmorra ${!currentValue ? "activada" : "desactivada"}`,
      })
    } catch (error: any) {
      console.error("Error updating dungeon:", error)
      toast({
        title: t.inventory?.error || "Error",
        description: error?.message || "Error al actualizar la mazmorra",
        variant: "destructive",
      })
    } finally {
      setUpdating(null)
    }
  }

  const getLocationTypeLabel = (type: string) => {
    return t.marketplace?.locationTypes?.[type as keyof typeof t.marketplace.locationTypes] || type
  }

  if (loading) {
    return <LoadingState message="Cargando configuración del mundo..." />
  }

  if (!isOwner) {
    return (
      <EmptyState
        icon={Settings}
        title="Acceso Denegado"
        description="Solo el Game Master puede configurar el mundo de la campaña"
      />
    )
  }

  // Filtrar ubicaciones regulares (excluir dungeons)
  const regularLocations = locations.filter((loc) => loc.location_type !== "dungeon")
  const activeRegularLocations = regularLocations.filter((loc) => loc.is_active !== false).length
  const activeDungeons = dungeons.filter((d) => d.is_active !== false).length

  return (
    <div className="space-y-6">
      {/* Resumen */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MapPin className="w-5 h-5" />
            Resumen del Mundo
          </CardTitle>
        </CardHeader>
        <Separator />
        <CardContent className="pt-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <p className="text-2xl font-bold">{regularLocations.length}</p>
              <p className="text-sm text-muted-foreground">Ubicaciones</p>
            </div>
            <div>
              <p className="text-2xl font-bold">{activeRegularLocations}</p>
              <p className="text-sm text-muted-foreground">Activas</p>
            </div>
            <div>
              <p className="text-2xl font-bold">{dungeons.length}</p>
              <p className="text-sm text-muted-foreground">Mazmorras</p>
            </div>
            <div>
              <p className="text-2xl font-bold">{activeDungeons}</p>
              <p className="text-sm text-muted-foreground">Activas</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Ubicaciones */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div>
              <CardTitle>Ubicaciones del Mundo</CardTitle>
              <CardDescription>
                Activa o desactiva ubicaciones para controlar qué pueden ver los jugadores
              </CardDescription>
            </div>
            <Button onClick={() => router.push(`/campaigns/${campaignId}/locations/new`)}>
              <Plus className="w-4 h-4 mr-2" />
              {t.marketplace?.createLocation || "Crear Ubicación"}
            </Button>
          </div>
        </CardHeader>
        <Separator />
        <CardContent className="pt-6 space-y-4">
          {regularLocations.length === 0 ? (
            <EmptyState
              icon={MapPin}
              title="No hay ubicaciones"
              description="Crea ubicaciones en tu mundo para que los jugadores las exploren. Las mazmorras se gestionan en su sección dedicada."
            >
              <Button
                onClick={() => router.push(`/campaigns/${campaignId}/locations/new`)}
                className="mt-4"
              >
                <Plus className="w-4 h-4 mr-2" />
                Crear Primera Ubicación
              </Button>
            </EmptyState>
          ) : (
            <div className="space-y-3">
              {regularLocations.map((location) => (
                <div
                  key={location.id}
                  className="flex items-center justify-between p-4 border rounded-lg"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <Label htmlFor={`location-${location.id}`} className="font-medium">
                        {location.name}
                      </Label>
                      {location.location_type && (
                        <span className="text-xs px-2 py-1 rounded-full bg-primary/10 text-primary">
                          {getLocationTypeLabel(location.location_type)}
                        </span>
                      )}
                      {location.is_active === false && (
                        <span className="text-xs px-2 py-1 rounded-full bg-muted text-muted-foreground">
                          Inactiva
                        </span>
                      )}
                    </div>
                    {location.description && (
                      <p className="text-sm text-muted-foreground mt-1">{location.description}</p>
                    )}
                  </div>
                  <Switch
                    id={`location-${location.id}`}
                    checked={location.is_active !== false}
                    onCheckedChange={() =>
                      handleToggleLocation(location.id, location.is_active !== false)
                    }
                    disabled={updating === `location-${location.id}`}
                  />
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Mazmorras */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Skull className="w-5 h-5 text-purple-600" />
                Mazmorras y Dungeons
              </CardTitle>
              <CardDescription>
                Gestiona mazmorras, controla su disponibilidad y configura encuentros
              </CardDescription>
            </div>
            <Button
              variant="outline"
              onClick={() => {
                router.push(`/campaigns/${campaignId}/dungeons/new`)
              }}
            >
              <Plus className="w-4 h-4 mr-2" />
              {t.marketplace?.dungeons?.createDungeon || "Crear Mazmorra"}
            </Button>
          </div>
        </CardHeader>
        <Separator />
        <CardContent className="pt-6 space-y-4">
          {dungeons.length === 0 ? (
            <EmptyState
              icon={Skull}
              title={t.marketplace?.dungeons?.noDungeon || "No hay mazmorras"}
              description="Crea una ubicación tipo mazmorra para comenzar"
            >
              <Button
                variant="outline"
                onClick={() => router.push(`/campaigns/${campaignId}/dungeons/new`)}
                className="mt-4"
              >
                <Plus className="w-4 h-4 mr-2" />
                {t.marketplace?.dungeons?.createDungeon || "Crear Primera Mazmorra"}
              </Button>
            </EmptyState>
          ) : (
            <div className="space-y-3">
              {dungeons.map((dungeon) => {
                const location = locations.find((loc) => loc.id === dungeon.location_id)
                return (
                  <div
                    key={dungeon.id}
                    className="flex items-center justify-between p-4 border rounded-lg"
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <Label htmlFor={`dungeon-${dungeon.id}`} className="font-medium">
                          {location?.name || "Mazmorra sin nombre"}
                        </Label>
                        {dungeon.recommended_level && (
                          <span className="text-xs px-2 py-1 rounded-full bg-secondary">
                            Nivel {dungeon.recommended_level}
                          </span>
                        )}
                        {dungeon.is_cleared && (
                          <span className="text-xs px-2 py-1 rounded-full bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                            Limpiada
                          </span>
                        )}
                        {dungeon.is_active === false && (
                          <span className="text-xs px-2 py-1 rounded-full bg-muted text-muted-foreground">
                            Inactiva
                          </span>
                        )}
                      </div>
                      {location?.description && (
                        <p className="text-sm text-muted-foreground mt-1">{location.description}</p>
                      )}
                    </div>
                    <Switch
                      id={`dungeon-${dungeon.id}`}
                      checked={dungeon.is_active !== false}
                      onCheckedChange={() =>
                        handleToggleDungeon(dungeon.id, dungeon.is_active !== false)
                      }
                      disabled={updating === `dungeon-${dungeon.id}`}
                    />
                  </div>
                )
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

