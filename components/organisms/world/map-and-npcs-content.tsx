"use client"

import { useEffect, useState, useMemo } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { LoadingState } from "@/components/molecules/loading"
import { EmptyState } from "@/components/molecules/empty"
import { useAuth } from "@/lib/auth-context"
import { useServices } from "@/hooks/use-services"
import { useLanguage } from "@/lib/language-context"
import { useToast } from "@/hooks/use-toast"
import { MapNpcsSummary } from "@/components/molecules/world/map-npcs-summary"
import { NpcCardEnhanced } from "@/components/molecules/world/npc-card-enhanced"
import { LocationCard } from "@/components/molecules/world/location-card"
import type { Location } from "@/lib/infrastructure/repositories/location-repository"
import type { Npc } from "@/lib/infrastructure/repositories/npc-repository"
import type { Shop } from "@/lib/infrastructure/repositories/shop-repository"
import type { DungeonRoom } from "@/lib/infrastructure/repositories/dungeon-repository.types"
import { MapPin, Users, Plus, Search, Edit, Trash2, ArrowRight } from "lucide-react"

interface MapAndNpcsContentProps {
  campaignId: string
  language?: "es" // Mantener por compatibilidad
}

type NpcFilter = "all" | "assigned" | "unassigned"

export function MapAndNpcsContent({ campaignId, language }: MapAndNpcsContentProps) {
  const { t } = useLanguage()
  const router = useRouter()
  const { user } = useAuth()
  const services = useServices()
  const { toast } = useToast()

  const [locations, setLocations] = useState<Location[]>([])
  const [npcsWithAssignments, setNpcsWithAssignments] = useState<Array<{
    npc: Npc
    shops: Shop[]
    dungeonRooms: Array<DungeonRoom & { dungeonName?: string }>
  }>>([])
  const [loading, setLoading] = useState(true)
  const [isOwner, setIsOwner] = useState(false)
  const [npcSearchQuery, setNpcSearchQuery] = useState("")
  const [npcFilter, setNpcFilter] = useState<NpcFilter>("all")

  useEffect(() => {
    if (user && campaignId) {
      loadData()
    }
  }, [user, campaignId])

  const loadData = async () => {
    if (!user || !campaignId) return

    setLoading(true)
    try {
      const [campaign, locationsData, npcsData] = await Promise.all([
        services.campaign.getCampaign(campaignId),
        services.location.getLocationsByCampaign(campaignId),
        services.npc.getNpcsWithAssignments(campaignId),
      ])

      setIsOwner(campaign.game_master_id === user.id)
      setLocations(locationsData)
      setNpcsWithAssignments(npcsData)
    } catch (error: any) {
      console.error("[v0] MapAndNpcsContent: Error loading data:", error)
      toast({
        title: t.inventory?.error || "Error",
        description: error?.message || "Error al cargar los datos",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const getLocationTypeLabel = (type: string) => {
    return t.marketplace?.locationTypes?.[type as keyof typeof t.marketplace.locationTypes] || type
  }

  // Filtrar ubicaciones regulares (excluir dungeons para mostrar en lista)
  const regularLocations = useMemo(() => {
    return locations.filter((loc) => loc.location_type !== "dungeon")
  }, [locations])

  // Calcular estadísticas
  const stats = useMemo(() => {
    const npcsCount = npcsWithAssignments.length
    const assignedCount = npcsWithAssignments.filter(
      (item) => item.shops.length > 0 || item.dungeonRooms.length > 0
    ).length
    const unassignedCount = npcsCount - assignedCount
    const dungeonsCount = locations.filter((loc) => loc.location_type === "dungeon").length

    return {
      locationsCount: regularLocations.length,
      npcsCount,
      assignedNpcsCount: assignedCount,
      unassignedNpcsCount: unassignedCount,
      dungeonsCount,
    }
  }, [regularLocations, npcsWithAssignments])

  // Filtrar NPCs
  const filteredNpcs = useMemo(() => {
    let filtered = npcsWithAssignments

    // Filtro por estado de asignación
    if (npcFilter === "assigned") {
      filtered = filtered.filter((item) => item.shops.length > 0 || item.dungeonRooms.length > 0)
    } else if (npcFilter === "unassigned") {
      filtered = filtered.filter((item) => item.shops.length === 0 && item.dungeonRooms.length === 0)
    }

    // Filtro por búsqueda
    if (npcSearchQuery.trim() !== "") {
      const query = npcSearchQuery.toLowerCase()
      filtered = filtered.filter(
        (item) =>
          item.npc.name.toLowerCase().includes(query) ||
          item.npc.title?.toLowerCase().includes(query) ||
          item.npc.story?.toLowerCase().includes(query)
      )
    }

    return filtered
  }, [npcsWithAssignments, npcFilter, npcSearchQuery])

  const handleDeleteLocation = async (locationId: string) => {
    if (!user || !isOwner) {
      toast({
        title: t.inventory?.error || "Error",
        description: "Solo el dueño de la campaña puede eliminar ubicaciones",
        variant: "destructive",
      })
      return
    }

    const location = locations.find((l) => l.id === locationId)
    if (!location) return

    const confirmMessage = `¿Eliminar "${location.name}"? Esta acción eliminará también todas las tiendas asociadas y todos sus items. Esta acción no se puede deshacer.`

    if (!confirm(confirmMessage)) return

    try {
      await services.location.deleteLocation(locationId, user.id)
      setLocations(locations.filter((l) => l.id !== locationId))

      toast({
        title: t.inventory?.success || "Éxito",
        description: "Ubicación eliminada correctamente",
      })

      loadData()
    } catch (err: any) {
      console.error("[v0] MapAndNpcsContent: Error deleting location:", err)
      toast({
        title: t.inventory?.error || "Error",
        description: err?.message || "Error al eliminar ubicación",
        variant: "destructive",
      })
    }
  }

  if (loading) {
    return <LoadingState message="Cargando mapa y NPCs..." />
  }

  return (
    <div className="space-y-6">
      {/* Resumen de estadísticas */}
      <MapNpcsSummary
        locationsCount={stats.locationsCount}
        npcsCount={stats.npcsCount}
        assignedNpcsCount={stats.assignedNpcsCount}
        unassignedNpcsCount={stats.unassignedNpcsCount}
        dungeonsCount={stats.dungeonsCount}
      />

      {/* Sección de Ubicaciones */}
      <div className="space-y-4">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div>
            <h3 className="text-xl font-semibold flex items-center gap-2">
              <MapPin className="w-5 h-5" />
              Ubicaciones del Mundo
            </h3>
            <p className="text-sm text-muted-foreground mt-1">
              {stats.locationsCount} {stats.locationsCount === 1 ? "ubicación" : "ubicaciones"} • {stats.dungeonsCount} {stats.dungeonsCount === 1 ? "mazmorra" : "mazmorras"}
            </p>
          </div>
          <div className="flex gap-2 flex-wrap">
            {regularLocations.length > 0 && (
              <Button 
                variant="outline" 
                onClick={() => router.push(`/campaigns/${campaignId}/locations`)}
              >
                Ver todas
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            )}
            {isOwner && (
              <>
                <Button onClick={() => router.push(`/campaigns/${campaignId}/locations/new`)}>
                  <Plus className="w-4 h-4 mr-2" />
                  {t.marketplace?.createLocation || "Crear Ubicación"}
                </Button>
                <Button 
                  variant="outline"
                  onClick={() => router.push(`/campaigns/${campaignId}/dungeons/new`)}
                >
                  <Plus className="w-4 h-4 mr-2" />
                  {t.marketplace?.dungeons?.createDungeon || "Crear Mazmorra"}
                </Button>
              </>
            )}
          </div>
        </div>

        {regularLocations.length === 0 ? (
          <EmptyState
            icon={MapPin}
            title="No hay ubicaciones"
            description="No hay ubicaciones creadas aún. Las mazmorras se gestionan por separado."
          >
            {isOwner && (
              <Button onClick={() => router.push(`/campaigns/${campaignId}/locations/new`)} className="mt-4">
                <Plus className="w-4 h-4 mr-2" />
                Crear Primera Ubicación
              </Button>
            )}
          </EmptyState>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {regularLocations.map((location) => (
              <LocationCard
                key={location.id}
                location={location}
                isSelected={false}
                language={language}
                onClick={() => router.push(`/campaigns/${campaignId}/locations/${location.id}`)}
                getLocationTypeLabel={getLocationTypeLabel}
              />
            ))}
          </div>
        )}
      </div>

      {/* Sección de NPCs */}
      <div className="space-y-4">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div>
            <h3 className="text-xl font-semibold flex items-center gap-2">
              <Users className="w-5 h-5" />
              {t.marketplace?.npcs?.title || "NPCs"}
            </h3>
            <p className="text-sm text-muted-foreground mt-1">
              {stats.npcsCount} {stats.npcsCount === 1 ? "NPC" : "NPCs"} • {stats.assignedNpcsCount} asignados •{" "}
              {stats.unassignedNpcsCount} sin asignar
            </p>
          </div>
          <div className="flex gap-2">
            {npcsWithAssignments.length > 0 && (
              <Button 
                variant="outline" 
                onClick={() => router.push(`/campaigns/${campaignId}/npcs`)}
              >
                Ver todos
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            )}
            {isOwner && (
              <Button onClick={() => router.push(`/campaigns/${campaignId}/npcs/new`)}>
                <Plus className="w-4 h-4 mr-2" />
                {t.marketplace?.npcs?.createNpc || "Crear NPC"}
              </Button>
            )}
          </div>
        </div>

        {/* Búsqueda y filtros de NPCs */}
        {npcsWithAssignments.length > 0 && (
          <div className="flex gap-2 flex-wrap">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
              <Input
                placeholder="Buscar NPCs..."
                value={npcSearchQuery}
                onChange={(e) => setNpcSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={npcFilter} onValueChange={(value) => setNpcFilter(value as NpcFilter)}>
              <SelectTrigger className="w-[180px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                <SelectItem value="assigned">
                  {t.marketplace?.npcs?.assigned || "Asignados"}
                </SelectItem>
                <SelectItem value="unassigned">
                  {t.marketplace?.npcs?.unassigned || "Sin asignar"}
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
        )}

        {filteredNpcs.length === 0 ? (
          <EmptyState
            icon={Users}
            title={
              npcsWithAssignments.length === 0
                ? t.marketplace?.npcs?.noNpcs || "No hay NPCs"
                : "No se encontraron NPCs"
            }
            description={
              npcsWithAssignments.length === 0
                ? "No hay NPCs creados aún."
                : "Intenta con otro término de búsqueda o filtro."
            }
          >
            {isOwner && npcsWithAssignments.length === 0 && (
              <Button onClick={() => router.push(`/campaigns/${campaignId}/npcs/new`)} className="mt-4">
                <Plus className="w-4 h-4 mr-2" />
                {t.marketplace?.npcs?.createNpc || "Crear Primer NPC"}
              </Button>
            )}
          </EmptyState>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {filteredNpcs.map((item) => (
              <NpcCardEnhanced
                key={item.npc.id}
                npc={item.npc}
                shops={item.shops}
                dungeonRooms={item.dungeonRooms}
                showAssignments={true}
                onClick={() => router.push(`/campaigns/${campaignId}/npcs/${item.npc.id}`)}
                campaignId={campaignId}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

