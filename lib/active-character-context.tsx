"use client"

import { createContext, useContext, useState, useEffect, type ReactNode } from "react"
import { createBrowserClient } from "@/lib/supabase/client"
import { useAuth } from "@/lib/auth-context"

interface Character {
  id: string
  name: string
  race: string
  level?: number
  class?: string
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
  const { user, loading: authLoading } = useAuth()

  useEffect(() => {
    const stored = localStorage.getItem("activeCharacterId")
    if (stored) {
      setActiveCharacterId(stored)
    }
  }, [])

  useEffect(() => {
    if (authLoading) {
      return // Wait for auth to load
    }

    if (!user) {
      setActiveCharacter(null)
      setActiveCharacterId(null)
      localStorage.removeItem("activeCharacterId")
      return
    }

    if (activeCharacterId) {
      loadCharacter(activeCharacterId)
    } else {
      setActiveCharacter(null)
    }
  }, [activeCharacterId, refreshTrigger, user, authLoading])

  const loadCharacter = async (id: string) => {
    try {
      const supabase = createBrowserClient()
      const { data, error } = await supabase.from("characters").select("*").eq("id", id).maybeSingle()

      if (error) {
        console.error("[v0] Error loading active character:", error.message)
        setActiveCharacter(null)
        localStorage.removeItem("activeCharacterId")
        setActiveCharacterId(null)
        return
      }

      if (!data) {
        setActiveCharacter(null)
        localStorage.removeItem("activeCharacterId")
        setActiveCharacterId(null)
        return
      }

      setActiveCharacter(data)
    } catch (error) {
      console.error("[v0] Error in loadCharacter:", error)
      setActiveCharacter(null)
      localStorage.removeItem("activeCharacterId")
      setActiveCharacterId(null)
    }
  }

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
