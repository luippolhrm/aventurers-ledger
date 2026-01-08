"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useAuth } from "@/lib/auth-context"
import { useServices } from "@/hooks/use-services"
import { useLanguage } from "@/lib/language-context"
import { LoadingState } from "@/components/molecules/loading"
import { EmptyState } from "@/components/molecules/empty"
import { PlayerCampaignTabs } from "@/components/features/campaigns"
import type { Character } from "@/lib/infrastructure/repositories/character-repository"
import type { Campaign } from "@/lib/infrastructure/repositories"
import { Sword, ArrowLeft } from "lucide-react"

interface CharacterCampaignViewProps {
  characterId: string
  campaignId: string
  language?: "es" // Mantener por compatibilidad, pero ya no se usa
  onBack: () => void
}

export function CharacterCampaignView({
  characterId,
  campaignId,
  language,
  onBack,
}: CharacterCampaignViewProps) {
  const { t } = useLanguage()
  const { user } = useAuth()
  const services = useServices()

  const [character, setCharacter] = useState<Character | null>(null)
  const [campaign, setCampaign] = useState<Campaign | null>(null)
  const [playerName, setPlayerName] = useState<string | null>(null)
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

      // Obtener el nombre del jugador (dueño del personaje)
      try {
        const profile = await services.profile.getProfile(characterData.user_id)
        setPlayerName(profile.display_name || null)
      } catch (err) {
        console.error("Error loading player profile:", err)
        // Continuar aunque no se pueda cargar el perfil
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
                {playerName && (
                  <p className="text-xs md:text-sm text-muted-foreground">
                    Jugador: {playerName}
                  </p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Character Campaign Content */}
      <PlayerCampaignTabs
        characterId={character.id}
        campaignId={campaignId}
        language={language}
        variant="compact"
      />
    </div>
  )
}

