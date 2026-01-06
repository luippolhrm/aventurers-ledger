"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useAuth } from "@/lib/auth-context"
import { useServices } from "@/hooks/use-services"
import { type Language, translations } from "@/lib/translations"
import type { Location } from "@/lib/infrastructure/repositories/location-repository"
import type { Shop } from "@/lib/infrastructure/repositories/shop-repository"
import type { Npc } from "@/lib/infrastructure/repositories/npc-repository"
import { MapPin, Store, Users, Package } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

const LOCATION_TYPE_OPTIONS = ["village", "forest", "camp", "port", "ruins", "city"] as const
const SHOP_TYPE_OPTIONS = ["inn", "general", "smith", "jewelry", "market", "atelier"] as const

type LocationType = (typeof LOCATION_TYPE_OPTIONS)[number]
type ShopType = (typeof SHOP_TYPE_OPTIONS)[number]

interface CampaignWorldViewProps {
  campaignId: string
  language: Language
}

const getLocationTypeLabel = (type: LocationType, map?: any) => map?.locationTypes?.[type] || type
const getShopTypeLabel = (type: ShopType, map?: any) => map?.shopTypes?.[type] || type

export function CampaignWorldView({ campaignId, language }: CampaignWorldViewProps) {
  const t = translations[language]
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
      console.error("[v0] CampaignWorldView: Error loading data:", error)
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
      console.error("[v0] CampaignWorldView: Error loading locations:", error)
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
      console.error("[v0] CampaignWorldView: Error loading shops:", error)
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
      console.error("[v0] CampaignWorldView: Error loading NPCs:", error)
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

  if (loading) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">Cargando mundo de la campaña...</p>
      </div>
    )
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

        {/* Locations Tab */}
        <TabsContent value="locations" className="space-y-4 mt-6">
          <div className="flex items-center justify-between">
            <h3 className="text-base md:text-lg font-semibold flex items-center gap-2">
              <MapPin className="w-4 h-4 md:w-5 md:h-5" />
              {t.marketplace?.yourLocations || "Ubicaciones"}
            </h3>
          </div>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {locations.map((location) => (
              <Card
                key={location.id}
                className={`transition-shadow cursor-pointer ${
                  selectedLocationId === location.id ? "border-2 border-primary" : "border"
                }`}
                onClick={() => setSelectedLocationId(location.id)}
              >
                <CardHeader>
                  <CardTitle className="text-base md:text-lg">{location.name}</CardTitle>
                  <CardDescription className="text-xs md:text-sm">{location.description}</CardDescription>
                  {location.location_type && (
                    <span className="inline-block mt-2 text-xs px-2 py-1 rounded-full bg-primary/10 text-primary uppercase">
                      {getLocationTypeLabel(location.location_type, t.marketplace)}
                    </span>
                  )}
                </CardHeader>
              </Card>
            ))}
            {!locations.length && (
              <Card>
                <CardContent className="py-8 text-center text-muted-foreground">
                  <p className="text-sm md:text-base">{t.marketplace?.emptyLocations || "No hay ubicaciones disponibles."}</p>
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>

        {/* Shops Tab */}
        <TabsContent value="shops" className="space-y-4 mt-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base md:text-lg font-semibold flex items-center gap-2">
                <Store className="w-4 h-4 md:w-5 md:h-5" />
                {t.marketplace?.shops || "Tiendas"}
              </h3>
              {selectedLocationId && (
                <p className="text-xs md:text-sm text-muted-foreground mt-1">
                  {selectedLocation?.name || "Ubicación seleccionada"}
                </p>
              )}
            </div>
          </div>
          {!selectedLocationId ? (
            <Card>
              <CardContent className="py-8 text-center text-muted-foreground">
                <p className="text-sm md:text-base">
                  {t.marketplace?.selectLocationFirst || "Selecciona una ubicación para ver sus tiendas."}
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {shops.map((shop) => (
                <Card
                  key={shop.id}
                  className={`transition-shadow cursor-pointer ${
                    selectedShopId === shop.id ? "border-2 border-primary" : "border"
                  }`}
                  onClick={() => setSelectedShopId(shop.id)}
                >
                  <CardHeader>
                    <CardTitle className="text-base md:text-lg">{shop.name}</CardTitle>
                    <CardDescription className="text-xs md:text-sm">{shop.description}</CardDescription>
                    {shop.shopkeeper_name && (
                      <p className="text-xs md:text-sm text-muted-foreground mt-1">
                        Tendero: {shop.shopkeeper_name}
                      </p>
                    )}
                    {(shop as any).shop_type && (
                      <span className="inline-block mt-2 text-xs px-2 py-1 rounded-full bg-primary/10 text-primary uppercase">
                        {getShopTypeLabel((shop as any).shop_type as ShopType, t.marketplace)}
                      </span>
                    )}
                  </CardHeader>
                  {selectedShopId === shop.id && (
                    <CardContent>
                      <Button
                        variant="outline"
                        className="w-full"
                        onClick={() => {
                          router.push(`/shop-items/${shop.id}?role=player`)
                        }}
                      >
                        <Package className="w-4 h-4 mr-2" />
                        {t.marketplace?.viewItems || "Ver Items"}
                      </Button>
                    </CardContent>
                  )}
                </Card>
              ))}
              {!shops.length && (
                <Card>
                  <CardContent className="py-8 text-center text-muted-foreground">
                    <p className="text-sm md:text-base">{t.marketplace?.emptyShops || "No hay tiendas en esta ubicación."}</p>
                  </CardContent>
                </Card>
              )}
            </div>
          )}
        </TabsContent>

        {/* NPCs Tab */}
        <TabsContent value="npcs" className="space-y-4 mt-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base md:text-lg font-semibold flex items-center gap-2">
                <Users className="w-4 h-4 md:w-5 md:h-5" />
                NPCs
              </h3>
              <p className="text-xs md:text-sm text-muted-foreground mt-1">
                {t.marketplace?.npcHint || "Personajes no jugadores de la campaña."}
              </p>
            </div>
          </div>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {standaloneNpcs.map((npc) => (
              <Card key={npc.id}>
                <CardHeader>
                  <CardTitle className="text-base md:text-lg">{npc.name}</CardTitle>
                  {npc.title && (
                    <CardDescription className="text-xs md:text-sm">{npc.title}</CardDescription>
                  )}
                  {npc.story && (
                    <p className="text-xs md:text-sm text-muted-foreground mt-2">{npc.story}</p>
                  )}
                  {npc.resistances && (
                    <p className="text-xs md:text-sm text-muted-foreground mt-1">
                      <strong>Resistencias:</strong> {npc.resistances}
                    </p>
                  )}
                </CardHeader>
              </Card>
            ))}
            {!standaloneNpcs.length && (
              <Card>
                <CardContent className="py-8 text-center text-muted-foreground">
                  <p className="text-sm md:text-base">No hay NPCs creados aún.</p>
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}

