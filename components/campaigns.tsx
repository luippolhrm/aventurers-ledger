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
import { AlertCircle, Copy, Crown, Trash2, UserPlus, LogOut, Mail, Check, X } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { createBrowserClient } from "@/lib/supabase/client"
import { useAuth } from "@/lib/auth-context"
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
  creator_name?: string // Nombre del creador (GM)
}

interface CampaignMember {
  id: string
  user_id: string
  role: string
  joined_at: string
  user_email?: string
}

interface CampaignInvitation {
  id: string
  campaign_id: string
  inviter_id: string
  invitee_id: string | null
  invitee_email: string
  status: "pending" | "accepted" | "rejected" | "cancelled"
  message: string | null
  created_at: string
  campaign_name?: string
  inviter_name?: string
}

interface CampaignsProps {
  language: Language
}

export function Campaigns({ language }: CampaignsProps) {
  const t = translations[language]
  const { user } = useAuth()
  const supabase = createBrowserClient()

  const [campaigns, setCampaigns] = useState<Campaign[]>([])
  const [allAvailableCampaigns, setAllAvailableCampaigns] = useState<Campaign[]>([]) // Todas las campañas disponibles
  const [pendingInvitations, setPendingInvitations] = useState<CampaignInvitation[]>([]) // Invitaciones pendientes
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [isJoinDialogOpen, setIsJoinDialogOpen] = useState(false)
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false)
  const [isInviteDialogOpen, setIsInviteDialogOpen] = useState(false)
  const [selectedCampaign, setSelectedCampaign] = useState<Campaign | null>(null)
  const [members, setMembers] = useState<CampaignMember[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")

  // Form states
  const [campaignName, setCampaignName] = useState("")
  const [campaignDescription, setCampaignDescription] = useState("")
  const [inviteCode, setInviteCode] = useState("")
  
  // Invitation states
  const [inviteEmail, setInviteEmail] = useState("")
  const [inviteMessage, setInviteMessage] = useState("")

  useEffect(() => {
    loadCampaigns()
    loadAllAvailableCampaigns()
    loadPendingInvitations()
  }, [])

  const loadCampaigns = async () => {
    if (!user) return

    try {
      setLoading(true)

      // Get campaigns where user is a member
      const { data: memberData, error: memberError } = await supabase
        .from("campaign_members")
        .select("campaign_id, role")
        .eq("user_id", user.id)

      if (memberError) throw memberError

      const campaignIds = memberData.map((m) => m.campaign_id)

      if (campaignIds.length === 0) {
        setCampaigns([])
        setLoading(false)
        return
      }

      // Get campaign details
      const { data: campaignsData, error: campaignsError } = await supabase
        .from("campaigns")
        .select("*")
        .in("id", campaignIds)
        .order("created_at", { ascending: false })

      if (campaignsError) throw campaignsError

      // Attach role to each campaign
      const campaignsWithRole = campaignsData.map((campaign) => ({
        ...campaign,
        role: memberData.find((m) => m.campaign_id === campaign.id)?.role,
      }))

      setCampaigns(campaignsWithRole)
    } catch (err: any) {
      console.error("[v0] Error loading campaigns:", err)
      setError(err?.message || JSON.stringify(err) || "Failed to load campaigns")
    } finally {
      setLoading(false)
    }
  }

  const loadAllAvailableCampaigns = async () => {
    if (!user) return

    try {
      // Verificar si el usuario tiene personajes creados
      const { data: characters, error: charactersError } = await supabase
        .from("characters")
        .select("id")
        .eq("user_id", user.id)
        .limit(1)

      if (charactersError) {
        console.error("[v0] Error checking characters:", charactersError)
        return
      }

      // Si no tiene personajes, no mostrar campañas disponibles
      if (!characters || characters.length === 0) {
        setAllAvailableCampaigns([])
        return
      }

      // Obtener todas las campañas activas (donde el usuario NO es miembro)
      const { data: memberData } = await supabase
        .from("campaign_members")
        .select("campaign_id")
        .eq("user_id", user.id)

      const userCampaignIds = memberData?.map((m) => m.campaign_id) || []

      // Obtener todas las campañas activas
      const { data: allCampaigns, error: campaignsError } = await supabase
        .from("campaigns")
        .select("*, game_master_id")
        .eq("status", "active")
        .order("created_at", { ascending: false })

      if (campaignsError) {
        console.error("[v0] Error loading all campaigns:", campaignsError)
        return
      }

      // Filtrar campañas donde el usuario NO es miembro
      const availableCampaigns = (allCampaigns || []).filter(
        (campaign) => !userCampaignIds.includes(campaign.id)
      )

      // Obtener información de los creadores (game masters)
      const creatorIds = [...new Set(availableCampaigns.map((c) => c.game_master_id))]
      
      if (creatorIds.length > 0) {
        // Intentar obtener profiles (puede fallar si RLS está habilitado)
        const { data: profiles, error: profilesError } = await supabase
          .from("profiles")
          .select("id, display_name")
          .in("id", creatorIds)

        // Si hay error de RLS, usar fallback
        if (profilesError) {
          console.warn("[v0] Could not load creator profiles (RLS restriction):", profilesError)
        }

        // Agregar nombre del creador a cada campaña
        const campaignsWithCreator = availableCampaigns.map((campaign) => ({
          ...campaign,
          creator_name: profiles?.find((p) => p.id === campaign.game_master_id)?.display_name || t.campaigns.gameMaster || "Game Master",
        }))

        setAllAvailableCampaigns(campaignsWithCreator)
      } else {
        setAllAvailableCampaigns([])
      }
    } catch (err: any) {
      console.error("[v0] Error loading all available campaigns:", err)
    }
  }

  const handleCreateCampaign = async () => {
    if (!user || !campaignName.trim()) return

    try {
      setError("")
      setSuccess("")

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

      const { error: memberError } = await supabase.from("campaign_members").upsert(
        {
          campaign_id: data.id,
          user_id: user.id,
          role: "game_master",
        },
        { onConflict: "campaign_id,user_id" },
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

      const { data: existingMember } = await supabase
        .from("campaign_members")
        .select("id, role")
        .eq("campaign_id", campaign.id)
        .eq("user_id", user.id)
        .eq("role", "player")
        .single()

      if (existingMember) {
        setError(t.campaigns.alreadyMember || "You are already a member of this campaign")
        return
      }

      const { error: joinError } = await supabase.from("campaign_members").insert({
        campaign_id: campaign.id,
        user_id: user.id,
        role: "player",
      })

      if (joinError) {
        if (joinError.code === "23505") {
          // Only show error if they're already a player, GMs can be players too
          const { data: checkMember } = await supabase
            .from("campaign_members")
            .select("role")
            .eq("campaign_id", campaign.id)
            .eq("user_id", user.id)
            .single()

          if (checkMember?.role === "player") {
            setError(t.campaigns.alreadyMember || "You are already a member of this campaign")
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
      loadAllAvailableCampaigns() // Recargar campañas disponibles
    } catch (err: any) {
      console.error("[v0] Error joining campaign:", err)
      setError(err.message)
    }
  }

  const handleViewCampaign = async (campaign: Campaign) => {
    setSelectedCampaign(campaign)

    try {
      // Load members
      const { data, error } = await supabase
        .from("campaign_members")
        .select("id, user_id, role, joined_at")
        .eq("campaign_id", campaign.id)

      if (error) throw error

      let membersWithEmails = data
      if (data && data.length > 0) {
        const { data: profiles } = await supabase
          .from("profiles")
          .select("id, display_name")
          .in(
            "id",
            data.map((m) => m.user_id),
          )

        membersWithEmails = data.map((member) => ({
          ...member,
          user_email: profiles?.find((p) => p.id === member.user_id)?.display_name || member.user_id,
        }))
      }

      setMembers(membersWithEmails)
      setIsViewDialogOpen(true)
    } catch (err: any) {
      console.error("[v0] Error loading members:", err)
      setError(err.message)
    }
  }

  const handleCopyInviteCode = (code: string) => {
    navigator.clipboard.writeText(code)
    setSuccess(t.campaigns.inviteCodeCopied || "Invite code copied!")
    setTimeout(() => setSuccess(""), 2000)
  }

  const handleLeaveCampaign = async (campaignId: string) => {
    if (!user) return

    if (!confirm(t.campaigns.confirmLeave || "Are you sure you want to leave this campaign?")) return

    try {
      const { error } = await supabase
        .from("campaign_members")
        .delete()
        .eq("campaign_id", campaignId)
        .eq("user_id", user.id)

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
      const { error } = await supabase.from("campaigns").delete().eq("id", campaignId)

      if (error) throw error

      setSuccess(t.campaigns.campaignDeleted || "Campaign deleted successfully")
      loadCampaigns()
      setIsViewDialogOpen(false)
    } catch (err: any) {
      console.error("[v0] Error deleting campaign:", err)
      setError(err.message)
    }
  }

  const loadPendingInvitations = async () => {
    if (!user) return

    try {
      // Obtener email del usuario actual
      const { data: userData } = await supabase.auth.getUser()
      const userEmail = userData?.user?.email?.toLowerCase()

      if (!userEmail) {
        setPendingInvitations([])
        return
      }

      // Buscar invitaciones por invitee_id O por invitee_email
      const { data, error } = await supabase
        .from("campaign_invitations")
        .select("*")
        .or(`invitee_id.eq.${user.id},invitee_email.eq.${userEmail}`)
        .eq("status", "pending")
        .order("created_at", { ascending: false })

      if (error) throw error

      if (!data || data.length === 0) {
        setPendingInvitations([])
        return
      }

      // Obtener información de campañas e invitadores
      const campaignIds = [...new Set(data.map((inv: any) => inv.campaign_id))]
      const inviterIds = [...new Set(data.map((inv: any) => inv.inviter_id))]

      const [campaignsData, profilesData] = await Promise.all([
        supabase
          .from("campaigns")
          .select("id, name")
          .in("id", campaignIds),
        supabase
          .from("profiles")
          .select("id, display_name")
          .in("id", inviterIds),
      ])

      const invitations = data.map((inv: any) => ({
        ...inv,
        campaign_name: campaignsData.data?.find((c) => c.id === inv.campaign_id)?.name || "Unknown Campaign",
        inviter_name:
          profilesData.data?.find((p) => p.id === inv.inviter_id)?.display_name ||
          "Unknown",
      }))

      setPendingInvitations(invitations)
    } catch (err: any) {
      console.error("[v0] Error loading pending invitations:", err)
    }
  }

  const searchUsers = async (query: string) => {
    if (!query.trim() || query.length < 2) {
      setSearchResults([])
      return
    }

    try {
      setIsSearching(true)
      // Buscar usuarios por email en auth.users (necesitamos usar una función o RPC)
      // Alternativamente, buscar en profiles usando display_name o email si está disponible
      // Por ahora, usaremos una búsqueda simple que el usuario ingrese el email completo
      setSearchResults([])
    } catch (err: any) {
      console.error("[v0] Error searching users:", err)
      setError(t.campaigns.searchError || "Error searching users")
    } finally {
      setIsSearching(false)
    }
  }

  const handleSendInvitation = async () => {
    if (!user || !selectedCampaign || !inviteEmail.trim()) return

    try {
      setError("")
      setSuccess("")

      const email = inviteEmail.trim().toLowerCase()

      // Validar formato de email básico
      if (!email.includes("@") || !email.includes(".")) {
        setError(t.campaigns.invalidEmail || "Invalid email format")
        return
      }

      // Buscar usuario por email usando RPC o función
      // Primero intentar encontrar el usuario por email
      const { data: authUsers, error: searchError } = await supabase.rpc("get_user_by_email", {
        user_email: email
      }).catch(() => {
        // Si la función no existe, buscar en profiles (si tienen email)
        // Por ahora, crear invitación solo con email
        return { data: null, error: null }
      })

      let inviteeId: string | null = null
      if (authUsers && authUsers.length > 0) {
        inviteeId = authUsers[0].id
        
        // Verificar que no es el mismo usuario
        if (inviteeId === user.id) {
          setError(t.campaigns.cannotInviteYourself || "You cannot invite yourself")
          return
        }

        // Verificar que no es ya miembro
        const { data: existingMember } = await supabase
          .from("campaign_members")
          .select("id")
          .eq("campaign_id", selectedCampaign.id)
          .eq("user_id", inviteeId)
          .single()

        if (existingMember) {
          setError(t.campaigns.userAlreadyMember || "User is already a member of this campaign")
          return
        }

        // Verificar que no hay invitación pendiente
        const { data: existingInvitation } = await supabase
          .from("campaign_invitations")
          .select("id")
          .eq("campaign_id", selectedCampaign.id)
          .eq("invitee_id", inviteeId)
          .eq("status", "pending")
          .single()

        if (existingInvitation) {
          setError(t.campaigns.invitationAlreadySent || "Invitation already sent to this user")
          return
        }
      } else {
        // Verificar si ya hay invitación pendiente para este email
        const { data: existingInvitation } = await supabase
          .from("campaign_invitations")
          .select("id")
          .eq("campaign_id", selectedCampaign.id)
          .eq("invitee_email", email)
          .eq("status", "pending")
          .single()

        if (existingInvitation) {
          setError(t.campaigns.invitationAlreadySent || "Invitation already sent to this email")
          return
        }
      }

      // Crear invitación (con o sin invitee_id)
      const { error: inviteError } = await supabase
        .from("campaign_invitations")
        .insert({
          campaign_id: selectedCampaign.id,
          inviter_id: user.id,
          invitee_id: inviteeId,
          invitee_email: email,
          message: inviteMessage.trim() || null,
        })

      if (inviteError) throw inviteError

      setSuccess(t.campaigns.invitationSent || "Invitation sent successfully!")
      setInviteEmail("")
      setInviteMessage("")
      setIsInviteDialogOpen(false)
      loadPendingInvitations()
    } catch (err: any) {
      console.error("[v0] Error sending invitation:", err)
      setError(err?.message || t.campaigns.invitationError || "Failed to send invitation")
    }
  }

  const handleAcceptInvitation = async (invitationId: string) => {
    if (!user) return

    try {
      setError("")
      setSuccess("")

      // Obtener la invitación
      const { data: invitation, error: fetchError } = await supabase
        .from("campaign_invitations")
        .select("*")
        .eq("id", invitationId)
        .eq("status", "pending")
        .single()

      if (fetchError || !invitation) {
        setError(t.campaigns.invitationNotFound || "Invitation not found or already processed")
        return
      }

      // Verificar que el usuario coincide (por ID o email)
      const { data: userData } = await supabase.auth.getUser()
      const userEmail = userData?.user?.email?.toLowerCase()

      if (invitation.invitee_id && invitation.invitee_id !== user.id) {
        setError(t.campaigns.invitationNotFound || "This invitation is not for you")
        return
      }

      if (invitation.invitee_email && invitation.invitee_email.toLowerCase() !== userEmail) {
        setError(t.campaigns.invitationNotFound || "This invitation is not for your email")
        return
      }

      // Verificar que no es ya miembro
      const { data: existingMember } = await supabase
        .from("campaign_members")
        .select("id")
        .eq("campaign_id", invitation.campaign_id)
        .eq("user_id", user.id)
        .single()

      if (existingMember) {
        // Ya es miembro, solo marcar invitación como aceptada
        await supabase
          .from("campaign_invitations")
          .update({ status: "accepted", invitee_id: user.id })
          .eq("id", invitationId)
        
        setSuccess(t.campaigns.invitationAccepted || "Invitation accepted! You are already a member.")
        loadPendingInvitations()
        return
      }

      // Agregar como miembro
      const { error: memberError } = await supabase
        .from("campaign_members")
        .insert({
          campaign_id: invitation.campaign_id,
          user_id: user.id,
          role: "player",
        })

      if (memberError) throw memberError

      // Marcar invitación como aceptada y actualizar invitee_id si estaba vacío
      await supabase
        .from("campaign_invitations")
        .update({ status: "accepted", invitee_id: user.id })
        .eq("id", invitationId)

      setSuccess(t.campaigns.invitationAccepted || "Invitation accepted! You are now a member.")
      loadPendingInvitations()
      loadCampaigns()
      loadAllAvailableCampaigns()
    } catch (err: any) {
      console.error("[v0] Error accepting invitation:", err)
      setError(err?.message || t.campaigns.invitationError || "Failed to accept invitation")
    }
  }

  const handleRejectInvitation = async (invitationId: string) => {
    if (!user) return

    try {
      setError("")
      setSuccess("")

      const { error } = await supabase
        .from("campaign_invitations")
        .update({ status: "rejected" })
        .eq("id", invitationId)
        .eq("invitee_id", user.id)

      if (error) throw error

      setSuccess(t.campaigns.invitationRejected || "Invitation rejected")
      loadPendingInvitations()
    } catch (err: any) {
      console.error("[v0] Error rejecting invitation:", err)
      setError(err?.message || t.campaigns.invitationError || "Failed to reject invitation")
    }
  }

  const isGM = (campaign: Campaign) => campaign.role === "game_master"

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
          <p className="text-muted-foreground">{t.campaigns.subtitle || "Manage your D&D campaigns"}</p>
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

      <Tabs defaultValue="all" className="w-full">
        <TabsList>
          <TabsTrigger value="all">{t.campaigns.allCampaigns || "All Campaigns"}</TabsTrigger>
          <TabsTrigger value="gm">{t.campaigns.asGM || "As Game Master"}</TabsTrigger>
          <TabsTrigger value="player">{t.campaigns.asPlayer || "As Player"}</TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="mt-6">
          {/* Campaign List - Todas las campañas disponibles */}
          <div className="space-y-4">
            {/* Invitaciones pendientes */}
            {pendingInvitations.length > 0 && (
              <div className="space-y-4 mb-6">
                <h3 className="text-lg font-semibold">{t.campaigns.pendingInvitations || "Pending Invitations"}</h3>
                {pendingInvitations.map((invitation) => (
                  <Card key={invitation.id} className="border-2 border-primary/20">
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <CardTitle>{invitation.campaign_name}</CardTitle>
                            <Badge variant="outline">
                              <Mail className="h-3 w-3 mr-1" />
                              {t.campaigns.invitation || "Invitation"}
                            </Badge>
                          </div>
                          <CardDescription className="mb-2">
                            {t.campaigns.invitedBy || "Invited by"}: {invitation.inviter_name}
                          </CardDescription>
                          {invitation.message && (
                            <p className="text-sm text-muted-foreground mb-2">{invitation.message}</p>
                          )}
                        </div>
                        <div className="flex gap-2">
                          <Button
                            variant="default"
                            size="sm"
                            onClick={() => handleAcceptInvitation(invitation.id)}
                          >
                            <Check className="h-4 w-4 mr-2" />
                            {t.campaigns.accept || "Accept"}
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleRejectInvitation(invitation.id)}
                          >
                            <X className="h-4 w-4 mr-2" />
                            {t.campaigns.reject || "Reject"}
                          </Button>
                        </div>
                      </div>
                    </CardHeader>
                  </Card>
                ))}
              </div>
            )}

            {/* Campañas donde el usuario es miembro */}
            {campaigns.length > 0 && (
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">{t.campaigns.myCampaigns || "My Campaigns"}</h3>
                {campaigns.map((campaign) => (
                  <Card
                    key={campaign.id}
                    className="cursor-pointer hover:bg-accent"
                    onClick={() => handleViewCampaign(campaign)}
                  >
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div>
                          <div className="flex items-center gap-2">
                            <CardTitle>{campaign.name}</CardTitle>
                            <Badge variant={campaign.role === "game_master" ? "default" : "secondary"}>
                              {campaign.role === "game_master" ? (
                                <span className="flex items-center gap-1">
                                  <Crown className="h-3 w-3" /> GM
                                </span>
                              ) : (
                                <span>{t.campaigns.player || "Player"}</span>
                              )}
                            </Badge>
                          </div>
                          <CardDescription>{campaign.description}</CardDescription>
                        </div>
                        {campaign.role === "game_master" && (
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
                ))}
              </div>
            )}

            {/* Campañas disponibles para unirse */}
            {allAvailableCampaigns.length > 0 && (
              <div className="space-y-4 mt-6">
                <h3 className="text-lg font-semibold">{t.campaigns.availableCampaigns || "Available Campaigns"}</h3>
                {allAvailableCampaigns.map((campaign) => (
                  <Card
                    key={campaign.id}
                    className="cursor-pointer hover:bg-accent border-2 border-primary/20"
                    onClick={() => {
                      setInviteCode(campaign.invite_code || "")
                      setIsJoinDialogOpen(true)
                    }}
                  >
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <CardTitle>{campaign.name}</CardTitle>
                            <Badge variant="outline">
                              <Crown className="h-3 w-3 mr-1" />
                              {t.campaigns.createdBy || "Created by"}: {campaign.creator_name || "Unknown"}
                            </Badge>
                          </div>
                          <CardDescription className="mb-2">{campaign.description}</CardDescription>
                          <div className="text-sm text-muted-foreground">
                            {t.campaigns.inviteCode || "Invite Code"}: <code className="bg-muted px-2 py-1 rounded">{campaign.invite_code}</code>
                          </div>
                        </div>
                        <Button
                          variant="default"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation()
                            setInviteCode(campaign.invite_code || "")
                            setIsJoinDialogOpen(true)
                          }}
                        >
                          <UserPlus className="h-4 w-4 mr-2" />
                          {t.campaigns.join || "Join"}
                        </Button>
                      </div>
                    </CardHeader>
                  </Card>
                ))}
              </div>
            )}

            {/* Estado vacío */}
            {!loading && campaigns.length === 0 && allAvailableCampaigns.length === 0 && (
              <Card>
                <CardContent className="pt-6">
                  {t.campaigns.noCampaigns || "You are not part of any campaigns yet."}
                  {allAvailableCampaigns.length === 0 && (
                    <p className="text-sm text-muted-foreground mt-2">
                      {t.campaigns.createCharacterFirst || "Create a character first to see available campaigns."}
                    </p>
                  )}
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>

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
                          <div className="flex items-center gap-2">
                            <CardTitle>{campaign.name}</CardTitle>
                            <Badge variant={campaign.role === "game_master" ? "default" : "secondary"}>
                              {campaign.role === "game_master" ? (
                                <span className="flex items-center gap-1">
                                  <Crown className="h-3 w-3" /> GM
                                </span>
                              ) : (
                                <span>{t.campaigns.player || "Player"}</span>
                              )}
                            </Badge>
                          </div>
                          <CardDescription>{campaign.description}</CardDescription>
                        </div>
                        {campaign.role === "game_master" && (
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
            ) : (
              campaigns
                .filter((c) => !isGM(c))
                .map((campaign) => (
                  <Card
                    key={campaign.id}
                    className="cursor-pointer hover:bg-accent"
                    onClick={() => handleViewCampaign(campaign)}
                  >
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div>
                          <div className="flex items-center gap-2">
                            <CardTitle>{campaign.name}</CardTitle>
                            <Badge variant={campaign.role === "game_master" ? "default" : "secondary"}>
                              {campaign.role === "game_master" ? (
                                <span className="flex items-center gap-1">
                                  <Crown className="h-3 w-3" /> GM
                                </span>
                              ) : (
                                <span>{t.campaigns.player || "Player"}</span>
                              )}
                            </Badge>
                          </div>
                          <CardDescription>{campaign.description}</CardDescription>
                        </div>
                      </div>
                    </CardHeader>
                  </Card>
                ))
            )}
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
                {isGM(selectedCampaign) && (
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
                {selectedCampaign.role === "game_master" && (
                  <TabsTrigger value="members">{t.campaigns.members || "Members"}</TabsTrigger>
                )}
              </TabsList>

              <TabsContent value="overview" className="space-y-4">
                <div>
                  <h4 className="font-semibold mb-2">{t.campaigns.description || "Description"}</h4>
                  <p>{selectedCampaign.description || t.campaigns.noDescription || "No description provided"}</p>
                </div>

                {selectedCampaign.role === "game_master" && (
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

              {selectedCampaign.role === "game_master" && (
                <TabsContent value="members" className="space-y-4">
                  <div className="flex justify-between items-center mb-4">
                    <h4 className="font-semibold">{t.campaigns.members || "Members"}</h4>
                    <Button
                      variant="default"
                      size="sm"
                      onClick={() => setIsInviteDialogOpen(true)}
                    >
                      <UserPlus className="h-4 w-4 mr-2" />
                      {t.campaigns.invitePlayer || "Invite Player"}
                    </Button>
                  </div>
                  {members.length === 0 ? (
                    <p>{t.campaigns.noMembers || "No members in this campaign"}</p>
                  ) : (
                    <div className="space-y-2">
                      {members.map((member) => (
                        <div key={member.id} className="flex items-center justify-between p-2 bg-muted rounded">
                          <div className="flex items-center gap-2">
                            <span>{member.user_email}</span>
                            <Badge variant={member.role === "game_master" ? "default" : "secondary"}>
                              {member.role === "game_master" ? (
                                <span className="flex items-center gap-1">
                                  <Crown className="h-3 w-3" /> GM
                                </span>
                              ) : (
                                member.role
                              )}
                            </Badge>
                          </div>
                          {member.role !== "game_master" && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                // Future: implement kick member functionality
                              }}
                            >
                              <UserPlus className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </TabsContent>
              )}
            </Tabs>
          </DialogContent>
        </Dialog>
      )}

      {/* Invite Player Dialog */}
      <Dialog open={isInviteDialogOpen} onOpenChange={setIsInviteDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{t.campaigns.invitePlayer || "Invite Player"}</DialogTitle>
            <DialogDescription>
              {t.campaigns.invitePlayerDescription || "Enter the email address of the user you want to invite to this campaign"}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="inviteEmail">{t.campaigns.email || "Email Address"}</Label>
              <Input
                id="inviteEmail"
                type="email"
                value={inviteEmail}
                onChange={(e) => setInviteEmail(e.target.value)}
                placeholder={t.campaigns.emailPlaceholder || "Enter email address"}
                className="mt-1"
              />
              <p className="text-xs text-muted-foreground mt-1">
                {t.campaigns.inviteEmailDescription || "Enter the email address of the user you want to invite"}
              </p>
            </div>
            <div>
              <Label htmlFor="inviteMessage">{t.campaigns.message || "Message (Optional)"}</Label>
              <Textarea
                id="inviteMessage"
                value={inviteMessage}
                onChange={(e) => setInviteMessage(e.target.value)}
                placeholder={t.campaigns.messagePlaceholder || "Add a personal message..."}
                rows={3}
                className="mt-1"
              />
            </div>
            <Button
              onClick={handleSendInvitation}
              className="w-full"
              disabled={!inviteEmail.trim()}
            >
              <Mail className="h-4 w-4 mr-2" />
              {t.campaigns.sendInvitation || "Send Invitation"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
