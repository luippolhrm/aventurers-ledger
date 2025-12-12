"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
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
import { UserPlus, Edit, Archive, Loader2, User, RotateCcw } from "lucide-react"

interface CharactersListProps {
  language: Language
}

interface Character {
  id: string
  name: string
  race: string
  created_at: string
  archived: boolean
}

export function CharactersList({ language }: CharactersListProps) {
  const [characters, setCharacters] = useState<Character[]>([])
  const [archivedCharacters, setArchivedCharacters] = useState<Character[]>([])
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

  if (loading) {
    return (
      <Card className="w-full max-w-4xl shadow-xl">
        <CardContent className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </CardContent>
      </Card>
    )
  }

  return (
    <>
      <Card className="w-full max-w-4xl shadow-xl">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-2xl bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                {t.sidebar.character}s
              </CardTitle>
              <CardDescription>Manage your adventurers</CardDescription>
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
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {characters.map((character) => (
                      <TableRow key={character.id} className={character.id === activeCharacterId ? "bg-accent/50" : ""}>
                        <TableCell className="font-medium">{character.name}</TableCell>
                        <TableCell>{character.race}</TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
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
                  <p className="text-muted-foreground">Archived characters will appear here</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>{t.character.characterName}</TableHead>
                      <TableHead>{t.character.race}</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
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
              {editingCharacter ? "Update your character information" : "Create a new character for your adventure"}
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
              Cancel
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
