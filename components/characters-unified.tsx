"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { createBrowserClient } from "@/lib/supabase/client"
import { useActiveCharacter } from "@/lib/active-character-context"
import { useAuth } from "@/lib/auth-context"
import { type Language, translations } from "@/lib/translations"
import {
  UserPlus,
  Edit,
  Archive,
  Loader2,
  User,
  RotateCcw,
  ArrowLeft,
  Eye,
  Coins,
  Package,
} from "lucide-react"

interface CharactersUnifiedProps {
  language: Language
}

interface Character {
  id: string
  name: string
  race: string
  class?: string
  level?: number
  alignment?: string
  background?: string
  experience_points?: number
  carrying_capacity?: number
  preparation_notes?: string
  avatar_url?: string
  gender?: string | null
  created_at: string
  archived: boolean
  user_id?: string
}

type ViewMode = "list" | "view" | "edit"

export function CharactersUnified({ language }: CharactersUnifiedProps) {
  const { user } = useAuth()
  const [viewMode, setViewMode] = useState<ViewMode>("list")
  const [characters, setCharacters] = useState<Character[]>([])
  const [archivedCharacters, setArchivedCharacters] = useState<Character[]>([])
  const [selectedCharacter, setSelectedCharacter] = useState<Character | null>(null)
  const [loading, setLoading] = useState(true)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingCharacter, setEditingCharacter] = useState<Character | null>(null)
  const [characterName, setCharacterName] = useState("")
  const [race, setRace] = useState("")
  const [characterClass, setCharacterClass] = useState("")
  const [level, setLevel] = useState<number>(1)
  const [gender, setGender] = useState<string>("")
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null)
  const [saving, setSaving] = useState(false)
  const [wallet, setWallet] = useState<{ platinum: number; gold: number; electrum: number; silver: number; copper: number; total_wealth: number } | null>(null)
  const [inventoryItems, setInventoryItems] = useState<any[]>([])
  const { activeCharacterId, setActiveCharacterId, triggerRefresh } = useActiveCharacter()
  const t = translations[language]

  useEffect(() => {
    loadCharacters()
  }, [])

  useEffect(() => {
    if (viewMode === "view" || viewMode === "edit" || activeCharacterId) {
      loadSelectedCharacter(activeCharacterId || "")
    }
  }, [viewMode, activeCharacterId])

  const loadCharacters = async () => {
    setLoading(true)
    try {
      const supabase = createBrowserClient()

      if (!user) {
        setCharacters([])
        setArchivedCharacters([])
        setLoading(false)
        return
      }

      const { data: activeData, error: activeError } = await supabase
        .from("characters")
        .select("*")
        .eq("archived", false)
        .eq("user_id", user.id)
        .order("created_at", { ascending: true })

      if (activeError) throw activeError

      const { data: archivedData, error: archivedError } = await supabase
        .from("characters")
        .select("*")
        .eq("archived", true)
        .eq("user_id", user.id)
        .order("created_at", { ascending: true })

      if (archivedError) throw archivedError

      setCharacters(activeData || [])
      setArchivedCharacters(archivedData || [])

      if (!activeCharacterId && activeData && activeData.length > 0) {
        setActiveCharacterId(activeData[0].id)
      }
    } catch (error) {
      console.error("[v0] Error loading characters:", error)
    } finally {
      setLoading(false)
    }
  }

  const loadSelectedCharacter = async (characterId: string) => {
    try {
      const supabase = createBrowserClient()
      const { data, error } = await supabase.from("characters").select("*").eq("id", characterId).single()

      if (error) throw error
      setSelectedCharacter(data)
      
      // Load wallet
      const { data: walletData, error: walletError } = await supabase
        .from("wallets")
        .select("*")
        .eq("character_id", characterId)
        .maybeSingle()
      
      if (!walletError && walletData) {
        setWallet(walletData)
      } else {
        setWallet(null)
      }
      
      // Load inventory items
      const { data: inventoryData, error: inventoryError } = await supabase
        .from("inventory")
        .select("*")
        .eq("character_id", characterId)
        .order("item_name", { ascending: true })
      
      if (!inventoryError && inventoryData) {
        setInventoryItems(inventoryData)
      } else {
        setInventoryItems([])
      }
    } catch (error) {
      console.error("[v0] Error loading character:", error)
    }
  }

  const openCreateDialog = () => {
    setEditingCharacter(null)
    setCharacterName("")
    setRace("")
    setCharacterClass("")
    setLevel(1)
    setGender("")
    setMessage(null)
    setIsDialogOpen(true)
  }

  const openEditDialog = (character: Character) => {
    setEditingCharacter(character)
    setCharacterName(character.name)
    setRace(character.race)
    setCharacterClass(character.class || "")
    setLevel(character.level || 1)
    setGender(character.gender || "")
    setMessage(null)
    setIsDialogOpen(true)
  }

  const handleSave = async () => {
    if (!characterName.trim()) {
      setMessage({ type: "error", text: t.character.error })
      return
    }

    setSaving(true)
    try {
      const supabase = createBrowserClient()

      // Refrescar usuario desde Supabase por si el contexto aún no está listo
      const {
        data: { user: currentUser },
        error: userError,
      } = await supabase.auth.getUser()

      if (userError || !currentUser) {
      setMessage({ type: "error", text: "You must be logged in to create a character" })
        setSaving(false)
      return
    }

      const userId = currentUser.id

      if (editingCharacter) {
        const { error } = await supabase
          .from("characters")
          .update({
            name: characterName.trim(),
            race: race.trim(),
            class: characterClass.trim() || null,
            level: level || null,
            gender: gender || null,
          })
          .eq("id", editingCharacter.id)

        if (error) throw error

        setMessage({ type: "success", text: t.character.updated })
      } else {
        const { data, error } = await supabase
          .from("characters")
          .insert({
            name: characterName.trim(),
            race: race.trim(),
            class: characterClass.trim() || null,
            level: level || null,
            gender: gender || null,
            user_id: userId,
            archived: false,
          })
          .select()
          .single()

        if (error) throw error

        // El wallet se crea automáticamente mediante el trigger en la base de datos
        // No es necesario crearlo manualmente aquí

        setMessage({ type: "success", text: t.character.success })

        if (characters.length === 0 && data) {
          setActiveCharacterId(data.id)
        }
      }

      await loadCharacters()
      triggerRefresh()

      setTimeout(() => {
        setIsDialogOpen(false)
        setMessage(null)
      }, 1500)
    } catch (error) {
      console.error("[v0] Error saving character:", error)
      setMessage({ type: "error", text: t.character.error })
    } finally {
      setSaving(false)
    }
  }

  const handleArchive = async (character: Character) => {
    if (!confirm(t.character.archiveConfirm)) {
      return
    }

    try {
      const supabase = createBrowserClient()
      const { error } = await supabase.from("characters").update({ archived: true }).eq("id", character.id)

      if (error) throw error

      if (character.id === activeCharacterId) {
        const remaining = characters.filter((c) => c.id !== character.id)
        setActiveCharacterId(remaining.length > 0 ? remaining[0].id : null)
      }

      setMessage({ type: "success", text: t.character.archiveSuccess })
      await loadCharacters()
      triggerRefresh()

      setTimeout(() => {
        setMessage(null)
      }, 2000)
    } catch (error) {
      console.error("[v0] Error archiving character:", error)
      setMessage({ type: "error", text: t.character.error })
    }
  }

  const handleRestore = async (character: Character) => {
    if (!confirm(t.character.restoreConfirm)) {
      return
    }

    try {
      const supabase = createBrowserClient()
      const { error } = await supabase.from("characters").update({ archived: false }).eq("id", character.id)

      if (error) throw error

      setMessage({ type: "success", text: t.character.restoreSuccess })
      await loadCharacters()
      triggerRefresh()

      setTimeout(() => {
        setMessage(null)
      }, 2000)
    } catch (error) {
      console.error("[v0] Error restoring character:", error)
      setMessage({ type: "error", text: t.character.error })
    }
  }

  const handleViewProfile = (character: Character) => {
    setActiveCharacterId(character.id)
    setViewMode("view")
  }

  const handleEditProfile = (character: Character) => {
    setActiveCharacterId(character.id)
    setViewMode("edit")
  }

  const handleUpdateProfile = async () => {
    if (!selectedCharacter || !activeCharacterId) return

    try {
      console.log("[v0] Saving character profile:", selectedCharacter)
      console.log("[v0] Level value:", selectedCharacter.level, "Type:", typeof selectedCharacter.level)

      const supabase = createBrowserClient()
      const { error } = await supabase.from("characters").update(selectedCharacter).eq("id", activeCharacterId)

      if (error) throw error

      console.log("[v0] Profile saved successfully")
      setMessage({ type: "success", text: t.characterProfile.updateSuccess })
      await loadCharacters()
      triggerRefresh()
      setTimeout(() => setMessage(null), 3000)
    } catch (error) {
      console.error("[v0] Error updating character:", error)
      setMessage({ type: "error", text: t.characterProfile.updateError })
    }
  }

  if (loading) {
    return (
      <Card className="w-full max-w-4xl shadow-xl">
        <CardContent className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </CardContent>
      </Card>
    )
  }

  if (viewMode === "view") {
    if (!selectedCharacter) {
      return (
        <Card>
          <CardHeader>
            <CardTitle>{t.characterProfile.noCharacter}</CardTitle>
            <CardDescription>{t.characterProfile.createFirst}</CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={() => setViewMode("list")} className="gap-2">
              <ArrowLeft className="w-4 h-4" />
              {t.characterProfile.backToList}
            </Button>
          </CardContent>
        </Card>
      )
    }

    return (
      <div className="w-full max-w-6xl space-y-6">
        <div className="flex items-center justify-between">
          <Button onClick={() => setViewMode("list")} variant="outline" className="gap-2">
            <ArrowLeft className="w-4 h-4" />
            {t.characterProfile.backToList}
          </Button>
          <Button onClick={() => setViewMode("edit")} className="gap-2">
            <Edit className="w-4 h-4" />
            {t.character.editCharacter}
          </Button>
        </div>

        {/* Character Sheet Header */}
        <Card className="bg-gradient-to-r from-primary/10 to-primary/5">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-3xl">{selectedCharacter.name}</CardTitle>
                <CardDescription className="text-lg mt-2">
                  {selectedCharacter.class && `${selectedCharacter.class} • `}
                  {t.characterProfile.level} {selectedCharacter.level || 1} • {selectedCharacter.race}
                  {selectedCharacter.gender && ` • ${selectedCharacter.gender === 'male' ? 'Masculino' : selectedCharacter.gender === 'female' ? 'Femenino' : 'Otro'}`}
                  {selectedCharacter.alignment && ` • ${selectedCharacter.alignment}`}
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          </Card>

          {/* Character Details */}
          <Card>
            <CardHeader>
              <CardTitle>{t.characterProfile.characterDetails}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {selectedCharacter.background && (
                <div className="space-y-1">
                  <p className="text-sm font-medium text-muted-foreground">{t.characterProfile.background}</p>
                  <p>{selectedCharacter.background}</p>
                </div>
              )}
              <div className="space-y-1">
                <p className="text-sm font-medium text-muted-foreground">{t.characterProfile.experiencePoints}</p>
                <p className="text-xl font-bold">{selectedCharacter.experience_points || 0} XP</p>
              </div>
            <div className="space-y-1">
              <p className="text-sm font-medium text-muted-foreground">Carrying Capacity</p>
              <p className="text-xl font-bold">{selectedCharacter.carrying_capacity || 150} lbs</p>
            </div>
            {selectedCharacter.gender && (
              <div className="space-y-1">
                <p className="text-sm font-medium text-muted-foreground">Gender</p>
                <p>{selectedCharacter.gender === 'male' ? 'Masculino' : selectedCharacter.gender === 'female' ? 'Femenino' : 'Otro'}</p>
              </div>
            )}
            {selectedCharacter.preparation_notes && (
              <div className="space-y-1">
                <p className="text-sm font-medium text-muted-foreground">Preparation Notes</p>
                <p className="text-muted-foreground whitespace-pre-wrap">{selectedCharacter.preparation_notes}</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Finances Section */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Coins className="w-5 h-5" />
                {t.wallet.title || "Finances"}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {wallet ? (
                <div className="space-y-4">
                  <div className="grid grid-cols-5 gap-3">
                    <div className="text-center p-3 bg-muted rounded-lg">
                      <div className="text-xs text-muted-foreground mb-1">PP</div>
                      <div className="text-lg font-bold">{wallet.platinum}</div>
                    </div>
                    <div className="text-center p-3 bg-muted rounded-lg">
                      <div className="text-xs text-muted-foreground mb-1">GP</div>
                      <div className="text-lg font-bold">{wallet.gold}</div>
                    </div>
                    <div className="text-center p-3 bg-muted rounded-lg">
                      <div className="text-xs text-muted-foreground mb-1">EP</div>
                      <div className="text-lg font-bold">{wallet.electrum}</div>
                    </div>
                    <div className="text-center p-3 bg-muted rounded-lg">
                      <div className="text-xs text-muted-foreground mb-1">SP</div>
                      <div className="text-lg font-bold">{wallet.silver}</div>
                    </div>
                    <div className="text-center p-3 bg-muted rounded-lg">
                      <div className="text-xs text-muted-foreground mb-1">CP</div>
                      <div className="text-lg font-bold">{wallet.copper}</div>
                    </div>
                  </div>
                  <div className="pt-3 border-t">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-muted-foreground">{t.wallet.totalWealth || "Total Wealth"}</span>
                      <span className="text-xl font-bold">
                        {Number.isInteger(wallet.total_wealth) ? wallet.total_wealth : wallet.total_wealth.toFixed(2)} GP
                      </span>
                    </div>
                  </div>
                </div>
              ) : (
                <p className="text-muted-foreground">{t.wallet.noWallet || "No wallet data available"}</p>
              )}
            </CardContent>
          </Card>

          {/* Equipment/Inventory Section */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Package className="w-5 h-5" />
                {t.inventory.title || "Equipment & Inventory"}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {inventoryItems.length > 0 ? (
                <div className="space-y-2">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                    {inventoryItems.slice(0, 6).map((item: any) => (
                      <div key={item.id} className="p-3 bg-muted rounded-lg border">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-medium">{item.item_name}</p>
                            {item.quantity && item.quantity > 1 && (
                              <p className="text-xs text-muted-foreground">x{item.quantity}</p>
                            )}
                          </div>
                          {item.equipped && (
                            <span className="text-xs bg-primary/20 text-primary px-2 py-1 rounded">Equipped</span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                  {inventoryItems.length > 6 && (
                    <p className="text-sm text-muted-foreground text-center pt-2">
                      +{inventoryItems.length - 6} more items
                    </p>
                  )}
                </div>
              ) : (
                <p className="text-muted-foreground">{t.inventory.noItems || "No items in inventory"}</p>
              )}
            </CardContent>
          </Card>
      </div>
    )
  }

  if (viewMode === "edit") {
    return (
      <div className="w-full max-w-4xl space-y-6">
        <div className="flex items-center justify-between">
          <Button onClick={() => setViewMode("list")} variant="outline" className="gap-2">
            <ArrowLeft className="w-4 h-4" />
            {t.characterProfile.backToList}
          </Button>
        </div>

        {message && (
          <Alert variant={message.type === "error" ? "destructive" : "default"}>
            <AlertDescription>{message.text}</AlertDescription>
          </Alert>
        )}

        <Tabs defaultValue="profile" className="w-full">
          <TabsList className="grid w-full grid-cols-1">
            <TabsTrigger value="profile">
              <User className="w-4 h-4 mr-2" />
              {t.characterProfile.tabs.profile}
            </TabsTrigger>
          </TabsList>

          {/* Profile Tab */}
          <TabsContent value="profile" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>{t.characterProfile.basicInfo}</CardTitle>
                <CardDescription>{t.characterProfile.basicInfoDesc}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">{t.characterProfile.name}</Label>
                    <Input
                      id="name"
                      value={selectedCharacter.name || ""}
                      onChange={(e) => setSelectedCharacter({ ...selectedCharacter, name: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="race">{t.characterProfile.race}</Label>
                    <Input
                      id="race"
                      value={selectedCharacter.race || ""}
                      onChange={(e) => setSelectedCharacter({ ...selectedCharacter, race: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="class">{t.characterProfile.class}</Label>
                    <Select
                      value={selectedCharacter.class || ""}
                      onValueChange={(value) => setSelectedCharacter({ ...selectedCharacter, class: value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder={t.characterProfile.selectClass} />
                      </SelectTrigger>
                      <SelectContent>
                        {t.characterProfile.classes.map((cls: string) => (
                          <SelectItem key={cls} value={cls}>
                            {cls}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="gender">Gender</Label>
                    <Select
                      value={selectedCharacter.gender || ""}
                      onValueChange={(value) => setSelectedCharacter({ ...selectedCharacter, gender: value || null })}
                    >
                      <SelectTrigger id="gender">
                        <SelectValue placeholder="Select gender" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="male">Masculino</SelectItem>
                        <SelectItem value="female">Femenino</SelectItem>
                        <SelectItem value="other">Otro</SelectItem>
                      </SelectContent>
                    </Select>
                    <p className="text-xs text-muted-foreground">Used for default avatar selection</p>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="level">{t.characterProfile.level}</Label>
                    <Input
                      id="level"
                      type="number"
                      min="1"
                      max="20"
                      value={selectedCharacter.level || 1}
                      onChange={(e) =>
                        setSelectedCharacter({ ...selectedCharacter, level: Number.parseInt(e.target.value) })
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="alignment">{t.characterProfile.alignment}</Label>
                    <Select
                      value={selectedCharacter.alignment || ""}
                      onValueChange={(value) => setSelectedCharacter({ ...selectedCharacter, alignment: value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder={t.characterProfile.selectAlignment} />
                      </SelectTrigger>
                      <SelectContent>
                        {t.characterProfile.alignments.map((align: string) => (
                          <SelectItem key={align} value={align}>
                            {align}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="background">{t.characterProfile.background}</Label>
                    <Input
                      id="background"
                      value={selectedCharacter.background || ""}
                      onChange={(e) => setSelectedCharacter({ ...selectedCharacter, background: e.target.value })}
                      placeholder={t.characterProfile.backgroundPlaceholder}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="xp">{t.characterProfile.experiencePoints}</Label>
                  <Input
                    id="xp"
                    type="number"
                    min="0"
                    value={selectedCharacter.experience_points || 0}
                    onChange={(e) =>
                      setSelectedCharacter({ ...selectedCharacter, experience_points: Number.parseInt(e.target.value) })
                    }
                  />
                </div>
                  <div className="space-y-2">
                  <Label htmlFor="carrying_capacity">Carrying Capacity (lbs)</Label>
                    <Input
                    id="carrying_capacity"
                      type="number"
                      min="0"
                    value={selectedCharacter.carrying_capacity || 150}
                      onChange={(e) =>
                      setSelectedCharacter({ ...selectedCharacter, carrying_capacity: Number.parseInt(e.target.value) })
                      }
                    placeholder="150"
                    />
                  <p className="text-xs text-muted-foreground">Maximum weight your character can carry for inventory system</p>
                  </div>
                  <div className="space-y-2">
                  <Label htmlFor="avatar_url">Avatar URL</Label>
                    <Input
                    id="avatar_url"
                    type="url"
                    value={selectedCharacter.avatar_url || ""}
                    onChange={(e) => setSelectedCharacter({ ...selectedCharacter, avatar_url: e.target.value })}
                    placeholder="https://example.com/avatar.jpg"
                  />
                  <p className="text-xs text-muted-foreground">URL to your character's avatar image</p>
                  </div>
                  <div className="space-y-2">
                  <Label htmlFor="preparation_notes">Preparation Notes</Label>
                  <Textarea
                    id="preparation_notes"
                    rows={4}
                    value={selectedCharacter.preparation_notes || ""}
                    onChange={(e) => setSelectedCharacter({ ...selectedCharacter, preparation_notes: e.target.value })}
                    placeholder="Notes for next adventure... (e.g., 'Buy 3 healing potions')"
                  />
                  <p className="text-xs text-muted-foreground">Free-form notes for adventure preparation</p>
                </div>
                <Button onClick={handleUpdateProfile} className="w-full">
                  {t.characterProfile.updateCharacter}
                </Button>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    )
  }

  return (
    <Card className="w-full shadow-xl">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-2xl bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
              {t.sidebar.characters}
            </CardTitle>
            <CardDescription>{t.character.manageAdventurers}</CardDescription>
          </div>
          <Button onClick={openCreateDialog} className="gap-2">
            <UserPlus className="w-4 h-4" />
            {t.character.createCharacter}
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {message && !isDialogOpen && (
          <Alert variant={message.type === "error" ? "destructive" : "default"} className="mb-4">
            <AlertDescription>{message.text}</AlertDescription>
          </Alert>
        )}

        <Tabs defaultValue="active" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="active">{t.character.activeCharacters}</TabsTrigger>
            <TabsTrigger value="archived">{t.character.archivedCharacters}</TabsTrigger>
          </TabsList>

          <TabsContent value="active">
            {characters.length === 0 ? (
              <div className="text-center py-12">
                <div className="mx-auto mb-4 w-16 h-16 rounded-full bg-muted flex items-center justify-center">
                  <User className="w-8 h-8 text-muted-foreground" />
                </div>
                <h3 className="text-lg font-semibold mb-2">{t.character.noCharactersYet}</h3>
                <p className="text-muted-foreground mb-6">{t.character.noActiveCharacters}</p>
                <Button onClick={openCreateDialog} className="gap-2">
                  <UserPlus className="w-4 h-4" />
                  {t.character.createCharacter}
                </Button>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{t.character.characterName}</TableHead>
                    <TableHead>{t.character.race}</TableHead>
                    <TableHead className="text-right">{t.character.actions}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {characters.map((character) => (
                    <TableRow key={character.id} className={character.id === activeCharacterId ? "bg-accent/50" : ""}>
                      <TableCell className="font-medium">{character.name}</TableCell>
                      <TableCell>{character.race}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex gap-2 justify-end">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleViewProfile(character)}
                            className="gap-2"
                          >
                            <Eye className="w-4 h-4" />
                            {t.character.viewSheet}
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleEditProfile(character)}
                            className="gap-2"
                          >
                            <Edit className="w-4 h-4" />
                            {t.character.edit}
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleArchive(character)}
                            className="gap-2"
                          >
                            <Archive className="w-4 h-4" />
                            {t.character.archive}
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </TabsContent>

          <TabsContent value="archived">
            {archivedCharacters.length === 0 ? (
              <div className="text-center py-12">
                <div className="mx-auto mb-4 w-16 h-16 rounded-full bg-muted flex items-center justify-center">
                  <Archive className="w-8 h-8 text-muted-foreground" />
                </div>
                <h3 className="text-lg font-semibold mb-2">{t.character.noArchivedCharacters}</h3>
                <p className="text-muted-foreground">{t.character.archivedAppearHere}</p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{t.character.characterName}</TableHead>
                    <TableHead>{t.character.race}</TableHead>
                    <TableHead className="text-right">{t.character.actions}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {archivedCharacters.map((character) => (
                    <TableRow key={character.id}>
                      <TableCell className="font-medium text-muted-foreground">{character.name}</TableCell>
                      <TableCell className="text-muted-foreground">{character.race}</TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleRestore(character)}
                          title={t.character.restore}
                          className="gap-2"
                        >
                          <RotateCcw className="w-4 h-4" />
                          {t.character.restore}
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </TabsContent>
        </Tabs>
      </CardContent>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingCharacter ? t.character.editCharacter : t.character.createCharacter}</DialogTitle>
            <DialogDescription>
              {editingCharacter ? t.character.editCharacterDescription : t.character.createCharacterDescription}
            </DialogDescription>
          </DialogHeader>

          {message && (
            <Alert variant={message.type === "error" ? "destructive" : "default"}>
              <AlertDescription>{message.text}</AlertDescription>
            </Alert>
          )}

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="character-name">{t.character.characterName}</Label>
              <Input
                id="character-name"
                value={characterName}
                onChange={(e) => setCharacterName(e.target.value)}
                placeholder={t.character.characterNamePlaceholder}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="race">{t.character.race}</Label>
              <Input
                id="race"
                value={race}
                onChange={(e) => setRace(e.target.value)}
                placeholder={t.character.racePlaceholder}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="class">{t.character.class}</Label>
              <Select value={characterClass} onValueChange={setCharacterClass}>
                <SelectTrigger id="class">
                  <SelectValue placeholder={t.character.selectClass} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="barbarian">{t.character.classes.barbarian}</SelectItem>
                  <SelectItem value="bard">{t.character.classes.bard}</SelectItem>
                  <SelectItem value="cleric">{t.character.classes.cleric}</SelectItem>
                  <SelectItem value="druid">{t.character.classes.druid}</SelectItem>
                  <SelectItem value="fighter">{t.character.classes.fighter}</SelectItem>
                  <SelectItem value="monk">{t.character.classes.monk}</SelectItem>
                  <SelectItem value="paladin">{t.character.classes.paladin}</SelectItem>
                  <SelectItem value="ranger">{t.character.classes.ranger}</SelectItem>
                  <SelectItem value="rogue">{t.character.classes.rogue}</SelectItem>
                  <SelectItem value="sorcerer">{t.character.classes.sorcerer}</SelectItem>
                  <SelectItem value="warlock">{t.character.classes.warlock}</SelectItem>
                  <SelectItem value="wizard">{t.character.classes.wizard}</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="gender">Gender</Label>
              <Select value={gender} onValueChange={setGender}>
                <SelectTrigger id="gender">
                  <SelectValue placeholder="Select gender" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="male">Masculino</SelectItem>
                  <SelectItem value="female">Femenino</SelectItem>
                  <SelectItem value="other">Otro</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">Used for default avatar selection</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="level">{t.character.level}</Label>
              <Input
                id="level"
                type="number"
                min="1"
                max="20"
                value={level}
                onChange={(e) => setLevel(Number.parseInt(e.target.value) || 1)}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)} disabled={saving}>
              {t.character.cancel}
            </Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  {t.character.saving}
                </>
              ) : editingCharacter ? (
                t.character.updateCharacter
              ) : (
                t.character.createCharacter
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  )
}
