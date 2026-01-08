"use client"

import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { useLanguage } from "@/lib/language-context"
import type { Character } from "@/lib/infrastructure/repositories/character-repository"

interface NotesSectionProps {
  formData: Partial<Character>
  onChange: (field: keyof Character, value: any) => void
  language?: "es" // Mantener por compatibilidad, pero ya no se usa
  errors?: Record<string, string>
}

export function NotesSection({ formData, onChange, language, errors }: NotesSectionProps) {
  const { t } = useLanguage()

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="preparation_notes">{t.characterProfile?.preparationNotes || "Notas de Preparación"}</Label>
        <Textarea
          id="preparation_notes"
          value={formData.preparation_notes || ""}
          onChange={(e) => onChange("preparation_notes", e.target.value || null)}
          placeholder="Ej: Comprar 3 pociones de curación antes de la próxima sesión"
          rows={6}
          className={errors?.preparation_notes ? "border-destructive" : ""}
        />
        <p className="text-xs text-muted-foreground">
          Notas para preparar la próxima aventura
        </p>
        {errors?.preparation_notes && <p className="text-xs text-destructive">{errors.preparation_notes}</p>}
      </div>
    </div>
  )
}

