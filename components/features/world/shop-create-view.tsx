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
import { ShopForm } from "./shop-form"
import { ArrowLeft, Store, MapPin, AlertCircle } from "lucide-react"
import type { Location } from "@/lib/infrastructure/repositories/location-repository"
import type { Npc } from "@/lib/infrastructure/repositories/npc-repository"

interface ShopCreateViewProps {
  campaignId: string
  locationId: string
}

export function ShopCreateView({ campaignId, locationId }: ShopCreateViewProps) {
  const { t } = useLanguage()
  const router = useRouter()
  const { user } = useAuth()
  const services = useServices()

  const [location, setLocation] = useState<Location | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isOwner, setIsOwner] = useState(false)
  const [standaloneNpcs, setStandaloneNpcs] = useState<Npc[]>([])

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
      const [campaign, locationData, npcs] = await Promise.all([
        services.campaign.getCampaign(campaignId),
        services.location.getLocation(locationId),
        services.npc.getNpcsByCampaign(campaignId),
      ])

      const owner = campaign.game_master_id === user.id
      setIsOwner(owner)
      setLocation(locationData)
      setStandaloneNpcs(npcs)
    } catch (err: any) {
      console.error("Error loading data:", err)
      setError(err?.message || "Error al cargar los datos")
    } finally {
      setIsLoading(false)
    }
  }

  const handleSubmit = async (formData: {
    name: string
    description: string
    shop_type: string
    selectedNpcId: string
  }) => {
    if (!user) {
      setError("Debes estar autenticado para crear tiendas")
      return
    }

    setIsSaving(true)
    setError(null)
    try {
      const newShop = await services.shop.createShop(
        {
          name: formData.name.trim(),
          description: formData.description || null,
          shopkeeper_name: null,
          shop_type: formData.shop_type,
          location_id: locationId,
        },
        user.id
      )

      // Si hay un NPC seleccionado, crear la relación shop_npc
      if (formData.selectedNpcId && formData.selectedNpcId !== "none") {
        const { createBrowserClient } = await import("@/lib/supabase/client")
        const supabase = createBrowserClient()
        
        // Buscar el NPC en el array standaloneNpcs que ya tenemos cargado
        const selectedNpc = standaloneNpcs.find((npc) => npc.id === formData.selectedNpcId)
        
        if (selectedNpc) {
          await supabase.from("shop_npcs").insert({
            shop_id: newShop.id,
            npc_id: formData.selectedNpcId,
            name: selectedNpc.name, // Campo requerido por la tabla shop_npcs
          })
        } else {
          throw new Error("No se pudo encontrar el NPC seleccionado")
        }
      }

      router.push(`/campaigns/${campaignId}/locations/${locationId}/shops/${newShop.id}`)
    } catch (err: any) {
      console.error("Error creating shop:", err)
      setError(err?.message || "Error al crear la tienda")
    } finally {
      setIsSaving(false)
    }
  }

  const handleCancel = () => {
    router.push(`/campaigns/${campaignId}/locations/${locationId}`)
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
    return <LoadingState message="Cargando..." />
  }

  if (!isOwner) {
    return (
      <div className="w-full max-w-3xl mx-auto space-y-4 md:space-y-6">
        <Button variant="ghost" onClick={handleCancel} className="text-sm md:text-base">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Volver a Ubicación
        </Button>
        <EmptyState icon={AlertCircle} title="Acceso Denegado" description="Solo el dueño de la campaña puede crear tiendas" />
      </div>
    )
  }

  if (!location) {
    return (
      <div className="w-full max-w-3xl mx-auto space-y-4 md:space-y-6">
        <Button variant="ghost" onClick={handleCancel} className="text-sm md:text-base">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Volver a Ubicación
        </Button>
        <EmptyState icon={MapPin} title="Ubicación no encontrada" description="La ubicación solicitada no existe" />
      </div>
    )
  }

  return (
    <div className="w-full max-w-3xl mx-auto space-y-4 md:space-y-6">
      <Button variant="ghost" onClick={handleCancel} className="text-sm md:text-base">
        <ArrowLeft className="w-4 h-4 mr-2" />
        Volver a Ubicación
      </Button>

      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Store className="w-5 h-5" />
            {t.marketplace?.createShop || "Crear Tienda"}
          </CardTitle>
          <CardDescription>
            {t.marketplace?.shopSubtitle || "Agrega una nueva tienda a esta ubicación"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ShopForm
            locationInfo={location ? { name: location.name, type: location.location_type } : undefined}
            standaloneNpcs={standaloneNpcs}
            onSubmit={handleSubmit}
            onCancel={handleCancel}
            isLoading={isSaving}
            getLocationTypeLabel={getLocationTypeLabel}
            getLocationTypeBadgeColor={getLocationTypeBadgeColor}
          />
        </CardContent>
      </Card>
    </div>
  )
}

