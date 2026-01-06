"use client"

/**
 * @deprecated Este contexto está siendo deprecado en favor de un modelo basado en contexto de campaña.
 * Los personajes ahora se asignan a campañas específicas y se obtienen desde el contexto de la campaña.
 * 
 * Componentes que aún usan este contexto (para referencia):
 * - components/characters-unified.tsx: Gestión de personajes (puede mantenerlo temporalmente)
 * - components/campaigns.tsx: Algunas referencias residuales (deberían eliminarse)
 * - components/shopping-cart.tsx: Carrito de compras
 * - components/locations-map.tsx: Mapa de ubicaciones
 * - app/shop-items/[shopId]/page.tsx: Página de tienda
 * 
 * Para nuevas funcionalidades, usar:
 * - CampaignService.getPlayerCharacterInCampaign() para obtener el personaje en una campaña
 * - Pasar characterId como prop a los componentes de jugador
 */

import { createContext, useContext, useState, useEffect, type ReactNode } from "react"
import { createBrowserClient } from "@/lib/supabase/client"
import { useAuth } from "@/lib/auth-context"

interface Character {
  id: string
  name: string
  race: string
  level?: number
  class?: string
  avatar_url?: string | null
  gender?: string | null
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

      // Validate that the character belongs to the current user
      if (user && data.user_id !== user.id) {
        console.error("[v0] Security: Attempted to load character that doesn't belong to current user")
        setActiveCharacter(null)
        localStorage.removeItem("activeCharacterId")
        setActiveCharacterId(null)
        return
      }

      setActiveCharacter(data)
    } catch (error: any) {
      console.error("[v0] Error in loadCharacter:", error?.message || error)
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

/**
 * @deprecated Usar CampaignService.getPlayerCharacterInCampaign() y pasar characterId como prop
 */
export function useActiveCharacter() {
  const context = useContext(ActiveCharacterContext)
  if (context === undefined) {
    throw new Error("useActiveCharacter must be used within an ActiveCharacterProvider")
  }
  return context
}
