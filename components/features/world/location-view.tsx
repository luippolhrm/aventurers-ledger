"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { LoadingState } from "@/components/molecules/loading"
import { EmptyState } from "@/components/molecules/empty"
import { Badge } from "@/components/ui/badge"
import { useAuth } from "@/lib/auth-context"
import { useServices } from "@/hooks/use-services"
import { useLanguage } from "@/lib/language-context"
import { LocationForm } from "./location-form"
import { UnifiedDungeonView } from "@/components/features/dungeons/unified-dungeon-view"
import { ArrowLeft, MapPin, Store, Edit, Trash2, Plus } from "lucide-react"
import type { Location } from "@/lib/infrastructure/repositories/location-repository"
import type { Shop } from "@/lib/infrastructure/repositories/shop-repository"

interface LocationViewProps {
  campaignId: string
  locationId: string
}

const LOCATION_TYPE_OPTIONS = ["village", "forest", "camp", "port", "ruins", "city", "dungeon"] as const
type LocationType = (typeof LOCATION_TYPE_OPTIONS)[number]

export function LocationView({ campaignId, locationId }: LocationViewProps) {
  const { t } = useLanguage()
  const router = useRouter()
  const { user } = useAuth()
  const services = useServices()

  const [location, setLocation] = useState<Location | null>(null)
  const [shops, setShops] = useState<Shop[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isOwner, setIsOwner] = useState(false)
  const [isEditing, setIsEditing] = useState(false)

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
      const [campaignData, locationData, shopsData] = await Promise.all([
        services.campaign.getCampaign(campaignId),
        services.location.getLocation(locationId),
        services.shop.getShopsByLocation(locationId),
      ])

      const owner = campaignData.game_master_id === user.id
      setIsOwner(owner)
      setLocation(locationData)
      setShops(shopsData)
    } catch (err: any) {
      console.error("Error loading data:", err)
      setError(err?.message || "Error al cargar los datos")
    } finally {
      setIsLoading(false)
    }
  }

  const handleEdit = () => {
    setIsEditing(true)
  }

  const handleCancelEdit = () => {
    setIsEditing(false)
    loadData()
  }

  const handleSubmit = async (formData: { name: string; description: string; location_type: string }) => {
    if (!user || !location) return

    setIsSaving(true)
    setError(null)
    try {
      const updated = await services.location.updateLocation(locationId, {
        name: formData.name.trim(),
        description: formData.description || null,
        location_type: formData.location_type,
      })
      setLocation(updated)
      setIsEditing(false)
    } catch (err: any) {
      console.error("Error updating location:", err)
      setError(err?.message || "Error al actualizar la ubicación")
    } finally {
      setIsSaving(false)
    }
  }

  const handleDelete = async () => {
    if (!user || !location) return

    const shopCount = shops.length
    const confirmMessage = shopCount > 0
      ? `¿Eliminar "${location.name}"? Esta acción eliminará también ${shopCount} tienda(s) asociada(s) y todos sus items. Esta acción no se puede deshacer.`
      : `¿Eliminar "${location.name}"? Esta acción no se puede deshacer.`

    if (!confirm(confirmMessage)) return

    setIsDeleting(true)
    setError(null)
    try {
      await services.location.deleteLocation(locationId)
      router.push(`/campaigns/${campaignId}`)
    } catch (err: any) {
      console.error("Error deleting location:", err)
      setError(err?.message || "Error al eliminar la ubicación")
      setIsDeleting(false)
    }
  }

  const getLocationTypeLabel = (type: string) => {
    return t.marketplace?.locationTypes?.[type as LocationType] || type
  }

  if (isLoading) {
    return <LoadingState message="Cargando ubicación..." />
  }

  if (!location) {
    return (
      <div className="w-full max-w-3xl mx-auto space-y-4 md:space-y-6">
        <Button variant="ghost" onClick={() => router.push(`/campaigns/${campaignId}`)} className="text-sm md:text-base">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Volver a Campaña
        </Button>
        <EmptyState icon={MapPin} title="Ubicación no encontrada" description="La ubicación solicitada no existe" />
      </div>
    )
  }

  return (
    <div className="w-full max-w-4xl mx-auto space-y-4 md:space-y-6">
      <Button
        variant="ghost"
        onClick={() => router.push(`/campaigns/${campaignId}`)}
        className="text-sm md:text-base"
      >
        <ArrowLeft className="w-4 h-4 mr-2" />
        Volver a Campaña
      </Button>

      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {isEditing ? (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MapPin className="w-5 h-5" />
              Editar Ubicación
            </CardTitle>
          </CardHeader>
          <CardContent>
            <LocationForm
              initialData={location}
              onSubmit={handleSubmit}
              onCancel={handleCancelEdit}
              isLoading={isSaving}
            />
          </CardContent>
        </Card>
      ) : location.location_type === "dungeon" ? (
        <UnifiedDungeonView
          campaignId={campaignId}
          locationId={locationId}
          location={location}
          shops={shops}
          isOwner={isOwner}
          onUpdate={loadData}
        />
      ) : (
        <>
          <Card>
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <CardTitle className="flex items-center gap-2 text-2xl">
                    <MapPin className="w-6 h-6" />
                    {location.name}
                  </CardTitle>
                  <CardDescription className="mt-2">
                    {location.description || "Sin descripción"}
                  </CardDescription>
                  {location.location_type && (
                    <Badge className="mt-2" variant="secondary">
                      {getLocationTypeLabel(location.location_type)}
                    </Badge>
                  )}
                </div>
                {isOwner && (
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={handleEdit}>
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

          {/* Sección de Tiendas */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between gap-4 flex-wrap">
                <div className="space-y-1 flex-1 min-w-0">
                  <CardTitle className="flex items-center gap-2">
                    <Store className="w-5 h-5" />
                    Tiendas ({shops.length})
                  </CardTitle>
                  <CardDescription>
                    Tiendas disponibles en esta ubicación
                  </CardDescription>
                </div>
                {isOwner && (
                  <Button
                    onClick={() => router.push(`/campaigns/${campaignId}/locations/${locationId}/shops/new`)}
                    className="shrink-0"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    <span className="hidden sm:inline">Crear Tienda</span>
                    <span className="sm:hidden">Crear</span>
                  </Button>
                )}
              </div>
            </CardHeader>
            <Separator />
            <CardContent className="pt-6">
              {shops.length === 0 ? (
                <EmptyState
                  icon={Store}
                  title="No hay tiendas"
                  description={`Esta ubicación no tiene tiendas registradas aún. ${isOwner ? 'Crea la primera tienda para comenzar.' : ''}`}
                >
                  {isOwner && (
                    <Button
                      onClick={() => router.push(`/campaigns/${campaignId}/locations/${locationId}/shops/new`)}
                      className="mt-4"
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      Crear Primera Tienda
                    </Button>
                  )}
                </EmptyState>
              ) : (
                <div className="grid gap-4 sm:grid-cols-1 md:grid-cols-2 xl:grid-cols-3">
                  {shops.map((shop) => (
                    <Card
                      key={shop.id}
                      className="cursor-pointer hover:bg-muted/50 transition-colors"
                      onClick={() => router.push(`/campaigns/${campaignId}/locations/${locationId}/shops/${shop.id}`)}
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
              )}
            </CardContent>
          </Card>
        </>
      )}
    </div>
  )
}

