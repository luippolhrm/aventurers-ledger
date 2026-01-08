"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { WalletDisplay } from "@/components/molecules/wallet"
import { CharacterCard } from "@/components/molecules/character"
import { StatCard } from "@/components/molecules/item"
import { CampaignCard } from "@/components/molecules/campaign"
import { LoadingState } from "@/components/molecules/loading"
import { EmptyState } from "@/components/molecules/empty"
import { useServices } from "@/hooks/use-services"
import { useActiveCharacter } from "@/lib/active-character-context"
import { useAuth } from "@/lib/auth-context"
import { Sword, Coins, Users, Map, ArrowRight } from "lucide-react"
import { useLanguage } from "@/lib/language-context"
import type { WalletData } from "@/lib/infrastructure/repositories"
import type { Campaign } from "@/lib/infrastructure/repositories"

// Tipo extendido para UI del dashboard
type CampaignForDashboard = Campaign & {
  role?: string
  member_count?: number
  gm_name?: string
}

interface DashboardViewProps {
  language?: "es" // Mantener por compatibilidad, pero ya no se usa
  onNavigate: (module: string) => void
}

/**
 * Vista refactorizada del Dashboard usando nuevos componentes
 */
export function DashboardView({ language, onNavigate }: DashboardViewProps) {
  const { t } = useLanguage()
  const { user } = useAuth()
  const { activeCharacter } = useActiveCharacter()
  const [wallet, setWallet] = useState<WalletData | null>(null)
  const [campaignsAsGM, setCampaignsAsGM] = useState<CampaignForDashboard[]>([])
  const [campaignsAsPlayer, setCampaignsAsPlayer] = useState<CampaignForDashboard[]>([])
  const [loading, setLoading] = useState(true)
  const services = useServices()

  useEffect(() => {
    if (user) {
      loadData()
    } else {
      setLoading(false)
    }
  }, [user, activeCharacter])

  const loadData = async () => {
    if (!user) return

    setLoading(true)
    try {
      // Load wallet using service
      if (activeCharacter) {
        try {
          const walletData = await services.wallet.getWallet(activeCharacter.id)
          setWallet(walletData)
        } catch (error) {
          console.error("Error loading wallet:", error)
          setWallet(null)
        }
      }

      // Load campaigns using service
      const userCampaigns = await services.campaign.getUserCampaigns(user.id)

      const gmCampaigns: CampaignForDashboard[] = userCampaigns
        .filter((c) => c.is_gm)
        .map((c) => ({
          ...c,
          role: "game_master",
        }))

      const playerCampaigns: CampaignForDashboard[] = userCampaigns
        .filter((c) => c.is_player && !c.is_gm)
        .map((c) => ({
          ...c,
          role: "player",
        }))

      setCampaignsAsGM(gmCampaigns)
      setCampaignsAsPlayer(playerCampaigns)
    } catch (error) {
      console.error("Error loading dashboard data:", error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return <LoadingState message="Cargando dashboard..." />
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
      {activeCharacter && (
        <Card className="border-2">
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                <Sword className="w-6 h-6 text-primary" />
              </div>
              <div>
                <CardTitle>{t.sidebar.character}</CardTitle>
                <CardDescription>{activeCharacter.name}</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {/* Character Card */}
              <CharacterCard
                id={activeCharacter.id}
                name={activeCharacter.name}
                race={activeCharacter.race || "Unknown"}
                characterClass={activeCharacter.class}
                level={activeCharacter.level}
                gender={activeCharacter.gender}
                platinum={wallet?.platinum}
                gold={wallet?.gold}
                electrum={wallet?.electrum}
                silver={wallet?.silver}
                copper={wallet?.copper}
              />

              {/* Wallet Display */}
              {wallet && (
                <WalletDisplay
                  platinum={wallet.platinum}
                  gold={wallet.gold}
                  electrum={wallet.electrum}
                  silver={wallet.silver}
                  copper={wallet.copper}
                  totalWealth={wallet.total_wealth}
                  variant="detailed"
                />
              )}
            </div>

            <Button
              variant="outline"
              className="w-full mt-4 gap-2"
              onClick={() => onNavigate("characters")}
            >
              {t.character.manageAdventurers || "Manage Characters"}
              <ArrowRight className="w-4 h-4" />
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <StatCard
          title="Campañas como GM"
          value={campaignsAsGM.length}
          icon={Map}
          description="Campañas que diriges"
        />
        <StatCard
          title="Campañas como Player"
          value={campaignsAsPlayer.length}
          icon={Users}
          description="Campañas en las que participas"
        />
        <StatCard
          title="Total Wealth"
          value={wallet?.total_wealth.toFixed(2) || "0.00"}
          icon={Coins}
          description="En Gold Pieces"
        />
      </div>

      {/* Campaigns as GM */}
      {campaignsAsGM.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-xl font-semibold flex items-center gap-2">
            <Map className="w-5 h-5" />
            Campañas como Game Master
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {campaignsAsGM.map((campaign) => (
              <CampaignCard
                key={campaign.id}
                id={campaign.id}
                name={campaign.name}
                description={campaign.description}
                status={campaign.status}
                role="game_master"
                memberCount={campaign.member_count}
                gmName={campaign.gm_name}
                onView={() => onNavigate("campaigns")}
              />
            ))}
          </div>
        </div>
      )}

      {/* Campaigns as Player */}
      {campaignsAsPlayer.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-xl font-semibold flex items-center gap-2">
            <Users className="w-5 h-5" />
            Campañas como Player
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {campaignsAsPlayer.map((campaign) => (
              <CampaignCard
                key={campaign.id}
                id={campaign.id}
                name={campaign.name}
                description={campaign.description}
                status={campaign.status}
                role="player"
                memberCount={campaign.member_count}
                gmName={campaign.gm_name}
                onView={() => onNavigate("campaigns")}
              />
            ))}
          </div>
        </div>
      )}

      {/* Empty States */}
      {!activeCharacter && (
        <EmptyState
          icon={Sword}
          title="No hay personaje activo"
          description="Selecciona o crea un personaje para comenzar"
          action={{
            label: "Gestionar Personajes",
            onClick: () => onNavigate("characters"),
          }}
        />
      )}

      {campaignsAsGM.length === 0 && campaignsAsPlayer.length === 0 && (
        <EmptyState
          icon={Map}
          title="No hay campañas"
          description="Únete a una campaña o crea una nueva"
          action={{
            label: "Ver Campañas",
            onClick: () => onNavigate("campaigns"),
          }}
        />
      )}
    </div>
  )
}

