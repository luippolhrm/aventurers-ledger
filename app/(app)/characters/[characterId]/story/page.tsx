"use client"

import { use } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ArrowLeft, Book } from "lucide-react"
import { EmptyState } from "@/components/molecules/empty"

export default function CharacterStoryPage({ params }: { params: Promise<{ characterId: string }> }) {
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
            <Book className="w-5 h-5" />
            Historia del Personaje
          </CardTitle>
          <CardDescription>
            Backstory, evolución y relaciones de tu personaje
          </CardDescription>
        </CardHeader>
        <CardContent>
          <EmptyState
            icon={Book}
            title="Sistema de Historia en Desarrollo"
            description="Esta funcionalidad estará disponible próximamente. Podrás documentar la historia y evolución de tu personaje."
          >
            <div className="mt-4 text-sm text-muted-foreground">
              <p>Características planeadas:</p>
              <ul className="list-disc list-inside mt-2 space-y-1">
                <li>Editor de backstory del personaje</li>
                <li>Línea de tiempo de eventos importantes</li>
                <li>Relaciones con NPCs y otros personajes</li>
                <li>Objetivos y motivaciones</li>
                <li>Notas de sesiones</li>
              </ul>
            </div>
          </EmptyState>
        </CardContent>
      </Card>
    </div>
  )
}

