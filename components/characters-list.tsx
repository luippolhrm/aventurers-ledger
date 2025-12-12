"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
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
import { UserPlus, Edit, Trash2, Loader2, User } from "lucide-react"

interface CharactersListProps {
  language: Language
}

interface Character {
  id: string
  name: string
  race: string
  created_at: string
}

export function CharactersList({ language }: CharactersListProps) {
  const [characters, setCharacters] = useState<Character[]>([])
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
      const { data, error } = await supabase.from("characters").select("*").order("created_at", { ascending: true })

      if (error) throw error

      setCharacters(data || [])

      if (!activeCharacterId && data && data.length > 0) {
        setActiveCharacterId(data[0].id)
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

  const handleDelete = async (character: Character) => {
    if (!confirm(`Delete ${character.name}? This action cannot be undone.`)) {
      return
    }

    try {
      const supabase = createBrowserClient()
      const { error } = await supabase.from("characters").delete().eq("id", character.id)

      if (error) throw error

      if (character.id === activeCharacterId) {
        const remaining = characters.filter((c) => c.id !== character.id)
        setActiveCharacterId(remaining.length > 0 ? remaining[0].id : null)
      }

      await loadCharacters()
      triggerRefresh()
    } catch (error) {
      console.error("[v0] Error deleting character:", error)
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
          {characters.length === 0 ? (
            <div className="text-center py-12">
              <div className="mx-auto mb-4 w-16 h-16 rounded-full bg-muted flex items-center justify-center">
                <User className="w-8 h-8 text-muted-foreground" />
              </div>
              <h3 className="text-lg font-semibold mb-2">{t.character.noCharactersYet}</h3>
              <p className="text-muted-foreground mb-6">{t.character.createFirstInfo}</p>
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
                          onClick={() => handleDelete(character)}
                          disabled={character.id === activeCharacterId && characters.length === 1}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
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
