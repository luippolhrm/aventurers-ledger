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
import { AlertCircle, Copy, Crown, Trash2, UserPlus, LogOut } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { createBrowserClient } from "@/lib/supabase/client"
import { useAuth } from "@/lib/auth-context"
import { useActiveCharacter } from "@/lib/active-character-context"
import { type Language, translations } from "@/lib/translations"

interface Campaign {
  id: string
  name: string
  description: string | null
  game_master_id: string
  status: string
  invite_code: string
  created_at: string
  member_count?: number
  role?: string
  character_id?: string | null
  is_gm?: boolean
  is_player?: boolean
  creator_name?: string // Nombre del creador (GM)
}

interface CampaignMember {
  id: string
  user_id: string
  character_id: string | null
  role: string
  joined_at: string
  user_email?: string // Display name (user name for GM, character name for Player)
  character_name?: string | null
  user_display_name?: string | null
}

interface CampaignsProps {
  language: Language
}

export function Campaigns({ language }: CampaignsProps) {
  const t = translations[language]
  const { user } = useAuth()
  const { activeCharacterId, activeCharacter } = useActiveCharacter()
  const supabase = createBrowserClient()

  const [campaigns, setCampaigns] = useState<Campaign[]>([])
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [isJoinDialogOpen, setIsJoinDialogOpen] = useState(false)
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false)
  const [selectedCampaign, setSelectedCampaign] = useState<Campaign | null>(null)
  const [members, setMembers] = useState<CampaignMember[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")

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

      let allMemberData: Array<{ campaign_id: string; role: string; character_id: string | null }> = []

      if (activeCharacterId) {
        console.log("[v0] loadCampaigns: Loading for activeCharacterId:", activeCharacterId)
        
        // 1. Obtener campañas donde el usuario es GM (sin filtrar por character_id)
        const { data: gmMembers, error: gmError } = await supabase
          .from("campaign_members")
          .select("campaign_id, role, character_id")
          .eq("user_id", user.id)
          .eq("role", "game_master")

        if (gmError) throw gmError
        console.log("[v0] loadCampaigns: GM members found:", gmMembers?.length || 0, gmMembers)

        // 2. Obtener campañas donde el personaje activo es player
        // Buscar con character_id específico
        const { data: playerMembersWithChar, error: playerError } = await supabase
          .from("campaign_members")
          .select("campaign_id, role, character_id")
          .eq("user_id", user.id)
          .eq("character_id", activeCharacterId)
          .eq("role", "player")

        if (playerError) {
          console.error("[v0] loadCampaigns: Error loading player members:", playerError)
          throw playerError
        }
        console.log("[v0] loadCampaigns: Player members found (with character_id):", playerMembersWithChar?.length || 0, playerMembersWithChar)

        // Solo usar playerMembers con character_id asignado
        // NO incluir registros legacy (character_id = NULL) porque son datos inconsistentes
        // y asignarlos automáticamente al personaje activo causaría que cualquier personaje
        // aparezca como player de campañas donde no lo es realmente
        const playerMembers = [...(playerMembersWithChar || [])]

        console.log("[v0] loadCampaigns: Total player members:", playerMembers.length, playerMembers)

        // Separar los roles: si una campaña tiene ambos roles, crear entradas separadas
        // Esto permite mostrarlas por separado en las pestañas "Como GM" y "Como Jugador"
        const allMembers: Array<{ campaign_id: string; role: string; character_id: string | null; is_gm: boolean; is_player: boolean }> = []
        
        // Agregar todas las campañas donde el usuario es GM (sin character_id)
        ;(gmMembers || []).forEach((m) => {
          allMembers.push({
            campaign_id: m.campaign_id,
            role: "game_master",
            character_id: null, // GM no tiene character_id
            is_gm: true,
            is_player: false
          })
        })
        
        // Agregar todas las campañas donde el personaje activo es player (con character_id)
        ;(playerMembers || []).forEach((m) => {
          allMembers.push({
            campaign_id: m.campaign_id,
            role: "player",
            character_id: m.character_id,
            is_gm: false,
            is_player: true
          })
        })

        allMemberData = allMembers
        console.log("[v0] loadCampaigns: Separated members (GM and Player as separate entries):", allMemberData.length, allMemberData.map(m => ({
          campaign_id: m.campaign_id,
          is_gm: m.is_gm,
          is_player: m.is_player,
          character_id: m.character_id
        })))
      } else {
        // Sin personaje activo: mostrar todas las campañas del usuario
        const { data, error: memberError } = await supabase
          .from("campaign_members")
          .select("campaign_id, role, character_id")
          .eq("user_id", user.id)

        if (memberError) throw memberError
        allMemberData = data || []
      }

      if (allMemberData.length === 0) {
        setCampaigns([])
        setLoading(false)
        return
      }

      const campaignIds = [...new Set(allMemberData.map((m) => m.campaign_id))]

      // Get campaign details
      const { data: campaignsData, error: campaignsError } = await supabase
        .from("campaigns")
        .select("*")
        .in("id", campaignIds)
        .order("created_at", { ascending: false })

      if (campaignsError) throw campaignsError

      // Crear entradas de campaña separadas para cada rol
      // Si una campaña tiene ambos roles (GM y Player), se crearán DOS entradas separadas
      const campaignsWithRole: Campaign[] = []
      
      // Obtener IDs únicos de campañas
      const uniqueCampaignIds = [...new Set(allMemberData.map((m) => m.campaign_id))]
      
      for (const campaignId of uniqueCampaignIds) {
        const campaign = campaignsData.find((c) => c.id === campaignId)
        if (!campaign) continue

        // Buscar todos los miembros de esta campaña (puede haber GM y/o Player)
        const members = allMemberData.filter((m) => m.campaign_id === campaignId)
        
        // Crear una entrada separada para cada rol
        for (const member of members) {
          console.log("[v0] loadCampaigns: Creating campaign entry", campaign.name, {
            role: member.role,
            is_gm: member.is_gm,
            is_player: member.is_player,
            character_id: member.character_id,
          })

          // Crear una entrada única para esta combinación de campaña + rol
          // Usar un ID compuesto para evitar duplicados si hay múltiples miembros del mismo tipo
          campaignsWithRole.push({
            ...campaign,
            id: `${campaign.id}_${member.role}_${member.character_id || 'gm'}`, // ID único para cada rol
            role: member.role,
            character_id: member.character_id || null,
            is_gm: member.is_gm,
            is_player: member.is_player,
          })
        }
      }
      
      console.log("[v0] loadCampaigns: Final campaigns with roles (separated):", campaignsWithRole.length, campaignsWithRole.map(c => ({
        name: c.name,
        id: c.id,
        is_gm: c.is_gm,
        is_player: c.is_player,
        character_id: c.character_id
      })))

      console.log("[v0] loadCampaigns: Final campaigns with roles:", campaignsWithRole.map(c => ({
        name: c.name,
        is_gm: c.is_gm,
        is_player: c.is_player,
        character_id: c.character_id
      })))

      setCampaigns(campaignsWithRole)
    } catch (err: any) {
      console.error("[v0] Error loading campaigns:", err)
      setError(err?.message || JSON.stringify(err) || "Failed to load campaigns")
    } finally {
      setLoading(false)
    }
  }

  const handleCreateCampaign = async () => {
    if (!user || !campaignName.trim()) return

    try {
      setError("")
      setSuccess("")

      // El GM no necesita un personaje activo - el GM es el usuario, no un personaje
      const { data, error: createError } = await supabase
        .from("campaigns")
        .insert({
          name: campaignName.trim(),
          description: campaignDescription.trim() || null,
          game_master_id: user.id,
        })
        .select()
        .single()

      if (createError) throw createError

      // GM tiene character_id: null porque el GM es el usuario, no un personaje
      const { error: memberError } = await supabase.from("campaign_members").upsert(
        {
          campaign_id: data.id,
          user_id: user.id,
          character_id: null, // GM es el usuario, no un personaje
          role: "game_master",
        },
        { onConflict: "campaign_id,user_id,character_id" },
      )

      if (memberError) throw memberError

      setSuccess(t.campaigns.campaignCreated || "Campaign created successfully!")
      setCampaignName("")
      setCampaignDescription("")
      setIsCreateDialogOpen(false)
      loadCampaigns()
    } catch (err: any) {
      console.error("[v0] Error creating campaign:", err)
      setError(err?.message || JSON.stringify(err) || "Failed to create campaign")
    }
  }

  const handleJoinCampaign = async () => {
    if (!user || !inviteCode.trim()) return

    try {
      setError("")
      setSuccess("")

      // Verificar que hay un personaje activo
      if (!activeCharacterId) {
        setError(t.campaigns.selectCharacterFirst || "Please select a character first to join the campaign")
        return
      }

      // Find campaign by invite code
      const { data: campaign, error: findError } = await supabase
        .from("campaigns")
        .select("id")
        .eq("invite_code", inviteCode.trim().toUpperCase())
        .single()

      if (findError || !campaign) {
        setError(t.campaigns.invalidInviteCode || "Invalid invite code")
        return
      }

      // Verificar si ya es miembro con este personaje
      const { data: existingMember } = await supabase
        .from("campaign_members")
        .select("id, role")
        .eq("campaign_id", campaign.id)
        .eq("user_id", user.id)
        .eq("character_id", activeCharacterId)
        .maybeSingle()

      if (existingMember) {
        setError(t.campaigns.alreadyMember || "This character is already a member of this campaign")
        return
      }

      const { error: joinError } = await supabase.from("campaign_members").insert({
        campaign_id: campaign.id,
        user_id: user.id,
        character_id: activeCharacterId,
        role: "player",
      })

      if (joinError) {
        if (joinError.code === "23505") {
          // Only show error if they're already a player with this character, GMs can be players too
          const { data: checkMember } = await supabase
            .from("campaign_members")
            .select("role")
            .eq("campaign_id", campaign.id)
            .eq("user_id", user.id)
            .eq("character_id", activeCharacterId)
            .maybeSingle()

          if (checkMember?.role === "player") {
            setError(t.campaigns.alreadyMember || "This character is already a member of this campaign")
          } else {
            setSuccess(t.campaigns.joinedCampaign || "Joined campaign successfully as a player!")
          }
        } else {
          throw joinError
        }
        return
      }

      setSuccess(t.campaigns.joinedCampaign || "Joined campaign successfully!")
      setInviteCode("")
      setIsJoinDialogOpen(false)
      loadCampaigns()
    } catch (err: any) {
      console.error("[v0] Error joining campaign:", err)
      setError(err.message)
    }
  }

  const handleViewCampaign = async (campaign: Campaign) => {
    // Extraer el ID real de la campaña (puede tener formato compuesto: campaignId_role_characterId)
    const realCampaignId = campaign.id.includes('_') ? campaign.id.split('_')[0] : campaign.id
    const campaignForView = { ...campaign, id: realCampaignId }
    setSelectedCampaign(campaignForView)

    try {
      // Load members using RPC function to avoid RLS recursion
      // This function returns all members if user is GM or member of the campaign
      let data: any[] | null = null
      let error: any = null
      
      // Try RPC function first - this is the preferred method
      const rpcResult = await supabase
        .rpc("get_campaign_members", { campaign_uuid: realCampaignId })
      
      data = rpcResult.data
      error = rpcResult.error
      
      // If RPC fails, check the error type
      if (error) {
        // If function doesn't exist (42883) or permission denied (42501), show helpful error
        if (error.code === "42883" || error.message?.includes("does not exist")) {
          setError("La función get_campaign_members no existe. Por favor ejecuta el script SQL 054 en Supabase.")
          return
        }
        
        if (error.code === "42501" || error.message?.includes("permission denied")) {
          setError("No tienes permisos para ejecutar la función. Verifica los permisos en Supabase.")
          return
        }
        
        // For other errors, try fallback but warn user
        const directResult = await supabase
          .from("campaign_members")
          .select("id, user_id, character_id, role, joined_at")
          .eq("campaign_id", realCampaignId)
        
        if (!directResult.error && directResult.data) {
          // Show warning to user that they're seeing limited data
          setError("Advertencia: Solo puedes ver tu propia membresía. La función RPC no está disponible. Por favor ejecuta el script SQL 054.")
          data = directResult.data
          error = null
        } else {
          throw directResult.error || error
        }
      }

      if (error) {
        throw error
      }

      // Ensure we have data array
      if (!data) {
        data = []
      }

      let membersWithEmails = data
      if (data.length > 0) {
        // Obtener información de perfiles y personajes
        const userIds = [...new Set(data.map((m) => m.user_id).filter((id): id is string => id !== null))]
        const characterIds = data.map((m) => m.character_id).filter((id): id is string => id !== null)

        // Load profiles and characters
        // Use RPC function for characters to bypass RLS (users can't see other users' characters)
        const profilesPromise = userIds.length > 0
          ? supabase
              .from("profiles")
              .select("id, display_name")
              .in("id", userIds)
          : Promise.resolve({ data: [], error: null })

        // Try RPC function first for characters
        let charactersPromise: Promise<any>
        if (characterIds.length > 0) {
          charactersPromise = supabase
            .rpc("get_campaign_character_names", {
              campaign_uuid: realCampaignId,
              character_ids: characterIds
            })
            .then((result) => {
              // If RPC fails, fallback to direct query (will be limited by RLS)
              if (result.error) {
                // Fallback: try direct query (limited by RLS - will only show own characters)
                return supabase
                  .from("characters")
                  .select("id, name")
                  .in("id", characterIds)
              }
              return result
            })
        } else {
          charactersPromise = Promise.resolve({ data: [], error: null })
        }

        const [profilesResult, charactersResult] = await Promise.all([
          profilesPromise,
          charactersPromise
        ])

        membersWithEmails = data.map((member) => {
          const profile = profilesResult.data?.find((p) => p.id === member.user_id)
          const character = member.character_id
            ? charactersResult.data?.find((c) => c.id === member.character_id)
            : null

          // Guardar los valores para usar en el renderizado
          const characterName = character?.name || null
          const playerName = profile?.display_name || null

          // Para GM: mostrar solo el nombre del usuario (el GM es el usuario, no un personaje)
          // Para Player: el formato completo se aplicará en el renderizado
          let displayName: string
          if (member.role === "game_master") {
            // GM: solo nombre del usuario
            displayName = playerName || member.user_id
          } else {
            // Player: el formato completo se aplicará en el renderizado
            // Por ahora solo guardamos el nombre del personaje o del usuario como fallback
            displayName = characterName || playerName || member.user_id
          }

          return {
            ...member,
            user_email: displayName, // Fallback para compatibilidad
            character_name: characterName,
            user_display_name: playerName,
          }
        })
      }

      setMembers(membersWithEmails)
      setIsViewDialogOpen(true)
    } catch (err: any) {
      console.error("[v0] Error loading members:", err)
      setError(err.message || t.campaigns.errorLoadingMembers || "Failed to load campaign members")
    }
  }

  const handleCopyInviteCode = (code: string) => {
    navigator.clipboard.writeText(code)
    setSuccess(t.campaigns.inviteCodeCopied || "Invite code copied!")
    // El mensaje desaparecerá automáticamente después de 5 segundos (manejado por useEffect)
  }

  const handleLeaveCampaign = async (campaignId: string) => {
    if (!user || !activeCharacterId) return

    if (!confirm(t.campaigns.confirmLeave || "Are you sure you want to leave this campaign?")) return

    try {
      // Extraer el ID real de la campaña (puede tener formato compuesto)
      const realCampaignId = campaignId.includes('_') ? campaignId.split('_')[0] : campaignId
      const { error } = await supabase
        .from("campaign_members")
        .delete()
        .eq("campaign_id", realCampaignId)
        .eq("user_id", user.id)
        .eq("character_id", activeCharacterId)

      if (error) throw error

      setSuccess(t.campaigns.leftCampaign || "Left campaign successfully")
      loadCampaigns()
      setIsViewDialogOpen(false)
    } catch (err: any) {
      console.error("[v0] Error leaving campaign:", err)
      setError(err.message)
    }
  }

  const handleDeleteCampaign = async (campaignId: string) => {
    if (!confirm(t.campaigns.confirmDelete || "Are you sure you want to delete this campaign?")) return

    try {
      // Extraer el ID real de la campaña (puede tener formato compuesto)
      const realCampaignId = campaignId.includes('_') ? campaignId.split('_')[0] : campaignId
      const { error } = await supabase.from("campaigns").delete().eq("id", realCampaignId)

      if (error) throw error

      setSuccess(t.campaigns.campaignDeleted || "Campaign deleted successfully")
      loadCampaigns()
      setIsViewDialogOpen(false)
    } catch (err: any) {
      console.error("[v0] Error deleting campaign:", err)
      setError(err.message)
    }
  }

  const handleRemoveMember = async (memberId: string, memberName: string) => {
    if (!selectedCampaign) return
    
    if (!confirm(t.campaigns.confirmRemoveMember?.replace("{name}", memberName) || `Are you sure you want to remove ${memberName} from this campaign?`)) return

    try {
      setError("")
      setSuccess("")

      const { error } = await supabase
        .from("campaign_members")
        .delete()
        .eq("id", memberId)

      if (error) throw error

      setSuccess(t.campaigns.memberRemoved || "Member removed successfully")
      
      // Recargar los miembros de la campaña
      await handleViewCampaign(selectedCampaign)
      
      // Recargar la lista de campañas
      loadCampaigns()
    } catch (err: any) {
      console.error("[v0] Error removing member:", err)
      setError(err.message || t.campaigns.errorRemovingMember || "Failed to remove member")
    }
  }

  const isGM = (campaign: Campaign) => campaign.is_gm === true || campaign.role === "game_master"

  if (loading) {
    return (
      <div className="w-full max-w-6xl mx-auto p-6">
        <div className="text-center">{t.campaigns.loading || "Loading campaigns..."}</div>
      </div>
    )
  }

  return (
    <div className="w-full max-w-6xl mx-auto p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-3xl font-bold">{t.campaigns.title || "Campaigns"}</h2>
          <p className="text-muted-foreground">
            {activeCharacterId
              ? `${t.campaigns.subtitle || "Manage your D&D campaigns"} - ${t.campaigns.filteredByCharacter || "Filtered by active character"}`
              : t.campaigns.subtitle || "Manage your D&D campaigns"}
          </p>
          {!activeCharacterId && (
            <Alert className="mt-2">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                {t.campaigns.selectCharacterToView || "Please select a character to view their campaigns"}
              </AlertDescription>
            </Alert>
          )}
        </div>
        <div className="flex gap-2">
          <Button onClick={() => setIsJoinDialogOpen(true)}>
            <UserPlus className="w-4 h-4 mr-2" />
            {t.campaigns.joinCampaign || "Join Campaign"}
          </Button>
          <Button onClick={() => setIsCreateDialogOpen(true)}>{t.campaigns.createCampaign || "Create Campaign"}</Button>
        </div>
      </div>

      {error && (
        <Alert variant="destructive" className="mb-4">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {success && (
        <Alert className="mb-4 bg-green-50 text-green-900 border-green-200">
          <AlertDescription>{success}</AlertDescription>
        </Alert>
      )}

      <Tabs defaultValue="gm" className="w-full">
        <TabsList>
          <TabsTrigger value="gm">{t.campaigns.asGM || "As Game Master"}</TabsTrigger>
          <TabsTrigger value="player">{t.campaigns.asPlayer || "As Player"}</TabsTrigger>
        </TabsList>

        <TabsContent value="gm" className="mt-6">
          {/* Campaign List */}
          <div className="space-y-4">
            {loading ? (
              <Card>
                <CardContent className="pt-6">{t.campaigns.loading || "Loading campaigns..."}</CardContent>
              </Card>
            ) : campaigns.length === 0 ? (
              <Card>
                <CardContent className="pt-6">
                  {t.campaigns.noCampaigns || "You are not part of any campaigns yet."}
                </CardContent>
              </Card>
            ) : (
              campaigns
                .filter((c) => isGM(c))
                .map((campaign) => (
                  <Card
                    key={campaign.id}
                    className="cursor-pointer hover:bg-accent"
                    onClick={() => handleViewCampaign(campaign)}
                  >
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div>
                          <div className="flex items-center gap-2 flex-wrap">
                            <CardTitle>{campaign.name}</CardTitle>
                            {campaign.is_gm && (
                              <Badge variant="default">
                                <span className="flex items-center gap-1">
                                  <Crown className="h-3 w-3" /> GM
                                </span>
                              </Badge>
                            )}
                            {campaign.is_player && (
                              <Badge variant="secondary">
                                <span>
                                  {t.campaigns.player || "Player"}
                                  {campaign.character_id && activeCharacter?.id === campaign.character_id && activeCharacter?.name
                                    ? ` (${activeCharacter.name})`
                                    : ""}
                                </span>
                              </Badge>
                            )}
                          </div>
                          <CardDescription>{campaign.description}</CardDescription>
                        </div>
                        {campaign.is_gm && (
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
                        )}
                      </div>
                    </CardHeader>
                  </Card>
                ))
            )}
          </div>
        </TabsContent>

        <TabsContent value="player" className="mt-6">
          {/* Campaign List */}
          <div className="space-y-4">
            {loading ? (
              <Card>
                <CardContent className="pt-6">{t.campaigns.loading || "Loading campaigns..."}</CardContent>
              </Card>
            ) : campaigns.length === 0 ? (
              <Card>
                <CardContent className="pt-6">
                  {t.campaigns.noCampaigns || "You are not part of any campaigns yet."}
                </CardContent>
              </Card>
            ) : (() => {
              const playerCampaigns = campaigns.filter((c) => c.is_player && !c.is_gm)
              return playerCampaigns.length === 0 ? (
                <Card>
                  <CardContent className="pt-6 text-center">
                    {t.campaigns.noPlayerCampaigns || "You are not a player in any campaigns yet. Join a campaign to get started!"}
                  </CardContent>
                </Card>
              ) : (
                playerCampaigns.map((campaign) => (
                  <Card
                    key={campaign.id}
                    className="cursor-pointer hover:bg-accent"
                    onClick={() => handleViewCampaign(campaign)}
                  >
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div>
                          <div className="flex items-center gap-2 flex-wrap">
                            <CardTitle>{campaign.name}</CardTitle>
                            {campaign.is_player && (
                              <Badge variant="secondary">
                                <span>
                                  {t.campaigns.player || "Player"}
                                  {campaign.character_id && activeCharacter?.id === campaign.character_id && activeCharacter?.name
                                    ? ` (${activeCharacter.name})`
                                    : ""}
                                </span>
                              </Badge>
                            )}
                          </div>
                          <CardDescription>{campaign.description}</CardDescription>
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
              {t.campaigns.createCampaign || "Create New Campaign"}
            </DialogTitle>
            <DialogDescription className="text-base pt-2">
              {t.campaigns.createDescription || "Create a new campaign and invite players"}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-5 py-4">
            <div className="space-y-2">
              <Label htmlFor="name" className="text-sm font-semibold">
                {t.campaigns.campaignName || "Campaign Name"}
              </Label>
              <Input
                id="name"
                value={campaignName}
                onChange={(e) => setCampaignName(e.target.value)}
                placeholder={t.campaigns.namePlaceholder || "Enter campaign name"}
                className="h-10 border-2 focus:border-primary transition-colors"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="description" className="text-sm font-semibold">
                {t.campaigns.description || "Description"}
              </Label>
              <Textarea
                id="description"
                value={campaignDescription}
                onChange={(e) => setCampaignDescription(e.target.value)}
                placeholder={t.campaigns.descriptionPlaceholder || "Describe your campaign"}
                rows={4}
                className="border-2 focus:border-primary transition-colors resize-none"
              />
            </div>
            <Button
              onClick={handleCreateCampaign}
              className="w-full h-11 text-base font-semibold mt-2"
              disabled={!campaignName.trim()}
            >
              {t.campaigns.create || "Create"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Join Campaign Dialog */}
      <Dialog open={isJoinDialogOpen} onOpenChange={setIsJoinDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t.campaigns.joinCampaign || "Join Campaign"}</DialogTitle>
            <DialogDescription>
              {t.campaigns.joinDescription || "Enter the invite code to join a campaign"}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="inviteCode">{t.campaigns.inviteCode || "Invite Code"}</Label>
              <Input
                id="inviteCode"
                value={inviteCode}
                onChange={(e) => setInviteCode(e.target.value.toUpperCase())}
                placeholder="XXXXXXXX"
                maxLength={8}
              />
            </div>
            <Button onClick={handleJoinCampaign} className="w-full" disabled={!inviteCode.trim()}>
              {t.campaigns.join || "Join"}
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
                {selectedCampaign.description || t.campaigns.noDescription || "No description"}
              </DialogDescription>
            </DialogHeader>

            <Tabs defaultValue="overview" className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="overview">{t.campaigns.overview || "Overview"}</TabsTrigger>
                <TabsTrigger value="members">{t.campaigns.members || "Members"}</TabsTrigger>
              </TabsList>

              <TabsContent value="overview" className="space-y-4">
                <div>
                  <h4 className="font-semibold mb-2">{t.campaigns.description || "Description"}</h4>
                  <p>{selectedCampaign.description || t.campaigns.noDescription || "No description provided"}</p>
                </div>

                {selectedCampaign.is_gm && (
                  <div>
                    <h4 className="font-semibold mb-2">{t.campaigns.inviteCode || "Invite Code"}</h4>
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
                  <LogOut className="h-4 w-4 mr-2" /> {t.campaigns.leave || "Leave Campaign"}
                </Button>
              </TabsContent>

              <TabsContent value="members" className="space-y-4">
                <div className="flex justify-between items-center mb-4">
                  <h4 className="font-semibold">{t.campaigns.members || "Members"}</h4>
                </div>
                {members.length === 0 ? (
                  <p>{t.campaigns.noMembers || "No members in this campaign"}</p>
                ) : (
                  <div className="space-y-2">
                    {members.map((member) => {
                      // Formatear el nombre según el rol
                      let displayText: string
                      if (member.role === "game_master") {
                        // GM: solo nombre del usuario (el GM es el usuario, no un personaje)
                        displayText = member.user_display_name || member.user_email || member.user_id
                      } else {
                        // Player: SIEMPRE mostrar "nombre del personaje (nombre del jugador)"
                        // Si no hay personaje, mostrar solo el nombre del jugador
                        const characterName = member.character_name
                        const playerName = member.user_display_name
                        
                        // Prioridad: characterName (playerName) > characterName > playerName > fallback
                        if (characterName && playerName) {
                          // Formato deseado: "Nombre del Personaje (Nombre del Jugador)"
                          displayText = `${characterName} (${playerName})`
                        } else if (characterName) {
                          // Solo hay nombre de personaje, sin nombre de jugador
                          displayText = characterName
                        } else if (playerName) {
                          // Solo hay nombre de jugador, sin personaje (caso raro pero posible)
                          displayText = playerName
                        } else {
                          // Fallback: usar user_email o user_id
                          displayText = member.user_email || member.user_id
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
                                <span>{t.campaigns.player || "Player"}</span>
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
                                  ? `${member.character_name} (${member.user_display_name || member.user_email || 'this member'})`
                                  : member.user_email || "this member"
                                handleRemoveMember(member.id, memberName)
                              }}
                              title={t.campaigns.removeMember || "Remove member"}
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
            </Tabs>
          </DialogContent>
        </Dialog>
      )}
    </div>
  )
}
