"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { createBrowserClient } from "@/lib/supabase/client"
import { type Language, translations } from "@/lib/translations"
import { Loader2, UserPlus, AlertCircle, RefreshCw } from "lucide-react"

interface CharacterManagerProps {
  language: Language
}

interface Character {
  name: string
  race: string
}

export function CharacterManager({ language }: CharacterManagerProps) {
  const [characterName, setCharacterName] = useState("")
  const [race, setRace] = useState("")
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null)
  const [loading, setLoading] = useState(false)
  const [hasCharacters, setHasCharacters] = useState<boolean | null>(null)
  const [checkingCharacters, setCheckingCharacters] = useState(true)
  const [existingCharacter, setExistingCharacter] = useState<Character | null>(null)

  const t = translations[language]
  const supabase = createBrowserClient()

  useEffect(() => {
    checkForExistingCharacters()
  }, [])

  const checkForExistingCharacters = async () => {
    setCheckingCharacters(true)
    try {
      const { data, error } = await supabase.from("characters").select("*").limit(1).single()

      if (error) {
        if (error.code === "PGRST116") {
          // No characters found
          setHasCharacters(false)
        } else {
          throw error
        }
      } else {
        // Character found, load it
        setHasCharacters(true)
        setExistingCharacter(data)
        setCharacterName(data.name)
        setRace(data.race || "")
      }
    } catch (error) {
      console.error("[v0] Error checking characters:", error)
      setHasCharacters(false)
    } finally {
      setCheckingCharacters(false)
    }
  }

  const handleSave = async () => {
    if (!characterName.trim()) {
      setMessage({ type: "error", text: t.character.error })
      return
    }

    setLoading(true)
    try {
      if (existingCharacter) {
        // Update existing character
        const { error } = await supabase
          .from("characters")
          .update({
            name: characterName.trim(),
            race: race.trim(),
          })
          .eq("name", existingCharacter.name)

        if (error) throw error

        setMessage({ type: "success", text: t.character.updated })
        setExistingCharacter({ name: characterName.trim(), race: race.trim() })
      } else {
        // Create new character
        const { error } = await supabase.from("characters").insert({
          name: characterName.trim(),
          race: race.trim(),
        })

        if (error) throw error

        setMessage({ type: "success", text: t.character.success })
        setHasCharacters(true)
        setExistingCharacter({ name: characterName.trim(), race: race.trim() })
      }
    } catch (error) {
      console.error("[v0] Error saving character:", error)
      setMessage({ type: "error", text: t.character.error })
    } finally {
      setLoading(false)
    }
  }

  if (checkingCharacters) {
    return (
      <Card className="w-full max-w-[600px] shadow-xl">
        <CardContent className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </CardContent>
      </Card>
    )
  }

  if (hasCharacters === false) {
    return (
      <Card className="w-full max-w-[600px] shadow-xl border-primary/50">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
            <UserPlus className="w-8 h-8 text-primary" />
          </div>
          <CardTitle className="text-2xl bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
            {t.character.createFirst}
          </CardTitle>
          <CardDescription className="text-base">{t.character.noCharactersYet}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{t.character.createFirstInfo}</AlertDescription>
          </Alert>

          <div className="space-y-4">
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
                disabled={loading}
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
                disabled={loading}
              />
            </div>

            <Button onClick={handleSave} disabled={loading || !characterName.trim()} className="w-full gap-2" size="lg">
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <UserPlus className="w-4 h-4" />}
              {t.character.createCharacter}
            </Button>
          </div>

          {message && (
            <Alert variant={message.type === "error" ? "destructive" : "default"}>
              <AlertDescription>{message.text}</AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="w-full max-w-[600px] shadow-xl">
      <CardHeader>
        <CardTitle className="text-2xl bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
          {t.character.title}
        </CardTitle>
        <CardDescription>{t.character.description}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{t.character.editingCharacter}</AlertDescription>
        </Alert>

        <div className="space-y-4">
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
              disabled={loading}
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
              disabled={loading}
            />
          </div>

          <Button onClick={handleSave} disabled={loading || !characterName.trim()} className="w-full gap-2" size="lg">
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
            {t.character.updateCharacter}
          </Button>
        </div>

        {message && (
          <Alert variant={message.type === "error" ? "destructive" : "default"}>
            <AlertDescription>{message.text}</AlertDescription>
          </Alert>
        )}
      </CardContent>
    </Card>
  )
}
