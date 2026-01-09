"use client"

import { use } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ArrowLeft, Map } from "lucide-react"
import { EmptyState } from "@/components/molecules/empty"

export default function CharacterCampaignsPage({ params }: { params: Promise<{ characterId: string }> }) {
  const { characterId } = use(params)
  const router = useRouter()

  return (
    <div className="w-full max-w-5xl mx-auto space-y-6">
      <Button variant="ghost" onClick={() => router.push(`/characters/${characterId}/sheet`)}>
        <ArrowLeft className="w-4 h-4 mr-2" />
        Volver a Hoja de Personaje
      </Button>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Map className="w-5 h-5" />
            Campañas del Personaje
          </CardTitle>
          <CardDescription>
            Campañas en las que participa este personaje
          </CardDescription>
        </CardHeader>
        <CardContent>
          <EmptyState
            icon={Map}
            title="Sistema de Campañas en Desarrollo"
            description="Esta funcionalidad estará disponible próximamente. Podrás ver todas las campañas en las que participa tu personaje."
          >
            <div className="mt-4 text-sm text-muted-foreground">
              <p>Características planeadas:</p>
              <ul className="list-disc list-inside mt-2 space-y-1">
                <li>Lista de campañas activas</li>
                <li>Historial de campañas completadas</li>
                <li>Estadísticas por campaña (sesiones, nivel alcanzado)</li>
                <li>Botón para unirse a nuevas campañas</li>
                <li>Notas específicas por campaña</li>
              </ul>
            </div>
          </EmptyState>
        </CardContent>
      </Card>
    </div>
  )
}

