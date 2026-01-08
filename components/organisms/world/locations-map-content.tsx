"use client"

import { useEffect, useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useAuth } from "@/lib/auth-context"
import { useLanguage } from "@/lib/language-context"
import { useServices } from "@/hooks/use-services"
import type { Campaign } from "@/lib/infrastructure/repositories"
import { MapPin, Edit, Plus, Trash2 } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

const LOCATION_TYPE_OPTIONS = ["village", "forest", "camp", "port", "ruins", "city"] as const

type LocationType = (typeof LOCATION_TYPE_OPTIONS)[number]

interface CampaignEntry {
  id: string
  name: string
  role: "game_master" | "player"
  displayId: string // Mantener por compatibilidad con selector, pero usar id directamente
}

interface LocationRow {
  id: string
  name: string
  description: string | null
  campaign_id: string
  location_type: LocationType | null
}


interface LocationsMapContentProps {
  language?: "es" // Mantener por compatibilidad, pero ya no se usa
  campaignId?: string // Opcional: si se proporciona, filtrar por esta campaña
}

export function LocationsMapContent({ language, campaignId: propCampaignId }: LocationsMapContentProps) {
  const { t } = useLanguage()
  const router = useRouter()
  const { user } = useAuth()
  const { toast } = useToast()
  const services = useServices()

  const [campaign, setCampaign] = useState<Campaign | null>(null)
  const [campaigns, setCampaigns] = useState<CampaignEntry[]>([])
  const [selectedCampaignId, setSelectedCampaignId] = useState<string>(propCampaignId || "")
  const [locations, setLocations] = useState<LocationRow[]>([])

  // Helper functions para obtener labels traducidos
  const getLocationTypeLabel = (type: string) => {
    return t.marketplace?.locationTypes?.[type as LocationType] || type
  }

  const campaignsList = useMemo(() => campaigns, [campaigns])

  // Verificar ownership directo
  const isOwner = campaign?.game_master_id === user?.id

  // Cargar datos de campaña cuando propCampaignId está presente
  useEffect(() => {
    if (propCampaignId && user) {
      loadCampaignData()
    } else if (!propCampaignId && user) {
      loadCampaigns()
    } else {
      // Limpiar estado si no hay usuario
      setCampaign(null)
      setCampaigns([])
      setSelectedCampaignId("")
      setLocations([])
    }
  }, [user, propCampaignId])

  // Cargar datos cuando cambia selectedCampaignId (modo standalone)
  useEffect(() => {
    if (!propCampaignId && selectedCampaignId && user) {
      loadCampaignDataById(selectedCampaignId)
    } else if (!propCampaignId && !selectedCampaignId) {
      // Limpiar estado si no hay campaña seleccionada
      setCampaign(null)
      setLocations([])
    }
  }, [selectedCampaignId, propCampaignId, user])


  // Cargar datos de campaña cuando propCampaignId está presente
  const loadCampaignData = async () => {
    if (!propCampaignId || !user) return

    try {
      const campaignData = await services.campaign.getCampaign(propCampaignId)
      setCampaign(campaignData)
      
      // Cargar datos de la campaña
      await loadLocations()
    } catch (err: any) {
      console.error("[v0] LocationsMapContent: Error loading campaign data:", err)
      toast({
        title: t.inventory?.error || "Error",
        description: err?.message || "Error al cargar la campaña",
        variant: "destructive",
      })
      setCampaign(null)
      setLocations([])
    }
  }

  // Cargar datos de campaña por ID (modo standalone)
  const loadCampaignDataById = async (campaignId: string) => {
    if (!campaignId || !user) return

    try {
      const campaignData = await services.campaign.getCampaign(campaignId)
      setCampaign(campaignData)
      
      // Cargar datos de la campaña
      await loadLocations()
    } catch (err: any) {
      console.error("[v0] LocationsMapContent: Error loading campaign data:", err)
      toast({
        title: t.inventory?.error || "Error",
        description: err?.message || "Error al cargar la campaña",
        variant: "destructive",
      })
      setCampaign(null)
      setLocations([])
    }
  }

  const loadCampaigns = async () => {
    if (!user) {
      setCampaigns([])
      return
    }

    try {
      // Cargar campañas donde el usuario es owner
      const ownedCampaigns = await services.campaign.getCampaignsAsGM(user.id)
      
      // Crear entradas simplificadas (sin displayId ni roles separados)
      const campaignEntries: CampaignEntry[] = ownedCampaigns.map(campaign => ({
        id: campaign.id,
        name: campaign.name,
        role: "game_master", // Siempre GM porque son campañas propias
        displayId: campaign.id, // Usar ID directamente, ya no necesitamos formato campaignId_role
      }))
      
      setCampaigns(campaignEntries)
      
      // Seleccionar primera campaña si no hay seleccionada
      if (!selectedCampaignId && campaignEntries.length > 0) {
        setSelectedCampaignId(campaignEntries[0].id)
      }
    } catch (err: any) {
      console.error("[v0] LocationsMapContent: Error loading campaigns:", err)
      toast({
        title: t.inventory?.error || "Error",
        description: err?.message || "Error al cargar campañas",
        variant: "destructive",
      })
      setCampaigns([])
    }
  }

  const loadLocations = async () => {
    const campaignIdToUse = propCampaignId || selectedCampaignId || campaign?.id
    if (!campaignIdToUse || !user) {
      setLocations([])
      return
    }

    try {
      const locationsData = await services.location.getLocationsByCampaign(campaignIdToUse)
      setLocations(locationsData.map(loc => ({
        id: loc.id,
        name: loc.name,
        description: loc.description,
        campaign_id: loc.campaign_id,
        location_type: loc.location_type as LocationType | null,
      })))
    } catch (err: any) {
      console.error("[v0] LocationsMapContent: Error loading locations:", err)
      toast({
        title: t.inventory?.error || "Error",
        description: err?.message || "Error al cargar ubicaciones",
        variant: "destructive",
      })
      setLocations([])
    }
  }


  const getCampaignId = () => {
    return propCampaignId || selectedCampaignId || campaign?.id || ""
  }

  const handleDeleteLocation = async (locationId: string) => {
    if (!user || !isOwner) {
      toast({
        title: t.inventory?.error || "Error",
        description: "Solo el dueño de la campaña puede eliminar ubicaciones",
        variant: "destructive",
      })
      return
    }

    const location = locations.find(l => l.id === locationId)
    if (!location) return

    const confirmMessage = `¿Eliminar "${location.name}"? Esta acción eliminará también todas las tiendas asociadas y todos sus items. Esta acción no se puede deshacer.`

    if (!confirm(confirmMessage)) return

    try {
      await services.location.deleteLocation(locationId)
      setLocations(locations.filter(l => l.id !== locationId))
      
      toast({
        title: t.inventory?.success || "Éxito",
        description: "Ubicación eliminada correctamente",
      })
      
      // Recargar datos
      loadLocations()
    } catch (err: any) {
      console.error("[v0] LocationsMapContent: Error deleting location:", err)
      toast({
        title: t.inventory?.error || "Error",
        description: err?.message || "Error al eliminar ubicación",
        variant: "destructive",
      })
    }
  }




  return (
    <div>
      {/* Campaign Selector - Solo mostrar si no hay propCampaignId */}
      {!propCampaignId && (
        <div className="mb-6">
          {campaignsList.length === 0 ? (
            <p className="text-sm text-muted-foreground">{t.marketplace?.noCampaigns || "Join a campaign to see the map."}</p>
          ) : (
            <div className="space-y-2">
              <Label>{t.campaigns?.selectCampaign || "Select Campaign"}</Label>
              <Select
                value={selectedCampaignId}
                onValueChange={(value) => {
                  if (value && user) {
                    setSelectedCampaignId(value)
                  }
                }}
              >
                <SelectTrigger className="w-full max-w-md">
                  <SelectValue placeholder={t.marketplace?.selectCampaign || "Select a campaign"} />
                </SelectTrigger>
                <SelectContent>
                  {campaignsList.map((campaign) => (
                    <SelectItem key={campaign.id} value={campaign.id}>
                      {campaign.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
        </div>
      )}

      {/* Main Content - Locations List */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-xl font-semibold flex items-center gap-2">
            <MapPin className="w-5 h-5" />
            {t.marketplace?.yourLocations || "Ubicaciones"}
          </h3>
          {isOwner && (
            <Button onClick={() => {
              const campaignIdToUse = getCampaignId()
              if (campaignIdToUse) {
                router.push(`/campaigns/${campaignIdToUse}/locations/new`)
              }
            }}>
              <Plus className="w-4 h-4 mr-2" />
              {t.marketplace?.createLocation || "Crear Ubicación"}
            </Button>
          )}
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {locations.map((location) => (
            <Card
              key={location.id}
              className="transition-shadow cursor-pointer border hover:shadow-md"
              onClick={() => {
                const campaignIdToUse = getCampaignId()
                if (campaignIdToUse) {
                  router.push(`/campaigns/${campaignIdToUse}/locations/${location.id}`)
                }
              }}
            >
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <CardTitle className="text-lg">{location.name}</CardTitle>
                    <CardDescription className="mt-1">{location.description}</CardDescription>
                    {location.location_type && (
                      <span className="inline-block mt-2 text-xs px-2 py-1 rounded-full bg-primary/10 text-primary uppercase">
                        {getLocationTypeLabel(location.location_type)}
                      </span>
                    )}
                  </div>
                  {isOwner && (
                    <div className="flex gap-1">
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-8 w-8"
                        onClick={(e) => {
                          e.stopPropagation()
                          const campaignIdToUse = getCampaignId()
                          if (campaignIdToUse) {
                            router.push(`/campaigns/${campaignIdToUse}/locations/${location.id}`)
                          }
                        }}
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-8 w-8 text-destructive hover:text-destructive"
                        onClick={(e) => {
                          e.stopPropagation()
                          handleDeleteLocation(location.id)
                        }}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  )}
                </div>
              </CardHeader>
            </Card>
          ))}
          {!locations.length && (
            <Card>
              <CardContent className="py-8 text-center text-muted-foreground">
                <p>{t.marketplace?.emptyLocations || "No hay ubicaciones aún."}</p>
                {isOwner && (
                  <Button variant="outline" className="mt-4" onClick={() => {
                    const campaignIdToUse = getCampaignId()
                    if (campaignIdToUse) {
                      router.push(`/campaigns/${campaignIdToUse}/locations/new`)
                    }
                  }}>
                    <Plus className="w-4 h-4 mr-2" />
                    {t.marketplace?.createLocation || "Crear Primera Ubicación"}
                  </Button>
                )}
              </CardContent>
            </Card>
          )}
        </div>
      </div>

    </div>
  )
}

