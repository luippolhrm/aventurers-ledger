import { createServerClient } from "@supabase/ssr"
import { cookies } from "next/headers"

export async function createClient() {
  const cookieStore = await cookies()

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!supabaseUrl) {
    console.error("[v0] Server: NEXT_PUBLIC_SUPABASE_URL is not defined")
    throw new Error("Supabase URL is not configured. Please check your environment variables.")
  }

  if (!supabaseAnonKey) {
    console.error("[v0] Server: NEXT_PUBLIC_SUPABASE_ANON_KEY is not defined")
    throw new Error("Supabase Anon Key is not configured. Please check your environment variables.")
  }

  return createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll()
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options))
        } catch {
          // The "setAll" method was called from a Server Component.
          // This can be ignored if you have proxy refreshing user sessions.
        }
      },
    },
    global: {
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      },
    },
  })
}
