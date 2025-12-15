"use client"

import { createContext, useContext, useState, useEffect, type ReactNode } from "react"
import { createBrowserClient } from "@/lib/supabase/client"
import type { User } from "@supabase/supabase-js"

interface UserProfile {
  id: string
  display_name: string
}

interface AuthContextType {
  user: User | null
  profile: UserProfile | null
  loading: boolean
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let isMounted = true
    const supabase = createBrowserClient()

    const loadSession = async () => {
      try {
        setLoading(true)
        const {
          data: { session },
          error,
        } = await supabase.auth.getSession()

        if (error) {
          console.error("[v0] Auth error:", error.message)
          if (isMounted) {
            setLoading(false)
          }
          return
        }

        if (isMounted && session?.user) {
          setUser(session.user)

          // Load user profile
          const { data: profileData } = await supabase.from("profiles").select("*").eq("id", session.user.id).single()

          if (isMounted && profileData) {
            setProfile(profileData)
          }
        }

        if (isMounted) {
          setLoading(false)
        }
      } catch (error) {
        console.error("[v0] Session load error:", error)
        if (isMounted) {
          setLoading(false)
        }
      }
    }

    loadSession()

    return () => {
      isMounted = false
    }
  }, [])

  return <AuthContext.Provider value={{ user, profile, loading }}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}
