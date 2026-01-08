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
import { useAuth } from "@/lib/auth-context"
import { useLanguage } from "@/lib/language-context"
import type { Character } from "@/lib/infrastructure/repositories"

interface CharacterSelectorProps {
  language?: "es" // Mantener por compatibilidad, pero ya no se usa
  onNavigateToCharacters: () => void
}

export function CharacterSelector({ language, onNavigateToCharacters }: CharacterSelectorProps) {
  const [characters, setCharacters] = useState<Character[]>([])
  const [activeCharacter, setActiveCharacter] = useState<Character | null>(null)
  const { activeCharacterId, setActiveCharacterId, refreshTrigger } = useActiveCharacter()
  const { user } = useAuth()
  const { t } = useLanguage()

  useEffect(() => {
    loadCharacters()
  }, [refreshTrigger, user]) // Reload when refreshTrigger or user changes

  useEffect(() => {
    if (activeCharacterId && characters.length > 0) {
      const char = characters.find((c) => c.id === activeCharacterId)
      setActiveCharacter(char || null)
    }
  }, [activeCharacterId, characters])

  const loadCharacters = async () => {
    try {
      const supabase = createBrowserClient()

      if (!user) {
        setCharacters([])
        return
      }

      const { data, error } = await supabase
        .from("characters")
        .select("*")
        .eq("archived", false)
        .eq("user_id", user.id)
        .order("created_at")

      if (error) {
        console.error("[v0] CharacterSelector: Error loading characters:", error.message)
        setCharacters([])
        return
      }

      setCharacters(data || [])

      if (!activeCharacterId && data && data.length > 0) {
        setActiveCharacterId(data[0].id)
      }
    } catch (error: any) {
      console.error("[v0] CharacterSelector: Error loading characters:", error?.message || error)
      setCharacters([])
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
          <span className="hidden sm:inline">{activeCharacter?.name || t.characterSelector.selectCharacter}</span>
          <ChevronDown className="w-4 h-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel>{t.characterSelector.activeCharacter}</DropdownMenuLabel>
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
          {t.characterSelector.manageCharacters}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
