"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { type Language, translations } from "@/lib/translations"
import { createBrowserClient } from "@/lib/supabase/client"
import { useAuth } from "@/lib/auth-context"
import { useActiveCharacter } from "@/lib/active-character-context"
import { Sword, Crown, Users, ArrowRight, Coins } from "lucide-react"
import { getCharacterAvatar } from "@/lib/character-utils"
import Image from "next/image"

interface DashboardOverviewProps {
  language: Language
  onNavigate: (module: string) => void
}

interface WalletData {
  platinum: number
  gold: number
  electrum: number
  silver: number
  copper: number
  total_wealth: number
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
  gm_name?: string // Nombre del Game Master
}

export function DashboardOverview({ language, onNavigate }: DashboardOverviewProps) {
  const t = translations[language]
  const { user } = useAuth()
  const { activeCharacterId, activeCharacter } = useActiveCharacter()
  const [wallet, setWallet] = useState<WalletData | null>(null)
  const [campaignsAsGM, setCampaignsAsGM] = useState<Campaign[]>([])
  const [campaignsAsPlayer, setCampaignsAsPlayer] = useState<Campaign[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (user) {
      loadData()
    } else {
      setLoading(false)
    }
  }, [user, activeCharacterId, activeCharacter])

  const loadData = async () => {
    if (!user) return

    try {
      const supabase = createBrowserClient()

      // Load wallet for active character only
      if (activeCharacterId && activeCharacter) {
        const { data: walletData, error: walletError } = await supabase
          .from("wallets")
          .select("platinum, gold, electrum, silver, copper, total_wealth")
          .eq("character_id", activeCharacterId)
          .maybeSingle()

        if (walletError) {
          console.error("[v0] Dashboard - Error loading wallet:", walletError)
          setWallet(null)
        } else if (walletData) {
          setWallet({
            platinum: walletData.platinum || 0,
            gold: walletData.gold || 0,
            electrum: walletData.electrum || 0,
            silver: walletData.silver || 0,
            copper: walletData.copper || 0,
            total_wealth: Number.parseFloat(walletData.total_wealth?.toString() || "0") || 0,
          })
        } else {
          // Wallet doesn't exist, set to zero
          setWallet({
            platinum: 0,
            gold: 0,
            electrum: 0,
            silver: 0,
            copper: 0,
            total_wealth: 0,
          })
        }
      } else {
        setWallet(null)
      }

      // Load campaigns where character is player
      // Esta es una vista de panel de personaje, solo muestra campañas donde el personaje es jugador
      // NO muestra campañas como GM porque el GM es el usuario, no el personaje
      let playerMemberData: Array<{ campaign_id: string; role: string; character_id: string | null }> = []

      if (activeCharacterId) {
        // Solo cargar campañas donde el personaje activo es player
        // NO mostrar campañas como GM porque el GM es el usuario, no el personaje
        const { data: playerMembers, error: playerError } = await supabase
          .from("campaign_members")
          .select("campaign_id, role, character_id")
          .eq("user_id", user.id)
          .eq("character_id", activeCharacterId)
          .eq("role", "player")

        if (playerError) {
          console.error("[v0] Dashboard - Error loading Player campaigns:", playerError)
        } else {
          playerMemberData = playerMembers || []
        }
      } else {
        // Sin personaje activo: no mostrar campañas en esta vista
        setCampaignsAsGM([])
        setCampaignsAsPlayer([])
        return
      }

      // Obtener IDs únicos de las campañas donde el personaje es player
      const campaignIds = [...new Set(playerMemberData.map((m) => m.campaign_id))]

      if (campaignIds.length > 0) {
        const { data: campaignsData, error: campaignsError } = await supabase
          .from("campaigns")
          .select("*")
          .in("id", campaignIds)
          .order("created_at", { ascending: false })

        if (campaignsError) {
          console.error("[v0] Dashboard - Error loading campaigns data:", campaignsError)
          setCampaignsAsGM([])
          setCampaignsAsPlayer([])
        } else if (campaignsData) {
          // Obtener IDs únicos de los Game Masters
          const gmIds = [...new Set(campaignsData.map((c: any) => c.game_master_id))]

          // Obtener nombres de los Game Masters desde profiles
          let gmProfiles: Array<{ id: string; display_name: string | null }> = []
          if (gmIds.length > 0) {
            const { data: profilesData, error: profilesError } = await supabase
              .from("profiles")
              .select("id, display_name")
              .in("id", gmIds)

            if (profilesError) {
              console.warn("[v0] Dashboard - Could not load GM profiles:", profilesError)
            } else if (profilesData) {
              gmProfiles = profilesData
            }
          }

          // Solo agregar campañas como Player (no hay GM en esta vista)
          const playerCampaigns: Campaign[] = campaignsData.map((campaign: Campaign & { id: string }) => {
            const playerMember = playerMemberData.find(
              (m) => m.campaign_id === campaign.id && m.character_id === activeCharacterId
            )

            // Buscar el nombre del GM
            const gmProfile = gmProfiles.find((p) => p.id === campaign.game_master_id)
            const gmName = gmProfile?.display_name || "Game Master"

            return {
              ...campaign,
              role: "player",
              is_gm: false,
              is_player: true,
              character_id: playerMember?.character_id || null,
              gm_name: gmName,
            }
          })

          setCampaignsAsGM([]) // No hay campañas como GM en esta vista
          setCampaignsAsPlayer(playerCampaigns)
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

      {/* Active Character Section */}
      <Card className="border-2">
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
              <Sword className="w-6 h-6 text-primary" />
            </div>
            <div>
              <CardTitle>{t.sidebar.character}</CardTitle>
              <CardDescription>
                {activeCharacter ? activeCharacter.name : t.characterSelector.selectCharacter}
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {activeCharacter ? (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {/* Character Info */}
              <div className="p-4 bg-gradient-to-br from-amber-50 to-yellow-50 dark:from-amber-950 dark:to-yellow-900 border-2 border-amber-200 dark:border-amber-800 rounded-lg">
                <div className="space-y-3">
                  <div className="flex items-center gap-4">
                    <div className="relative w-20 h-20 rounded-full overflow-hidden bg-muted border-2 border-amber-300 dark:border-amber-700 flex-shrink-0">
                      <Image
                        src={getCharacterAvatar(activeCharacter)}
                        alt={activeCharacter.name}
                        fill
                        className="object-cover"
                        unoptimized
                      />
                    </div>
                    <div className="flex-1">
                      <h3 className="text-2xl font-bold text-amber-900 dark:text-amber-50">{activeCharacter.name}</h3>
                      <div className="flex items-center gap-2 mt-1 flex-wrap">
                        <p className="text-sm text-amber-700 dark:text-amber-200 font-serif italic">
                          {activeCharacter.race || "Unknown"}
                        </p>
                        {activeCharacter.level && (
                          <>
                            <span className="text-amber-600 dark:text-amber-400">•</span>
                            <p className="text-sm text-amber-700 dark:text-amber-200">Level {activeCharacter.level}</p>
                          </>
                        )}
                        {activeCharacter.class && (
                          <>
                            <span className="text-amber-600 dark:text-amber-400">•</span>
                            <p className="text-sm text-amber-700 dark:text-amber-200">{activeCharacter.class}</p>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Wallet Info */}
              {wallet && (
                <div className="p-4 bg-muted rounded-lg border">
                  <div className="flex items-center gap-2 mb-3">
                    <Coins className="w-4 h-4 text-amber-600" />
                    <h3 className="font-semibold">{t.wallet?.title || "Wallet"}</h3>
                  </div>
                  <div className="grid grid-cols-5 gap-2">
                    <div className="text-center">
                      <p className="text-xl font-bold">{wallet.platinum}</p>
                      <p className="text-xs text-muted-foreground">PP</p>
                    </div>
                    <div className="text-center">
                      <p className="text-xl font-bold">{wallet.gold}</p>
                      <p className="text-xs text-muted-foreground">GP</p>
                    </div>
                    <div className="text-center">
                      <p className="text-xl font-bold">{wallet.electrum}</p>
                      <p className="text-xs text-muted-foreground">EP</p>
                    </div>
                    <div className="text-center">
                      <p className="text-xl font-bold">{wallet.silver}</p>
                      <p className="text-xs text-muted-foreground">SP</p>
                    </div>
                    <div className="text-center">
                      <p className="text-xl font-bold">{wallet.copper}</p>
                      <p className="text-xs text-muted-foreground">CP</p>
                    </div>
                  </div>
                  <div className="mt-3 pt-3 border-t text-center">
                    <p className="text-sm text-muted-foreground">{t.wallet?.totalWealth || "Total Wealth"}</p>
                    <p className="text-lg font-bold">{wallet.total_wealth.toFixed(2)} GP</p>
                  </div>
                </div>
              )}

              {/* Button - Full width on mobile, but in grid on desktop */}
              <div className="lg:col-span-2">
                <Button
                  variant="outline"
                  className="w-full gap-2 bg-transparent"
                  onClick={() => onNavigate("characters")}
                >
                  {t.character.manageAdventurers || "Manage Characters"}
                  <ArrowRight className="w-4 h-4" />
                </Button>
              </div>
            </div>
          ) : (
            <Alert>
              <AlertDescription className="flex flex-col gap-3">
                <span>{t.welcome.noCharacter || "No active character selected"}</span>
                <Button
                  variant="outline"
                  className="w-full gap-2"
                  onClick={() => onNavigate("characters")}
                >
                  {t.characterSelector.manageCharacters || "Select a Character"}
                  <ArrowRight className="w-4 h-4" />
                </Button>
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      {/* Campaigns Section - Solo como Player (vista de panel de personaje) */}
      {activeCharacter && (
        <Card className="border-2">
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-accent/10 flex items-center justify-center">
                <Users className="w-6 h-6 text-accent" />
              </div>
              <div>
                <CardTitle>{t.sidebar.campaigns}</CardTitle>
                <CardDescription>
                  {campaignsAsPlayer.length} campaign{campaignsAsPlayer.length !== 1 ? "s" : ""} as Player
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Campaigns as Player */}
            <div>
              <div className="flex items-center gap-2 mb-3">
                <Sword className="w-4 h-4 text-blue-600" />
                <h3 className="font-semibold">{"Campaigns as Player"}</h3>
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
                          Player
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground p-3 bg-muted rounded-lg">
                  {"No campaigns as Player"}
                </p>
              )}
            </div>

            <Button variant="outline" className="w-full gap-2 bg-transparent" onClick={() => onNavigate("campaigns")}>
              {t.sidebar.campaigns}
              <ArrowRight className="w-4 h-4" />
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
