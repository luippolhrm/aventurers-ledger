"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/lib/auth-context"
import { useServices } from "@/hooks/use-services"
import { useToast } from "@/hooks/use-toast"
import { LoadingState } from "@/components/molecules/loading"
import { LocationsSection } from "@/components/organisms/world/locations-section"
import { ShopsSection } from "@/components/organisms/world/shops-section"
import type { Location } from "@/lib/infrastructure/repositories/location-repository"
import type { Shop } from "@/lib/infrastructure/repositories/shop-repository"
import { ArrowLeft } from "lucide-react"
import { useLanguage } from "@/lib/language-context"
import { Button } from "@/components/ui/button"
import { type ShopType } from "@/lib/constants/shop-constants"

type LocationType = "village" | "forest" | "camp" | "port" | "ruins" | "city" | "dungeon"

interface WorldViewProps {
  campaignId: string
  language?: "es" // Mantener por compatibilidad, pero ya no se usa
}

export function WorldView({ campaignId, language }: WorldViewProps) {
  const { t } = useLanguage()
  const router = useRouter()
  const { user } = useAuth()
  const services = useServices()
  const { toast } = useToast()

  const [locations, setLocations] = useState<Location[]>([])
  const [selectedLocationId, setSelectedLocationId] = useState<string>("")
  const [shops, setShops] = useState<Shop[]>([])
  const [loading, setLoading] = useState(true)
  const [isOwner, setIsOwner] = useState(false)

  useEffect(() => {
    if (user && campaignId) {
      loadData()
    }
  }, [user, campaignId])

  useEffect(() => {
    if (selectedLocationId) {
      loadShops()
    } else {
      setShops([])
    }
  }, [selectedLocationId])

  const loadData = async () => {
    if (!user || !campaignId) return

    setLoading(true)
    try {
      await loadLocations()
    } catch (error) {
      console.error("[v0] WorldView: Error loading data:", error)
    } finally {
      setLoading(false)
    }
  }

  const loadLocations = async () => {
    if (!campaignId || !user) {
      setLocations([])
      return
    }

    try {
      const [campaign, locationsData] = await Promise.all([
        services.campaign.getCampaign(campaignId),
        services.location.getLocationsByCampaign(campaignId),
      ])
      setIsOwner(campaign.game_master_id === user.id)
      setLocations(locationsData)
    } catch (error: any) {
      console.error("[v0] WorldView: Error loading locations:", error)
      toast({
        title: t.inventory?.error || "Error",
        description: error?.message || "Error al cargar ubicaciones",
        variant: "destructive",
      })
      setLocations([])
    }
  }

  const loadShops = async () => {
    if (!selectedLocationId || !user) {
      setShops([])
      return
    }

    try {
      const shopsData = await services.shop.getShopsByLocation(selectedLocationId)
      setShops(shopsData)
    } catch (error: any) {
      console.error("[v0] WorldView: Error loading shops:", error)
      toast({
        title: t.inventory?.error || "Error",
        description: error?.message || "Error al cargar tiendas",
        variant: "destructive",
      })
      setShops([])
    }
  }


  const selectedLocation = locations.find((location) => location.id === selectedLocationId)

  const getLocationTypeLabel = (type: string) => {
    return t.marketplace?.locationTypes?.[type as LocationType] || type
  }

  const getShopTypeLabel = (type: string) => {
    return t.marketplace?.shopTypes?.[type as ShopType] || type
  }

  if (loading) {
    return <LoadingState message="Cargando mundo de la campaña..." />
  }

  return (
    <div className="space-y-6">
      {/* Botón Volver */}
      <Button
        variant="ghost"
        onClick={() => router.push(`/campaigns/${campaignId}`)}
        className="text-sm md:text-base"
      >
        <ArrowLeft className="w-4 h-4 mr-2" />
        Volver a Campaña
      </Button>

      {/* Sección de Ubicaciones */}
      <LocationsSection
        locations={locations}
        selectedLocationId={selectedLocationId}
        language={language}
        onLocationSelect={setSelectedLocationId}
        getLocationTypeLabel={getLocationTypeLabel}
        campaignId={campaignId}
        isOwner={isOwner}
      />

      {/* Sección de Tiendas - Solo se muestra si hay ubicación seleccionada */}
      {selectedLocation && (
        <ShopsSection
          shops={shops}
          selectedLocation={selectedLocation}
          language={language}
          onViewItems={(shopId) => router.push(`/shop-items/${shopId}?role=player`)}
          getShopTypeLabel={getShopTypeLabel}
          campaignId={campaignId}
          isOwner={isOwner}
        />
      )}
    </div>
  )
}

