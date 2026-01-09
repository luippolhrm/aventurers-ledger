"use client"

import { useEffect, useState, useMemo } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { useLanguage } from "@/lib/language-context"
import { useAuth } from "@/lib/auth-context"
import { Sword, Crown, Users, ArrowRight, User, Package, Map } from "lucide-react"
import { useServices } from "@/hooks/use-services"
import { LoadingState } from "@/components/molecules/loading"
import type { CharacterWithCampaign } from "@/lib/infrastructure/repositories/character-repository"

interface DashboardOverviewProps {
  language?: "es" // Mantener por compatibilidad, pero ya no se usa
  onNavigate: (module: string) => void
}

type CampaignForDashboard = {
  id: string
  name: string
  description: string | null
  game_master_id: string
  status: string
  role: string
  character_id?: string | null
  is_gm?: boolean
  is_player?: boolean
  member_count?: number
  gm_name?: string
}

export function DashboardOverview({ language, onNavigate }: DashboardOverviewProps) {
  const { t } = useLanguage()
  const { user } = useAuth()
  const router = useRouter()
  const [campaignsAsGM, setCampaignsAsGM] = useState<CampaignForDashboard[]>([])
  const [campaignsAsPlayer, setCampaignsAsPlayer] = useState<CampaignForDashboard[]>([])
  const [assignedCharacters, setAssignedCharacters] = useState<CharacterWithCampaign[]>([])
  const [freeCharacters, setFreeCharacters] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  const services = useServices()

  useEffect(() => {
    if (user) {
      loadData()
    } else {
      setLoading(false)
    }
  }, [user])

  const loadData = async () => {
    if (!user) return

    setLoading(true)
    try {
      // Obtener campañas donde el usuario es GM directamente
      const gmCampaignsData = await services.campaign.getCampaignsAsGM(user.id)
      
      const gmCampaigns: CampaignForDashboard[] = gmCampaignsData.map((c) => ({
        ...c,
        role: "game_master",
        is_gm: true,
        is_player: false,
        character_id: null,
      }))

      // Para player: obtener todas las campañas del usuario y filtrar las que son player
      const userCampaigns = await services.campaign.getUserCampaigns(user.id)
      const allMembers = await services.campaign.getUserMembers(user.id)
      
      const playerMemberCampaignIds = allMembers
        .filter((m) => m.role === "player")
        .map((m) => m.campaign_id)

      const playerCampaigns: CampaignForDashboard[] = userCampaigns
        .filter((c) => 
          playerMemberCampaignIds.includes(c.id) && 
          c.game_master_id !== user.id // No incluir si también es GM
        )
        .map((c) => {
          const member = allMembers.find((m) => m.campaign_id === c.id && m.role === "player")
          return {
            ...c,
            role: "player",
            is_gm: false,
            is_player: true,
            character_id: member?.character_id || null,
          }
        })

      setCampaignsAsGM(gmCampaigns)
      setCampaignsAsPlayer(playerCampaigns)

      // Load characters by status
      const charactersStatus = await services.character.getCharactersByStatus(user.id)
      setAssignedCharacters(charactersStatus.assigned)
      setFreeCharacters(charactersStatus.free)
    } catch (error) {
      console.error("[v0] Error loading dashboard data:", error)
    } finally {
      setLoading(false)
    }
  }

  // Helper para pluralización
  const pluralize = (count: number) => count !== 1 ? "s" : ""

  // Lógica para obtener los primeros 2 aventureros (priorizando asignados)
  const displayedCharacters = useMemo(() => {
    const result: Array<CharacterWithCampaign | any> = []
    
    // Priorizar aventureros asignados
    if (assignedCharacters.length > 0) {
      result.push(...assignedCharacters.slice(0, 2))
    }
    
    // Si no hay suficientes asignados, completar con disponibles
    if (result.length < 2 && freeCharacters.length > 0) {
      const needed = 2 - result.length
      result.push(...freeCharacters.slice(0, needed))
    }
    
    return result
  }, [assignedCharacters, freeCharacters])

  // Calcular cuántos más hay
  const remainingCharacters = useMemo(() => {
    const displayedCount = displayedCharacters.length
    const totalCount = assignedCharacters.length + freeCharacters.length
    return totalCount > displayedCount ? totalCount - displayedCount : 0
  }, [displayedCharacters, assignedCharacters, freeCharacters])

  if (loading) {
    return (
      <div className="w-full max-w-7xl mx-auto p-4 md:p-6">
        <LoadingState message={(t.welcome as any)?.loading || "Loading dashboard..."} />
      </div>
    )
  }

  const totalAdventurers = assignedCharacters.length + freeCharacters.length
  const adventurersText = t.welcome.adventurersTotal
    .replace("{{count}}", totalAdventurers.toString())
    .replace("{{plural}}", pluralize(totalAdventurers))

  const campaignsGMText = t.welcome.campaignsAsGM
    .replace("{{count}}", campaignsAsGM.length.toString())
    .replace("{{plural}}", pluralize(campaignsAsGM.length))

  const campaignsPlayerText = t.welcome.campaignsAsPlayer
    .replace("{{count}}", campaignsAsPlayer.length.toString())
    .replace("{{plural}}", pluralize(campaignsAsPlayer.length))

  return (
    <div className="w-full max-w-7xl mx-auto space-y-4">
      {/* Welcome Section */}
      <div className="mb-6 md:mb-8">
        <h1 className="text-2xl md:text-3xl font-bold mb-2">
          {user?.user_metadata?.full_name 
            ? `¡Bienvenido, ${user.user_metadata.full_name}!`
            : t.welcome.welcomeMessage}
        </h1>
        <p className="text-sm md:text-base text-muted-foreground max-w-3xl">
          {t.welcome.welcomeDescription}
        </p>
      </div>

      {/* What You Can Do Section */}
      <div className="mb-6 md:mb-8">
        <h2 className="text-lg md:text-xl font-semibold mb-4">{t.welcome.whatYouCanDo}</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/50 border">
            <User className="w-5 h-5 text-primary mt-0.5 shrink-0" />
            <div>
              <p className="text-sm font-medium mb-1">Aventureros</p>
              <p className="text-xs text-muted-foreground">{t.welcome.createAdventurers}</p>
            </div>
          </div>
          <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/50 border">
            <Crown className="w-5 h-5 text-purple-600 dark:text-purple-400 mt-0.5 shrink-0" />
            <div>
              <p className="text-sm font-medium mb-1">Campañas</p>
              <p className="text-xs text-muted-foreground">{t.welcome.createCampaigns}</p>
            </div>
          </div>
          <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/50 border">
            <Users className="w-5 h-5 text-blue-600 dark:text-blue-400 mt-0.5 shrink-0" />
            <div>
              <p className="text-sm font-medium mb-1">Unirse</p>
              <p className="text-xs text-muted-foreground">{t.welcome.joinCampaigns}</p>
            </div>
          </div>
          <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/50 border">
            <Package className="w-5 h-5 text-green-600 dark:text-green-400 mt-0.5 shrink-0" />
            <div>
              <p className="text-sm font-medium mb-1">Recursos</p>
              <p className="text-xs text-muted-foreground">{t.welcome.manageResources}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Characters and Campaigns Summary - Side by Side */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Characters Section */}
        <Card className="border shadow-sm">
          <CardHeader className="p-3 md:p-4 pb-0">
            <div className="flex items-center gap-2 md:gap-3">
              <div className="w-8 h-8 md:w-10 md:h-10 rounded-full bg-primary/10 flex items-center justify-center">
                <User className="w-4 h-4 md:w-5 md:h-5 text-primary" />
              </div>
              <div>
                <CardTitle className="text-base md:text-lg">{t.sidebar.characters}</CardTitle>
                <CardDescription className="text-xs md:text-sm">
                  {adventurersText}
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-2 px-3 md:px-4 pb-2 md:pb-3 pt-0">
          {/* All Characters - Combined List */}
          {(assignedCharacters.length > 0 || freeCharacters.length > 0) ? (
            <div className="space-y-2">
              {displayedCharacters.map((character) => {
                const isAssigned = assignedCharacters.some(c => c.id === character.id)
                return (
                  <div
                    key={character.id}
                    className={`p-2.5 rounded-lg border transition-colors cursor-pointer min-h-[80px] ${
                      isAssigned 
                        ? "bg-muted/50 border-muted-foreground/20 hover:bg-muted hover:border-muted-foreground/30" 
                        : "bg-green-50 dark:bg-green-950 border-green-200 dark:border-green-800 hover:border-green-400 dark:hover:border-green-600"
                    }`}
                    onClick={() => router.push(`/characters/${character.id}/sheet`)}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between">
                          <p className="font-medium">{character.name}</p>
                          {isAssigned && character.campaignName ? (
                            <Badge variant="secondary" className="text-xs ml-2 shrink-0">
                              Campaña: {character.campaignName}
                            </Badge>
                          ) : !isAssigned ? (
                            <Badge variant="outline" className="text-xs bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-100 border-green-300 dark:border-green-700 ml-2 shrink-0">
                              Disponible
                            </Badge>
                          ) : null}
                        </div>
                        <p className="text-xs text-muted-foreground">
                          {character.race}
                          {character.class && ` • ${character.class}`}
                          {character.level && ` • Nivel ${character.level}`}
                        </p>
                      </div>
                    </div>
                  </div>
                )
              })}
              
              {remainingCharacters > 0 && (
                <p className="text-xs text-muted-foreground text-center">
                  +{remainingCharacters} más
                </p>
              )}
            </div>
          ) : null}

          {assignedCharacters.length === 0 && freeCharacters.length === 0 && (
            <Alert>
              <AlertDescription className="flex flex-col gap-3">
                <span>{t.welcome.noAdventurers}</span>
                <Button
                  variant="outline"
                  className="w-full gap-2"
                  onClick={() => onNavigate("characters")}
                >
                  {t.welcome.createFirstAdventurer}
                  <ArrowRight className="w-4 h-4" />
                </Button>
              </AlertDescription>
            </Alert>
          )}

          <Button
            variant="outline"
            className="w-full gap-2 bg-transparent"
            onClick={() => onNavigate("characters")}
          >
            {t.welcome.manageAdventurers}
            <ArrowRight className="w-4 h-4" />
          </Button>
        </CardContent>
      </Card>

        {/* Campaigns Created Summary */}
        <Card className="border shadow-sm">
          <CardHeader className="p-3 md:p-4 pb-0">
            <div className="flex items-center gap-2 md:gap-3">
              <div className="w-8 h-8 md:w-10 md:h-10 rounded-full bg-purple-100 dark:bg-purple-900 flex items-center justify-center">
                <Crown className="w-4 h-4 md:w-5 md:h-5 text-purple-600 dark:text-purple-400" />
              </div>
              <div>
                <CardTitle className="text-base md:text-lg">{t.welcome.recentCampaigns}</CardTitle>
                <CardDescription className="text-xs md:text-sm">
                  {campaignsGMText}
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-2 px-3 md:px-4 pb-2 md:pb-3 pt-0">
            {campaignsAsGM.length > 0 ? (
              <div className="space-y-2">
                {campaignsAsGM.slice(0, 2).map((campaign) => (
                  <div
                    key={campaign.id}
                    className="p-2.5 bg-purple-50 dark:bg-purple-950 rounded-lg border border-purple-200 dark:border-purple-800 hover:border-purple-400 dark:hover:border-purple-600 transition-colors cursor-pointer min-h-[80px]"
                    onClick={() => onNavigate("campaigns")}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <p className="font-medium">{campaign.name}</p>
                        {campaign.description && (
                          <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{campaign.description}</p>
                        )}
                        {campaign.member_count !== undefined && (
                          <p className="text-xs text-muted-foreground mt-1">
                            {campaign.member_count} miembro{campaign.member_count !== 1 ? "s" : ""}
                          </p>
                        )}
                      </div>
                      <span className="text-xs font-medium bg-purple-100 dark:bg-purple-900 text-purple-800 dark:text-purple-100 px-2 py-1 rounded ml-2 flex items-center gap-1">
                        <Crown className="w-3 h-3" />
                        GM
                      </span>
                    </div>
                  </div>
                ))}
                {campaignsAsGM.length > 2 && (
                  <p className="text-xs text-muted-foreground text-center">
                    +{campaignsAsGM.length - 2} más
                  </p>
                )}
                {/* Botón solo cuando hay campañas */}
                <Button variant="outline" className="w-full gap-2 bg-transparent" onClick={() => onNavigate("campaigns")}>
                  {t.welcome.manageCampaigns}
                  <ArrowRight className="w-4 h-4" />
                </Button>
              </div>
            ) : (
              <Alert>
                <AlertDescription className="flex flex-col gap-3">
                  <span>{t.welcome.noCampaigns}</span>
                  <Button
                    variant="outline"
                    className="w-full gap-2"
                    onClick={() => onNavigate("campaigns")}
                  >
                    {t.welcome.createFirstCampaign}
                    <ArrowRight className="w-4 h-4" />
                  </Button>
                </AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Campaigns Section - Modo Jugador */}
      <div className="space-y-4">
        {/* Modo Jugador Section */}
        {campaignsAsPlayer.length > 0 && (
          <Card className="border shadow-sm">
            <CardHeader className="p-3 md:p-4">
              <div className="flex items-center gap-2 md:gap-3">
                <div className="w-8 h-8 md:w-10 md:h-10 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center">
                  <Sword className="w-4 h-4 md:w-5 md:h-5 text-blue-600 dark:text-blue-400" />
                </div>
                <div>
                  <CardTitle className="text-base md:text-lg">Modo Jugador</CardTitle>
                  <CardDescription className="text-xs md:text-sm">
                    {campaignsPlayerText}
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-2 px-3 md:px-4 pb-3 md:pb-4 pt-0">
              <div className="space-y-2">
                {campaignsAsPlayer.slice(0, 2).map((campaign) => (
                  <div
                    key={campaign.id}
                    className="p-2.5 bg-blue-50 dark:bg-blue-950 rounded-lg border border-blue-200 dark:border-blue-800 hover:border-blue-400 dark:hover:border-blue-600 transition-colors cursor-pointer"
                    onClick={() => onNavigate("campaigns")}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <p className="font-medium">{campaign.name}</p>
                        {campaign.description && (
                          <p className="text-sm text-muted-foreground mt-1 line-clamp-2">{campaign.description}</p>
                        )}
                        {campaign.gm_name && (
                          <p className="text-xs text-muted-foreground mt-2">
                            <span className="font-medium">GM:</span> {campaign.gm_name}
                          </p>
                        )}
                      </div>
                      <span className="text-xs font-medium bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-100 px-2 py-1 rounded ml-2">
                        Jugador
                      </span>
                    </div>
                  </div>
                ))}
                {campaignsAsPlayer.length > 2 && (
                  <p className="text-xs text-muted-foreground text-center">
                    +{campaignsAsPlayer.length - 2} más
                  </p>
                )}
              </div>
              <Button variant="outline" className="w-full gap-2 bg-transparent" onClick={() => onNavigate("campaigns")}>
                {t.welcome.viewAsPlayer}
                <ArrowRight className="w-4 h-4" />
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
