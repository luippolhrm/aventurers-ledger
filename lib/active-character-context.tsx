"use client"

import { createContext, useContext, useState, useEffect, type ReactNode } from "react"
import { createBrowserClient } from "@/lib/supabase/client"

interface Character {
  id: string
  name: string
  race: string
}

interface ActiveCharacterContextType {
  activeCharacterId: string | null
  activeCharacter: Character | null
  setActiveCharacterId: (id: string | null) => void
  refreshTrigger: number
  triggerRefresh: () => void
}

const ActiveCharacterContext = createContext<ActiveCharacterContextType | undefined>(undefined)

export function ActiveCharacterProvider({ children }: { children: ReactNode }) {
  const [activeCharacterId, setActiveCharacterId] = useState<string | null>(null)
  const [activeCharacter, setActiveCharacter] = useState<Character | null>(null)
  const [refreshTrigger, setRefreshTrigger] = useState(0)

  useEffect(() => {
    const stored = localStorage.getItem("activeCharacterId")
    if (stored) {
      setActiveCharacterId(stored)
    }
  }, [])

  useEffect(() => {
    if (activeCharacterId) {
      loadCharacter(activeCharacterId)
    } else {
      setActiveCharacter(null)
    }
  }, [activeCharacterId])

  const loadCharacter = async (id: string) => {
    try {
      const supabase = createBrowserClient()
      const { data, error } = await supabase.from("characters").select("*").eq("id", id).single()

      if (error) {
        console.error("[v0] Error loading active character:", error)
        setActiveCharacter(null)
        return
      }

      setActiveCharacter(data)
    } catch (error) {
      console.error("[v0] Error in loadCharacter:", error)
      setActiveCharacter(null)
    }
  }

  // Save active character to localStorage when it changes
  const handleSetActiveCharacter = (id: string | null) => {
    setActiveCharacterId(id)
    if (id) {
      localStorage.setItem("activeCharacterId", id)
    } else {
      localStorage.removeItem("activeCharacterId")
    }
  }

  const triggerRefresh = () => {
    setRefreshTrigger((prev) => prev + 1)
  }

  return (
    <ActiveCharacterContext.Provider
      value={{
        activeCharacterId,
        activeCharacter,
        setActiveCharacterId: handleSetActiveCharacter,
        refreshTrigger,
        triggerRefresh,
      }}
    >
      {children}
    </ActiveCharacterContext.Provider>
  )
}

export function useActiveCharacter() {
  const context = useContext(ActiveCharacterContext)
  if (context === undefined) {
    throw new Error("useActiveCharacter must be used within an ActiveCharacterProvider")
  }
  return context
}
