"use client"

import { use } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ArrowLeft, Package } from "lucide-react"
import { EmptyState } from "@/components/molecules/empty"

export default function CharacterInventoryPage({ params }: { params: Promise<{ characterId: string }> }) {
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
            <Package className="w-5 h-5" />
            Inventario del Personaje
          </CardTitle>
          <CardDescription>
            Gestiona los items, equipo y recursos de tu personaje
          </CardDescription>
        </CardHeader>
        <CardContent>
          <EmptyState
            icon={Package}
            title="Sistema de Inventario en Desarrollo"
            description="Esta funcionalidad estará disponible próximamente. Podrás gestionar items, peso, monedas y equipo de tu personaje."
          >
            <div className="mt-4 text-sm text-muted-foreground">
              <p>Características planeadas:</p>
              <ul className="list-disc list-inside mt-2 space-y-1">
                <li>Gestión de items por categoría (armas, armadura, consumibles)</li>
                <li>Control de peso y capacidad de carga</li>
                <li>Gestión de monedas (oro, plata, cobre)</li>
                <li>Items equipados vs mochila</li>
              </ul>
            </div>
          </EmptyState>
        </CardContent>
      </Card>
    </div>
  )
}

