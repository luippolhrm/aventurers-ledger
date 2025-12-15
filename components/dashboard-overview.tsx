"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { type Language, translations } from "@/lib/translations"
import { createBrowserClient } from "@/lib/supabase/client"
import { useAuth } from "@/lib/auth-context"
import { Sword, Crown, Users, ArrowRight } from "lucide-react"
import { AdventurerCard } from "./adventurer-card"

interface DashboardOverviewProps {
  language: Language
  onNavigate: (module: string) => void
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
  member_count?: number
}

export function DashboardOverview({ language, onNavigate }: DashboardOverviewProps) {
  const t = translations[language]
  const { user } = useAuth()
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
  }, [user])

  const loadData = async () => {
    if (!user) return

    try {
      const supabase = createBrowserClient()

      // Load characters with wealth
      const { data: chars } = await supabase
        .from("characters")
        .select("id, name, race, wallets(total_wealth)")
        .eq("user_id", user.id)
        .order("name", { ascending: true })

      if (chars) {
        const charsWithWealth = chars.map((char: any) => ({
          id: char.id,
          name: char.name,
          race: char.race,
          total_wealth: char.wallets?.[0]?.total_wealth || 0,
        }))
        setCharactersWithWealth(charsWithWealth)
      }

      // Load campaigns where user is member
      const { data: memberData } = await supabase
        .from("campaign_members")
        .select("campaign_id, role")
        .eq("user_id", user.id)

      if (memberData && memberData.length > 0) {
        const campaignIds = memberData.map((m) => m.campaign_id)
        const { data: campaignsData } = await supabase
          .from("campaigns")
          .select("*")
          .in("id", campaignIds)
          .order("created_at", { ascending: false })

        if (campaignsData) {
          const campaignsWithRole = campaignsData.map((campaign) => ({
            ...campaign,
            role: memberData.find((m) => m.campaign_id === campaign.id)?.role || "player",
          }))

          setCampaignsAsGM(campaignsWithRole.filter((c) => c.role === "game_master"))
          setCampaignsAsPlayer(campaignsWithRole.filter((c) => c.role === "player"))
        }
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
                  onSelect={() => onNavigate("character-profile")}
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
                        Player
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
