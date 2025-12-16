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
  id: string
  name: string
  role: "game_master" | "player"
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
}

const getLocationTypeLabel = (type: LocationType, map?: MarketplaceTranslation) => map?.locationTypes?.[type] || type
const getShopTypeLabel = (type: ShopType, map?: MarketplaceTranslation) => map?.shopTypes?.[type] || type

export function LocationsMap({ language }: LocationsMapProps) {
  const t = translations[language]
  const router = useRouter()
  const supabase = createBrowserClient()
  const { user } = useAuth()
  const { activeCharacterId } = useActiveCharacter()
  const { toast } = useToast()

  const [campaigns, setCampaigns] = useState<CampaignEntry[]>([])
  const [selectedCampaignId, setSelectedCampaignId] = useState<string>("")
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

  const activeCampaign = useMemo(
    () => campaigns.find((campaign) => campaign.id === selectedCampaignId),
    [campaigns, selectedCampaignId],
  )
  const isGm = activeCampaign?.role === "game_master"

  useEffect(() => {
    if (user) {
      loadCampaigns()
    }
  }, [user])

  useEffect(() => {
    if (selectedCampaignId) {
      loadLocations()
      setSelectedLocationId("")
      setSelectedShopId("")
    }
  }, [selectedCampaignId])

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
    if (selectedShopId) {
      loadShopNpcs()
    } else {
      setShopNpcs([])
    }
  }, [selectedShopId])

  useEffect(() => {
    if (selectedCampaignId) {
      loadStandaloneNpcs()
    } else {
      setStandaloneNpcs([])
    }
  }, [selectedCampaignId])

  const loadCampaigns = async () => {
    const { data, error } = await supabase
      .from("campaign_members")
      .select("campaign_id, role, campaigns(id, name)")
      .eq("user_id", user?.id)

    if (error) {
      toast({
        title: t.inventory?.error || "Error",
        description: error.message,
        variant: "destructive",
      })
      return
    }

    const mapped: CampaignEntry[] = (data || [])
      .map((entry: { campaigns?: { id: string; name: string }; role: "game_master" | "player" }) => ({
        id: entry.campaigns?.id,
        name: entry.campaigns?.name,
        role: entry.role,
      }))
      .filter((entry: { id?: string }) => entry.id)

    setCampaigns(mapped)
    if (!selectedCampaignId && mapped.length > 0) {
      setSelectedCampaignId(mapped[0].id)
    }
  }

  const loadLocations = async () => {
    if (!selectedCampaignId) return

    const { data, error } = await supabase
      .from("locations")
      .select("*")
      .eq("campaign_id", selectedCampaignId)
      .order("created_at", { ascending: false })

    if (!error && data) {
      setLocations(data as LocationRow[])
    }
  }

  const loadShops = async () => {
    if (!selectedLocationId) return

    const { data, error } = await supabase
      .from("shops")
      .select("*")
      .eq("location_id", selectedLocationId)
      .order("created_at", { ascending: false })

    if (!error && data) {
      setShops(data as ShopRow[])
    }
  }

  const loadShopNpcs = async () => {
    if (!selectedShopId) return

    const { data, error } = await supabase
      .from("shop_npcs")
      .select("*")
      .eq("shop_id", selectedShopId)
      .order("created_at", { ascending: false })

    if (!error && data) {
      setShopNpcs(data as ShopNpcRow[])
    }
  }

  const loadStandaloneNpcs = async () => {
    if (!selectedCampaignId) return

    const { data, error } = await supabase
      .from("npcs")
      .select("*")
      .eq("campaign_id", selectedCampaignId)
      .order("created_at", { ascending: false })

    if (!error && data) {
      setStandaloneNpcs(data as StandaloneNpcRow[])
    }
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

    const payload = {
      name: locationForm.name.trim(),
      description: locationForm.description || null,
      location_type: locationForm.type,
      campaign_id: selectedCampaignId,
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

    const payload = {
      name: npcForm.name.trim(),
      title: npcForm.title || null,
      resistances: npcForm.resistances || null,
      story: npcForm.story || null,
      campaign_id: selectedCampaignId,
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
    <div className="w-full max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-3xl font-bold flex items-center gap-2 text-foreground">
              <MapPin className="w-8 h-8" />
              {t.marketplace?.mapTitle || t.sidebar.map || "Mapa"}
            </h2>
            <p className="text-muted-foreground mt-1">
              {t.marketplace?.mapDescription || "Visualiza las ubicaciones y conecta tus tiendas."}
            </p>
          </div>
        </div>

        {/* Campaign Selector */}
        <div className="flex flex-col gap-2">
          {campaigns.length === 0 ? (
            <p className="text-sm text-muted-foreground">{t.marketplace?.noCampaigns || "Join a campaign to see the map."}</p>
          ) : (
            <Select value={selectedCampaignId} onValueChange={(value) => setSelectedCampaignId(value)}>
              <SelectTrigger className="w-full max-w-md">
                <SelectValue placeholder={t.marketplace?.selectCampaign || "Select a campaign"} />
              </SelectTrigger>
              <SelectContent>
                {campaigns.map((campaign) => (
                  <SelectItem key={campaign.id} value={campaign.id}>
                    {campaign.name} {campaign.role === "game_master" ? "· GM" : ""}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </div>
      </div>

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
                        onClick={() => router.push(`/shop-items/${shop.id}`)}
                      >
                        <Package className="w-4 h-4 mr-2" />
                        {t.marketplace?.manageItems || "Manage Items"}
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
    </div>
  )
}
