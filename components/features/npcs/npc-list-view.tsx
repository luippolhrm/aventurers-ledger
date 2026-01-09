"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { LoadingState } from "@/components/molecules/loading"
import { EmptyState } from "@/components/molecules/empty"
import { useAuth } from "@/lib/auth-context"
import { useServices } from "@/hooks/use-services"
import { useLanguage } from "@/lib/language-context"
import { useToast } from "@/hooks/use-toast"
import type { Npc } from "@/lib/infrastructure/repositories/npc-repository"
import { Users, Plus, Search, ArrowLeft } from "lucide-react"
import { NpcCard } from "@/components/molecules/world/npc-card"

interface NpcListViewProps {
  campaignId: string
}

export function NpcListView({ campaignId }: NpcListViewProps) {
  const { t } = useLanguage()
  const router = useRouter()
  const { user } = useAuth()
  const services = useServices()
  const { toast } = useToast()

  const [npcs, setNpcs] = useState<Npc[]>([])
  const [filteredNpcs, setFilteredNpcs] = useState<Npc[]>([])
  const [searchQuery, setSearchQuery] = useState("")
  const [loading, setLoading] = useState(true)
  const [isOwner, setIsOwner] = useState(false)

  useEffect(() => {
    if (user && campaignId) {
      loadData()
    }
  }, [user, campaignId])

  useEffect(() => {
    if (searchQuery.trim() === "") {
      setFilteredNpcs(npcs)
    } else {
      const query = searchQuery.toLowerCase()
      setFilteredNpcs(
        npcs.filter(
          (npc) =>
            npc.name.toLowerCase().includes(query) ||
            npc.title?.toLowerCase().includes(query) ||
            npc.story?.toLowerCase().includes(query)
        )
      )
    }
  }, [searchQuery, npcs])

  const loadData = async () => {
    if (!user || !campaignId) return

    setLoading(true)
    try {
      const [campaign, npcsData] = await Promise.all([
        services.campaign.getCampaign(campaignId),
        services.npc.getNpcsByCampaign(campaignId),
      ])

      setIsOwner(campaign.game_master_id === user.id)
      setNpcs(npcsData)
      setFilteredNpcs(npcsData)
    } catch (error: any) {
      console.error("[v0] NpcListView: Error loading data:", error)
      toast({
        title: t.inventory?.error || "Error",
        description: error?.message || "Error al cargar NPCs",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return <LoadingState message="Cargando NPCs..." />
  }

  return (
    <div className="space-y-4">
      <Button
        variant="ghost"
        size="sm"
        onClick={() => router.push(`/campaigns/${campaignId}?tab=map`)}
        className="text-sm"
      >
        <ArrowLeft className="w-4 h-4 mr-2" />
        Volver a Mapa y NPCs
      </Button>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <div className="space-y-1 flex-1 min-w-0">
              <CardTitle className="flex items-center gap-2">
                <Users className="w-6 h-6" />
                {t.marketplace?.npcs?.title || "NPCs"} ({npcs.length})
              </CardTitle>
              <CardDescription>
                {t.marketplace?.npcs?.description || "Gestiona los personajes no jugadores de la campaña"}
              </CardDescription>
            </div>
            {isOwner && (
              <Button
                onClick={() => router.push(`/campaigns/${campaignId}/npcs/new`)}
                className="shrink-0"
              >
                <Plus className="w-4 h-4 mr-2" />
                <span className="hidden sm:inline">{t.marketplace?.npcs?.createNpc || "Crear NPC"}</span>
                <span className="sm:hidden">Crear</span>
              </Button>
            )}
          </div>
        </CardHeader>
        <Separator />
        <CardContent className="pt-6 space-y-4">
          {npcs.length > 0 && (
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
              <Input
                placeholder="Buscar NPCs..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
          )}

          {filteredNpcs.length === 0 ? (
            <EmptyState
              icon={Users}
              title={npcs.length === 0 ? (t.marketplace?.npcs?.noNpcs || "No hay NPCs") : "No se encontraron NPCs"}
              description={
                npcs.length === 0
                  ? `No hay NPCs creados aún. ${isOwner ? 'Crea el primer NPC para comenzar.' : ''}`
                  : "Intenta con otro término de búsqueda."
              }
            >
              {isOwner && npcs.length === 0 && (
                <Button onClick={() => router.push(`/campaigns/${campaignId}/npcs/new`)} className="mt-4">
                  <Plus className="w-4 h-4 mr-2" />
                  {t.marketplace?.npcs?.createFirstNpc || "Crear Primer NPC"}
                </Button>
              )}
            </EmptyState>
          ) : (
            <div className="grid gap-4 sm:grid-cols-1 md:grid-cols-2 xl:grid-cols-3">
              {filteredNpcs.map((npc) => (
                <NpcCard
                  key={npc.id}
                  npc={npc}
                  onClick={() => router.push(`/campaigns/${campaignId}/npcs/${npc.id}`)}
                />
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

