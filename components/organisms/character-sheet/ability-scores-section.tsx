"use client"

import { useMemo } from "react"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { AbilityScoreInput, CarryingCapacityDisplay } from "@/components/molecules/character-sheet"
import { CharacterSheetConfigService } from "@/lib/services/character-sheet-config"
import { RacialTraitService } from "@/lib/services/racial-traits-service"
import { useLanguage } from "@/lib/language-context"
import type { Character } from "@/lib/infrastructure/repositories/character-repository"
import { calculateAbilityModifier } from "@/lib/application/utils/character-sheet.utils"

interface AbilityScoresSectionProps {
  formData: Partial<Character>
  onChange: (field: keyof Character, value: any) => void
  language: "es" // Siempre español ahora
  errors?: Record<string, string>
}

export function AbilityScoresSection({ formData, onChange, language, errors }: AbilityScoresSectionProps) {
  const { t } = useLanguage()

  // Determinar qué sistema está activo (default: 5e_2024)
  const rulesSystem = formData.rules_system || "5e_2024"
  const is2024 = rulesSystem === "5e_2024"
  const is2014 = rulesSystem === "5e_2014"

  // Obtener bonificaciones según el sistema de reglas
  const abilityBonuses = is2024
    ? formData.background_ability_bonuses || {}
    : formData.racial_ability_bonuses || {}

  // Calcular valores finales (base + bonificaciones)
  const finalScores = useMemo(() => {
    const scores: Record<string, { base: number | null; bonus: number; final: number | null; source: string }> = {}
    const abilityKeys = ["strength", "dexterity", "constitution", "intelligence", "wisdom", "charisma"] as const

    for (const key of abilityKeys) {
      const base = formData[key] ?? null
      const bonus = abilityBonuses[key] || 0
      const final = base !== null ? base + bonus : null
      scores[key] = { 
        base, 
        bonus, 
        final,
        source: is2024 ? "Background" : "Raza"
      }
    }

    return scores
  }, [formData.strength, formData.dexterity, formData.constitution, formData.intelligence, formData.wisdom, formData.charisma, abilityBonuses, is2024])

  // Calcular tamaño efectivo considerando traits (ej: Powerful Build)
  const effectiveSize = RacialTraitService.calculateEffectiveSize(
    formData.size || "medium",
    formData.racial_traits || []
  )

  // Calcular capacidad de carga en tiempo real con tamaño efectivo
  const carryingCapacity = CharacterSheetConfigService.calculateCarryingCapacity(
    finalScores.strength.final,
    effectiveSize
  )

  // Función para renderizar un atributo con valores base y finales
  const renderAbilityScore = (
    key: "strength" | "dexterity" | "constitution" | "intelligence" | "wisdom" | "charisma",
    label: string
  ) => {
    const score = finalScores[key]
    const hasBonus = score.bonus !== 0

    return (
      <div className="space-y-2">
        <AbilityScoreInput
          value={formData[key]}
          onChange={(value) => onChange(key, value)}
          label={label}
          language={language}
          error={errors?.[key]}
        />
        {hasBonus && (
          <div className="text-xs space-y-1 pl-2 border-l-2 border-primary/20">
            <div className="flex items-center gap-2">
              <span className="text-muted-foreground">Base:</span>
              <span className="font-medium">
                {score.base ?? "—"} ({calculateAbilityModifier(score.base) >= 0 ? "+" : ""}
                {calculateAbilityModifier(score.base)})
              </span>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="text-xs">
                +{score.bonus} {is2024 ? "del Background" : "de la Raza"}
              </Badge>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-muted-foreground">Final:</span>
              <span className="font-semibold text-primary">
                {score.final ?? "—"} ({calculateAbilityModifier(score.final) >= 0 ? "+" : ""}
                {calculateAbilityModifier(score.final)})
              </span>
            </div>
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Mostrar información sobre bonificaciones si hay */}
      {Object.values(finalScores).some((s) => s.bonus !== 0) && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm">Bonificaciones Aplicadas</CardTitle>
            <CardDescription className="text-xs">
              {is2024
                ? "Las bonificaciones del Background se suman a los valores base"
                : "Las bonificaciones de la Raza se suman a los valores base"}
            </CardDescription>
          </CardHeader>
        </Card>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {renderAbilityScore("strength", t.character.strength)}
        {renderAbilityScore("dexterity", t.character.dexterity)}
        {renderAbilityScore("constitution", t.character.constitution)}
        {renderAbilityScore("intelligence", t.character.intelligence)}
        {renderAbilityScore("wisdom", t.character.wisdom)}
        {renderAbilityScore("charisma", t.character.charisma)}
      </div>

      <div className="space-y-2">
        <Label htmlFor="size">{t.character.size}</Label>
        <Select
          value={formData.size || "medium"}
          onValueChange={(value) => onChange("size", value as "small" | "medium" | "large")}
        >
          <SelectTrigger id="size">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="small">{t.character.sizeSmall}</SelectItem>
            <SelectItem value="medium">{t.character.sizeMedium}</SelectItem>
            <SelectItem value="large">{t.character.sizeLarge}</SelectItem>
          </SelectContent>
        </Select>
        <p className="text-xs text-muted-foreground">
          {t.character.size} afecta la capacidad de carga. Pequeño: ÷2, Mediano: ×1, Grande: ×2
        </p>
        {effectiveSize !== formData.size && (
          <div className="mt-2">
            <Badge variant="secondary" className="text-xs">
              Tamaño Efectivo: {effectiveSize === "small" && t.character.sizeSmall}
              {effectiveSize === "medium" && t.character.sizeMedium}
              {effectiveSize === "large" && t.character.sizeLarge}
              {effectiveSize === "huge" && "Enorme"} (por traits raciales)
            </Badge>
          </div>
        )}
      </div>

      {finalScores.strength.final && (
        <CarryingCapacityDisplay
          currentWeight={0}
          maxCapacity={carryingCapacity}
          language={language}
        />
      )}
    </div>
  )
}

