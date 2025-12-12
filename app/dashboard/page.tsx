import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { MainLayout } from "@/components/main-layout"

export default async function DashboardPage() {
  const supabase = await createClient()

  const {
    data: { user },
    error,
  } = await supabase.auth.getUser()

  if (error || !user) {
    redirect("/auth/login")
  }

  return <MainLayout />
}
