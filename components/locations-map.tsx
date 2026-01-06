"use client"

import { useEffect, useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { createBrowserClient } from "@/lib/supabase/client"
import { useAuth } from "@/lib/auth-context"
import { useActiveCharacter } from "@/lib/active-character-context"
import { type Language, translations } from "@/lib/translations"
import { CharacterSelector } from "@/components/character-selector"
import { ShopCatalog } from "@/components/shop-catalog"
import { MapPin, Store, Sparkles, Users, Package, Edit, Plus, Trash2 } from "lucide-react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useToast } from "@/hooks/use-toast"

const LOCATION_TYPE_OPTIONS = ["village", "forest", "camp", "port", "ruins", "city"] as const
const SHOP_TYPE_OPTIONS = ["inn", "general", "smith", "jewelry", "market", "atelier"] as const

type LocationType = (typeof LOCATION_TYPE_OPTIONS)[number]
type ShopType = (typeof SHOP_TYPE_OPTIONS)[number]

interface CampaignEntry {
  id: string // ID real de la campaña
  name: string
  role: "game_master" | "player"
  displayId: string // ID único para el selector (combina id + role)
}

interface LocationRow {
  id: string
  name: string
  description: string | null
  campaign_id: string
  location_type: LocationType | null
}

interface ShopRow {
  id: string
  name: string
  description: string | null
  shopkeeper_name: string | null
  location_id: string
  shop_type: ShopType | null
}

interface ShopNpcRow {
  id: string
  name: string
  title: string | null
  resistances: string | null
  story: string | null
  shop_id: string
  npc_id: string | null
}

interface StandaloneNpcRow {
  id: string
  name: string
  title: string | null
  resistances: string | null
  story: string | null
  campaign_id: string
}

type MarketplaceTranslation = typeof translations["en"]["marketplace"]

interface LocationsMapProps {
  language: Language
  campaignId?: string // Opcional: si se proporciona, filtrar por esta campaña
}

const getLocationTypeLabel = (type: LocationType, map?: MarketplaceTranslation) => map?.locationTypes?.[type] || type
const getShopTypeLabel = (type: ShopType, map?: MarketplaceTranslation) => map?.shopTypes?.[type] || type

export function LocationsMap({ language, campaignId: propCampaignId }: LocationsMapProps) {
  const t = translations[language]
  const router = useRouter()
  const supabase = createBrowserClient()
  const { user } = useAuth()
  const { activeCharacterId } = useActiveCharacter()
  const { toast } = useToast()

  const [campaigns, setCampaigns] = useState<CampaignEntry[]>([])
  const [selectedCampaignId, setSelectedCampaignId] = useState<string>(propCampaignId || "")
  const [locations, setLocations] = useState<LocationRow[]>([])
  const [selectedLocationId, setSelectedLocationId] = useState<string>("")
  const [shops, setShops] = useState<ShopRow[]>([])
  const [selectedShopId, setSelectedShopId] = useState<string>("")
  const [shopNpcs, setShopNpcs] = useState<ShopNpcRow[]>([])
  const [standaloneNpcs, setStandaloneNpcs] = useState<StandaloneNpcRow[]>([])

  const [isLocationDialogOpen, setIsLocationDialogOpen] = useState(false)
  const [editingLocation, setEditingLocation] = useState<LocationRow | null>(null)
  const [locationForm, setLocationForm] = useState({
    name: "",
    description: "",
    type: "village" as LocationType,
  })
  const [isShopDialogOpen, setIsShopDialogOpen] = useState(false)
  const [editingShop, setEditingShop] = useState<ShopRow | null>(null)
  const [shopForm, setShopForm] = useState({
    name: "",
    description: "",
    shopkeeper: "",
    type: "general" as ShopType,
    selectedNpcId: "",
  })
  const [isNpcDialogOpen, setIsNpcDialogOpen] = useState(false)
  const [isStandaloneNpcDialogOpen, setIsStandaloneNpcDialogOpen] = useState(false)
  const [npcForm, setNpcForm] = useState({
    name: "",
    title: "",
    resistances: "",
    story: "",
  })
  const [editingNpc, setEditingNpc] = useState<ShopNpcRow | null>(null)
  const [editingStandaloneNpc, setEditingStandaloneNpc] = useState<StandaloneNpcRow | null>(null)
  const [activeTab, setActiveTab] = useState<"locations" | "shops" | "npcs">("locations")

  // No filtrar duplicados - queremos mantener entradas separadas para cada rol
  // Si un usuario es GM y jugador, ambas entradas deben aparecer
  const campaignsList = useMemo(() => campaigns, [campaigns])

  const activeCampaign = useMemo(() => {
    // selectedCampaignId ahora puede ser un displayId (id_role) o el id real
    // Buscar por displayId primero, luego por id
    return campaignsList.find(
      (campaign) => campaign.displayId === selectedCampaignId || campaign.id === selectedCampaignId
    )
  }, [campaignsList, selectedCampaignId])
  const isGm = activeCampaign?.role === "game_master"

  useEffect(() => {
    // Si hay propCampaignId, no necesitamos cargar la lista de campañas
    if (propCampaignId) {
      // Validar y cargar datos directamente
      validateAndLoadCampaignData()
      return
    }

    if (user) {
      loadCampaigns()
    } else {
      // Limpiar estado si no hay usuario
      setCampaigns([])
      setSelectedCampaignId("")
      setLocations([])
      setShops([])
      setStandaloneNpcs([])
    }
  }, [user, activeCharacterId, propCampaignId]) // Recargar campañas cuando cambia el personaje activo o propCampaignId

  useEffect(() => {
    const campaignIdToUse = propCampaignId || selectedCampaignId
    if (campaignIdToUse && user) {
      // Validar acceso antes de cargar datos
      validateAndLoadCampaignData()
    } else {
      // Limpiar estado si no hay campaña seleccionada
      setLocations([])
      setSelectedLocationId("")
      setShops([])
      setSelectedShopId("")
      setStandaloneNpcs([])
    }
  }, [selectedCampaignId, propCampaignId, user])

  useEffect(() => {
    if (selectedLocationId) {
      loadShops()
      setSelectedShopId("")
      // Automatically switch to shops tab when a location is selected
      setActiveTab("shops")
    } else {
      setShops([])
    }
  }, [selectedLocationId])

  useEffect(() => {
    // Solo cargar shop NPCs cuando se está en la pestaña NPCs y hay un shop seleccionado
    // Esto evita cargar datos innecesarios cuando el usuario solo quiere ver la tienda
    if (selectedShopId && activeTab === "npcs") {
      loadShopNpcs()
    } else {
      // Limpiar solo si no hay shop seleccionado o si cambiamos de pestaña
      if (!selectedShopId) {
        setShopNpcs([])
      }
      // Si hay shop seleccionado pero no estamos en la pestaña NPCs, mantener los datos
      // (no limpiar para evitar recargas innecesarias si el usuario vuelve a la pestaña)
    }
  }, [selectedShopId, activeTab])

  // Función helper para extraer el ID real de la campaña del selectedCampaignId
  // selectedCampaignId puede ser un displayId (formato: campaignId_role) o el ID real
  const getRealCampaignId = (campaignIdOrDisplayId: string): string => {
    if (!campaignIdOrDisplayId) return ""
    // Si contiene "_", es un displayId, extraer el ID real
    if (campaignIdOrDisplayId.includes("_")) {
      return campaignIdOrDisplayId.split("_")[0]
    }
    // Si no contiene "_", es el ID real
    return campaignIdOrDisplayId
  }

  // Función helper para validar acceso a una campaña
  // Considera character_id para players, pero permite acceso como GM sin character_id
  const validateCampaignAccess = async (campaignId: string): Promise<{ hasAccess: boolean; role?: "game_master" | "player" }> => {
    if (!user || !campaignId) {
      return { hasAccess: false }
    }

    try {
      // Primero verificar si es GM (no requiere character_id)
      const { data: gmMember, error: gmError } = await supabase
        .from("campaign_members")
        .select("role, character_id")
        .eq("campaign_id", campaignId)
        .eq("user_id", user.id)
        .eq("role", "game_master")
        .is("character_id", null)
        .maybeSingle()

      if (gmError) {
        console.error("[v0] LocationsMap: Error validating GM access:", gmError)
      } else if (gmMember) {
        return { hasAccess: true, role: "game_master" }
      }

      // Si no es GM, verificar si es player con el personaje activo
      if (activeCharacterId) {
        const { data: playerMember, error: playerError } = await supabase
          .from("campaign_members")
          .select("role, character_id")
          .eq("campaign_id", campaignId)
          .eq("user_id", user.id)
          .eq("role", "player")
          .eq("character_id", activeCharacterId)
          .maybeSingle()

        if (playerError) {
          console.error("[v0] LocationsMap: Error validating player access:", playerError)
        } else if (playerMember) {
          return { hasAccess: true, role: "player" }
        }
      }

      return { hasAccess: false }
    } catch (err) {
      console.error("[v0] LocationsMap: Exception validating campaign access:", err)
      return { hasAccess: false }
    }
  }

  // Función para validar y cargar datos de la campaña
  const validateAndLoadCampaignData = async () => {
    if (!selectedCampaignId || !user) return

    // Verificar primero si la campaña está en la lista de campaigns cargadas
    // Si está, confiar en que es válida (ya fue filtrada por user_id en loadCampaigns)
    const campaignExists = campaigns.some((c) => c.displayId === selectedCampaignId || c.id === selectedCampaignId)
    if (campaignExists) {
      // Cargar datos directamente sin validar (ya sabemos que es válida)
      await Promise.all([loadLocations(), loadStandaloneNpcs()])
      return
    }

    // Solo validar si la campaña NO está en la lista (caso edge - no debería pasar normalmente)
    const realCampaignId = getRealCampaignId(selectedCampaignId)
    const access = await validateCampaignAccess(realCampaignId)
    
    if (!access.hasAccess) {
      console.error("[v0] LocationsMap: User does not have access to campaign:", realCampaignId)
      toast({
        title: t.inventory?.error || "Error",
        description: "No tienes acceso a esta campaña",
        variant: "destructive",
      })
      // Limpiar estado y resetear campaña seleccionada
      setSelectedCampaignId("")
      setLocations([])
      setShops([])
      setStandaloneNpcs([])
      return
    }

    // Si tiene acceso, cargar los datos
    await Promise.all([loadLocations(), loadStandaloneNpcs()])
  }

  const loadCampaigns = async () => {
    if (!user) {
      setCampaigns([])
      return
    }

    try {
      // Separar consultas en lugar de JOIN para mayor seguridad
      // 1. Obtener campaign_members del usuario, incluyendo character_id
      const { data: memberData, error: memberError } = await supabase
        .from("campaign_members")
        .select("campaign_id, role, character_id")
        .eq("user_id", user.id)

      if (memberError) {
        console.error("[v0] LocationsMap: Error loading campaign members:", memberError)
        toast({
          title: t.inventory?.error || "Error",
          description: memberError.message,
          variant: "destructive",
        })
        return
      }

      if (!memberData || memberData.length === 0) {
        setCampaigns([])
        setSelectedCampaignId("")
        return
      }

      // 2. Filtrar memberData según el personaje activo
      // - Si hay activeCharacterId: solo incluir campañas GM (sin character_id) y campañas player con character_id coincidente
      // - Si no hay activeCharacterId: incluir todas las campañas del usuario
      let filteredMemberData = memberData
      if (activeCharacterId) {
        filteredMemberData = memberData.filter((member) => {
          // Incluir campañas GM (role = "game_master", character_id puede ser null)
          if (member.role === "game_master") {
            return true
          }
          // Incluir campañas player solo si character_id coincide con activeCharacterId
          if (member.role === "player") {
            return member.character_id === activeCharacterId
          }
          return false
        })
      }

      if (filteredMemberData.length === 0) {
        setCampaigns([])
        setSelectedCampaignId("")
        return
      }

      // 3. Extraer campaign_ids únicos
      const campaignIds = [...new Set(filteredMemberData.map((m) => m.campaign_id))]

      // 4. Obtener campaigns por separado usando los IDs validados
      const { data: campaignsData, error: campaignsError } = await supabase
        .from("campaigns")
        .select("id, name")
        .in("id", campaignIds)

      if (campaignsError) {
        console.error("[v0] LocationsMap: Error loading campaigns:", campaignsError)
        toast({
          title: t.inventory?.error || "Error",
          description: campaignsError.message,
          variant: "destructive",
        })
        return
      }

      // 5. Crear mapeo de roles: cada campaña puede tener múltiples roles (GM y/o jugador)
      // En lugar de priorizar "game_master", crear entradas separadas para cada rol
      const campaignRoleMap = new Map<string, Array<"game_master" | "player">>()
      filteredMemberData.forEach((member) => {
        const existing = campaignRoleMap.get(member.campaign_id) || []
        const role = member.role as "game_master" | "player"
        // Agregar el rol si no existe ya
        if (!existing.includes(role)) {
          existing.push(role)
          campaignRoleMap.set(member.campaign_id, existing)
        }
      })

      // 6. Crear entradas separadas para cada rol
      // Si un usuario es GM y jugador en la misma campaña, se crearán DOS entradas
      const validCampaigns: CampaignEntry[] = []
      campaignsData.forEach((campaign) => {
        const roles = campaignRoleMap.get(campaign.id) || []
        // Si la campaña no tiene roles, no la incluimos
        if (roles.length === 0) return

        // Crear una entrada para cada rol que el usuario tiene en esta campaña
        roles.forEach((role) => {
          validCampaigns.push({
            id: campaign.id, // ID real de la campaña (para consultas)
            name: campaign.name,
            role: role,
            displayId: `${campaign.id}_${role}`, // ID único para el selector
          })
        })
      })

      // No eliminar duplicados aquí porque queremos mantener entradas separadas para cada rol
      // Si hay dos entradas con el mismo ID pero diferentes roles, ambas son válidas

      setCampaigns(validCampaigns)
      
      // Si no hay campaña seleccionada y hay campañas disponibles, seleccionar la primera
      // Priorizar entrada GM si existe, sino la primera disponible
      if (!selectedCampaignId && validCampaigns.length > 0) {
        const gmCampaign = validCampaigns.find((c) => c.role === "game_master")
        const campaignToSelect = gmCampaign || validCampaigns[0]
        setSelectedCampaignId(campaignToSelect.displayId)
      }
    } catch (err) {
      console.error("[v0] LocationsMap: Exception loading campaigns:", err)
      toast({
        title: t.inventory?.error || "Error",
        description: err instanceof Error ? err.message : "Error al cargar campañas",
        variant: "destructive",
      })
    }
  }

  const loadLocations = async () => {
    const campaignIdToUse = propCampaignId || selectedCampaignId
    if (!campaignIdToUse || !user) {
      setLocations([])
      return
    }

    // Extraer el ID real de la campaña
    const realCampaignId = getRealCampaignId(campaignIdToUse)

    // Verificar si la campaña está en la lista antes de validar
    // Si está en la lista, confiar en que es válida (ya fue filtrada por user_id)
    const campaignExists = campaigns.some((c) => c.displayId === campaignIdToUse || c.id === campaignIdToUse)
    if (!campaignExists) {
      // Solo validar si no está en la lista (caso edge)
      const access = await validateCampaignAccess(realCampaignId)
      if (!access.hasAccess) {
        console.error("[v0] LocationsMap: Cannot load locations - no access to campaign:", realCampaignId)
        setLocations([])
        return
      }
    }

    const { data, error } = await supabase
      .from("locations")
      .select("*")
      .eq("campaign_id", realCampaignId)
      .order("created_at", { ascending: false })

    if (error) {
      console.error("[v0] LocationsMap: Error loading locations:", error)
      toast({
        title: t.inventory?.error || "Error",
        description: error.message,
        variant: "destructive",
      })
      setLocations([])
      return
    }

    setLocations((data as LocationRow[]) || [])
  }

  const loadShops = async () => {
    if (!selectedLocationId || !user) {
      setShops([])
      return
    }

    // Obtener la location para verificar su campaign_id
    const { data: locationData, error: locationError } = await supabase
      .from("locations")
      .select("campaign_id")
      .eq("id", selectedLocationId)
      .maybeSingle()

    if (locationError || !locationData) {
      console.error("[v0] LocationsMap: Error validating location:", locationError)
      setShops([])
      return
    }

    // Verificar si la campaña de la location está en la lista antes de validar
    // Si está en la lista, confiar en que es válida (ya fue filtrada por user_id)
    const campaignExists = campaigns.some((c) => c.id === locationData.campaign_id)
    if (!campaignExists) {
      // Solo validar si no está en la lista (caso edge)
      const access = await validateCampaignAccess(locationData.campaign_id)
      if (!access.hasAccess) {
        console.error("[v0] LocationsMap: Cannot load shops - no access to campaign:", locationData.campaign_id)
        setShops([])
        return
      }
    }

    const { data, error } = await supabase
      .from("shops")
      .select("*")
      .eq("location_id", selectedLocationId)
      .order("created_at", { ascending: false })

    if (error) {
      console.error("[v0] LocationsMap: Error loading shops:", error)
      toast({
        title: t.inventory?.error || "Error",
        description: error.message,
        variant: "destructive",
      })
      setShops([])
      return
    }

    setShops((data as ShopRow[]) || [])
  }

  const loadShopNpcs = async () => {
    if (!selectedShopId || !user) {
      setShopNpcs([])
      return
    }

    // Validar que el shop pertenezca a una location de una campaña del usuario
    // Primero obtener el shop para verificar su location_id
    const { data: shopData, error: shopError } = await supabase
      .from("shops")
      .select("location_id, locations!inner(campaign_id)")
      .eq("id", selectedShopId)
      .maybeSingle()

    if (shopError || !shopData) {
      console.error("[v0] LocationsMap: Error validating shop:", shopError)
      setShopNpcs([])
      return
    }

    // Obtener campaign_id de la location
    const location = shopData.locations as { campaign_id: string }
    if (!location || !location.campaign_id) {
      console.error("[v0] LocationsMap: Shop location has no campaign_id")
      setShopNpcs([])
      return
    }

    // Verificar si la campaña está en la lista antes de validar
    // Si está en la lista, confiar en que es válida (ya fue filtrada por user_id)
    const campaignExists = campaigns.some((c) => {
      const realId = getRealCampaignId(c.displayId || c.id)
      return realId === location.campaign_id
    })

    if (!campaignExists) {
      // Solo validar si no está en la lista (caso edge)
      const access = await validateCampaignAccess(location.campaign_id)
      if (!access.hasAccess) {
        console.error("[v0] LocationsMap: Cannot load shop NPCs - no access to campaign:", location.campaign_id)
        setShopNpcs([])
        return
      }
    }

    const { data, error } = await supabase
      .from("shop_npcs")
      .select("*")
      .eq("shop_id", selectedShopId)
      .order("created_at", { ascending: false })

    if (error) {
      console.error("[v0] LocationsMap: Error loading shop NPCs:", error)
      toast({
        title: t.inventory?.error || "Error",
        description: error.message,
        variant: "destructive",
      })
      setShopNpcs([])
      return
    }

    setShopNpcs((data as ShopNpcRow[]) || [])
  }

  const loadStandaloneNpcs = async () => {
    const campaignIdToUse = propCampaignId || selectedCampaignId
    if (!campaignIdToUse || !user) {
      setStandaloneNpcs([])
      return
    }

    // Extraer el ID real de la campaña
    const realCampaignId = getRealCampaignId(campaignIdToUse)

    // Verificar si la campaña está en la lista antes de validar
    // Si está en la lista, confiar en que es válida (ya fue filtrada por user_id)
    const campaignExists = campaigns.some((c) => c.displayId === campaignIdToUse || c.id === campaignIdToUse)
    if (!campaignExists) {
      // Solo validar si no está en la lista (caso edge)
      const access = await validateCampaignAccess(realCampaignId)
      if (!access.hasAccess) {
        console.error("[v0] LocationsMap: Cannot load NPCs - no access to campaign:", realCampaignId)
        setStandaloneNpcs([])
        return
      }
    }

    const { data, error } = await supabase
      .from("npcs")
      .select("*")
      .eq("campaign_id", realCampaignId)
      .order("created_at", { ascending: false })

    if (error) {
      console.error("[v0] LocationsMap: Error loading NPCs:", error)
      toast({
        title: t.inventory?.error || "Error",
        description: error.message,
        variant: "destructive",
      })
      setStandaloneNpcs([])
      return
    }

    setStandaloneNpcs((data as StandaloneNpcRow[]) || [])
  }

  const openLocationDialog = (location?: LocationRow) => {
    setEditingLocation(location || null)
    setLocationForm({
      name: location?.name || "",
      description: location?.description || "",
      type: (location?.location_type as LocationType) || "village",
    })
    setIsLocationDialogOpen(true)
  }

  const handleSaveLocation = async () => {
    if (!locationForm.name.trim() || !selectedCampaignId) return

    // Extraer el ID real de la campaña
    const realCampaignId = getRealCampaignId(selectedCampaignId)

    const payload = {
      name: locationForm.name.trim(),
      description: locationForm.description || null,
      location_type: locationForm.type,
      campaign_id: realCampaignId,
    }

    if (editingLocation) {
      const { data, error } = await supabase
        .from("locations")
        .update(payload)
        .eq("id", editingLocation.id)
        .select()

      if (!error && data) {
        setLocations(locations.map((loc) => (loc.id === editingLocation.id ? data[0] : loc)))
        setIsLocationDialogOpen(false)
        setEditingLocation(null)
      }
    } else {
      const { data, error } = await supabase.from("locations").insert(payload).select()

      if (!error && data) {
        setLocations([data[0], ...(locations || [])])
        setIsLocationDialogOpen(false)
      }
    }
    setLocationForm({ name: "", description: "", type: "village" })
  }

  const openShopDialog = async (shop?: ShopRow) => {
    // Validación de seguridad: solo los GMs pueden abrir el diálogo de edición/creación
    if (!isGm) {
      toast({
        title: t.inventory?.error || "Error",
        description: "Solo el Game Master puede crear o editar tiendas",
        variant: "destructive",
      })
      return
    }

    setEditingShop(shop || null)
    
    // If editing, find the assigned NPC
    let assignedNpcId = ""
    if (shop) {
      const { data: shopNpcData } = await supabase
        .from("shop_npcs")
        .select("npc_id")
        .eq("shop_id", shop.id)
        .maybeSingle()
      
      if (shopNpcData?.npc_id) {
        assignedNpcId = shopNpcData.npc_id
      }
    }
    
    setShopForm({
      name: shop?.name || "",
      description: shop?.description || "",
      shopkeeper: shop?.shopkeeper_name || "",
      type: (shop?.shop_type as ShopType) || "general",
      selectedNpcId: assignedNpcId,
    })
    setIsShopDialogOpen(true)
  }

  const handleSaveShop = async () => {
    if (!shopForm.name.trim() || !selectedLocationId) return

    // Validación de seguridad: solo los GMs pueden crear/editar shops
    if (!isGm) {
      toast({
        title: t.inventory?.error || "Error",
        description: "Solo el Game Master puede crear o editar tiendas",
        variant: "destructive",
      })
      return
    }

    const payload = {
      name: shopForm.name.trim(),
      description: shopForm.description || null,
      shopkeeper_name: shopForm.shopkeeper || null,
      shop_type: shopForm.type,
      location_id: selectedLocationId,
    }

    let shopId: string

    if (editingShop) {
      const { data, error } = await supabase
        .from("shops")
        .update(payload)
        .eq("id", editingShop.id)
        .select()

      if (!error && data) {
        shopId = data[0].id
        setShops(shops.map((s) => (s.id === editingShop.id ? data[0] : s)))
        setIsShopDialogOpen(false)
        setEditingShop(null)
      } else {
        return
      }
    } else {
      const { data, error } = await supabase.from("shops").insert(payload).select()

      if (!error && data) {
        shopId = data[0].id
        setShops([data[0], ...(shops || [])])
        setIsShopDialogOpen(false)
      } else {
        return
      }
    }

    // Handle NPC assignment
    if (shopId) {
      // Remove existing NPC assignments for this shop
      await supabase.from("shop_npcs").delete().eq("shop_id", shopId)

      // If an NPC was selected, create a shop_npc entry
      if (shopForm.selectedNpcId && shopForm.selectedNpcId !== "none") {
        const { error: npcError } = await supabase.from("shop_npcs").insert({
          shop_id: shopId,
          npc_id: shopForm.selectedNpcId,
        })

        if (!npcError && selectedShopId === shopId) {
          loadShopNpcs()
        }
      } else if (selectedShopId === shopId) {
        loadShopNpcs()
      }
    }

    setShopForm({ name: "", description: "", shopkeeper: "", type: "general", selectedNpcId: "" })
  }

  const handleShopClick = (shopId: string) => {
    setSelectedShopId(shopId)
  }

  const openNpcDialog = (npc?: ShopNpcRow) => {
    setEditingNpc(npc || null)
    setNpcForm({
      name: npc?.name || "",
      title: npc?.title || "",
      resistances: npc?.resistances || "",
      story: npc?.story || "",
    })
    setIsNpcDialogOpen(true)
  }

  const openStandaloneNpcDialog = (npc?: StandaloneNpcRow) => {
    setEditingStandaloneNpc(npc || null)
    setNpcForm({
      name: npc?.name || "",
      title: npc?.title || "",
      resistances: npc?.resistances || "",
      story: npc?.story || "",
    })
    setIsStandaloneNpcDialogOpen(true)
  }

  const handleSaveStandaloneNpc = async () => {
    if (!npcForm.name.trim() || !selectedCampaignId) return

    // Extraer el ID real de la campaña
    const realCampaignId = getRealCampaignId(selectedCampaignId)

    const payload = {
      name: npcForm.name.trim(),
      title: npcForm.title || null,
      resistances: npcForm.resistances || null,
      story: npcForm.story || null,
      campaign_id: realCampaignId,
    }

    if (editingStandaloneNpc) {
      const { data, error } = await supabase
        .from("npcs")
        .update(payload)
        .eq("id", editingStandaloneNpc.id)
        .select()

      if (!error && data) {
        setStandaloneNpcs(standaloneNpcs.map((npc) => (npc.id === editingStandaloneNpc.id ? data[0] : npc)))
        setIsStandaloneNpcDialogOpen(false)
        setEditingStandaloneNpc(null)
      }
    } else {
      const { data, error } = await supabase.from("npcs").insert(payload).select()

      if (!error && data) {
        setStandaloneNpcs([data[0], ...standaloneNpcs])
        setIsStandaloneNpcDialogOpen(false)
      }
    }
    setNpcForm({ name: "", title: "", resistances: "", story: "" })
  }

  const handleDeleteStandaloneNpc = async (npcId: string) => {
    const { error } = await supabase.from("npcs").delete().eq("id", npcId)
    if (!error) {
      setStandaloneNpcs(standaloneNpcs.filter((npc) => npc.id !== npcId))
    }
  }

  const handleSaveNpc = async () => {
    if (!npcForm.name.trim() || !selectedShopId) return

    const payload = {
      name: npcForm.name.trim(),
      title: npcForm.title,
      resistances: npcForm.resistances,
      story: npcForm.story,
      shop_id: selectedShopId,
    }

    if (editingNpc) {
      const { error } = await supabase.from("shop_npcs").update(payload).eq("id", editingNpc.id)
      if (!error) {
        loadShopNpcs()
        setIsNpcDialogOpen(false)
      }
    } else {
      const { error } = await supabase.from("shop_npcs").insert(payload)
      if (!error) {
        loadShopNpcs()
        setIsNpcDialogOpen(false)
      }
    }
  }

  const handleDeleteNpc = async (npcId: string) => {
    const { error } = await supabase.from("shop_npcs").delete().eq("id", npcId)
    if (!error) {
      setShopNpcs(shopNpcs.filter((npc) => npc.id !== npcId))
    }
  }

  const selectedShop = shops.find((shop) => shop.id === selectedShopId)
  const selectedLocation = locations.find((location) => location.id === selectedLocationId)

  return (
    <Card className="w-full max-w-6xl">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MapPin className="w-6 h-6" />
          {t.marketplace?.mapTitle || t.sidebar.map || "Mapa"}
        </CardTitle>
        <CardDescription>
          {t.marketplace?.mapDescription || "Visualiza las ubicaciones y conecta tus tiendas."}
        </CardDescription>
      </CardHeader>

      <CardContent>
        {/* Campaign Selector - Solo mostrar si no hay propCampaignId */}
        {!propCampaignId && (
          <div className="mb-6">
            {campaignsList.length === 0 ? (
              <p className="text-sm text-muted-foreground">{t.marketplace?.noCampaigns || "Join a campaign to see the map."}</p>
            ) : (
              <div className="space-y-2">
              <Label>{t.campaigns?.selectCampaign || "Select Campaign"}</Label>
              <Select
                value={selectedCampaignId}
                onValueChange={async (value) => {
                  // Verificar que la campaña esté en la lista
                  // El selector solo muestra campañas de la lista, pero mantener validación por seguridad
                  if (value && user) {
                    const campaignExists = campaignsList.some((c) => c.displayId === value || c.id === value)
                    if (!campaignExists) {
                      // Solo validar si no está en la lista (no debería pasar normalmente)
                      // Extraer el ID real de la campaña del displayId si es necesario
                      const campaignId = value.includes("_") ? value.split("_")[0] : value
                      const access = await validateCampaignAccess(campaignId)
                      if (!access.hasAccess) {
                        toast({
                          title: t.inventory?.error || "Error",
                          description: "No tienes acceso a esta campaña",
                          variant: "destructive",
                        })
                        return
                      }
                    }
                  }
                  setSelectedCampaignId(value)
                }}
              >
                <SelectTrigger className="w-full max-w-md">
                  <SelectValue placeholder={t.marketplace?.selectCampaign || "Select a campaign"} />
                </SelectTrigger>
                <SelectContent>
                  {campaignsList.map((campaign) => (
                    <SelectItem key={campaign.displayId} value={campaign.displayId}>
                      {campaign.name} {campaign.role === "game_master" ? "· GM" : "· Jugador"}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
          </div>
        )}

        {/* Main Content with Tabs */}
        <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as "locations" | "shops" | "npcs")} className="w-full">
        <TabsList className="grid w-full grid-cols-3 max-w-2xl">
          <TabsTrigger value="locations">
            <MapPin className="w-4 h-4 mr-2" />
            {t.marketplace?.yourLocations || "Locations"}
          </TabsTrigger>
          <TabsTrigger value="shops">
            <Store className="w-4 h-4 mr-2" />
            {t.marketplace?.shops || "Shops"}
          </TabsTrigger>
          <TabsTrigger value="npcs">
            <Users className="w-4 h-4 mr-2" />
            NPCs
          </TabsTrigger>
        </TabsList>

        {/* Locations Tab */}
        <TabsContent value="locations" className="space-y-4 mt-6">
          <div className="flex items-center justify-between">
            <h3 className="text-xl font-semibold flex items-center gap-2">
              <MapPin className="w-5 h-5" />
              {t.marketplace?.yourLocations || "Locations"}
            </h3>
            {isGm && (
              <Button onClick={() => openLocationDialog()}>
                <Plus className="w-4 h-4 mr-2" />
                {t.marketplace?.createLocation || "Add Location"}
              </Button>
            )}
          </div>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {locations.map((location) => (
              <Card
                key={location.id}
                className={`transition-shadow cursor-pointer ${selectedLocationId === location.id ? "border-2 border-primary" : "border"}`}
                onClick={() => setSelectedLocationId(location.id)}
              >
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <CardTitle className="text-lg">{location.name}</CardTitle>
                      <CardDescription className="mt-1">{location.description}</CardDescription>
                      {location.location_type && (
                        <span className="inline-block mt-2 text-xs px-2 py-1 rounded-full bg-primary/10 text-primary uppercase">
                          {getLocationTypeLabel(location.location_type, t.marketplace)}
                        </span>
                      )}
                    </div>
                    {isGm && (
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-8 w-8"
                        onClick={(e) => {
                          e.stopPropagation()
                          openLocationDialog(location)
                        }}
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                    )}
                  </div>
                </CardHeader>
              </Card>
            ))}
            {!locations.length && (
              <Card>
                <CardContent className="py-8 text-center text-muted-foreground">
                  <p>{t.marketplace?.emptyLocations || "No locations yet."}</p>
                  {isGm && (
                    <Button variant="outline" className="mt-4" onClick={() => openLocationDialog()}>
                      <Plus className="w-4 h-4 mr-2" />
                      {t.marketplace?.createLocation || "Create First Location"}
                    </Button>
                  )}
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>

        {/* Shops Tab */}
        <TabsContent value="shops" className="space-y-4 mt-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-xl font-semibold flex items-center gap-2">
                <Store className="w-5 h-5" />
                {t.marketplace?.shops || "Shops"}
              </h3>
              {selectedLocationId && (
                <p className="text-sm text-muted-foreground mt-1">
                  {selectedLocation?.name || "Selected location"}
                </p>
              )}
            </div>
            <div className="flex gap-2">
              {isGm && selectedLocationId && (
                <Button onClick={() => openShopDialog()}>
                  <Plus className="w-4 h-4 mr-2" />
                  {t.marketplace?.createShop || "Create Shop"}
                </Button>
              )}
            </div>
          </div>

          {!selectedLocationId ? (
            <Card>
              <CardContent className="py-8 text-center text-muted-foreground">
                <p>{t.marketplace?.noLocationSelected || "Select a location first from the Locations tab."}</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {shops.map((shop) => (
                <Card
                  key={shop.id}
                  className={`transition-shadow cursor-pointer ${selectedShopId === shop.id ? "border-2 border-primary" : "border"}`}
                  onClick={() => handleShopClick(shop.id)}
                >
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <CardTitle>{shop.name}</CardTitle>
                        <CardDescription className="mt-1">{shop.description}</CardDescription>
                        {shop.shopkeeper_name && (
                          <p className="text-xs text-muted-foreground mt-2">
                            {t.marketplace?.shopkeeper || "Shopkeeper"}: {shop.shopkeeper_name}
                          </p>
                        )}
                        {shop.shop_type && (
                          <span className="inline-block mt-2 text-xs px-2 py-1 rounded-full bg-foreground/5 text-foreground uppercase">
                            {getShopTypeLabel(shop.shop_type, t.marketplace)}
                          </span>
                        )}
                      </div>
                      {isGm && (
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-8 w-8"
                          onClick={(e) => {
                            e.stopPropagation()
                            openShopDialog(shop)
                          }}
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                      )}
                    </div>
                  </CardHeader>
                  {selectedShopId === shop.id && (
                    <CardContent>
                      <Button
                        variant="outline"
                        className="w-full"
                        onClick={() => {
                          const role = activeCampaign?.role || "player"
                          router.push(`/shop-items/${shop.id}?role=${role}`)
                        }}
                      >
                        <Package className="w-4 h-4 mr-2" />
                        {isGm 
                          ? (t.marketplace?.manageItems || "Manage Items")
                          : (t.marketplace?.viewItems || "View Items")
                        }
                      </Button>
                    </CardContent>
                  )}
                </Card>
              ))}
              {!shops.length && (
                <Card>
                  <CardContent className="py-8 text-center text-muted-foreground">
                    <p>{t.marketplace?.emptyShops || "No shops defined yet."}</p>
                    {isGm && (
                      <Button variant="outline" className="mt-4" onClick={() => openShopDialog()}>
                        <Plus className="w-4 h-4 mr-2" />
                        {t.marketplace?.createShop || "Create First Shop"}
                      </Button>
                    )}
                  </CardContent>
                </Card>
              )}
            </div>
          )}
        </TabsContent>

        {/* NPCs Tab */}
        <TabsContent value="npcs" className="space-y-4 mt-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-xl font-semibold flex items-center gap-2">
                <Users className="w-5 h-5" />
                NPCs
              </h3>
              <p className="text-sm text-muted-foreground mt-1">
                {t.marketplace?.npcHint || "NPCs are optional; shops keep operating with or without them."}
              </p>
            </div>
            {isGm && (
              <Button onClick={() => openStandaloneNpcDialog()}>
                <Plus className="w-4 h-4 mr-2" />
                Create NPC
              </Button>
            )}
          </div>

          {/* Standalone NPCs */}
          <div className="space-y-4">
            <h4 className="text-lg font-semibold">Campaign NPCs</h4>
            {standaloneNpcs.length === 0 ? (
              <Card>
                <CardContent className="py-8 text-center text-muted-foreground">
                  <p>No NPCs created yet.</p>
                  {isGm && (
                    <Button variant="outline" className="mt-4" onClick={() => openStandaloneNpcDialog()}>
                      <Plus className="w-4 h-4 mr-2" />
                      Create First NPC
                    </Button>
                  )}
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {standaloneNpcs.map((npc) => (
                  <Card key={npc.id}>
                    <CardHeader>
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <CardTitle className="text-lg">{npc.name}</CardTitle>
                          <CardDescription>{npc.title}</CardDescription>
                        </div>
                        {isGm && (
                          <div className="flex gap-1">
                            <Button
                              size="icon"
                              variant="ghost"
                              className="h-8 w-8"
                              onClick={() => openStandaloneNpcDialog(npc)}
                            >
                              <Edit className="w-4 h-4" />
                            </Button>
                            <Button
                              size="icon"
                              variant="ghost"
                              className="h-8 w-8"
                              onClick={() => handleDeleteStandaloneNpc(npc.id)}
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        )}
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-2">
                      {npc.resistances && (
                        <div className="text-sm">
                          <span className="font-semibold">{t.marketplace?.npcResistances || "Resistances"}:</span>{" "}
                          <span className="text-muted-foreground">{npc.resistances}</span>
                        </div>
                      )}
                      {npc.story && (
                        <div className="text-sm text-muted-foreground">
                          <p className="line-clamp-3">{npc.story}</p>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>

          {/* Shop NPCs (if shop selected) */}
          {selectedShopId && (
            <div className="space-y-4 mt-6 border-t pt-6">
              <div className="flex items-center justify-between">
                <h4 className="text-lg font-semibold">
                  NPCs in "{selectedShop?.name || "Selected Shop"}"
                </h4>
                {isGm && (
                  <Button size="sm" variant="outline" onClick={() => openNpcDialog()}>
                    <Plus className="w-4 h-4 mr-2" />
                    Add NPC to Shop
                  </Button>
                )}
              </div>
              {shopNpcs.length === 0 ? (
                <Card>
                  <CardContent className="py-6 text-center text-muted-foreground">
                    <p>No NPCs assigned to this shop.</p>
                  </CardContent>
                </Card>
              ) : (
                <div className="grid gap-4 md:grid-cols-2">
                  {shopNpcs.map((npc) => (
                    <Card key={npc.id}>
                      <CardHeader>
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                            <CardTitle>{npc.name}</CardTitle>
                            <CardDescription>{npc.title}</CardDescription>
                          </div>
                          {isGm && (
                            <div className="flex gap-1">
                              <Button
                                size="icon"
                                variant="ghost"
                                className="h-8 w-8"
                                onClick={() => openNpcDialog(npc)}
                              >
                                <Edit className="w-4 h-4" />
                              </Button>
                              <Button
                                size="icon"
                                variant="ghost"
                                className="h-8 w-8"
                                onClick={() => handleDeleteNpc(npc.id)}
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>
                          )}
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-2">
                        {npc.resistances && (
                          <div className="text-sm">
                            <span className="font-semibold">{t.marketplace?.npcResistances || "Resistances"}:</span>{" "}
                            <span className="text-muted-foreground">{npc.resistances}</span>
                          </div>
                        )}
                        {npc.story && (
                          <div className="text-sm text-muted-foreground">
                            <p>{npc.story}</p>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          )}
        </TabsContent>
      </Tabs>
      </CardContent>

      <Dialog open={isLocationDialogOpen} onOpenChange={setIsLocationDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingLocation ? "Edit Location" : t.marketplace?.createLocation || "Add Location"}
            </DialogTitle>
            <DialogDescription>
              {editingLocation ? "Update location details" : t.marketplace?.locationSubtitle || "Define a new spot on your map."}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>{t.marketplace?.locationName || "Name"}</Label>
              <Input value={locationForm.name} onChange={(event) => setLocationForm({ ...locationForm, name: event.target.value })} />
            </div>
            <div>
              <Label>{t.marketplace?.locationType || "Location Type"}</Label>
              <Select value={locationForm.type} onValueChange={(value) => setLocationForm({ ...locationForm, type: value as LocationType })}>
                <SelectTrigger>
                  <SelectValue placeholder={t.marketplace?.selectLocationType || "Select type"} />
                </SelectTrigger>
                <SelectContent>
                  {LOCATION_TYPE_OPTIONS.map((type) => (
                    <SelectItem key={type} value={type}>
                      {getLocationTypeLabel(type, t.marketplace)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>{t.marketplace?.description || "Description"}</Label>
              <Textarea value={locationForm.description} onChange={(event) => setLocationForm({ ...locationForm, description: event.target.value })} />
            </div>
            <Button onClick={handleSaveLocation} className="w-full">
              {editingLocation ? "Update Location" : t.marketplace?.create || "Create"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={isShopDialogOpen} onOpenChange={setIsShopDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingShop ? "Edit Shop" : t.marketplace?.createShop || "Add Shop"}</DialogTitle>
            <DialogDescription>
              {editingShop ? "Update shop details" : t.marketplace?.shopSubtitle || "Add a new shop to this location."}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>{t.marketplace?.shopName || "Shop Name"}</Label>
              <Input value={shopForm.name} onChange={(event) => setShopForm({ ...shopForm, name: event.target.value })} />
            </div>
            <div>
              <Label>{t.marketplace?.shopType || "Shop Type"}</Label>
              <Select value={shopForm.type} onValueChange={(value) => setShopForm({ ...shopForm, type: value as ShopType })}>
                <SelectTrigger>
                  <SelectValue placeholder={t.marketplace?.selectShopType || "Select type"} />
                </SelectTrigger>
                <SelectContent>
                  {SHOP_TYPE_OPTIONS.map((type) => (
                    <SelectItem key={type} value={type}>
                      {getShopTypeLabel(type, t.marketplace)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>{t.marketplace?.description || "Description"}</Label>
              <Textarea value={shopForm.description} onChange={(event) => setShopForm({ ...shopForm, description: event.target.value })} />
            </div>
            <div>
              <div className="flex items-center justify-between mb-2">
                <Label>{t.marketplace?.shopkeeperName || "Shopkeeper (Optional)"}</Label>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setIsStandaloneNpcDialogOpen(true)}
                >
                  + Create New NPC
                </Button>
              </div>
              <Input
                value={shopForm.shopkeeper}
                onChange={(event) => setShopForm({ ...shopForm, shopkeeper: event.target.value })}
                placeholder="Enter shopkeeper name or select an NPC below"
              />
            </div>
            <div>
              <Label>Assign Existing NPC (Optional)</Label>
              <Select
                value={shopForm.selectedNpcId || "none"}
                onValueChange={(value) => {
                  if (value === "none") {
                    setShopForm({ ...shopForm, selectedNpcId: "", shopkeeper: "" })
                  } else {
                    const selectedNpc = standaloneNpcs.find((npc) => npc.id === value)
                    setShopForm({
                      ...shopForm,
                      selectedNpcId: value,
                      shopkeeper: selectedNpc?.name || "",
                    })
                  }
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select an NPC from your campaign" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">None</SelectItem>
                  {standaloneNpcs.map((npc) => (
                    <SelectItem key={npc.id} value={npc.id}>
                      {npc.name} {npc.title && `- ${npc.title}`}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {standaloneNpcs.length === 0 && (
                <p className="text-xs text-muted-foreground mt-1">
                  No NPCs created yet. Click "Create New NPC" to add one.
                </p>
              )}
            </div>
            <Button onClick={handleSaveShop} className="w-full">
              {editingShop ? "Update Shop" : t.marketplace?.create || "Create"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={isNpcDialogOpen} onOpenChange={setIsNpcDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingNpc ? t.marketplace?.editNpc : t.marketplace?.addNpc}</DialogTitle>
            <DialogDescription>{t.marketplace?.npcSubtitle || "Describe who runs the shop."}</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>{t.marketplace?.npcName || "Name"}</Label>
              <Input value={npcForm.name} onChange={(event) => setNpcForm({ ...npcForm, name: event.target.value })} />
            </div>
            <div>
              <Label>{t.marketplace?.npcTitleField || "Title"}</Label>
              <Input value={npcForm.title} onChange={(event) => setNpcForm({ ...npcForm, title: event.target.value })} />
            </div>
            <div>
              <Label>{t.marketplace?.npcResistances || "Resistances"}</Label>
              <Textarea
                value={npcForm.resistances}
                onChange={(event) => setNpcForm({ ...npcForm, resistances: event.target.value })}
              />
            </div>
            <div>
              <Label>{t.marketplace?.npcStory || "Story"}</Label>
              <Textarea value={npcForm.story} onChange={(event) => setNpcForm({ ...npcForm, story: event.target.value })} />
            </div>
            <Button onClick={handleSaveNpc} className="w-full">
              {editingNpc ? t.marketplace?.saveChanges || "Update NPC" : t.marketplace?.addNpc || "Add NPC"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={isStandaloneNpcDialogOpen} onOpenChange={setIsStandaloneNpcDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingStandaloneNpc ? "Edit NPC" : "Create NPC"}</DialogTitle>
            <DialogDescription>
              {editingStandaloneNpc
                ? "Update NPC details. This NPC can be assigned to multiple shops."
                : "Create a reusable NPC that can be assigned to shops in your campaign."}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>{t.marketplace?.npcName || "Name"}</Label>
              <Input value={npcForm.name} onChange={(event) => setNpcForm({ ...npcForm, name: event.target.value })} />
            </div>
            <div>
              <Label>{t.marketplace?.npcTitleField || "Title"}</Label>
              <Input value={npcForm.title} onChange={(event) => setNpcForm({ ...npcForm, title: event.target.value })} />
            </div>
            <div>
              <Label>{t.marketplace?.npcResistances || "Resistances"}</Label>
              <Textarea
                value={npcForm.resistances}
                onChange={(event) => setNpcForm({ ...npcForm, resistances: event.target.value })}
              />
            </div>
            <div>
              <Label>{t.marketplace?.npcStory || "Story"}</Label>
              <Textarea value={npcForm.story} onChange={(event) => setNpcForm({ ...npcForm, story: event.target.value })} />
            </div>
            <Button onClick={handleSaveStandaloneNpc} className="w-full">
              {editingStandaloneNpc ? "Update NPC" : "Create NPC"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </Card>
  )
}
