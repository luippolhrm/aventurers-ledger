"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useAuth } from "@/lib/auth-context"
import { useServices } from "@/hooks/use-services"
import { useToast } from "@/hooks/use-toast"
import { LoadingState } from "@/components/molecules/loading"
import { LocationsTab } from "@/components/organisms/world/locations-tab"
import { ShopsTab } from "@/components/organisms/world/shops-tab"
import { NpcsTab } from "@/components/organisms/world/npcs-tab"
import type { Location } from "@/lib/infrastructure/repositories/location-repository"
import type { Shop } from "@/lib/infrastructure/repositories/shop-repository"
import type { Npc } from "@/lib/infrastructure/repositories/npc-repository"
import { MapPin, Store, Users } from "lucide-react"
import { useLanguage } from "@/lib/language-context"

const LOCATION_TYPE_OPTIONS = ["village", "forest", "camp", "port", "ruins", "city"] as const
const SHOP_TYPE_OPTIONS = ["inn", "general", "smith", "jewelry", "market", "atelier"] as const

type LocationType = (typeof LOCATION_TYPE_OPTIONS)[number]
type ShopType = (typeof SHOP_TYPE_OPTIONS)[number]

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
  const [selectedShopId, setSelectedShopId] = useState<string>("")
  const [standaloneNpcs, setStandaloneNpcs] = useState<Npc[]>([])
  const [activeTab, setActiveTab] = useState<"locations" | "shops" | "npcs">("locations")
  const [loading, setLoading] = useState(true)

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
      setSelectedShopId("")
    }
  }, [selectedLocationId])

  const loadData = async () => {
    if (!user || !campaignId) return

    setLoading(true)
    try {
      await Promise.all([loadLocations(), loadStandaloneNpcs()])
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
      const locationsData = await services.location.getLocationsByCampaign(campaignId)
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

  const loadStandaloneNpcs = async () => {
    if (!campaignId || !user) {
      setStandaloneNpcs([])
      return
    }

    try {
      const npcsData = await services.npc.getNpcsByCampaign(campaignId)
      setStandaloneNpcs(npcsData)
    } catch (error: any) {
      console.error("[v0] WorldView: Error loading NPCs:", error)
      toast({
        title: t.inventory?.error || "Error",
        description: error?.message || "Error al cargar NPCs",
        variant: "destructive",
      })
      setStandaloneNpcs([])
    }
  }

  const selectedLocation = locations.find((location) => location.id === selectedLocationId)
  const selectedShop = shops.find((shop) => shop.id === selectedShopId)

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
    <div className="space-y-4">
      <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as "locations" | "shops" | "npcs")} className="w-full">
        <TabsList className="grid w-full grid-cols-3 max-w-2xl gap-1">
          <TabsTrigger value="locations" className="text-xs sm:text-sm">
            <MapPin className="w-3 h-3 sm:w-4 sm:h-4 sm:mr-2" />
            <span className="hidden sm:inline">{t.marketplace?.yourLocations || "Ubicaciones"}</span>
            <span className="sm:hidden">Ubic.</span>
          </TabsTrigger>
          <TabsTrigger value="shops" className="text-xs sm:text-sm">
            <Store className="w-3 h-3 sm:w-4 sm:h-4 sm:mr-2" />
            <span className="hidden sm:inline">{t.marketplace?.shops || "Tiendas"}</span>
            <span className="sm:hidden">Tiendas</span>
          </TabsTrigger>
          <TabsTrigger value="npcs" className="text-xs sm:text-sm">
            <Users className="w-3 h-3 sm:w-4 sm:h-4 sm:mr-2" />
            NPCs
          </TabsTrigger>
        </TabsList>

        <TabsContent value="locations" className="space-y-4 mt-6">
          <LocationsTab
            locations={locations}
            selectedLocationId={selectedLocationId}
            language={language}
            onLocationSelect={setSelectedLocationId}
            getLocationTypeLabel={getLocationTypeLabel}
          />
        </TabsContent>

        <TabsContent value="shops" className="space-y-4 mt-6">
          <ShopsTab
            shops={shops}
            selectedShopId={selectedShopId}
            selectedLocation={selectedLocation}
            language={language}
            onShopSelect={setSelectedShopId}
            onViewItems={(shopId) => router.push(`/shop-items/${shopId}?role=player`)}
            getShopTypeLabel={getShopTypeLabel}
          />
        </TabsContent>

        <TabsContent value="npcs" className="space-y-4 mt-6">
          <NpcsTab npcs={standaloneNpcs} language={language} />
        </TabsContent>
      </Tabs>
    </div>
  )
}

