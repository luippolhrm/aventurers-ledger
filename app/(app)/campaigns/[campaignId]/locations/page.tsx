"use client"

import { use } from "react"
import { useLanguage } from "@/lib/language-context"
import { useRouter } from "next/navigation"
import { NavigationCard } from "@/components/molecules/navigation-card"
import { WorldView } from "@/components/features/world/world-view"
import { MapPin, Skull, Users } from "lucide-react"

export default function LocationsPage({ params }: { params: Promise<{ campaignId: string }> }) {
  const { campaignId } = use(params)
  const { language } = useLanguage()
  const router = useRouter()

  return (
    <div className="w-full max-w-7xl mx-auto space-y-6">
      {/* Cards de Navegación Rápida */}
      <div className="grid gap-4 md:grid-cols-3">
        <NavigationCard
          title="Ver Todas las Ubicaciones"
          description="Explorar todas las ubicaciones del mundo"
          icon={MapPin}
          onClick={() => router.push(`/campaigns/${campaignId}/locations`)}
        />

        <NavigationCard
          title="Mazmorras"
          description="Explorar mazmorras y dungeons"
          icon={Skull}
          iconColor="text-purple-600"
          onClick={() => router.push(`/campaigns/${campaignId}/dungeons`)}
        />

        <NavigationCard
          title="NPCs"
          description="Gestionar personajes no jugadores"
          icon={Users}
          onClick={() => router.push(`/campaigns/${campaignId}/npcs`)}
        />
      </div>

      {/* Contenido Principal */}
      <WorldView campaignId={campaignId} language={language} />
    </div>
  )
}

