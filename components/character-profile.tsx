"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { User, Swords, Heart, BookOpen } from "lucide-react"
import { useActiveCharacter } from "@/lib/active-character-context"
import { createBrowserClient } from "@/lib/supabase/client"
import { type Language, translations } from "@/lib/translations"

interface CharacterProfileProps {
  language: Language
}

export function CharacterProfile({ language }: CharacterProfileProps) {
  const t = translations[language]
  const { activeCharacterId, activeCharacter } = useActiveCharacter()
  const [character, setCharacter] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null)

  const supabase = createBrowserClient()

  useEffect(() => {
    if (activeCharacterId) {
      loadCharacter()
    } else {
      setLoading(false)
    }
  }, [activeCharacterId])

  const loadCharacter = async () => {
    if (!activeCharacterId) return

    try {
      const { data, error } = await supabase.from("characters").select("*").eq("id", activeCharacterId).single()

      if (error) throw error
      setCharacter(data)
    } catch (error) {
      console.error("Error loading character:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleUpdate = async () => {
    if (!character || !activeCharacterId) return

    try {
      const { error } = await supabase.from("characters").update(character).eq("id", activeCharacterId)

      if (error) throw error

      setMessage({ type: "success", text: t.characterProfile.updateSuccess })
      setTimeout(() => setMessage(null), 3000)
    } catch (error) {
      console.error("Error updating character:", error)
      setMessage({ type: "error", text: t.characterProfile.updateError })
    }
  }

  const calculateModifier = (score: number) => {
    return Math.floor((score - 10) / 2)
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <p className="text-muted-foreground">{t.characterProfile.loading}</p>
      </div>
    )
  }

  if (!activeCharacterId || !character) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>{t.characterProfile.noCharacter}</CardTitle>
          <CardDescription>{t.characterProfile.createFirst}</CardDescription>
        </CardHeader>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold text-foreground">{t.characterProfile.title}</h2>
        <p className="text-muted-foreground">{t.characterProfile.description}</p>
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
                    value={character.name || ""}
                    onChange={(e) => setCharacter({ ...character, name: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="race">{t.characterProfile.race}</Label>
                  <Input
                    id="race"
                    value={character.race || ""}
                    onChange={(e) => setCharacter({ ...character, race: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="class">{t.characterProfile.class}</Label>
                  <Select
                    value={character.class || ""}
                    onValueChange={(value) => setCharacter({ ...character, class: value })}
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
                    value={character.level || 1}
                    onChange={(e) => setCharacter({ ...character, level: Number.parseInt(e.target.value) })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="alignment">{t.characterProfile.alignment}</Label>
                  <Select
                    value={character.alignment || ""}
                    onValueChange={(value) => setCharacter({ ...character, alignment: value })}
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
                    value={character.background || ""}
                    onChange={(e) => setCharacter({ ...character, background: e.target.value })}
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
                  value={character.experience_points || 0}
                  onChange={(e) => setCharacter({ ...character, experience_points: Number.parseInt(e.target.value) })}
                />
              </div>
              <Button onClick={handleUpdate} className="w-full">
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
                  const value = character[attr] || 10
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
                          onChange={(e) => setCharacter({ ...character, [attr]: Number.parseInt(e.target.value) })}
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
              <Button onClick={handleUpdate} className="w-full mt-4">
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
                    value={character.max_hit_points || 10}
                    onChange={(e) => setCharacter({ ...character, max_hit_points: Number.parseInt(e.target.value) })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="current_hp">{t.characterProfile.currentHitPoints}</Label>
                  <Input
                    id="current_hp"
                    type="number"
                    min="0"
                    max={character.max_hit_points || 10}
                    value={character.current_hit_points || 10}
                    onChange={(e) =>
                      setCharacter({ ...character, current_hit_points: Number.parseInt(e.target.value) })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="ac">{t.characterProfile.armorClass}</Label>
                  <Input
                    id="ac"
                    type="number"
                    min="1"
                    value={character.armor_class || 10}
                    onChange={(e) => setCharacter({ ...character, armor_class: Number.parseInt(e.target.value) })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="speed">{t.characterProfile.speed}</Label>
                  <Input
                    id="speed"
                    type="number"
                    min="0"
                    value={character.speed || 30}
                    onChange={(e) => setCharacter({ ...character, speed: Number.parseInt(e.target.value) })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="initiative">{t.characterProfile.initiativeBonus}</Label>
                  <Input
                    id="initiative"
                    type="number"
                    value={character.initiative_bonus || 0}
                    onChange={(e) => setCharacter({ ...character, initiative_bonus: Number.parseInt(e.target.value) })}
                  />
                </div>
              </div>
              <Button onClick={handleUpdate} className="w-full">
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
                  value={character.physical_description || ""}
                  onChange={(e) => setCharacter({ ...character, physical_description: e.target.value })}
                  placeholder={t.characterProfile.physicalPlaceholder}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="personality">{t.characterProfile.personalityTraits}</Label>
                <Textarea
                  id="personality"
                  rows={3}
                  value={character.personality_traits || ""}
                  onChange={(e) => setCharacter({ ...character, personality_traits: e.target.value })}
                  placeholder={t.characterProfile.personalityPlaceholder}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="backstory">{t.characterProfile.backstory}</Label>
                <Textarea
                  id="backstory"
                  rows={5}
                  value={character.backstory || ""}
                  onChange={(e) => setCharacter({ ...character, backstory: e.target.value })}
                  placeholder={t.characterProfile.backstoryPlaceholder}
                />
              </div>
              <Button onClick={handleUpdate} className="w-full">
                {t.characterProfile.updateCharacter}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
