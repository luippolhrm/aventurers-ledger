import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { AppLayout } from "@/components/app-layout"
import SettingsPageContent from "./settings-content"

export default async function SettingsPage() {
  try {
    const supabase = await createClient()

    const {
      data: { user },
      error,
    } = await supabase.auth.getUser()

    if (error || !user) {
      redirect("/auth/login")
    }

    return (
      <AppLayout>
        <SettingsPageContent />
      </AppLayout>
    )
  } catch (error) {
    console.error("[v0] Settings page error:", error)
    redirect("/auth/login")
  }
}
