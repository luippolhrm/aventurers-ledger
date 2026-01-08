"use client"

import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useLanguage } from "@/lib/language-context"
import type { Character } from "@/lib/infrastructure/repositories/character-repository"

interface BackgroundSectionProps {
  formData: Partial<Character>
  onChange: (field: keyof Character, value: any) => void
  language?: "es" // Mantener por compatibilidad, pero ya no se usa
  errors?: Record<string, string>
}

export function BackgroundSection({ formData, onChange, language, errors }: BackgroundSectionProps) {
  const { t } = useLanguage()

  const alignmentOptions = [
    { value: "lawful_good", label: "Legal Bueno" },
    { value: "neutral_good", label: "Neutral Bueno" },
    { value: "chaotic_good", label: "Caótico Bueno" },
    { value: "lawful_neutral", label: "Legal Neutral" },
    { value: "true_neutral", label: "Neutral Verdadero" },
    { value: "chaotic_neutral", label: "Caótico Neutral" },
    { value: "lawful_evil", label: "Legal Malvado" },
    { value: "neutral_evil", label: "Neutral Malvado" },
    { value: "chaotic_evil", label: "Caótico Malvado" },
  ]

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="background">{t.character.background}</Label>
        <Input
          id="background"
          value={formData.background || ""}
          onChange={(e) => onChange("background", e.target.value || null)}
          placeholder="Ej: Soldado, Noble, Criminal"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="alignment">{t.character.alignment}</Label>
        <Select
          value={formData.alignment || ""}
          onValueChange={(value) => onChange("alignment", value || null)}
        >
          <SelectTrigger id="alignment">
            <SelectValue placeholder="Seleccionar alineamiento" />
          </SelectTrigger>
          <SelectContent>
            {alignmentOptions.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="experience_points">{t.character.experiencePoints}</Label>
        <Input
          id="experience_points"
          type="number"
          min={0}
          value={formData.experience_points || ""}
          onChange={(e) => onChange("experience_points", e.target.value ? Number.parseInt(e.target.value) : null)}
          placeholder="0"
        />
      </div>
    </div>
  )
}

