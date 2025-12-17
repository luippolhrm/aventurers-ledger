"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { type Language, translations } from "@/lib/translations"
import { createBrowserClient } from "@/lib/supabase/client"
import { useAuth } from "@/lib/auth-context"
import { useActiveCharacter } from "@/lib/active-character-context"
import { Sword, Crown, Users, ArrowRight } from "lucide-react"
import { AdventurerCard } from "./adventurer-card"

interface DashboardOverviewProps {
  language: Language
  onNavigate: (module: string) => void
}

interface CharacterFromDB {
  id: string
  name: string
  race: string | null
  archived: boolean | null
}

interface CharacterWithWealth {
  id: string
  name: string
  race: string
  total_wealth: number | null
}

interface Campaign {
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
}

export function DashboardOverview({ language, onNavigate }: DashboardOverviewProps) {
  const t = translations[language]
  const { user } = useAuth()
  const { activeCharacterId, activeCharacter } = useActiveCharacter()
  const [charactersWithWealth, setCharactersWithWealth] = useState<CharacterWithWealth[]>([])
  const [campaignsAsGM, setCampaignsAsGM] = useState<Campaign[]>([])
  const [campaignsAsPlayer, setCampaignsAsPlayer] = useState<Campaign[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (user) {
      loadData()
    } else {
      setLoading(false)
    }
  }, [user, activeCharacterId])

  const loadData = async () => {
    if (!user) return

    try {
      const supabase = createBrowserClient()

      // Load ONLY active (non-archived) characters
      const { data: chars, error: charsError } = await supabase
        .from("characters")
        .select("id, name, race")
        .eq("user_id", user.id)
        .eq("archived", false)
        .order("name", { ascending: true })

      if (charsError) {
        console.error("[v0] Dashboard - Error loading characters:", charsError)
      }

      if (chars && chars.length > 0) {
        // Load wallets for all characters
        const characterIds = chars.map((char: CharacterFromDB) => char.id)
        const { data: wallets, error: walletsError } = await supabase
          .from("wallets")
          .select("character_id, total_wealth")
          .in("character_id", characterIds)

        // Combinar personajes con sus billeteras
        const charsWithWealth: CharacterWithWealth[] = chars.map((char: CharacterFromDB) => {
          const wallet = wallets?.find((w: { character_id: string; total_wealth: number | null }) => w.character_id === char.id)
          return {
            id: char.id,
            name: char.name,
            race: char.race || "Unknown",
            total_wealth: wallet?.total_wealth ?? 0,
          }
        })
        
        setCharactersWithWealth(charsWithWealth)
      } else {
        // No characters found
        setCharactersWithWealth([])
      }

      // Load campaigns where user is member
      // Si hay personaje activo: mostrar campañas GM (sin filtrar) y campañas Player (filtrar por character_id)
      let allMemberData: Array<{ campaign_id: string; role: string; character_id: string | null }> = []

      if (activeCharacterId) {
        // 1. Obtener campañas donde el usuario es GM (sin filtrar por character_id)
        const { data: gmMembers } = await supabase
          .from("campaign_members")
          .select("campaign_id, role, character_id")
          .eq("user_id", user.id)
          .eq("role", "game_master")

        // 2. Obtener campañas donde el personaje activo es player
        const { data: playerMembers } = await supabase
          .from("campaign_members")
          .select("campaign_id, role, character_id")
          .eq("user_id", user.id)
          .eq("character_id", activeCharacterId)
          .eq("role", "player")

        // Combinar y deduplicar
        const memberMap = new Map<string, { campaign_id: string; role: string; character_id: string | null }>()
        
        // Primero agregar los players
        ;(playerMembers || []).forEach((m) => {
          memberMap.set(m.campaign_id, m)
        })
        
        // Luego agregar los GMs
        ;(gmMembers || []).forEach((m) => {
          const existing = memberMap.get(m.campaign_id)
          if (existing) {
            // Si ya existe como player, mantener ambos (priorizar GM para el rol principal)
            memberMap.set(m.campaign_id, { ...m, character_id: existing.character_id })
          } else {
            memberMap.set(m.campaign_id, m)
          }
        })

        allMemberData = Array.from(memberMap.values())
      } else {
        // Sin personaje activo: mostrar todas las campañas del usuario
        const { data } = await supabase
          .from("campaign_members")
          .select("campaign_id, role, character_id")
          .eq("user_id", user.id)
        allMemberData = data || []
      }

      if (allMemberData.length > 0) {
        const campaignIds = [...new Set(allMemberData.map((m) => m.campaign_id))]
        const { data: campaignsData } = await supabase
          .from("campaigns")
          .select("*")
          .in("id", campaignIds)
          .order("created_at", { ascending: false })

        if (campaignsData) {
          // Asignar el rol correcto basado en el memberData
          const campaignsWithRole = campaignsData.map((campaign) => {
            // Buscar si el usuario es GM de esta campaña
            const gmMember = allMemberData.find(
              (m) => m.campaign_id === campaign.id && m.role === "game_master"
            )
            
            // Buscar si el personaje activo es player de esta campaña
            const playerMember = activeCharacterId
              ? allMemberData.find(
                  (m) =>
                    m.campaign_id === campaign.id &&
                    m.role === "player" &&
                    m.character_id === activeCharacterId
                )
              : allMemberData.find(
                  (m) => m.campaign_id === campaign.id && m.role === "player"
                )

            return {
              ...campaign,
              role: gmMember ? "game_master" : playerMember?.role || "player",
              character_id: playerMember?.character_id || null,
              is_gm: !!gmMember,
              is_player: !!playerMember,
            }
          })

          setCampaignsAsGM(campaignsWithRole.filter((c) => c.is_gm))
          setCampaignsAsPlayer(campaignsWithRole.filter((c) => c.is_player && !c.is_gm))
        } else {
          setCampaignsAsGM([])
          setCampaignsAsPlayer([])
        }
      } else {
        setCampaignsAsGM([])
        setCampaignsAsPlayer([])
      }
    } catch (error) {
      console.error("[v0] Error loading dashboard data:", error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle>{t.welcome.title}</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">{t.welcome.loading}</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="w-full space-y-6">
      {/* Header */}
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent mb-2">
          {t.welcome.title}
        </h2>
        <p className="text-muted-foreground">{t.welcome.quickStats}</p>
      </div>

      {/* Characters Section */}
      <Card className="border-2">
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
              <Sword className="w-6 h-6 text-primary" />
            </div>
            <div>
              <CardTitle>{t.sidebar.character}</CardTitle>
              <CardDescription>
                {charactersWithWealth.length} character{charactersWithWealth.length !== 1 ? "s" : ""}
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {charactersWithWealth.length > 0 ? (
            <div className="space-y-3">
              {charactersWithWealth.map((char) => (
                <AdventurerCard
                  key={char.id}
                  name={char.name}
                  race={char.race || "Unknown"}
                  wealth={char.total_wealth || 0}
                  onSelect={() => onNavigate("characters")}
                />
              ))}
              <Button
                variant="outline"
                className="w-full gap-2 mt-4 bg-transparent"
                onClick={() => onNavigate("characters")}
              >
                {t.character.manageAdventurers}
                <ArrowRight className="w-4 h-4" />
              </Button>
            </div>
          ) : (
            <Alert>
              <AlertDescription>{t.welcome.noCharacter}</AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      {/* Campaigns Section */}
      <Card className="border-2">
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-accent/10 flex items-center justify-center">
              <Users className="w-6 h-6 text-accent" />
            </div>
            <div>
              <CardTitle>{t.sidebar.campaigns}</CardTitle>
              <CardDescription>
                {campaignsAsGM.length + campaignsAsPlayer.length} campaign
                {campaignsAsGM.length + campaignsAsPlayer.length !== 1 ? "s" : ""}
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Campaigns as DM */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <Crown className="w-4 h-4 text-amber-600" />
              <h3 className="font-semibold">{t.campaigns.campaignsAsGM || "Campaigns as Game Master"}</h3>
            </div>
            {campaignsAsGM.length > 0 ? (
              <div className="space-y-2">
                {campaignsAsGM.map((campaign) => (
                  <div
                    key={campaign.id}
                    className="p-4 bg-muted rounded-lg border hover:border-primary transition-colors cursor-pointer"
                    onClick={() => onNavigate("campaigns")}
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="font-medium">{campaign.name}</p>
                        {campaign.description && (
                          <p className="text-sm text-muted-foreground mt-1 line-clamp-2">{campaign.description}</p>
                        )}
                      </div>
                      <span className="text-xs font-medium bg-amber-100 dark:bg-amber-900 text-amber-800 dark:text-amber-100 px-2 py-1 rounded">
                        DM
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground p-3 bg-muted rounded-lg">
                {t.campaigns.noCampaigns || "No campaigns as Game Master"}
              </p>
            )}
          </div>

          {/* Campaigns as Player */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <Sword className="w-4 h-4 text-blue-600" />
              <h3 className="font-semibold">{t.campaigns.campaignsAsPlayer || "Campaigns as Player"}</h3>
            </div>
            {campaignsAsPlayer.length > 0 ? (
              <div className="space-y-2">
                {campaignsAsPlayer.map((campaign) => (
                  <div
                    key={campaign.id}
                    className="p-4 bg-muted rounded-lg border hover:border-primary transition-colors cursor-pointer"
                    onClick={() => onNavigate("campaigns")}
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="font-medium">{campaign.name}</p>
                        {campaign.description && (
                          <p className="text-sm text-muted-foreground mt-1 line-clamp-2">{campaign.description}</p>
                        )}
                      </div>
                      <span className="text-xs font-medium bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-100 px-2 py-1 rounded">
                        Player{campaign.character_id && activeCharacter?.id === campaign.character_id && activeCharacter?.name
                          ? ` (${activeCharacter.name})`
                          : ""}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground p-3 bg-muted rounded-lg">
                {t.campaigns.noCampaigns || "No campaigns as Player"}
              </p>
            )}
          </div>

          <Button variant="outline" className="w-full gap-2 bg-transparent" onClick={() => onNavigate("campaigns")}>
            {t.sidebar.campaigns}
            <ArrowRight className="w-4 h-4" />
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
