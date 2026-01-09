"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { LoadingState } from "@/components/molecules/loading"
import { EmptyState } from "@/components/molecules/empty"
import { Badge } from "@/components/ui/badge"
import { useAuth } from "@/lib/auth-context"
import { useServices } from "@/hooks/use-services"
import { useLanguage } from "@/lib/language-context"
import { ShopForm } from "./shop-form"
import { ArrowLeft, Store, Package, Edit, Trash2, MapPin } from "lucide-react"
import type { Shop } from "@/lib/infrastructure/repositories/shop-repository"
import type { Location } from "@/lib/infrastructure/repositories/location-repository"

interface ShopViewProps {
  campaignId: string
  locationId: string
  shopId: string
}


import { type ShopType } from "@/lib/constants/shop-constants"

export function ShopView({ campaignId, locationId, shopId }: ShopViewProps) {
  const { t } = useLanguage()
  const router = useRouter()
  const { user } = useAuth()
  const services = useServices()

  const [shop, setShop] = useState<Shop | null>(null)
  const [location, setLocation] = useState<Location | null>(null)
  const [standaloneNpcs, setStandaloneNpcs] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isOwner, setIsOwner] = useState(false)
  const [isEditing, setIsEditing] = useState(false)

  useEffect(() => {
    if (user && campaignId && locationId && shopId) {
      loadData()
    }
  }, [user, campaignId, locationId, shopId])

  const loadData = async () => {
    if (!user || !campaignId || !locationId || !shopId) return

    setIsLoading(true)
    setError(null)
    try {
      const [campaignData, shopData, locationData, npcs] = await Promise.all([
        services.campaign.getCampaign(campaignId),
        services.shop.getShop(shopId),
        services.location.getLocation(locationId),
        services.npc.getNpcsByCampaign(campaignId),
      ])

      const owner = campaignData.game_master_id === user.id
      setIsOwner(owner)
      setShop(shopData)
      setLocation(locationData)
      setStandaloneNpcs(npcs)
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

  const handleSubmit = async (formData: {
    name: string
    description: string
    shop_type: string
    selectedNpcId: string
  }) => {
    if (!user || !shop) return

    setIsSaving(true)
    setError(null)
    try {
      const updated = await services.shop.updateShop(shopId, {
        name: formData.name.trim(),
        description: formData.description || null,
        shop_type: formData.shop_type,
      })
      setShop(updated)

      // Manejar relación con NPC
      const { createBrowserClient } = await import("@/lib/supabase/client")
      const supabase = createBrowserClient()

      // Eliminar relaciones existentes
      await supabase.from("shop_npcs").delete().eq("shop_id", shopId)

      // Si hay un NPC seleccionado, crear la relación
      if (formData.selectedNpcId && formData.selectedNpcId !== "none") {
        // Buscar el NPC en el array standaloneNpcs que ya tenemos cargado
        const selectedNpc = standaloneNpcs.find((npc) => npc.id === formData.selectedNpcId)
        
        if (selectedNpc) {
          await supabase.from("shop_npcs").insert({
            shop_id: shopId,
            npc_id: formData.selectedNpcId,
            name: selectedNpc.name, // Campo requerido por la tabla shop_npcs
          })
        } else {
          throw new Error("No se pudo encontrar el NPC seleccionado")
        }
      }

      setIsEditing(false)
      loadData()
    } catch (err: any) {
      console.error("Error updating shop:", err)
      setError(err?.message || "Error al actualizar la tienda")
    } finally {
      setIsSaving(false)
    }
  }

  const handleDelete = async () => {
    if (!user || !shop) return

    const confirmMessage = `¿Eliminar "${shop.name}"? Esta acción eliminará todos los items, NPCs y carritos asociados. Esta acción no se puede deshacer.`

    if (!confirm(confirmMessage)) return

    setIsDeleting(true)
    setError(null)
    try {
      await services.shop.deleteShop(shopId)
      router.push(`/campaigns/${campaignId}/locations/${locationId}`)
    } catch (err: any) {
      console.error("Error deleting shop:", err)
      setError(err?.message || "Error al eliminar la tienda")
      setIsDeleting(false)
    }
  }

  const getShopTypeLabel = (type: string) => {
    return t.marketplace?.shopTypes?.[type as ShopType] || type
  }

  const getLocationTypeLabel = (type: string) => {
    const locationTypes = t.marketplace?.locationTypes
    if (!locationTypes) return type
    return (locationTypes as Record<string, string>)[type] || type
  }

  const getLocationTypeBadgeColor = (locationType: string | null): string => {
    if (locationType === "dungeon") {
      return "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200"
    }
    return "bg-primary/10 text-primary"
  }

  if (isLoading) {
    return <LoadingState message="Cargando tienda..." />
  }

  if (!shop) {
    return (
      <div className="w-full max-w-3xl mx-auto space-y-4 md:space-y-6">
        <Button
          variant="ghost"
          onClick={() => router.push(`/campaigns/${campaignId}/locations/${locationId}`)}
          className="text-sm md:text-base"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Volver a Ubicación
        </Button>
        <EmptyState
          icon={Store}
          title="Tienda no encontrada"
          description="La tienda solicitada no existe"
        />
      </div>
    )
  }

  return (
    <div className="w-full max-w-4xl mx-auto space-y-4 md:space-y-6">
      <Button
        variant="ghost"
        onClick={() => router.push(`/campaigns/${campaignId}/locations/${locationId}`)}
        className="text-sm md:text-base"
      >
        <ArrowLeft className="w-4 h-4 mr-2" />
        Volver a Ubicación
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
              <Store className="w-5 h-5" />
              Editar Tienda
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ShopForm
              initialData={shop}
              locationInfo={location ? { name: location.name, type: location.location_type } : undefined}
              standaloneNpcs={standaloneNpcs}
              selectedNpcId=""
              onSubmit={handleSubmit}
              onCancel={handleCancelEdit}
              isLoading={isSaving}
              getLocationTypeLabel={getLocationTypeLabel}
              getLocationTypeBadgeColor={getLocationTypeBadgeColor}
            />
          </CardContent>
        </Card>
      ) : (
        <>
          <Card>
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <CardTitle className="flex items-center gap-2 text-2xl">
                    <Store className="w-6 h-6" />
                    {shop.name}
                  </CardTitle>
                  <CardDescription className="mt-2">
                    {shop.description || "Sin descripción"}
                  </CardDescription>
                  {shop.shop_type && (
                    <Badge className="mt-2" variant="secondary">
                      {getShopTypeLabel(shop.shop_type)}
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

          <div className="space-y-4">
            <Button
              variant="outline"
              className="w-full"
              onClick={() => router.push(`/shop-items/${shopId}?role=${isOwner ? "game_master" : "player"}`)}
            >
              <Package className="w-4 h-4 mr-2" />
              {isOwner ? (t.marketplace?.manageItems || "Gestionar Items") : (t.marketplace?.viewItems || "Ver Items")}
            </Button>
          </div>
        </>
      )}
    </div>
  )
}

