"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useServices } from "@/hooks/use-services"
import { useAuth } from "@/lib/auth-context"
import { useLanguage } from "@/lib/language-context"
import { ErrorService } from "@/lib/infrastructure/errors"
import { LoadingState } from "@/components/molecules/loading"
import { EmptyState } from "@/components/molecules/empty"
import { CharacterSheetForm } from "./character-sheet-form"
import { Button } from "@/components/ui/button"
import { ArrowLeft } from "lucide-react"
import type { Character } from "@/lib/infrastructure/repositories/character-repository"

interface CharacterManagementViewProps {
  characterId?: string // undefined = crear, string = editar
  onSuccess?: () => void // Callback opcional
}

export function CharacterManagementView({ characterId, onSuccess }: CharacterManagementViewProps) {
  const { t } = useLanguage()
  const { user } = useAuth()
  const services = useServices()
  const router = useRouter()

  const [character, setCharacter] = useState<Character | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Cargar personaje si estamos editando
  useEffect(() => {
    if (characterId) {
      loadCharacter()
    }
  }, [characterId])

  const loadCharacter = async () => {
    if (!characterId) return

    setIsLoading(true)
    setError(null)
    try {
      const charData = await services.character.getCharacter(characterId)
      setCharacter(charData)
    } catch (err: any) {
      console.error("Error loading character:", err)
      setError(err.message || t.character.notFound)
    } finally {
      setIsLoading(false)
    }
  }

  const handleSubmit = async (data: Partial<Character>) => {
    if (!user) {
      setError("Debes estar autenticado para crear o editar personajes")
      return
    }

    setIsSaving(true)
    setError(null)
    try {
      if (characterId) {
        // Editar personaje existente
        await services.character.updateCharacterWithCalculations(characterId, data)
        // Navegar a la hoja del personaje o ejecutar callback
        if (onSuccess) {
          onSuccess()
        } else {
          router.push(`/characters/${characterId}/sheet`)
        }
      } else {
        // Crear nuevo personaje
        const newCharacter = await services.character.createCharacterWithDefaults(data, user.id)
        // Navegar a la hoja del personaje o ejecutar callback
        if (onSuccess) {
          onSuccess()
        } else {
          router.push(`/characters/${newCharacter.id}/sheet`)
        }
      }
    } catch (err: any) {
      console.error("Error saving character:", err)
      const errorMessage =
        err instanceof Error
          ? err.message
          : ErrorService.fromUnknownError(err).message
      setError(errorMessage || "Error al guardar el personaje")
    } finally {
      setIsSaving(false)
    }
  }

  const handleCancel = () => {
    if (characterId) {
      router.push(`/characters/${characterId}/sheet`)
    } else {
      router.push("/dashboard?module=characters")
    }
  }

  if (isLoading) {
    return <LoadingState message={t.character.loading || "Cargando personaje..."} />
  }

  if (error && !character) {
    return <EmptyState title={t.common.error || "Error"} description={error} />
  }

  return (
    <div className="w-full max-w-7xl mx-auto space-y-4 md:space-y-6">
      {/* Botón Volver a Personajes */}
      <Button
        variant="ghost"
        onClick={() => router.push("/dashboard?module=characters")}
        className="mb-2 md:mb-4 text-sm md:text-base"
      >
        <ArrowLeft className="w-4 h-4 mr-2" />
        Volver a Personajes
      </Button>

      {error && (
        <div className="bg-destructive/10 text-destructive px-4 py-3 rounded-md">
          {error}
        </div>
      )}
      <CharacterSheetForm
        initialData={character || undefined}
        language="es" // Siempre español ahora
        onSubmit={handleSubmit}
        onCancel={handleCancel}
        isLoading={isSaving}
      />
    </div>
  )
}

