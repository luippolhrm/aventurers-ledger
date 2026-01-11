"use client"

import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { LoadingState } from "@/components/molecules/loading"
import { EmptyState } from "@/components/molecules/empty"
import { FileText, Edit, AlertCircle } from "lucide-react"
import { useLanguage } from "@/lib/language-context"
import { cn } from "@/lib/utils"

interface CharacterNotesDisplayProps {
  characterId: string
  notes: string | null
  loading?: boolean
  error?: string | null
  className?: string
}

/**
 * Componente de presentación puro para mostrar notas del personaje
 * No contiene lógica de datos, solo renderiza UI
 */
export function CharacterNotesDisplay({
  characterId,
  notes,
  loading = false,
  error = null,
  className,
}: CharacterNotesDisplayProps) {
  const { t } = useLanguage()
  const router = useRouter()

  if (loading) {
    return <LoadingState message="Cargando notas..." />
  }

  if (error) {
    return (
      <EmptyState
        icon={AlertCircle}
        title="Error al cargar notas"
        description={error}
      />
    )
  }

  return (
    <Card className={cn(className)}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <FileText className="w-5 h-5" />
            {t.character.sections?.notes || "Notas"}
          </CardTitle>
          <Button
            size="sm"
            variant="outline"
            onClick={() => router.push(`/characters/${characterId}/edit`)}
          >
            <Edit className="w-4 h-4 mr-1" />
            {notes ? "Editar" : "Agregar"}
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {notes ? (
          <p className="text-sm whitespace-pre-wrap">{notes}</p>
        ) : (
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              No tienes apuntes o anotaciones aún. ¿Quieres agregar algo?
            </p>
            <Button
              variant="outline"
              onClick={() => router.push(`/characters/${characterId}/edit`)}
            >
              <Edit className="w-4 h-4 mr-2" />
              Agregar Nota
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
