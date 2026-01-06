"use client"

import { createContext, useContext, useState, useEffect, useMemo, type ReactNode } from "react"
import type { User } from "@supabase/supabase-js"
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

    return () => {
      isMounted = false
    }
  }, [authService, profileService])

  return <AuthContext.Provider value={{ user, profile, loading }}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}
