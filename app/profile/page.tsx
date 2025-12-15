import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { AppLayout } from "@/components/app-layout"
import ProfilePageContent from "./profile-content"

export default async function ProfilePage() {
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
        <ProfilePageContent user={user} />
      </AppLayout>
    )
  } catch (error) {
    console.error("[v0] Profile page error:", error)
    redirect("/auth/login")
  }
}
