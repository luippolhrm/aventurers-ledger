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
import { MapPin, Store, Sparkles, Users, Package } from "lucide-react"
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

  const [isLocationDialogOpen, setIsLocationDialogOpen] = useState(false)
  const [locationForm, setLocationForm] = useState({
    name: "",
    description: "",
    type: "village" as LocationType,
  })
  const [isShopDialogOpen, setIsShopDialogOpen] = useState(false)
  const [shopForm, setShopForm] = useState({
    name: "",
    description: "",
    shopkeeper: "",
    type: "general" as ShopType,
  })
  const [isNpcDialogOpen, setIsNpcDialogOpen] = useState(false)
  const [npcForm, setNpcForm] = useState({
    name: "",
    title: "",
    resistances: "",
    story: "",
  })
  const [editingNpc, setEditingNpc] = useState<ShopNpcRow | null>(null)

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

  const handleCreateLocation = async () => {
    if (!locationForm.name.trim() || !selectedCampaignId) return

    const { data, error } = await supabase
      .from("locations")
      .insert({
        name: locationForm.name.trim(),
        description: locationForm.description,
        location_type: locationForm.type,
        campaign_id: selectedCampaignId,
      })
      .select()

    if (!error && data) {
      setLocations([data[0], ...(locations || [])])
      setLocationForm({ name: "", description: "", type: "village" })
      setIsLocationDialogOpen(false)
    }
  }

  const handleCreateShop = async () => {
    if (!shopForm.name.trim() || !selectedLocationId) return

    const { data, error } = await supabase
      .from("shops")
      .insert({
        name: shopForm.name.trim(),
        description: shopForm.description,
        shopkeeper_name: shopForm.shopkeeper || null,
        shop_type: shopForm.type,
        location_id: selectedLocationId,
      })
      .select()

    if (!error && data) {
      setShops([data[0], ...(shops || [])])
      setShopForm({ name: "", description: "", shopkeeper: "", type: "general" })
      setIsShopDialogOpen(false)
    }
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
    <div className="w-full max-w-6xl mx-auto space-y-6">
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <div>
          <h2 className="text-3xl font-bold flex items-center gap-2 text-foreground">
            <MapPin className="w-8 h-8" />
            {t.marketplace?.mapTitle || t.sidebar.map || "Mapa"}
          </h2>
            <p className="text-muted-foreground">
              {t.marketplace?.mapDescription || "Visualiza las ubicaciones y conecta tus tiendas."}
            </p>
          </div>
          {isGm && (
            <Button onClick={() => setIsLocationDialogOpen(true)}>
              <Sparkles className="w-4 h-4 mr-2" />
              {t.marketplace?.createLocation || "Add Location"}
            </Button>
          )}
        </div>

        <div className="flex flex-col gap-2">
          {campaigns.length === 0 ? (
            <p className="text-sm text-muted-foreground">{t.marketplace?.noCampaigns || "Join a campaign to see the map."}</p>
          ) : (
            <Select value={selectedCampaignId} onValueChange={(value) => setSelectedCampaignId(value)}>
              <SelectTrigger>
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

      <div className="grid gap-6 lg:grid-cols-[1.1fr_1fr_1.4fr]">
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-xl font-semibold flex items-center gap-2">
              <MapPin className="w-5 h-5" />
              {t.marketplace?.yourLocations || "Locations"}
            </h3>
            <span className="text-sm text-muted-foreground">
              {locations.length} {t.marketplace?.locationsTag || "places"}
            </span>
          </div>
          <div className="space-y-3 max-h-[600px] overflow-y-auto pr-2">
            {locations.map((location) => (
              <Card
                key={location.id}
                className={`transition-shadow ${selectedLocationId === location.id ? "border border-primary" : "border border-border"}`}
                onClick={() => setSelectedLocationId(location.id)}
              >
                <CardHeader>
                  <div className="flex justify-between items-center">
                    <div>
                      <CardTitle className="text-lg">{location.name}</CardTitle>
                      <CardDescription>{location.description}</CardDescription>
                    </div>
                    {location.location_type && (
                      <span className="text-xs px-2 py-1 rounded-full bg-primary/10 text-primary uppercase">
                        {getLocationTypeLabel(location.location_type, t.marketplace)}
                      </span>
                    )}
                  </div>
                </CardHeader>
              </Card>
            ))}
            {!locations.length && (
              <p className="text-sm text-muted-foreground">{t.marketplace?.emptyLocations || "No locations yet."}</p>
            )}
          </div>
        </section>

        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-xl font-semibold flex items-center gap-2">
              <Store className="w-5 h-5" />
              {t.marketplace?.shops || "Shops"}
            </h3>
            {isGm && selectedLocationId && (
              <Button size="sm" onClick={() => setIsShopDialogOpen(true)}>
                {t.marketplace?.createShop || "Create Shop"}
              </Button>
            )}
          </div>
          {!selectedLocationId && (
            <p className="text-sm text-muted-foreground">{t.marketplace?.noLocationSelected || "Select a location first."}</p>
          )}
          <div className="space-y-3 max-h-[520px] overflow-y-auto pr-2">
            {shops.map((shop) => (
              <Card
                key={shop.id}
                className={`transition-shadow ${selectedShopId === shop.id ? "border border-primary" : "border border-border"} cursor-pointer`}
                onClick={() => handleShopClick(shop.id)}
              >
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle>{shop.name}</CardTitle>
                      <CardDescription>{shop.description}</CardDescription>
                      <p className="text-xs text-muted-foreground mt-1">
                        {shop.shopkeeper_name ? `${t.marketplace?.shopkeeper || "Shopkeeper"}: ${shop.shopkeeper_name}` : ""}
                      </p>
                    </div>
                    {shop.shop_type && (
                      <span className="text-xs px-2 py-1 rounded-full bg-foreground/5 text-foreground uppercase">
                        {getShopTypeLabel(shop.shop_type, t.marketplace)}
                      </span>
                    )}
                  </div>
                </CardHeader>
              </Card>
            ))}
            {!shops.length && selectedLocationId && (
              <p className="text-sm text-muted-foreground">{t.marketplace?.emptyShops || "No shops defined yet."}</p>
            )}
          </div>
        </section>

        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-xl font-semibold flex items-center gap-2">
              <Users className="w-5 h-5" />
              {t.marketplace?.npcTitle || "NPCs"}
            </h3>
            {isGm && selectedShopId && (
              <div className="flex gap-2">
                <Button size="sm" variant="outline" onClick={() => router.push(`/shop-items/${selectedShopId}`)}>
                  <Package className="w-4 h-4 mr-2" />
                  {t.marketplace?.manageItems || "Manage Items"}
                </Button>
                <Button size="sm" onClick={() => openNpcDialog()}>
                  {t.marketplace?.addNpc || "Add NPC"}
                </Button>
              </div>
            )}
          </div>
          <p className="text-xs text-muted-foreground">
            {t.marketplace?.npcHint || "NPCs are optional; shops keep operating with or without them."}
          </p>

          {selectedShop ? (
            <>
              <div className="space-y-3 max-h-[250px] overflow-y-auto pr-2">
                {shopNpcs.map((npc) => (
                  <Card key={npc.id} className="shadow-sm">
                    <CardHeader>
                      <div className="flex justify-between items-start">
                        <div>
                          <CardTitle>{npc.name}</CardTitle>
                          <CardDescription>{npc.title}</CardDescription>
                          {npc.resistances && (
                            <p className="text-xs text-muted-foreground mt-1">
                              <span className="font-semibold">{t.marketplace?.npcResistances || "Resistances"}:</span>{" "}
                              {npc.resistances}
                            </p>
                          )}
                        </div>
                        {isGm && (
                          <div className="flex gap-2">
                            <Button size="icon" variant="ghost" onClick={() => openNpcDialog(npc)}>
                              ✏️
                            </Button>
                            <Button size="icon" variant="ghost" onClick={() => handleDeleteNpc(npc.id)}>
                              🗑️
                            </Button>
                          </div>
                        )}
                      </div>
                    </CardHeader>
                    {npc.story && <CardContent>{npc.story}</CardContent>}
                  </Card>
                ))}
                {!shopNpcs.length && (
                  <p className="text-sm text-muted-foreground">{t.marketplace?.emptyNpcs || "No NPCs yet."}</p>
                )}
              </div>

              <div className="space-y-3">
                {activeCharacterId ? (
                  <ShopCatalog language={language} shopId={selectedShopId} characterId={activeCharacterId} />
                ) : (
                  <p className="text-sm text-muted-foreground">{t.characterSelector?.selectCharacter || "Select your character to browse the shop catalog."}</p>
                )}
              </div>
            </>
          ) : (
            <p className="text-sm text-muted-foreground">{t.marketplace?.noShopSelected || "Pick a shop to see details."}</p>
          )}
        </section>
      </div>

      <Dialog open={isLocationDialogOpen} onOpenChange={setIsLocationDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t.marketplace?.createLocation || "Add Location"}</DialogTitle>
            <DialogDescription>{t.marketplace?.locationSubtitle || "Define a new spot on your map."}</DialogDescription>
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
            <Button onClick={handleCreateLocation} className="w-full">
              {t.marketplace?.create || "Create"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={isShopDialogOpen} onOpenChange={setIsShopDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t.marketplace?.createShop || "Add Shop"}</DialogTitle>
            <DialogDescription>{t.marketplace?.shopSubtitle || "Add a new shop to this location."}</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>{t.marketplace?.shopName || "Shop Name"}</Label>
              <Input value={shopForm.name} onChange={(event) => setShopForm({ ...shopForm, name: event.target.value })} />
            </div>
            <div>
              <Label>{t.marketplace?.shopkeeperName || "Shopkeeper"}</Label>
              <Input value={shopForm.shopkeeper} onChange={(event) => setShopForm({ ...shopForm, shopkeeper: event.target.value })} />
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
            <Button onClick={handleCreateShop} className="w-full">
              {t.marketplace?.create || "Create"}
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
    </div>
  )
}
