"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { AlertCircle, Copy, Crown, Trash2, UserPlus, LogOut, Sword, MapPin } from "lucide-react"
import { LocationsMap } from "@/components/locations-map"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { useServices } from "@/hooks/use-services"
import type { Campaign, CampaignMemberWithDetails } from "@/lib/infrastructure/repositories"
import { LoadingState } from "@/components/molecules/loading"
import { EmptyState } from "@/components/molecules/empty"
import { useAuth } from "@/lib/auth-context"
import { useActiveCharacter } from "@/lib/active-character-context"
import { type Language, translations } from "@/lib/translations"
import { CharacterCampaignSelector } from "@/components/character-campaign-selector"
import { useRouter } from "next/navigation"

// Extended Campaign type for UI purposes
type CampaignWithRole = Campaign & {
  role?: string
  character_id?: string | null
  is_gm?: boolean
  is_player?: boolean
  creator_name?: string
  member_count?: number
  gm_name?: string
}

interface CampaignsProps {
  language: Language
}

export function Campaigns({ language }: CampaignsProps) {
  const t = translations[language]
  const { user } = useAuth()
  const { activeCharacterId } = useActiveCharacter()
  const services = useServices()
  const router = useRouter()

  const [campaigns, setCampaigns] = useState<CampaignWithRole[]>([])
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [isJoinDialogOpen, setIsJoinDialogOpen] = useState(false)
  const [isCharacterSelectorOpen, setIsCharacterSelectorOpen] = useState(false)
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false)
  const [selectedCampaign, setSelectedCampaign] = useState<CampaignWithRole | null>(null)
  const [members, setMembers] = useState<CampaignMemberWithDetails[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")
  const [selectedCharacterId, setSelectedCharacterId] = useState<string | null>(null)

  // Form states
  const [campaignName, setCampaignName] = useState("")
  const [campaignDescription, setCampaignDescription] = useState("")
  const [inviteCode, setInviteCode] = useState("")

  useEffect(() => {
    loadCampaigns()
  }, [activeCharacterId, user])

  // Auto-hide success message after 5 seconds
  useEffect(() => {
    if (success) {
      const timer = setTimeout(() => {
        setSuccess("")
      }, 5000)
      return () => clearTimeout(timer)
    }
  }, [success])

  const loadCampaigns = async () => {
    if (!user) return

    try {
      setLoading(true)
      setError("")

      // Obtener campañas como GM
      const gmCampaigns = await services.campaign.getCampaignsAsGM(user.id)

      // Obtener campañas como Player (si hay personaje activo)
      let playerCampaigns: Campaign[] = []
      if (activeCharacterId) {
        const characterMembers = await services.campaign.getCharacterMembers(activeCharacterId)
        const playerCampaignIds = characterMembers.map((m) => m.campaign_id)
        
        if (playerCampaignIds.length > 0) {
          const allUserCampaigns = await services.campaign.getUserCampaigns(user.id)
          // Filtrar solo las que tienen el character_id del personaje activo y no son GM
          playerCampaigns = allUserCampaigns.filter(
            (c) => playerCampaignIds.includes(c.id) && c.game_master_id !== user.id
          )
        }
      }

      // Combinar y formatear para la UI
      const campaignsWithRoles: CampaignWithRole[] = [
        ...gmCampaigns.map((c) => ({
          ...c,
          role: "game_master",
          is_gm: true,
          is_player: false,
          character_id: null,
        })),
        ...playerCampaigns.map((c) => ({
          ...c,
          role: "player",
          is_gm: false,
          is_player: true,
          character_id: activeCharacterId || null,
        })),
      ]

      setCampaigns(campaignsWithRoles)
    } catch (err: any) {
      console.error("Error loading campaigns:", err)
      setError(err?.message || "Failed to load campaigns")
    } finally {
      setLoading(false)
    }
  }

  const handleCreateCampaign = async () => {
    if (!user || !campaignName.trim()) return

    try {
      setError("")
      setSuccess("")

      const { campaign, member } = await services.campaign.createCampaign(
        {
          name: campaignName.trim(),
          description: campaignDescription.trim() || null,
          game_master_id: user.id,
          status: "active",
        },
        user.id
      )

      setSuccess((t.campaigns as any)?.campaignCreated || "Campaign created successfully!")
      setCampaignName("")
      setCampaignDescription("")
      setIsCreateDialogOpen(false)
      loadCampaigns()
    } catch (err: any) {
      console.error("Error creating campaign:", err)
      setError(err?.message || "Failed to create campaign")
    }
  }

  const handleJoinCampaignClick = () => {
    if (!inviteCode.trim()) {
      setError((t.campaigns as any)?.enterInviteCode || "Please enter an invite code")
      return
    }
    // Abrir selector de personajes
    setIsCharacterSelectorOpen(true)
  }

  const handleCharacterSelected = async (characterId: string) => {
    if (!user || !inviteCode.trim()) return

    setSelectedCharacterId(characterId)
    setIsCharacterSelectorOpen(false)

    try {
      setError("")
      setSuccess("")

      const { campaign, member } = await services.campaign.joinCampaignByInviteCode(
        inviteCode.trim().toUpperCase(),
        user.id,
        characterId
      )

      setSuccess((t.campaigns as any)?.joinedCampaign || "Joined campaign successfully!")
      setInviteCode("")
      setIsJoinDialogOpen(false)
      setSelectedCharacterId(null)
      loadCampaigns()
    } catch (err: any) {
      console.error("Error joining campaign:", err)
      setError(err?.message || "Failed to join campaign")
    }
  }

  const handleCreateNewCharacter = () => {
    setIsCharacterSelectorOpen(false)
    setIsJoinDialogOpen(false)
    router.push("/dashboard?module=characters")
  }

  const handleViewCampaign = (campaign: CampaignWithRole) => {
    const realCampaignId = campaign.id.includes("_") ? campaign.id.split("_")[0] : campaign.id
    // Navegar a la ruta de la campaña
    router.push(`/campaigns/${realCampaignId}`)
  }

  const handleCopyInviteCode = (code: string) => {
    navigator.clipboard.writeText(code)
    setSuccess((t.campaigns as any)?.inviteCodeCopied || "Invite code copied!")
    // El mensaje desaparecerá automáticamente después de 5 segundos (manejado por useEffect)
  }

  const handleLeaveCampaign = async (campaignId: string) => {
    if (!user || !activeCharacterId) return

    if (!confirm((t.campaigns as any)?.confirmLeave || "Are you sure you want to leave this campaign?")) return

    try {
      setError("")
      setSuccess("")

      const realCampaignId = campaignId.includes("_") ? campaignId.split("_")[0] : campaignId
      await services.campaign.leaveCampaign(realCampaignId, user.id, activeCharacterId)

      setSuccess((t.campaigns as any)?.leftCampaign || "Left campaign successfully")
      loadCampaigns()
      setIsViewDialogOpen(false)
    } catch (err: any) {
      console.error("Error leaving campaign:", err)
      setError(err?.message || "Failed to leave campaign")
    }
  }

  const handleDeleteCampaign = async (campaignId: string) => {
    if (!user) return
    if (!confirm((t.campaigns as any)?.confirmDelete || "Are you sure you want to delete this campaign?")) return

    try {
      setError("")
      setSuccess("")

      const realCampaignId = campaignId.includes("_") ? campaignId.split("_")[0] : campaignId
      await services.campaign.deleteCampaign(realCampaignId, user.id)

      setSuccess((t.campaigns as any)?.campaignDeleted || "Campaign deleted successfully")
      loadCampaigns()
      setIsViewDialogOpen(false)
    } catch (err: any) {
      console.error("Error deleting campaign:", err)
      setError(err?.message || "Failed to delete campaign")
    }
  }

  const handleRemoveMember = async (memberId: string, memberName: string) => {
    if (!user || !selectedCampaign) return

    if (
      !confirm(
        ((t.campaigns as any)?.confirmRemoveMember as string | undefined)?.replace("{name}", memberName) ||
          `Are you sure you want to remove ${memberName} from this campaign?`
      )
    )
      return

    try {
      setError("")
      setSuccess("")

      const realCampaignId = selectedCampaign.id.includes("_")
        ? selectedCampaign.id.split("_")[0]
        : selectedCampaign.id

      await services.campaign.removeMember(memberId, user.id, realCampaignId)

      setSuccess((t.campaigns as any)?.memberRemoved || "Member removed successfully")

      // Recargar los miembros de la campaña
      await handleViewCampaign(selectedCampaign)

      // Recargar la lista de campañas
      loadCampaigns()
    } catch (err: any) {
      console.error("Error removing member:", err)
      setError(err?.message || (t.campaigns as any)?.errorRemovingMember || "Failed to remove member")
    }
  }

  const isGM = (campaign: CampaignWithRole) => campaign.is_gm === true || campaign.role === "game_master"

  if (loading) {
    return (
      <div className="w-full max-w-7xl mx-auto p-4 md:p-6">
        <LoadingState message={(t.campaigns as any)?.loading || "Loading campaigns..."} />
      </div>
    )
  }

  return (
    <div className="w-full max-w-7xl mx-auto space-y-4 md:space-y-6 p-4 md:p-6">
      {error && (
        <Alert variant="destructive" className="mb-4">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription className="text-sm md:text-base">{error}</AlertDescription>
        </Alert>
      )}

      {success && (
        <Alert className="mb-4 bg-green-50 text-green-900 border-green-200">
          <AlertDescription className="text-sm md:text-base">{success}</AlertDescription>
        </Alert>
      )}

      <Tabs defaultValue="gm" className="w-full">
        <TabsList className="grid w-full grid-cols-2 h-auto">
          <TabsTrigger value="gm" className="flex items-center gap-1 md:gap-2 text-xs md:text-sm py-2 md:py-3">
            <Crown className="w-3 h-3 md:w-4 md:h-4" />
            <span className="hidden sm:inline">{(t.campaigns as any)?.asGM || "Como Game Master"}</span>
            <span className="sm:hidden">GM</span>
          </TabsTrigger>
          <TabsTrigger value="player" className="flex items-center gap-1 md:gap-2 text-xs md:text-sm py-2 md:py-3">
            <Sword className="w-3 h-3 md:w-4 md:h-4" />
            <span className="hidden sm:inline">{(t.campaigns as any)?.asPlayer || "Como Jugador"}</span>
            <span className="sm:hidden">Jugador</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="gm" className="mt-4 md:mt-6">
          {/* GM Tab: Solo campañas donde el usuario es GM */}
          <div className="space-y-3 md:space-y-4">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 sm:gap-4 mb-4">
              <div>
                <h3 className="text-base md:text-lg font-semibold">Mis Campañas como Game Master</h3>
                <p className="text-xs md:text-sm text-muted-foreground">
                  Gestiona las campañas que has creado y donde eres el Game Master
                </p>
              </div>
              <Button onClick={() => setIsCreateDialogOpen(true)} className="text-sm md:text-base w-full sm:w-auto">
                <Crown className="w-3 h-3 md:w-4 md:h-4 mr-1 md:mr-2" />
                Crear Campaña
              </Button>
            </div>

            {(() => {
              const gmCampaigns = campaigns.filter((c) => isGM(c))
              return gmCampaigns.length === 0 ? (
                <Card>
                  <CardContent className="pt-6 text-center">
                    <p className="mb-4">{(t.campaigns as any)?.noGMCampaigns || "Aún no has creado ninguna campaña como Game Master."}</p>
                    <Button onClick={() => setIsCreateDialogOpen(true)}>
                      <Crown className="w-4 h-4 mr-2" />
                      Crear tu Primera Campaña
                    </Button>
                  </CardContent>
                </Card>
              ) : (
                gmCampaigns.map((campaign) => (
                  <Card
                    key={campaign.id}
                    className="cursor-pointer hover:bg-accent border-purple-200 dark:border-purple-800"
                    onClick={() => handleViewCampaign(campaign)}
                  >
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 flex-wrap mb-2">
                            <CardTitle>{campaign.name}</CardTitle>
                            <Badge variant="default" className="bg-purple-600">
                              <span className="flex items-center gap-1">
                                <Crown className="h-3 w-3" /> GM
                              </span>
                            </Badge>
                          </div>
                          <CardDescription>{campaign.description || "Sin descripción"}</CardDescription>
                        </div>
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation()
                            handleDeleteCampaign(campaign.id)
                          }}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </CardHeader>
                  </Card>
                ))
              )
            })()}
          </div>
        </TabsContent>

        <TabsContent value="player" className="mt-6">
          {/* Player Tab: Solo campañas donde el personaje activo es player */}
          <div className="space-y-4">
            <div className="flex justify-between items-center mb-4">
              <div>
                <h3 className="text-lg font-semibold">Mis Campañas como Jugador</h3>
                <p className="text-sm text-muted-foreground">
                  Campañas donde participas como jugador
                </p>
              </div>
              <Button onClick={() => setIsJoinDialogOpen(true)} disabled={!activeCharacterId}>
                <UserPlus className="w-4 h-4 mr-2" />
                Unirse a Campaña
              </Button>
            </div>

            {!activeCharacterId ? (
              <EmptyState
                icon={Sword}
                title={(t.campaigns as any)?.selectCharacterToView || "Por favor selecciona un personaje para ver sus campañas"}
                description="Selecciona un personaje activo desde el selector en el header"
              />
            ) : (() => {
              const playerCampaigns = campaigns.filter((c) => c.is_player && !c.is_gm)
              return playerCampaigns.length === 0 ? (
                <EmptyState
                  icon={Sword}
                  title={
                    (t.campaigns as any)?.noPlayerCampaigns ||
                    "No estás participando en ninguna campaña como jugador."
                  }
                  description="Únete a una campaña usando un código de invitación"
                  action={{
                    label: "Unirse a una Campaña",
                    onClick: () => setIsJoinDialogOpen(true),
                  }}
                />
              ) : (
                playerCampaigns.map((campaign) => (
                  <Card
                    key={campaign.id}
                    className="cursor-pointer hover:bg-accent border-blue-200 dark:border-blue-800"
                    onClick={() => handleViewCampaign(campaign)}
                  >
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 flex-wrap mb-2">
                            <CardTitle>{campaign.name}</CardTitle>
                            <Badge variant="secondary" className="bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-100">
                              <span>
                                {(t.campaigns as any)?.player || "Jugador"}
                              </span>
                            </Badge>
                          </div>
                          <CardDescription>{campaign.description || "Sin descripción"}</CardDescription>
                          {campaign.gm_name && (
                            <p className="text-xs text-muted-foreground mt-2">
                              <span className="font-medium">Game Master:</span> {campaign.gm_name}
                            </p>
                          )}
                        </div>
                      </div>
                    </CardHeader>
                  </Card>
                ))
              )
            })()}
          </div>
        </TabsContent>
      </Tabs>

      {/* Create Campaign Dialog */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader className="space-y-2">
            <DialogTitle className="text-2xl font-bold">
              {(t.campaigns as any)?.createCampaign || "Create New Campaign"}
            </DialogTitle>
            <DialogDescription className="text-base pt-2">
              {(t.campaigns as any)?.createDescription || "Create a new campaign and invite players"}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-5 py-4">
            <div className="space-y-2">
              <Label htmlFor="name" className="text-sm font-semibold">
                {(t.campaigns as any)?.campaignName || "Campaign Name"}
              </Label>
              <Input
                id="name"
                value={campaignName}
                onChange={(e) => setCampaignName(e.target.value)}
                placeholder={(t.campaigns as any)?.namePlaceholder || "Enter campaign name"}
                className="h-10 border-2 focus:border-primary transition-colors"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="description" className="text-sm font-semibold">
                {(t.campaigns as any)?.description || "Description"}
              </Label>
              <Textarea
                id="description"
                value={campaignDescription}
                onChange={(e) => setCampaignDescription(e.target.value)}
                placeholder={(t.campaigns as any)?.descriptionPlaceholder || "Describe your campaign"}
                rows={4}
                className="border-2 focus:border-primary transition-colors resize-none"
              />
            </div>
            <Button
              onClick={handleCreateCampaign}
              className="w-full h-11 text-base font-semibold mt-2"
              disabled={!campaignName.trim()}
            >
              {(t.campaigns as any)?.create || "Create"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Join Campaign Dialog */}
      <Dialog 
        open={isJoinDialogOpen} 
        onOpenChange={(open) => {
          setIsJoinDialogOpen(open)
          if (!open) {
            // Limpiar error y código de invitación al cerrar el modal
            setError("")
            setInviteCode("")
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{(t.campaigns as any)?.joinCampaign || "Join Campaign"}</DialogTitle>
            <DialogDescription>
              {(t.campaigns as any)?.joinDescription || "Enter the invite code to join a campaign"}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            {/* Mostrar error dentro del modal para que sea visible en dispositivos móviles */}
            {error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
            <div>
              <Label htmlFor="inviteCode">{(t.campaigns as any)?.inviteCode || "Invite Code"}</Label>
              <Input
                id="inviteCode"
                value={inviteCode}
                onChange={(e) => setInviteCode(e.target.value.toUpperCase())}
                placeholder="XXXXXXXX"
                maxLength={8}
              />
            </div>
            <Button onClick={handleJoinCampaignClick} className="w-full" disabled={!inviteCode.trim()}>
              {(t.campaigns as any)?.join || "Join"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* View Campaign Dialog */}
      {selectedCampaign && (
        <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                {selectedCampaign.name}
                {selectedCampaign.is_gm && (
                  <Badge variant="default">
                    <Crown className="w-3 h-3 mr-1" />
                    GM
                  </Badge>
                )}
              </DialogTitle>
              <DialogDescription>
                {selectedCampaign.description || (t.campaigns as any)?.noDescription || "No description"}
              </DialogDescription>
            </DialogHeader>

            <Tabs defaultValue="overview" className="w-full">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="overview">{(t.campaigns as any)?.overview || "Overview"}</TabsTrigger>
                <TabsTrigger value="members">{(t.campaigns as any)?.members || "Members"}</TabsTrigger>
                <TabsTrigger value="map" className="flex items-center gap-2">
                  <MapPin className="w-4 h-4" />
                  {t.sidebar.map || "Mapa"}
                </TabsTrigger>
              </TabsList>

              <TabsContent value="overview" className="space-y-4">
                <div>
                  <h4 className="font-semibold mb-2">{(t.campaigns as any)?.description || "Description"}</h4>
                  <p>{selectedCampaign.description || (t.campaigns as any)?.noDescription || "No description provided"}</p>
                </div>

                {selectedCampaign.is_gm && (
                  <div>
                    <h4 className="font-semibold mb-2">{(t.campaigns as any)?.inviteCode || "Invite Code"}</h4>
                    <div className="flex gap-2">
                      <Input value={selectedCampaign.invite_code || "N/A"} readOnly />
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleCopyInviteCode(selectedCampaign.invite_code)}
                      >
                        <Copy className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                )}

                <Button onClick={() => handleLeaveCampaign(selectedCampaign.id)} variant="outline" className="w-full">
                  <LogOut className="h-4 w-4 mr-2" /> {(t.campaigns as any)?.leave || "Leave Campaign"}
                </Button>
              </TabsContent>

              <TabsContent value="members" className="space-y-4">
                <div className="flex justify-between items-center mb-4">
                  <h4 className="font-semibold">{(t.campaigns as any)?.members || "Members"}</h4>
                </div>
                {members.length === 0 ? (
                  <p>{(t.campaigns as any)?.noMembers || "No members in this campaign"}</p>
                ) : (
                  <div className="space-y-2">
                    {members.map((member) => {
                      // Formatear el nombre según el rol
                      let displayText: string
                      if (member.role === "game_master") {
                        // GM: solo nombre del usuario
                        displayText = member.user_display_name || member.user_id
                      } else {
                        // Player: mostrar "nombre del personaje (nombre del jugador)"
                        const characterName = member.character_name
                        const playerName = member.user_display_name

                        if (characterName && playerName) {
                          displayText = `${characterName} (${playerName})`
                        } else if (characterName) {
                          displayText = characterName
                        } else if (playerName) {
                          displayText = playerName
                        } else {
                          displayText = member.user_id
                        }
                      }

                      return (
                        <div key={member.id} className="flex items-center justify-between p-2 bg-muted rounded">
                          <div className="flex items-center gap-2">
                            <span>{displayText}</span>
                            <Badge variant={member.role === "game_master" ? "default" : "secondary"}>
                              {member.role === "game_master" ? (
                                <span className="flex items-center gap-1">
                                  <Crown className="h-3 w-3" /> GM
                                </span>
                              ) : (
                                <span>{(t.campaigns as any)?.player || "Player"}</span>
                              )}
                            </Badge>
                          </div>
                          {/* Solo mostrar botón de eliminar para players si eres GM */}
                          {member.role !== "game_master" && selectedCampaign?.is_gm && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation()
                                const memberName = member.character_name
                                  ? `${member.character_name} (${member.user_display_name || "this member"})`
                                  : member.user_display_name || "this member"
                                handleRemoveMember(member.id, memberName)
                              }}
                              title={(t.campaigns as any)?.removeMember || "Remove member"}
                            >
                              <LogOut className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      )
                    })}
                  </div>
                )}
              </TabsContent>

              <TabsContent value="map" className="space-y-4">
                <div className="max-h-[600px] overflow-auto">
                  <LocationsMap 
                    language={language} 
                    campaignId={selectedCampaign.id.includes('_') ? selectedCampaign.id.split('_')[0] : selectedCampaign.id}
                  />
                </div>
              </TabsContent>
            </Tabs>
          </DialogContent>
        </Dialog>
      )}

      {/* Character Selector for Joining Campaign */}
      <CharacterCampaignSelector
        language={language}
        open={isCharacterSelectorOpen}
        onOpenChange={setIsCharacterSelectorOpen}
        onSelect={handleCharacterSelected}
        onCreateNew={handleCreateNewCharacter}
      />
    </div>
  )
}
