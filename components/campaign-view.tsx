"use client"

import { useState, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useAuth } from "@/lib/auth-context"
import { useServices } from "@/hooks/use-services"
import { type Language, translations } from "@/lib/translations"
import { LoadingState } from "@/components/molecules/loading"
import { EmptyState } from "@/components/molecules/empty"
import { WalletManager } from "@/components/wallet-manager"
import { Finances } from "@/components/finances"
import { Inventory } from "@/components/inventory"
import { Movements } from "@/components/movements"
import { CampaignWorldView } from "@/components/campaign-world-view"
import type { Campaign } from "@/lib/infrastructure/repositories"
import type { Character } from "@/lib/infrastructure/repositories/character-repository"
import { Crown, Sword, Settings, MapPin, Coins, Package, ArrowLeft, Globe } from "lucide-react"

interface CampaignViewProps {
  campaignId: string
  language: Language
}

export function CampaignView({ campaignId, language }: CampaignViewProps) {
  const t = translations[language]
  const router = useRouter()
  const searchParams = useSearchParams()
  const { user } = useAuth()
  const services = useServices()

  const [campaign, setCampaign] = useState<Campaign | null>(null)
  const [character, setCharacter] = useState<Character | null>(null)
  const [isGM, setIsGM] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (user && campaignId) {
      loadCampaignData()
    }
  }, [user, campaignId])

  const loadCampaignData = async () => {
    if (!user) return

    setLoading(true)
    setError(null)

    try {
      // Cargar campaña
      const campaignData = await services.campaign.getCampaign(campaignId)
      setCampaign(campaignData)

      // Verificar si es GM
      const userIsGM = await services.campaign.isGameMaster(user.id, campaignId)
      setIsGM(userIsGM)

      // Si es jugador, obtener su personaje
      if (!userIsGM) {
        // Si hay characterId en la URL, usarlo directamente
        const characterIdFromUrl = searchParams?.get("characterId")
        let characterLoaded = false
        
        if (characterIdFromUrl) {
          try {
            const character = await services.character.getCharacter(characterIdFromUrl)
            // Verificar que el personaje pertenece al usuario y está en la campaña
            if (character.user_id === user.id) {
              // Verificar que el personaje está asignado a esta campaña como player
              const characterMembers = await services.campaign.getCharacterMembers(characterIdFromUrl)
              const member = characterMembers.find(
                (m) => m.campaign_id === campaignId && m.role === "player"
              )
              if (member) {
                setCharacter(character)
                characterLoaded = true
              }
            }
          } catch (err) {
            console.error("Error loading character from URL:", err)
          }
        }
        
        // Si no se encontró desde la URL, intentar el método anterior
        if (!characterLoaded) {
          const playerCharacter = await services.campaign.getPlayerCharacterInCampaign(campaignId, user.id)
          setCharacter(playerCharacter)
        }
      }
    } catch (err: any) {
      console.error("Error loading campaign:", err)
      setError(err?.message || "Error al cargar la campaña")
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="w-full max-w-6xl mx-auto p-6">
        <LoadingState message="Cargando campaña..." />
      </div>
    )
  }

  if (error || !campaign) {
    return (
      <div className="w-full max-w-6xl mx-auto p-6">
        <EmptyState
          icon={Sword}
          title="Error al cargar la campaña"
          description={error || "La campaña no existe o no tienes acceso"}
          action={{
            label: "Volver a Campañas",
            onClick: () => router.push("/dashboard?module=campaigns"),
          }}
        />
      </div>
    )
  }

  return (
    <div className="w-full max-w-7xl mx-auto space-y-4 md:space-y-6 p-4 md:p-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 md:gap-4">
        <div className="w-full sm:flex-1">
          <Button
            variant="ghost"
            onClick={() => router.push("/dashboard?module=campaigns")}
            className="mb-2 md:mb-4 text-sm md:text-base"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Volver a Campañas
          </Button>
          <h1 className="text-2xl md:text-3xl font-bold">{campaign.name}</h1>
          {campaign.description && (
            <p className="text-sm md:text-base text-muted-foreground mt-2">{campaign.description}</p>
          )}
        </div>
        {isGM && (
          <div className="flex items-center gap-2">
            <Crown className="w-4 h-4 md:w-5 md:h-5 text-purple-600" />
            <span className="font-semibold text-purple-600 text-sm md:text-base">Game Master</span>
          </div>
        )}
      </div>

      {/* Content based on role */}
      {isGM ? (
        <Card>
          <CardHeader>
            <CardTitle>Administración de Campaña</CardTitle>
            <CardDescription>
              Gestiona ubicaciones, tiendas, NPCs y miembros de la campaña
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Button
                variant="outline"
                className="h-auto p-4 flex flex-col items-start gap-2"
                onClick={() => router.push(`/campaigns/${campaignId}/admin`)}
              >
                <MapPin className="w-6 h-6" />
                <div className="text-left">
                  <div className="font-semibold">Mapa y Ubicaciones</div>
                  <div className="text-sm text-muted-foreground">
                    Gestiona ubicaciones, tiendas y NPCs
                  </div>
                </div>
              </Button>
              <Button
                variant="outline"
                className="h-auto p-4 flex flex-col items-start gap-2"
                onClick={() => router.push(`/campaigns/${campaignId}/admin?tab=settings`)}
              >
                <Settings className="w-6 h-6" />
                <div className="text-left">
                  <div className="font-semibold">Configuración</div>
                  <div className="text-sm text-muted-foreground">
                    Gestiona miembros y configuración de la campaña
                  </div>
                </div>
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : character ? (
        <Tabs defaultValue="overview" className="w-full">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="overview">Resumen</TabsTrigger>
            <TabsTrigger value="wallet">Monedero</TabsTrigger>
            <TabsTrigger value="inventory">Inventario</TabsTrigger>
            <TabsTrigger value="movements">Movimientos</TabsTrigger>
            <TabsTrigger value="world">
              <Globe className="w-4 h-4 mr-2" />
              Mundo
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Sword className="w-5 h-5" />
                  {character.name}
                </CardTitle>
                <CardDescription>
                  {character.race}
                  {character.class && ` • ${character.class}`}
                  {character.level && ` • Nivel ${character.level}`}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Personaje asignado a esta campaña. Usa las pestañas para gestionar tu monedero, inventario y movimientos.
                </p>
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
      ) : (
        <Card>
          <CardContent className="pt-6">
            <EmptyState
              icon={Sword}
              title="No tienes personaje asignado"
              description="No estás participando en esta campaña como jugador, o no tienes un personaje asignado."
            />
          </CardContent>
        </Card>
      )}
    </div>
  )
}

