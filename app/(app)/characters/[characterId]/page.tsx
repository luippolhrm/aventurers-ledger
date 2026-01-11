"use client"

import { use } from "react"
import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { LoadingState } from "@/components/molecules/loading"
import { EmptyState } from "@/components/molecules/empty"
import { NavigationCard } from "@/components/molecules/navigation-card"
import { useAuth } from "@/lib/auth-context"
import { useServices } from "@/hooks/use-services"
import type { Character } from "@/lib/infrastructure/repositories/character-repository"
import { FileText, Package, Book, Map, Sword } from "lucide-react"

export default function CharacterPage({ params }: { params: Promise<{ characterId: string }> }) {
  const { characterId } = use(params)
  const router = useRouter()
  const { user } = useAuth()
  const services = useServices()

  const [character, setCharacter] = useState<Character | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (user && characterId) {
      loadCharacter()
    }
  }, [user, characterId])

  const loadCharacter = async () => {
    if (!user) return

    setLoading(true)
    setError(null)

    try {
      const characterData = await services.character.getCharacter(characterId)

      // Verificar que el personaje pertenece al usuario
      if (characterData.user_id !== user.id) {
        setError("No tienes acceso a este personaje")
        return
      }

      setCharacter(characterData)
    } catch (err: any) {
      console.error("Error loading character:", err)
      setError(err?.message || "Error al cargar el personaje")
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="w-full max-w-7xl mx-auto">
        <LoadingState message="Cargando personaje..." />
      </div>
    )
  }

  if (error || !character) {
    return (
      <div className="w-full max-w-7xl mx-auto">
        <EmptyState
          icon={Sword}
          title="Error al cargar el personaje"
          description={error || "El personaje no existe o no tienes acceso"}
          action={{
            label: "Volver a Personajes",
            onClick: () => router.push("/characters"),
          }}
        />
      </div>
    )
  }

  return (
    <div className="w-full max-w-7xl mx-auto space-y-6 p-4 md:p-6">
      {/* Header del Personaje */}
      <Card>
        <CardHeader>
          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-3 mb-2 flex-wrap">
                <CardTitle className="text-2xl">{character.name}</CardTitle>
                {character.race && (
                  <Badge variant="secondary">{character.race}</Badge>
                )}
                {character.class && (
                  <Badge variant="outline">{character.class}</Badge>
                )}
                {character.level && (
                  <Badge variant="default">Nivel {character.level}</Badge>
                )}
              </div>
              <CardDescription>
                {character.description || "Sin descripción"}
              </CardDescription>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Grid de Navigation Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <NavigationCard
          title="Hoja de Personaje"
          description="Ver y editar estadísticas"
          icon={FileText}
          onClick={() => router.push(`/characters/${characterId}/sheet`)}
        />

        <NavigationCard
          title="Inventario"
          description="Gestionar objetos y equipo"
          icon={Package}
          onClick={() => router.push(`/characters/${characterId}/inventory`)}
        />

        <NavigationCard
          title="Historia"
          description="Backstory y notas"
          icon={Book}
          onClick={() => router.push(`/characters/${characterId}/history`)}
        />

        <NavigationCard
          title="Mis Campañas"
          description="Campañas del personaje"
          icon={Map}
          onClick={() => router.push(`/characters/${characterId}/campaigns`)}
        />
      </div>
    </div>
  )
}
