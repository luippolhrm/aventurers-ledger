"use client"

import { useState, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { useAuth } from "@/lib/auth-context"
import { useServices } from "@/hooks/use-services"
import { useLanguage } from "@/lib/language-context"
import { LoadingState } from "@/components/molecules/loading"
import { EmptyState } from "@/components/molecules/empty"
import { PlayerCampaignTabs } from "@/components/features/campaigns"
import { LocationsMapContent } from "@/components/organisms/world"
import type { Campaign, CampaignMemberWithDetails } from "@/lib/infrastructure/repositories"
import type { Character } from "@/lib/infrastructure/repositories/character-repository"
import { Crown, Sword, Settings, MapPin, ArrowLeft, Info, Copy, LogOut, Users, AlertCircle } from "lucide-react"

interface CampaignViewProps {
  campaignId: string
  language?: "es" // Mantener por compatibilidad, pero ya no se usa
}

export function CampaignView({ campaignId, language }: CampaignViewProps) {
  const { t } = useLanguage()
  const router = useRouter()
  const searchParams = useSearchParams()
  const { user } = useAuth()
  const services = useServices()

  const [campaign, setCampaign] = useState<Campaign | null>(null)
  const [character, setCharacter] = useState<Character | null>(null)
  const [isOwner, setIsOwner] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  const [members, setMembers] = useState<CampaignMemberWithDetails[]>([])
  const [membersLoading, setMembersLoading] = useState(false)
  const [membersError, setMembersError] = useState<string | null>(null)
  const [inviteLoading, setInviteLoading] = useState(false)

  useEffect(() => {
    if (user && campaignId) {
      loadCampaignData()
    }
  }, [user, campaignId])

  useEffect(() => {
    if (!success) return
    const timer = setTimeout(() => setSuccess(null), 4000)
    return () => clearTimeout(timer)
  }, [success])

  const loadCampaignData = async () => {
    if (!user) return

    setLoading(true)
    setError(null)

    try {
      // Cargar campaña
      const campaignData = await services.campaign.getCampaign(campaignId)
      setCampaign(campaignData)

      // Verificar ownership directo (como con personajes)
      const userIsOwner = campaignData.game_master_id === user.id
      setIsOwner(userIsOwner)

      // Si es owner, precargar miembros
      if (userIsOwner) {
        await loadMembers()
      }

      // Si es jugador, obtener su personaje
      if (!userIsOwner) {
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

  const loadMembers = async () => {
    if (!user) return
    setMembersLoading(true)
    setMembersError(null)
    try {
      const data = await services.campaign.getCampaignMembersWithDetails(campaignId)
      setMembers(data)
    } catch (err: any) {
      console.error("Error loading members:", err)
      setMembersError(err?.message || "Error al cargar miembros")
    } finally {
      setMembersLoading(false)
    }
  }

  const handleCopyInviteCode = async () => {
    if (!campaign?.invite_code) return
    try {
      await navigator.clipboard.writeText(campaign.invite_code)
      setSuccess((t.campaigns as any)?.inviteCodeCopied || "Código copiado")
    } catch (err) {
      setMembersError("No se pudo copiar el código")
    }
  }

  const handleRegenerateInviteCode = async () => {
    if (!user) return
    setInviteLoading(true)
    setMembersError(null)
    try {
      const updated = await services.campaign.generateInviteCode(campaignId, user.id)
      setCampaign(updated)
      setSuccess("Nuevo código generado")
    } catch (err: any) {
      console.error("Error generating invite code:", err)
      setMembersError(err?.message || "Error al generar el código")
    } finally {
      setInviteLoading(false)
    }
  }

  const handleRemoveMember = async (member: CampaignMemberWithDetails) => {
    if (!user) return
    if (member.role === "game_master") return

    const displayText = member.character_name
      ? `${member.character_name} (${member.user_display_name || member.user_id})`
      : member.user_display_name || member.user_id

    if (!confirm(`¿Expulsar a ${displayText} de la campaña?`)) return

    setMembersError(null)
    try {
      await services.campaign.removeMember(member.id, user.id, campaignId)
      setSuccess("Miembro expulsado")
      await loadMembers()
    } catch (err: any) {
      console.error("Error removing member:", err)
      setMembersError(err?.message || "Error al expulsar miembro")
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
        {isOwner && (
          <div className="flex items-center gap-2">
            <Crown className="w-4 h-4 md:w-5 md:h-5 text-purple-600" />
            <span className="font-semibold text-purple-600 text-sm md:text-base">Game Master</span>
          </div>
        )}
      </div>

      {/* Content based on role */}
      {isOwner ? (
        <>
          {success && (
            <Alert className="bg-green-50 text-green-900 border-green-200">
              <AlertDescription>{success}</AlertDescription>
            </Alert>
          )}

          <Tabs defaultValue="info" className="w-full">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="info" className="flex items-center gap-2">
                <Info className="w-4 h-4" />
                Información
              </TabsTrigger>
              <TabsTrigger value="members" className="flex items-center gap-2">
                <Users className="w-4 h-4" />
                Miembros
              </TabsTrigger>
              <TabsTrigger value="map" className="flex items-center gap-2">
                <MapPin className="w-4 h-4" />
                Mapa y Ubicaciones
              </TabsTrigger>
              <TabsTrigger value="settings" className="flex items-center gap-2">
                <Settings className="w-4 h-4" />
                Configuración
              </TabsTrigger>
            </TabsList>

            {/* Tab Información */}
            <TabsContent value="info" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Información de la Campaña</CardTitle>
                  <CardDescription>Datos básicos y código de invitación</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <p className="text-sm font-medium">Nombre</p>
                    <p className="text-base">{campaign.name}</p>
                  </div>
                  {campaign.description && (
                    <div className="space-y-2">
                      <p className="text-sm font-medium">Descripción</p>
                      <p className="text-base text-muted-foreground">{campaign.description}</p>
                    </div>
                  )}
                  <div className="space-y-2">
                    <p className="text-sm font-medium">Estado</p>
                    <Badge variant={campaign.status === "active" ? "default" : "secondary"}>
                      {campaign.status === "active"
                        ? "Activa"
                        : campaign.status === "archived"
                          ? "Archivada"
                          : campaign.status}
                    </Badge>
                  </div>
                  <div className="space-y-2">
                    <p className="text-sm font-medium">Código de invitación</p>
                    <div className="flex gap-2">
                      <Input value={campaign.invite_code || ""} readOnly className="font-mono" />
                      <Button variant="outline" onClick={handleCopyInviteCode} title="Copiar">
                        <Copy className="h-4 w-4" />
                      </Button>
                    </div>
                    <Button variant="outline" onClick={handleRegenerateInviteCode} disabled={inviteLoading} size="sm">
                      Regenerar código
                    </Button>
                    <p className="text-xs text-muted-foreground">
                      Comparte este código con tus jugadores para que unan sus personajes a la campaña
                    </p>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Tab Miembros */}
            <TabsContent value="members" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Miembros de la Campaña</CardTitle>
                  <CardDescription>Gestiona los jugadores que participan en esta campaña</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {membersError && (
                    <Alert variant="destructive">
                      <AlertCircle className="h-4 w-4" />
                      <AlertDescription>{membersError}</AlertDescription>
                    </Alert>
                  )}

                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium">Lista de miembros</p>
                    <Button variant="outline" size="sm" onClick={loadMembers} disabled={membersLoading}>
                      Recargar
                    </Button>
                  </div>

                  {membersLoading ? (
                    <LoadingState message="Cargando miembros..." size="sm" />
                  ) : members.length === 0 ? (
                    <p className="text-sm text-muted-foreground">Aún no hay miembros en esta campaña.</p>
                  ) : (
                    <div className="space-y-2">
                      {members.map((member) => {
                        const displayText =
                          member.role === "game_master"
                            ? member.user_display_name || member.user_id
                            : member.character_name && member.user_display_name
                              ? `${member.character_name} (${member.user_display_name})`
                              : member.character_name || member.user_display_name || member.user_id

                        return (
                          <div key={member.id} className="flex items-center justify-between p-2 bg-muted rounded">
                            <div className="flex items-center gap-2">
                              <span className="text-sm">{displayText}</span>
                              <Badge variant={member.role === "game_master" ? "default" : "secondary"}>
                                {member.role === "game_master" ? (
                                  <span className="flex items-center gap-1">
                                    <Crown className="h-3 w-3" /> GM
                                  </span>
                                ) : (
                                  <span>Jugador</span>
                                )}
                              </Badge>
                            </div>
                            {member.role !== "game_master" && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleRemoveMember(member)}
                                title="Expulsar"
                              >
                                <LogOut className="h-4 w-4" />
                              </Button>
                            )}
                          </div>
                        )
                      })}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Tab Mapa y Ubicaciones */}
            <TabsContent value="map" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Mapa y Ubicaciones</CardTitle>
                  <CardDescription>
                    Gestiona ubicaciones, tiendas y NPCs de la campaña
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <LocationsMapContent campaignId={campaignId} />
                </CardContent>
              </Card>
            </TabsContent>

            {/* Tab Configuración */}
            <TabsContent value="settings" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Configuración de Campaña</CardTitle>
                  <CardDescription>
                    Configuración general y opciones avanzadas
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">
                    Próximamente: opciones de estado (pausada/completada/archivada), notas del GM y más.
                  </p>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </>
      ) : character ? (
        <PlayerCampaignTabs
          characterId={character.id}
          campaignId={campaignId}
          language={language}
          variant="default"
        />
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

