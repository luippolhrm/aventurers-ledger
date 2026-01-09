import { redirect } from "next/navigation"
import type { Metadata } from "next"
import { createClient } from "@/lib/supabase/server"
import ProfilePageContent from "./profile-content"

export const metadata: Metadata = {
  title: "Perfil - Libro de aventureros",
}

export default async function ProfilePage() {
  const supabase = await createClient()

  const {
    data: { user },
    error,
  } = await supabase.auth.getUser()

  if (error || !user) {
    redirect("/auth/login")
  }

  return <ProfilePageContent user={user} />
}
