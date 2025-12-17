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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { AlertCircle, Copy, Crown, Trash2, UserPlus, LogOut, Mail, Check, X } from "lucide-react"
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

interface CampaignInvitation {
  id: string
  campaign_id: string
  inviter_id: string
  invitee_id: string | null
  invitee_email: string
  character_id: string | null
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
  const { activeCharacterId, activeCharacter } = useActiveCharacter()
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
  const [inviteType, setInviteType] = useState<"email" | "character">("email")
  const [selectedInviteCharacterId, setSelectedInviteCharacterId] = useState<string>("")
  const [availableCharacters, setAvailableCharacters] = useState<Array<{ id: string; name: string; user_id: string }>>([])
  const [searchResults, setSearchResults] = useState<any[]>([])
  const [isSearching, setIsSearching] = useState(false)

  useEffect(() => {
    loadCampaigns()
    loadAllAvailableCampaigns()
    loadPendingInvitations()
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
      loadAllAvailableCampaigns() // Recargar campañas disponibles
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
      // Load members
      const { data, error } = await supabase
        .from("campaign_members")
        .select("id, user_id, character_id, role, joined_at")
        .eq("campaign_id", realCampaignId)

      if (error) throw error

      let membersWithEmails = data
      if (data && data.length > 0) {
        // Obtener información de perfiles y personajes
        const userIds = [...new Set(data.map((m) => m.user_id))]
        const characterIds = data.map((m) => m.character_id).filter((id): id is string => id !== null)

        const [profilesResult, charactersResult] = await Promise.all([
          supabase
            .from("profiles")
            .select("id, display_name")
            .in("id", userIds),
          characterIds.length > 0
            ? supabase
                .from("characters")
                .select("id, name")
                .in("id", characterIds)
            : Promise.resolve({ data: [], error: null }),
        ])

        membersWithEmails = data.map((member) => {
          const profile = profilesResult.data?.find((p) => p.id === member.user_id)
          const character = member.character_id
            ? charactersResult.data?.find((c) => c.id === member.character_id)
            : null

          // Para GM: mostrar solo el nombre del usuario (el GM es el usuario, no un personaje)
          // Para Player: mostrar el nombre del personaje (si tiene character_id) o el nombre del usuario si no tiene
          let displayName: string
          if (member.role === "game_master") {
            // GM: solo nombre del usuario
            displayName = profile?.display_name || member.user_id
          } else {
            // Player: mostrar nombre del personaje si existe, sino el nombre del usuario
            displayName = character
              ? character.name
              : profile?.display_name || member.user_id
          }

          return {
            ...member,
            user_email: displayName,
            character_name: character?.name || null,
            user_display_name: profile?.display_name || null,
          }
        })
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

  const loadPendingInvitations = async () => {
    if (!user) {
      console.log("[v0] loadPendingInvitations: No user, skipping")
      return
    }

    try {
      // Obtener email del usuario actual
      const { data: userData } = await supabase.auth.getUser()
      const userEmail = userData?.user?.email?.toLowerCase()

      console.log("[v0] loadPendingInvitations: User ID:", user.id, "Email:", userEmail)

      if (!userEmail) {
        console.warn("[v0] loadPendingInvitations: No user email found")
        setPendingInvitations([])
        return
      }

      // Buscar invitaciones por invitee_id O por invitee_email
      // Si hay personaje activo, filtrar por character_id (debe coincidir o ser NULL)
      // Usar dos consultas separadas porque .or() puede tener problemas con RLS
      console.log("[v0] loadPendingInvitations: Searching by invitee_id:", user.id, "activeCharacterId:", activeCharacterId)
      
      let queryById = supabase
        .from("campaign_invitations")
        .select("*")
        .eq("invitee_id", user.id)
        .eq("status", "pending")

      // Si hay personaje activo, filtrar por character_id (debe coincidir o ser NULL)
      if (activeCharacterId) {
        queryById = queryById.or(`character_id.eq.${activeCharacterId},character_id.is.null`)
      }

      const { data: dataById, error: errorById } = await queryById

      console.log("[v0] loadPendingInvitations: Search by ID result:", { data: dataById?.length || 0, error: errorById })

      console.log("[v0] loadPendingInvitations: Searching by invitee_email:", userEmail)
      
      let queryByEmail = supabase
        .from("campaign_invitations")
        .select("*")
        .eq("invitee_email", userEmail)
        .is("invitee_id", null) // Solo las que no tienen invitee_id (para evitar duplicados)
        .eq("status", "pending")

      // Si hay personaje activo, filtrar por character_id (debe coincidir o ser NULL)
      if (activeCharacterId) {
        queryByEmail = queryByEmail.or(`character_id.eq.${activeCharacterId},character_id.is.null`)
      }

      const { data: dataByEmail, error: errorByEmail } = await queryByEmail

      console.log("[v0] loadPendingInvitations: Search by email result:", { data: dataByEmail?.length || 0, error: errorByEmail })

      if (errorById || errorByEmail) {
        const error = errorById || errorByEmail
        console.error("[v0] Error loading invitations:", error)
        // Si es un error de permisos, mostrar mensaje más claro
        if (error?.code === '42501' || error?.message?.includes('permission denied')) {
          console.error("[v0] ❌ PERMISSION DENIED - RLS policies need to be fixed!")
          console.error("[v0] Please run script: 049_fix_campaign_invitations_rls.sql")
          setError("Error loading invitations: Permission denied. Please check RLS policies.")
        }
        setPendingInvitations([])
        return
      }

      // Combinar resultados y eliminar duplicados
      const allInvitations = [...(dataById || []), ...(dataByEmail || [])]
      const uniqueInvitations = allInvitations.filter(
        (inv, index, self) => index === self.findIndex((i) => i.id === inv.id)
      )

      console.log("[v0] loadPendingInvitations: Combined invitations:", uniqueInvitations.length)

      const { data, error } = { 
        data: uniqueInvitations.sort((a, b) => 
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        ), 
        error: null 
      }

      if (error) throw error

      if (!data || data.length === 0) {
        console.log("[v0] loadPendingInvitations: No invitations found")
        setPendingInvitations([])
        return
      }

      console.log("[v0] loadPendingInvitations: Found", data.length, "invitations")

      // Obtener información de campañas e invitadores
      const campaignIds = [...new Set(data.map((inv: any) => inv.campaign_id))]
      const inviterIds = [...new Set(data.map((inv: any) => inv.inviter_id))]

      console.log("[v0] loadPendingInvitations: Fetching campaign data for IDs:", campaignIds)
      console.log("[v0] loadPendingInvitations: Fetching profile data for IDs:", inviterIds)

      const [campaignsResult, profilesResult] = await Promise.all([
        supabase
          .from("campaigns")
          .select("id, name")
          .in("id", campaignIds),
        supabase
          .from("profiles")
          .select("id, display_name")
          .in("id", inviterIds),
      ])

      console.log("[v0] loadPendingInvitations: Campaigns query result:", {
        data: campaignsResult.data?.length || 0,
        error: campaignsResult.error,
        campaignIds: campaignsResult.data?.map((c: any) => ({ id: c.id, name: c.name }))
      })

      console.log("[v0] loadPendingInvitations: Profiles query result:", {
        data: profilesResult.data?.length || 0,
        error: profilesResult.error,
        profileIds: profilesResult.data?.map((p: any) => ({ id: p.id, name: p.display_name }))
      })

      // Si hay errores, loguearlos pero continuar
      if (campaignsResult.error) {
        console.error("[v0] Error fetching campaigns:", campaignsResult.error)
        if (campaignsResult.error.code === '42501' || campaignsResult.error.message?.includes('permission denied')) {
          console.error("[v0] ❌ Permission denied for campaigns - RLS policy may be blocking access")
        }
      }

      if (profilesResult.error) {
        console.error("[v0] Error fetching profiles:", profilesResult.error)
        if (profilesResult.error.code === '42501' || profilesResult.error.message?.includes('permission denied')) {
          console.error("[v0] ❌ Permission denied for profiles - RLS policy may be blocking access")
        }
      }

      const invitations = data.map((inv: any) => {
        const campaign = campaignsResult.data?.find((c: any) => c.id === inv.campaign_id)
        const profile = profilesResult.data?.find((p: any) => p.id === inv.inviter_id)
        
        console.log("[v0] Mapping invitation:", {
          invitationId: inv.id,
          campaignId: inv.campaign_id,
          campaignFound: !!campaign,
          campaignName: campaign?.name,
          inviterId: inv.inviter_id,
          profileFound: !!profile,
          profileName: profile?.display_name
        })

        return {
          ...inv,
          campaign_name: campaign?.name || "Unknown Campaign",
          inviter_name: profile?.display_name || "Unknown",
        }
      })

      setPendingInvitations(invitations)
      console.log("[v0] loadPendingInvitations: Successfully loaded", invitations.length, "invitations")
    } catch (err: any) {
      console.error("[v0] Error loading pending invitations:", err)
      setPendingInvitations([])
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
    if (!user || !selectedCampaign) return

    try {
      setError("")
      setSuccess("")

      let inviteeId: string | null = null
      let inviteeEmail: string = ""
      let characterId: string | null = null

      if (inviteType === "email") {
        // Invitación por email
        const email = inviteEmail.trim().toLowerCase()

        // Validar formato de email básico
        if (!email.includes("@") || !email.includes(".")) {
          setError(t.campaigns.invalidEmail || "Invalid email format")
          return
        }

        inviteeEmail = email

        // Verificar que no está invitándose a sí mismo
        const { data: currentUser } = await supabase.auth.getUser()
        if (currentUser?.user?.email?.toLowerCase() === email) {
          setError(t.campaigns.cannotInviteYourself || "You cannot invite yourself")
          return
        }

        // Verificar si ya hay invitación pendiente para este email (sin character_id específico)
        const { data: existingInvitation } = await supabase
          .from("campaign_invitations")
          .select("id")
          .eq("campaign_id", selectedCampaign.id)
          .eq("invitee_email", email)
          .is("character_id", null)
          .eq("status", "pending")
          .maybeSingle()

        if (existingInvitation) {
          setError(t.campaigns.invitationAlreadySent || "Invitation already sent to this email")
          return
        }
      } else {
        // Invitación por personaje específico
        if (!selectedInviteCharacterId) {
          setError(t.campaigns.selectCharacterToInvite || "Please select a character to invite")
          return
        }

        // También necesitamos el email para invitaciones por personaje
        const email = inviteEmail.trim().toLowerCase()
        if (!email.includes("@") || !email.includes(".")) {
          setError(t.campaigns.invalidEmail || "Invalid email format. Please provide the user's email.")
          return
        }

        // Obtener información del personaje
        const { data: character, error: charError } = await supabase
          .from("characters")
          .select("id, user_id, name")
          .eq("id", selectedInviteCharacterId)
          .single()

        if (charError || !character) {
          setError(t.campaigns.characterNotFound || "Character not found")
          return
        }

        // Verificar que no está invitándose a sí mismo
        if (character.user_id === user.id) {
          setError(t.campaigns.cannotInviteYourself || "You cannot invite your own character")
          return
        }

        characterId = character.id
        inviteeId = character.user_id
        inviteeEmail = email

        // Verificar si ya hay invitación pendiente para este personaje
        const { data: existingInvitation } = await supabase
          .from("campaign_invitations")
          .select("id")
          .eq("campaign_id", selectedCampaign.id)
          .eq("character_id", characterId)
          .eq("status", "pending")
          .maybeSingle()

        if (existingInvitation) {
          setError(t.campaigns.invitationAlreadySent || "Invitation already sent to this character")
          return
        }
      }

      // Crear invitación
      const { error: inviteError } = await supabase
        .from("campaign_invitations")
        .insert({
          campaign_id: selectedCampaign.id,
          inviter_id: user.id,
          invitee_id: inviteeId || null,
          invitee_email: inviteeEmail,
          character_id: characterId,
          message: inviteMessage.trim() || null,
        })

      if (inviteError) {
        console.error("[v0] Error creating invitation:", inviteError)
        throw inviteError
      }

      setSuccess(t.campaigns.invitationSent || "Invitation sent successfully!")
      setInviteEmail("")
      setInviteMessage("")
      setInviteType("email")
      setSelectedInviteCharacterId("")
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

      // Si la invitación tiene character_id, validar que coincida con el personaje activo
      if (invitation.character_id) {
        if (!activeCharacterId) {
          setError(t.campaigns.invitationRequiresCharacter || "This invitation is for a specific character. Please select that character first.")
          return
        }
        if (invitation.character_id !== activeCharacterId) {
          setError(t.campaigns.invitationWrongCharacter || "This invitation is for a different character. Please select the correct character.")
          return
        }
      }

      // Si no hay personaje activo, no se puede aceptar (necesitamos character_id)
      if (!activeCharacterId) {
        setError(t.campaigns.selectCharacterFirst || "Please select a character first to accept the invitation.")
        return
      }

      // Verificar que no es ya miembro con este personaje
      const { data: existingMember } = await supabase
        .from("campaign_members")
        .select("id")
        .eq("campaign_id", invitation.campaign_id)
        .eq("user_id", user.id)
        .eq("character_id", activeCharacterId)
        .maybeSingle()

      if (existingMember) {
        // Ya es miembro con este personaje, solo marcar invitación como aceptada
        await supabase
          .from("campaign_invitations")
          .update({ status: "accepted", invitee_id: user.id })
          .eq("id", invitationId)
        
        setSuccess(t.campaigns.invitationAccepted || "Invitation accepted! You are already a member with this character.")
        loadPendingInvitations()
        return
      }

      // Agregar como miembro con el personaje activo
      const { error: memberError } = await supabase
        .from("campaign_members")
        .insert({
          campaign_id: invitation.campaign_id,
          user_id: user.id,
          character_id: activeCharacterId,
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

      {/* Buzón de Invitaciones - Destacado fuera de las pestañas */}
      {pendingInvitations.length > 0 && (
        <Card className="border-2 border-primary bg-primary/5 mb-6">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Mail className="h-5 w-5 text-primary" />
                <CardTitle className="text-lg">
                  {t.campaigns.pendingInvitations || "Pending Invitations"}
                </CardTitle>
                <Badge variant="default" className="ml-2">
                  {pendingInvitations.length}
                </Badge>
              </div>
            </div>
            <CardDescription>
              {t.campaigns.invitationsDescription || "You have pending campaign invitations"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {pendingInvitations.map((invitation) => (
                <Card key={invitation.id} className="border border-primary/20">
                  <CardContent className="pt-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <CardTitle className="text-base">{invitation.campaign_name}</CardTitle>
                          <Badge variant="outline">
                            <Mail className="h-3 w-3 mr-1" />
                            {t.campaigns.invitation || "Invitation"}
                          </Badge>
                        </div>
                        <CardDescription className="mb-2">
                          {t.campaigns.invitedBy || "Invited by"}: <strong>{invitation.inviter_name}</strong>
                        </CardDescription>
                        {invitation.message && (
                          <p className="text-sm text-muted-foreground mb-2 italic">"{invitation.message}"</p>
                        )}
                        <p className="text-xs text-muted-foreground">
                          {new Date(invitation.created_at).toLocaleDateString()}
                        </p>
                      </div>
                      <div className="flex gap-2 ml-4">
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
                  </CardContent>
                </Card>
              ))}
            </div>
          </CardContent>
        </Card>
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
                {selectedCampaign.is_gm && (
                  <TabsTrigger value="members">{t.campaigns.members || "Members"}</TabsTrigger>
                )}
              </TabsList>

              <TabsContent value="overview" className="space-y-4">
                <div>
                  <h4 className="font-semibold mb-2">{t.campaigns.description || "Description"}</h4>
                  <p>{selectedCampaign.description || t.campaigns.noDescription || "No description provided"}</p>
                </div>

                {selectedCampaign.is_gm && (
                  <>
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
                    <div>
                      <h4 className="font-semibold mb-2">{t.campaigns.invitePlayer || "Invite Players"}</h4>
                      <Button
                        variant="default"
                        className="w-full"
                        onClick={() => setIsInviteDialogOpen(true)}
                      >
                        <UserPlus className="h-4 w-4 mr-2" />
                        {t.campaigns.invitePlayer || "Invite Player"}
                      </Button>
                      <p className="text-xs text-muted-foreground mt-2">
                        {t.campaigns.invitePlayerHint || "Send an invitation by email to add players to this campaign"}
                      </p>
                    </div>
                  </>
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
                                <span>{t.campaigns.player || "Player"}</span>
                              )}
                            </Badge>
                          </div>
                          {/* Solo mostrar botón de eliminar para players si eres GM */}
                          {member.role !== "game_master" && selectedCampaign?.is_gm && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                // TODO: implementar funcionalidad para eliminar miembro
                                // Por ahora, este botón no hace nada
                              }}
                              title={t.campaigns.removeMember || "Remove member"}
                            >
                              <LogOut className="h-4 w-4" />
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
              {t.campaigns.invitePlayerDescription || "Invite a player by email or select a specific character"}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            {/* Tipo de invitación */}
            <div>
              <Label>{t.campaigns.inviteType || "Invitation Type"}</Label>
              <Tabs value={inviteType} onValueChange={(value) => setInviteType(value as "email" | "character")} className="mt-2">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="email">
                    <Mail className="h-4 w-4 mr-2" />
                    {t.campaigns.byEmail || "By Email"}
                  </TabsTrigger>
                  <TabsTrigger value="character">
                    <UserPlus className="h-4 w-4 mr-2" />
                    {t.campaigns.byCharacter || "By Character"}
                  </TabsTrigger>
                </TabsList>
              </Tabs>
            </div>

            {/* Contenido según el tipo */}
            {inviteType === "email" ? (
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
            ) : (
              <>
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
                    {t.campaigns.inviteEmailForCharacter || "Enter the email of the user who owns the character"}
                  </p>
                </div>
                <div>
                  <Label htmlFor="inviteCharacter">{t.campaigns.selectCharacter || "Select Character"}</Label>
                  <Input
                    id="inviteCharacter"
                    type="text"
                    value={selectedInviteCharacterId}
                    onChange={(e) => setSelectedInviteCharacterId(e.target.value)}
                    placeholder={t.campaigns.characterIdPlaceholder || "Enter character ID (UUID)"}
                    className="mt-1"
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    {t.campaigns.inviteCharacterDescription || "Enter the character ID to invite a specific character. The user will need to accept with that character."}
                  </p>
                </div>
              </>
            )}

            {/* Mensaje opcional */}
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
              disabled={
                inviteType === "email" 
                  ? !inviteEmail.trim() 
                  : !inviteEmail.trim() || !selectedInviteCharacterId.trim()
              }
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
