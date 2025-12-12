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
  Swords,
  Heart,
  BookOpen,
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
  strength?: number
  dexterity?: number
  constitution?: number
  intelligence?: number
  wisdom?: number
  charisma?: number
  max_hit_points?: number
  current_hit_points?: number
  armor_class?: number
  speed?: number
  initiative_bonus?: number
  physical_description?: string
  personality_traits?: string
  backstory?: string
  created_at: string
  archived: boolean
}

type ViewMode = "list" | "profile"

export function CharactersUnified({ language }: CharactersUnifiedProps) {
  const [viewMode, setViewMode] = useState<ViewMode>("list")
  const [characters, setCharacters] = useState<Character[]>([])
  const [archivedCharacters, setArchivedCharacters] = useState<Character[]>([])
  const [selectedCharacter, setSelectedCharacter] = useState<Character | null>(null)
  const [loading, setLoading] = useState(true)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingCharacter, setEditingCharacter] = useState<Character | null>(null)
  const [characterName, setCharacterName] = useState("")
  const [race, setRace] = useState("")
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null)
  const [saving, setSaving] = useState(false)
  const { activeCharacterId, setActiveCharacterId, triggerRefresh } = useActiveCharacter()
  const t = translations[language]

  useEffect(() => {
    loadCharacters()
  }, [])

  useEffect(() => {
    if (viewMode === "profile" && activeCharacterId) {
      loadSelectedCharacter(activeCharacterId)
    }
  }, [viewMode, activeCharacterId])

  const loadCharacters = async () => {
    setLoading(true)
    try {
      const supabase = createBrowserClient()

      const { data: activeData, error: activeError } = await supabase
        .from("characters")
        .select("*")
        .eq("archived", false)
        .order("created_at", { ascending: true })

      if (activeError) throw activeError

      const { data: archivedData, error: archivedError } = await supabase
        .from("characters")
        .select("*")
        .eq("archived", true)
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
    } catch (error) {
      console.error("[v0] Error loading character:", error)
    }
  }

  const openCreateDialog = () => {
    setEditingCharacter(null)
    setCharacterName("")
    setRace("")
    setMessage(null)
    setIsDialogOpen(true)
  }

  const openEditDialog = (character: Character) => {
    setEditingCharacter(character)
    setCharacterName(character.name)
    setRace(character.race)
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

      if (editingCharacter) {
        const { error } = await supabase
          .from("characters")
          .update({
            name: characterName.trim(),
            race: race.trim(),
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
            archived: false,
          })
          .select()
          .single()

        if (error) throw error

        const { error: walletError } = await supabase.from("wallets").insert({
          character_id: data.id,
          platinum: 0,
          gold: 0,
          electrum: 0,
          silver: 0,
          copper: 0,
          total_wealth: 0,
        })

        if (walletError && !walletError.message.includes("duplicate")) {
          console.error("[v0] Error creating wallet:", walletError)
        }

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
    setViewMode("profile")
  }

  const handleUpdateProfile = async () => {
    if (!selectedCharacter || !activeCharacterId) return

    try {
      const supabase = createBrowserClient()
      const { error } = await supabase.from("characters").update(selectedCharacter).eq("id", activeCharacterId)

      if (error) throw error

      setMessage({ type: "success", text: t.characterProfile.updateSuccess })
      await loadCharacters()
      setTimeout(() => setMessage(null), 3000)
    } catch (error) {
      console.error("[v0] Error updating character:", error)
      setMessage({ type: "error", text: t.characterProfile.updateError })
    }
  }

  const calculateModifier = (score: number) => {
    return Math.floor((score - 10) / 2)
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

  if (viewMode === "profile") {
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
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="profile">
              <User className="w-4 h-4 mr-2" />
              {t.characterProfile.tabs.profile}
            </TabsTrigger>
            <TabsTrigger value="attributes">
              <Swords className="w-4 h-4 mr-2" />
              {t.characterProfile.tabs.attributes}
            </TabsTrigger>
            <TabsTrigger value="stats">
              <Heart className="w-4 h-4 mr-2" />
              {t.characterProfile.tabs.stats}
            </TabsTrigger>
            <TabsTrigger value="narrative">
              <BookOpen className="w-4 h-4 mr-2" />
              {t.characterProfile.tabs.narrative}
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
                <Button onClick={handleUpdateProfile} className="w-full">
                  {t.characterProfile.updateCharacter}
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Attributes Tab */}
          <TabsContent value="attributes" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>{t.characterProfile.coreAttributes}</CardTitle>
                <CardDescription>{t.characterProfile.coreAttributesDesc}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {["strength", "dexterity", "constitution", "intelligence", "wisdom", "charisma"].map((attr) => {
                    const value = (selectedCharacter[attr as keyof Character] as number) || 10
                    const modifier = calculateModifier(value)
                    return (
                      <Card key={attr}>
                        <CardHeader className="pb-3">
                          <CardTitle className="text-lg">{t.characterProfile.attributes[attr]}</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-2">
                          <Input
                            type="number"
                            min="1"
                            max="30"
                            value={value}
                            onChange={(e) =>
                              setSelectedCharacter({ ...selectedCharacter, [attr]: Number.parseInt(e.target.value) })
                            }
                          />
                          <div className="text-center">
                            <span className="text-2xl font-bold">
                              {modifier >= 0 ? "+" : ""}
                              {modifier}
                            </span>
                            <p className="text-xs text-muted-foreground">{t.characterProfile.modifier}</p>
                          </div>
                        </CardContent>
                      </Card>
                    )
                  })}
                </div>
                <Button onClick={handleUpdateProfile} className="w-full mt-4">
                  {t.characterProfile.updateCharacter}
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Stats Tab */}
          <TabsContent value="stats" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>{t.characterProfile.combatStats}</CardTitle>
                <CardDescription>{t.characterProfile.combatStatsDesc}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="max_hp">{t.characterProfile.maxHitPoints}</Label>
                    <Input
                      id="max_hp"
                      type="number"
                      min="1"
                      value={selectedCharacter.max_hit_points || 10}
                      onChange={(e) =>
                        setSelectedCharacter({
                          ...selectedCharacter,
                          max_hit_points: Number.parseInt(e.target.value),
                        })
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="current_hp">{t.characterProfile.currentHitPoints}</Label>
                    <Input
                      id="current_hp"
                      type="number"
                      min="0"
                      max={selectedCharacter.max_hit_points || 10}
                      value={selectedCharacter.current_hit_points || 10}
                      onChange={(e) =>
                        setSelectedCharacter({
                          ...selectedCharacter,
                          current_hit_points: Number.parseInt(e.target.value),
                        })
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="ac">{t.characterProfile.armorClass}</Label>
                    <Input
                      id="ac"
                      type="number"
                      min="1"
                      value={selectedCharacter.armor_class || 10}
                      onChange={(e) =>
                        setSelectedCharacter({ ...selectedCharacter, armor_class: Number.parseInt(e.target.value) })
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="speed">{t.characterProfile.speed}</Label>
                    <Input
                      id="speed"
                      type="number"
                      min="0"
                      value={selectedCharacter.speed || 30}
                      onChange={(e) =>
                        setSelectedCharacter({ ...selectedCharacter, speed: Number.parseInt(e.target.value) })
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="initiative">{t.characterProfile.initiativeBonus}</Label>
                    <Input
                      id="initiative"
                      type="number"
                      value={selectedCharacter.initiative_bonus || 0}
                      onChange={(e) =>
                        setSelectedCharacter({
                          ...selectedCharacter,
                          initiative_bonus: Number.parseInt(e.target.value),
                        })
                      }
                    />
                  </div>
                </div>
                <Button onClick={handleUpdateProfile} className="w-full">
                  {t.characterProfile.updateCharacter}
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Narrative Tab */}
          <TabsContent value="narrative" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>{t.characterProfile.narrativeInfo}</CardTitle>
                <CardDescription>{t.characterProfile.narrativeInfoDesc}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="physical">{t.characterProfile.physicalDescription}</Label>
                  <Textarea
                    id="physical"
                    rows={3}
                    value={selectedCharacter.physical_description || ""}
                    onChange={(e) =>
                      setSelectedCharacter({ ...selectedCharacter, physical_description: e.target.value })
                    }
                    placeholder={t.characterProfile.physicalPlaceholder}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="personality">{t.characterProfile.personalityTraits}</Label>
                  <Textarea
                    id="personality"
                    rows={3}
                    value={selectedCharacter.personality_traits || ""}
                    onChange={(e) => setSelectedCharacter({ ...selectedCharacter, personality_traits: e.target.value })}
                    placeholder={t.characterProfile.personalityPlaceholder}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="backstory">{t.characterProfile.backstory}</Label>
                  <Textarea
                    id="backstory"
                    rows={5}
                    value={selectedCharacter.backstory || ""}
                    onChange={(e) => setSelectedCharacter({ ...selectedCharacter, backstory: e.target.value })}
                    placeholder={t.characterProfile.backstoryPlaceholder}
                  />
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
    <>
      <Card className="w-full max-w-4xl shadow-xl">
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
                          <div className="flex justify-end gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleViewProfile(character)}
                              title={t.character.viewProfile}
                            >
                              <Eye className="w-4 h-4" />
                            </Button>
                            <Button variant="outline" size="sm" onClick={() => openEditDialog(character)}>
                              <Edit className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleArchive(character)}
                              disabled={character.id === activeCharacterId && characters.length === 1}
                              title={t.character.archive}
                            >
                              <Archive className="w-4 h-4" />
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
      </Card>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingCharacter ? t.character.updateCharacter : t.character.createCharacter}</DialogTitle>
            <DialogDescription>
              {editingCharacter ? t.character.updateDescription : t.character.createDescription}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="character-name">{t.character.characterName}</Label>
              <Input
                id="character-name"
                placeholder={t.character.enterName}
                value={characterName}
                onChange={(e) => {
                  setCharacterName(e.target.value)
                  setMessage(null)
                }}
                disabled={saving}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="race">{t.character.race}</Label>
              <Input
                id="race"
                placeholder={t.character.enterRace}
                value={race}
                onChange={(e) => {
                  setRace(e.target.value)
                  setMessage(null)
                }}
                disabled={saving}
              />
            </div>

            {message && (
              <Alert variant={message.type === "error" ? "destructive" : "default"}>
                <AlertDescription>{message.text}</AlertDescription>
              </Alert>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)} disabled={saving}>
              {t.character.cancel}
            </Button>
            <Button onClick={handleSave} disabled={saving || !characterName.trim()} className="gap-2">
              {saving && <Loader2 className="w-4 h-4 animate-spin" />}
              {editingCharacter ? t.character.updateCharacter : t.character.createCharacter}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
