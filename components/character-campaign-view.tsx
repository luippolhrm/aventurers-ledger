"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useAuth } from "@/lib/auth-context"
import { useServices } from "@/hooks/use-services"
import { type Language, translations } from "@/lib/translations"
import { LoadingState } from "@/components/molecules/loading"
import { EmptyState } from "@/components/molecules/empty"
import { WalletManager } from "@/components/wallet-manager"
import { Inventory } from "@/components/inventory"
import { Movements } from "@/components/movements"
import { CampaignWorldView } from "@/components/campaign-world-view"
import type { Character } from "@/lib/infrastructure/repositories/character-repository"
import type { Campaign } from "@/lib/infrastructure/repositories"
import { Sword, ArrowLeft, Globe, Coins, Package, ArrowRightLeft } from "lucide-react"

interface CharacterCampaignViewProps {
  characterId: string
  campaignId: string
  language: Language
  onBack: () => void
}

export function CharacterCampaignView({
  characterId,
  campaignId,
  language,
  onBack,
}: CharacterCampaignViewProps) {
  const t = translations[language]
  const { user } = useAuth()
  const services = useServices()

  const [character, setCharacter] = useState<Character | null>(null)
  const [campaign, setCampaign] = useState<Campaign | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (user && characterId && campaignId) {
      loadData()
    }
  }, [user, characterId, campaignId])

  const loadData = async () => {
    if (!user) return

    setLoading(true)
    setError(null)

    try {
      // Cargar personaje y campaña en paralelo
      const [characterData, campaignData] = await Promise.all([
        services.character.getCharacter(characterId),
        services.campaign.getCampaign(campaignId),
      ])

      // Verificar que el personaje pertenece al usuario
      if (characterData.user_id !== user.id) {
        setError("No tienes acceso a este personaje")
        return
      }

      // Verificar que el personaje está asignado a esta campaña como player
      const characterMembers = await services.campaign.getCharacterMembers(characterId)
      const member = characterMembers.find(
        (m) => m.campaign_id === campaignId && m.role === "player"
      )

      if (!member) {
        setError("El personaje no está asignado a esta campaña como jugador")
        return
      }

      setCharacter(characterData)
      setCampaign(campaignData)
    } catch (err: any) {
      console.error("Error loading character campaign data:", err)
      setError(err?.message || "Error al cargar los datos de la campaña")
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="w-full max-w-7xl mx-auto p-4 md:p-6">
        <LoadingState message="Cargando campaña..." />
      </div>
    )
  }

  if (error || !character || !campaign) {
    return (
      <div className="w-full max-w-7xl mx-auto p-4 md:p-6">
        <EmptyState
          icon={Sword}
          title="Error al cargar la campaña"
          description={error || "No se pudieron cargar los datos"}
          action={{
            label: "Volver",
            onClick: onBack,
          }}
        />
      </div>
    )
  }

  return (
    <div className="w-full max-w-7xl mx-auto space-y-4 md:space-y-6 p-4 md:p-6">
      {/* Header */}
      <div className="space-y-3 md:space-y-4">
        <Button
          variant="ghost"
          onClick={onBack}
          className="text-xs sm:text-sm"
        >
          <ArrowLeft className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
          Volver a Personajes
        </Button>
        
        <div className="space-y-2">
          <h1 className="text-xl md:text-2xl font-bold">{campaign.name}</h1>
          {campaign.description && (
            <p className="text-xs md:text-sm text-muted-foreground">{campaign.description}</p>
          )}
        </div>

        {/* Character Info Card */}
        <Card className="border-primary/20 bg-primary/5">
          <CardContent className="pt-4 pb-3">
            <div className="flex items-center gap-3">
              <div className="flex-shrink-0">
                <Sword className="w-5 h-5 md:w-6 md:h-6 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <h2 className="text-base md:text-lg font-semibold truncate">{character.name}</h2>
                <p className="text-xs md:text-sm text-muted-foreground">
                  {character.race}
                  {character.class && ` • ${character.class}`}
                  {character.level && ` • Nivel ${character.level}`}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Character Campaign Content */}
      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="grid w-full grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-1 h-auto">
          <TabsTrigger value="overview" className="text-xs sm:text-sm py-2">
            <span className="hidden sm:inline">Resumen</span>
            <span className="sm:hidden">Res.</span>
          </TabsTrigger>
          <TabsTrigger value="wallet" className="text-xs sm:text-sm py-2">
            <Coins className="w-3 h-3 sm:w-4 sm:h-4 sm:mr-1.5" />
            <span className="hidden sm:inline">Monedero</span>
          </TabsTrigger>
          <TabsTrigger value="inventory" className="text-xs sm:text-sm py-2">
            <Package className="w-3 h-3 sm:w-4 sm:h-4 sm:mr-1.5" />
            <span className="hidden sm:inline">Inventario</span>
          </TabsTrigger>
          <TabsTrigger value="movements" className="text-xs sm:text-sm py-2">
            <ArrowRightLeft className="w-3 h-3 sm:w-4 sm:h-4 sm:mr-1.5" />
            <span className="hidden sm:inline">Movimientos</span>
          </TabsTrigger>
          <TabsTrigger value="world" className="text-xs sm:text-sm py-2">
            <Globe className="w-3 h-3 sm:w-4 sm:h-4 sm:mr-1.5" />
            <span className="hidden sm:inline">Mundo</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base md:text-lg">Resumen del Personaje</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3 text-sm md:text-base text-muted-foreground">
                <p>
                  Estás jugando como <strong className="text-foreground">{character.name}</strong> en la campaña <strong className="text-foreground">{campaign.name}</strong>.
                </p>
                <p>
                  Usa las pestañas para gestionar tu <strong>monedero</strong>, <strong>inventario</strong>, <strong>movimientos</strong> y explorar el <strong>mundo</strong> de la campaña.
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="wallet" className="space-y-4">
          <WalletManager language={language} characterId={character.id} />
        </TabsContent>

        <TabsContent value="inventory" className="space-y-4">
          <Inventory language={language} characterId={character.id} campaignId={campaignId} />
        </TabsContent>

        <TabsContent value="movements" className="space-y-4">
          <Movements language={language} characterId={character.id} />
        </TabsContent>

        <TabsContent value="world" className="space-y-4">
          <CampaignWorldView campaignId={campaignId} language={language} />
        </TabsContent>
      </Tabs>
    </div>
  )
}

