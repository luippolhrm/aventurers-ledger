"use client"

import { createContext, useContext, useState, useEffect, useMemo, type ReactNode } from "react"
import type { User } from "@supabase/supabase-js"
import { createBrowserClient } from "@/lib/supabase/client"
import { AuthService } from "@/lib/application/services"
import { ProfileService } from "@/lib/application/services"
import type { Profile } from "@/lib/infrastructure/repositories"

interface AuthContextType {
  user: User | null
  profile: Profile | null
  loading: boolean
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)

  const supabase = useMemo(() => createBrowserClient(), [])
  const authService = useMemo(() => new AuthService(), [])
  const profileService = useMemo(() => new ProfileService(), [])

  useEffect(() => {
    let isMounted = true

    const loadSession = async () => {
      try {
        const sessionData = await authService.getSession()

        if (!isMounted) return

        if (sessionData?.user) {
          setUser(sessionData.user)

          // Load user profile using ProfileService
          try {
            const profileData = await profileService.getProfile(sessionData.user.id)
            if (isMounted) {
              setProfile(profileData)
            }
          } catch (error) {
            // Profile might not exist yet (shouldn't happen with trigger, but handle gracefully)
            console.error("[v0] Error loading profile:", error)
            if (isMounted) {
              setProfile(null)
            }
          }
        } else {
          setUser(null)
          setProfile(null)
        }
      } catch (error) {
        console.error("[v0] Session load error:", error)
        if (isMounted) {
          setUser(null)
          setProfile(null)
        }
      } finally {
        if (isMounted) {
          setLoading(false)
        }
      }
    }

    loadSession()

    // Escuchar cambios en la autenticación (sign in, sign out, token refresh)
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (!isMounted) return

      console.log("[v0] Auth state changed:", event)

      if (session?.user) {
        setUser(session.user)

        // Cargar perfil cuando hay sesión
        try {
          const profileData = await profileService.getProfile(session.user.id)
          if (isMounted) {
            setProfile(profileData)
          }
        } catch (error) {
          console.error("[v0] Error loading profile on auth change:", error)
          if (isMounted) {
            setProfile(null)
          }
        }
      } else {
        // Limpiar estado cuando no hay sesión
        setUser(null)
        setProfile(null)
      }

      // Asegurar que loading esté en false después del cambio
      if (isMounted) {
        setLoading(false)
      }
    })

    return () => {
      isMounted = false
      subscription.unsubscribe()
    }
  }, [authService, profileService, supabase])

  return <AuthContext.Provider value={{ user, profile, loading }}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}
