"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { type Language, translations } from "@/lib/translations"
import { useAuth } from "@/lib/auth-context"
import { Sword, Crown, Users, ArrowRight, User } from "lucide-react"
import { useServices } from "@/hooks/use-services"
import { LoadingState } from "@/components/molecules/loading"
import type { CharacterWithCampaign } from "@/lib/infrastructure/repositories/character-repository"

interface DashboardOverviewProps {
  language: Language
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
  const t = translations[language]
  const { user } = useAuth()
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

  if (loading) {
    return (
      <div className="w-full max-w-7xl mx-auto p-4 md:p-6">
        <LoadingState message={(t.welcome as any)?.loading || "Loading dashboard..."} />
      </div>
    )
  }

  return (
    <div className="w-full max-w-7xl mx-auto space-y-4 md:space-y-6">
      {/* Characters and Campaigns Summary - Side by Side */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
        {/* Characters Section */}
        <Card className="border-2 shadow-sm">
          <CardHeader className="p-4 md:p-6">
            <div className="flex items-center gap-2 md:gap-3">
              <div className="w-10 h-10 md:w-12 md:h-12 rounded-full bg-primary/10 flex items-center justify-center">
                <User className="w-5 h-5 md:w-6 md:h-6 text-primary" />
              </div>
              <div>
                <CardTitle className="text-lg md:text-xl">{t.sidebar.characters}</CardTitle>
                <CardDescription className="text-xs md:text-sm">
                  {assignedCharacters.length + freeCharacters.length} personaje{(assignedCharacters.length + freeCharacters.length) !== 1 ? "s" : ""} en total
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-3 md:space-y-4 p-4 md:p-6">
          {/* Assigned Characters */}
          {assignedCharacters.length > 0 && (
            <div>
              <h3 className="text-sm font-semibold mb-2 text-muted-foreground">
                Personajes Asignados ({assignedCharacters.length})
              </h3>
              <div className="space-y-2">
                {assignedCharacters.slice(0, 3).map((character) => (
                  <div
                    key={character.id}
                    className="p-3 bg-muted rounded-lg border"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">{character.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {character.race}
                          {character.class && ` • ${character.class}`}
                          {character.level && ` • Nivel ${character.level}`}
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">
                          En: {character.campaignName}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
                {assignedCharacters.length > 3 && (
                  <p className="text-xs text-muted-foreground text-center">
                    +{assignedCharacters.length - 3} más
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Free Characters */}
          {freeCharacters.length > 0 && (
            <div>
              <h3 className="text-sm font-semibold mb-2">
                Personajes Libres ({freeCharacters.length})
              </h3>
              <div className="space-y-2">
                {freeCharacters.slice(0, 3).map((character) => (
                  <div
                    key={character.id}
                    className="p-3 bg-green-50 dark:bg-green-950 rounded-lg border border-green-200 dark:border-green-800"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">{character.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {character.race}
                          {character.class && ` • ${character.class}`}
                          {character.level && ` • Nivel ${character.level}`}
                        </p>
                      </div>
                      <span className="text-xs font-medium bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-100 px-2 py-1 rounded">
                        Disponible
                      </span>
                    </div>
                  </div>
                ))}
                {freeCharacters.length > 3 && (
                  <p className="text-xs text-muted-foreground text-center">
                    +{freeCharacters.length - 3} más
                  </p>
                )}
              </div>
            </div>
          )}

          {assignedCharacters.length === 0 && freeCharacters.length === 0 && (
            <Alert>
              <AlertDescription className="flex flex-col gap-3">
                <span>No tienes personajes creados</span>
                <Button
                  variant="outline"
                  className="w-full gap-2"
                  onClick={() => onNavigate("characters")}
                >
                  Crear Primer Personaje
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
            {t.character.manageAdventurers || "Gestionar Personajes"}
            <ArrowRight className="w-4 h-4" />
          </Button>
        </CardContent>
      </Card>

        {/* Campaigns Created Summary */}
        <Card className="border-2 border-purple-200 dark:border-purple-800 shadow-sm">
          <CardHeader className="p-4 md:p-6">
            <div className="flex items-center gap-2 md:gap-3">
              <div className="w-10 h-10 md:w-12 md:h-12 rounded-full bg-purple-100 dark:bg-purple-900 flex items-center justify-center">
                <Crown className="w-5 h-5 md:w-6 md:h-6 text-purple-600 dark:text-purple-400" />
              </div>
              <div>
                <CardTitle className="text-lg md:text-xl">Campañas Creadas</CardTitle>
                <CardDescription className="text-xs md:text-sm">
                  {campaignsAsGM.length} campaña{campaignsAsGM.length !== 1 ? "s" : ""} como Game Master
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-3 md:space-y-4 p-4 md:p-6">
            {campaignsAsGM.length > 0 ? (
              <div className="space-y-2">
                {campaignsAsGM.slice(0, 3).map((campaign) => (
                  <div
                    key={campaign.id}
                    className="p-3 bg-purple-50 dark:bg-purple-950 rounded-lg border border-purple-200 dark:border-purple-800 hover:border-purple-400 dark:hover:border-purple-600 transition-colors cursor-pointer"
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
                {campaignsAsGM.length > 3 && (
                  <p className="text-xs text-muted-foreground text-center">
                    +{campaignsAsGM.length - 3} más
                  </p>
                )}
                {/* Botón solo cuando hay campañas */}
                <Button variant="outline" className="w-full gap-2 bg-transparent" onClick={() => onNavigate("campaigns")}>
                  Gestionar Campañas
                  <ArrowRight className="w-4 h-4" />
                </Button>
              </div>
            ) : (
              <Alert>
                <AlertDescription className="flex flex-col gap-3">
                  <span>No has creado ninguna campaña</span>
                  <Button
                    variant="outline"
                    className="w-full gap-2"
                    onClick={() => onNavigate("campaigns")}
                  >
                    Crear Primera Campaña
                    <ArrowRight className="w-4 h-4" />
                  </Button>
                </AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Campaigns Section - Modo Jugador */}
      <div className="space-y-4 md:space-y-6">

        {/* Modo Jugador Section */}
        {campaignsAsPlayer.length > 0 && (
          <Card className="border-2 border-blue-200 dark:border-blue-800 shadow-sm">
            <CardHeader className="p-4 md:p-6">
              <div className="flex items-center gap-2 md:gap-3">
                <div className="w-10 h-10 md:w-12 md:h-12 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center">
                  <Sword className="w-5 h-5 md:w-6 md:h-6 text-blue-600 dark:text-blue-400" />
                </div>
                <div>
                  <CardTitle className="text-lg md:text-xl">Modo Jugador</CardTitle>
                  <CardDescription className="text-xs md:text-sm">
                    {campaignsAsPlayer.length} campaña{campaignsAsPlayer.length !== 1 ? "s" : ""} como Jugador
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-3 md:space-y-4 p-4 md:p-6">
              <div className="space-y-2">
                {campaignsAsPlayer.slice(0, 3).map((campaign) => (
                  <div
                    key={campaign.id}
                    className="p-4 bg-blue-50 dark:bg-blue-950 rounded-lg border border-blue-200 dark:border-blue-800 hover:border-blue-400 dark:hover:border-blue-600 transition-colors cursor-pointer"
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
                {campaignsAsPlayer.length > 3 && (
                  <p className="text-xs text-muted-foreground text-center">
                    +{campaignsAsPlayer.length - 3} más
                  </p>
                )}
              </div>
              <Button variant="outline" className="w-full gap-2 bg-transparent" onClick={() => onNavigate("campaigns")}>
                Ver Campañas como Jugador
                <ArrowRight className="w-4 h-4" />
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
