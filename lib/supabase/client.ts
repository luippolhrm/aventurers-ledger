"use client"

import { createBrowserClient as createSupabaseBrowserClient } from "@supabase/ssr"

let client: ReturnType<typeof createSupabaseBrowserClient> | null = null

export function createBrowserClient() {
  if (client) {
    return client
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

  if (!supabaseUrl) {
    console.error("[v0] NEXT_PUBLIC_SUPABASE_URL is not defined")
    throw new Error("Supabase URL is not configured. Please check your environment variables.")
  }

  if (!supabaseAnonKey) {
    console.error("[v0] NEXT_PUBLIC_SUPABASE_ANON_KEY is not defined")
    throw new Error("Supabase Anon Key is not configured. Please check your environment variables.")
  }

  console.log("[v0] Initializing Supabase client with URL:", supabaseUrl)
  console.log("[v0] Supabase Anon Key configured: YES")

  try {
    client = createSupabaseBrowserClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
      },
    })
    console.log("[v0] Supabase client initialized successfully")
  } catch (error) {
    console.error("[v0] Error creating Supabase client:", error)
    throw error
  }

  return client
}

// Keep backward compatibility
export function createClient() {
  return createBrowserClient()
}
