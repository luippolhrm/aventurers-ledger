import { redirect } from "next/navigation"
import type { Metadata } from "next"
import { createClient } from "@/lib/supabase/server"
import SettingsPageContent from "./settings-content"

export const metadata: Metadata = {
  title: "Configuración - Libro de aventureros",
}

export default async function SettingsPage() {
  const supabase = await createClient()

  const {
    data: { user },
    error,
  } = await supabase.auth.getUser()

  if (error || !user) {
    redirect("/auth/login")
  }

  return <SettingsPageContent />
}
