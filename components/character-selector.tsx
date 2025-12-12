"use client"

import { useState, useEffect } from "react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Button } from "@/components/ui/button"
import { User, ChevronDown } from "lucide-react"
import { createBrowserClient } from "@/lib/supabase/client"
import { useActiveCharacter } from "@/lib/active-character-context"
import { type Language, translations } from "@/lib/translations"

interface Character {
  id: string
  name: string
  race: string
}

interface CharacterSelectorProps {
  language: Language
  onNavigateToCharacters: () => void
}

export function CharacterSelector({ language, onNavigateToCharacters }: CharacterSelectorProps) {
  const [characters, setCharacters] = useState<Character[]>([])
  const [activeCharacter, setActiveCharacter] = useState<Character | null>(null)
  const { activeCharacterId, setActiveCharacterId, refreshTrigger } = useActiveCharacter()
  const t = translations[language]

  useEffect(() => {
    loadCharacters()
  }, [refreshTrigger]) // Reload when refreshTrigger changes

  useEffect(() => {
    if (activeCharacterId && characters.length > 0) {
      const char = characters.find((c) => c.id === activeCharacterId)
      setActiveCharacter(char || null)
    }
  }, [activeCharacterId, characters])

  const loadCharacters = async () => {
    try {
      const supabase = createBrowserClient()
      const { data, error } = await supabase.from("characters").select("*").order("created_at")

      if (error) throw error

      setCharacters(data || [])

      if (!activeCharacterId && data && data.length > 0) {
        setActiveCharacterId(data[0].id)
      }
    } catch (error) {
      console.error("[v0] CharacterSelector: Error loading characters:", error)
    }
  }

  if (characters.length === 0) {
    return null
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" className="gap-2 bg-transparent">
          <User className="w-4 h-4" />
          <span className="hidden sm:inline">{activeCharacter?.name || "Select Character"}</span>
          <ChevronDown className="w-4 h-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel>Active Character</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {characters.map((char) => (
          <DropdownMenuItem
            key={char.id}
            onClick={() => setActiveCharacterId(char.id)}
            className={char.id === activeCharacterId ? "bg-accent" : ""}
          >
            <div className="flex flex-col">
              <span className="font-medium">{char.name}</span>
              <span className="text-xs text-muted-foreground">{char.race}</span>
            </div>
          </DropdownMenuItem>
        ))}
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={onNavigateToCharacters}>
          <User className="w-4 h-4 mr-2" />
          Manage Characters
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
