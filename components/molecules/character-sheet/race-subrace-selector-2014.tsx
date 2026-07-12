"use client"

import { useEffect, useMemo, useRef } from "react"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { useLanguage } from "@/lib/language-context"
import { RacialTraitService, type Race2014, type Subrace2014 } from "@/lib/services/racial-traits-service"
import { AbilityBonusSelector } from "./ability-bonus-selector"
import { Info } from "lucide-react"

interface RaceSubraceSelector2014Props {
  selectedRace?: string | null
  selectedSubrace?: string | null
  currentBonuses: {
    strength?: number
    dexterity?: number
    constitution?: number
    intelligence?: number
    wisdom?: number
    charisma?: number
  }
  onRaceChange: (raceId: string) => void
  onSubraceChange: (subraceId: string | null) => void
  onBonusesChange: (bonuses: {
    strength?: number | null
    dexterity?: number | null
    constitution?: number | null
    intelligence?: number | null
    wisdom?: number | null
    charisma?: number | null
  }) => void
}

export function RaceSubraceSelector2014({
  selectedRace,
  selectedSubrace,
  currentBonuses,
  onRaceChange,
  onSubraceChange,
  onBonusesChange,
}: RaceSubraceSelector2014Props) {
  const { t } = useLanguage()
  const races = RacialTraitService.getRaces2014()

  const selectedRaceData = selectedRace ? RacialTraitService.getRace2014ById(selectedRace) : null
  const selectedSubraceData =
    selectedRace && selectedSubrace
      ? RacialTraitService.getSubrace2014ById(selectedRace, selectedSubrace)
      : null

  // Referencia para evitar loops infinitos
  const lastCalculatedRef = useRef<string>("")
  const isInitializingRef = useRef(false)
  const onBonusesChangeRef = useRef(onBonusesChange)

  // Actualizar referencia cuando cambia la función
  useEffect(() => {
    onBonusesChangeRef.current = onBonusesChange
  }, [onBonusesChange])

  // Calcular bonos automáticamente cuando cambia la raza/subraza
  useEffect(() => {
    if (!selectedRace) {
      const key = `no-race`
      if (lastCalculatedRef.current !== key) {
        lastCalculatedRef.current = key
        onBonusesChangeRef.current({})
      }
      return
    }

    const race = RacialTraitService.getRace2014ById(selectedRace)
    if (!race) {
      const key = `invalid-race-${selectedRace}`
      if (lastCalculatedRef.current !== key) {
        lastCalculatedRef.current = key
        onBonusesChangeRef.current({})
      }
      return
    }

    // Caso especial: Humano estándar (aplica +1 a todas automáticamente)
    if (selectedSubrace === "standard_human") {
      const bonuses = RacialTraitService.getRacialAbilityBonuses2014(selectedRace, selectedSubrace)
      const key = `${selectedRace}-${selectedSubrace}-${JSON.stringify(bonuses)}`
      if (lastCalculatedRef.current !== key) {
        lastCalculatedRef.current = key
        onBonusesChangeRef.current(bonuses)
      }
      return
    }

    // Casos especiales que requieren selección manual (humano variante y semielfo)
    if (race.requiresManualSelection) {
      // Para humano variante y semielfo, no calcular automáticamente
      // El usuario seleccionará manualmente, no hacer nada aquí
      return
    }

    // Para razas normales, calcular bonos automáticamente
    const bonuses = RacialTraitService.getRacialAbilityBonuses2014(selectedRace, selectedSubrace || undefined)
    const key = `${selectedRace}-${selectedSubrace || "none"}-${JSON.stringify(bonuses)}`
    if (lastCalculatedRef.current !== key) {
      lastCalculatedRef.current = key
      onBonusesChangeRef.current(bonuses)
    }
  }, [selectedRace, selectedSubrace]) // NO incluir currentBonuses para evitar loops

  // Bonos calculados (para mostrar)
  const calculatedBonuses = useMemo(() => {
    if (!selectedRace) return {}
    
    const race = RacialTraitService.getRace2014ById(selectedRace)
    if (!race) return {}

    // Si requiere selección manual, usar los bonos actuales
    if (race.requiresManualSelection && selectedSubrace !== "standard_human") {
      return currentBonuses
    }

    // Calcular bonos automáticamente
    return RacialTraitService.getRacialAbilityBonuses2014(selectedRace, selectedSubrace || undefined)
  }, [selectedRace, selectedSubrace, currentBonuses])

  // Mapeo de nombres de características
  const abilityScoreNames: Record<string, string> = {
    strength: t.character.strength,
    dexterity: t.character.dexterity,
    constitution: t.character.constitution,
    intelligence: t.character.intelligence,
    wisdom: t.character.wisdom,
    charisma: t.character.charisma,
  }

  const handleRaceChange = (raceId: string) => {
    onRaceChange(raceId)
    onSubraceChange(null) // Limpiar subraza al cambiar raza
  }

  const handleSubraceChange = (subraceId: string) => {
    onSubraceChange(subraceId || null)
  }

  // Determinar si necesita selector manual de bonos
  const needsManualSelection =
    selectedRaceData?.requiresManualSelection &&
    (selectedSubrace === "variant_human" || selectedRace === "half_elf")

  return (
    <div className="space-y-4">
      {/* Selector de Raza */}
      <div className="space-y-2">
        <Label htmlFor="race_2014">
          Raza (PHB 2014) <span className="text-destructive">*</span>
        </Label>
        <Select value={selectedRace || ""} onValueChange={handleRaceChange}>
          <SelectTrigger id="race_2014">
            <SelectValue placeholder="Selecciona una raza" />
          </SelectTrigger>
          <SelectContent>
            {races.map((race) => (
              <SelectItem key={race.id} value={race.id}>
                {race.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {selectedRaceData && (
          <p className="text-xs text-muted-foreground mt-1">{selectedRaceData.description}</p>
        )}
      </div>

      {/* Selector de Subraza (si aplica) */}
      {selectedRaceData?.hasSubraces && selectedRaceData.subraces && (
        <div className="space-y-2">
          <Label htmlFor="subrace_2014">
            Subraza <span className="text-destructive">*</span>
          </Label>
          <Select value={selectedSubrace || ""} onValueChange={handleSubraceChange}>
            <SelectTrigger id="subrace_2014">
              <SelectValue placeholder="Selecciona una subraza" />
            </SelectTrigger>
            <SelectContent>
              {selectedRaceData.subraces.map((subrace) => (
                <SelectItem key={subrace.id} value={subrace.id}>
                  {subrace.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {selectedSubraceData && (
            <p className="text-xs text-muted-foreground mt-1">{selectedSubraceData.description}</p>
          )}
        </div>
      )}

      {/* Selector manual de bonos para casos especiales */}
      {needsManualSelection && selectedRaceData && (
        <div className="mt-4">
          {selectedRace === "half_elf" ? (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm">Bonificaciones de Semielfo</CardTitle>
                <CardDescription className="text-xs">
                  Los semielfos reciben +2 a Carisma y +1 a dos características adicionales de tu elección.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="rounded-md bg-muted/50 p-3 mb-3">
                  <p className="text-xs font-medium mb-2">Bonos fijos:</p>
                  <Badge variant="default" className="text-xs mr-2">
                    {abilityScoreNames.charisma}: +2
                  </Badge>
                </div>
                <AbilityBonusSelector
                  abilityScoreOptions={selectedRaceData.abilityScoreOptions || []}
                  currentBonuses={currentBonuses}
                  onBonusesChange={(bonuses) => {
                    // Agregar el +2 de Carisma
                    onBonusesChange({
                      ...bonuses,
                      charisma: 2,
                    })
                  }}
                />
              </CardContent>
            </Card>
          ) : selectedSubrace === "variant_human" ? (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm">Bonificaciones de Humano Variante</CardTitle>
                <CardDescription className="text-xs">
                  Los humanos variantes reciben +1 a dos características de tu elección y una dote.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="rounded-md border bg-muted/30 p-3 mb-3">
                  <p className="text-xs text-muted-foreground flex items-start gap-2">
                    <Info className="w-3 h-3 mt-0.5 shrink-0" />
                    <span>
                      Nota: La dote se implementará en una futura actualización. Por ahora, solo se aplican los bonos de características.
                    </span>
                  </p>
                </div>
                <div className="space-y-2">
                  <Label className="text-sm">Selecciona dos características para +1 cada una:</Label>
                  <div className="grid grid-cols-3 gap-2">
                    {selectedRaceData.abilityScoreOptions?.map((score) => {
                      const currentBonus = currentBonuses[score] || 0
                      const isSelected = currentBonus > 0
                      return (
                        <button
                          key={score}
                          type="button"
                          onClick={() => {
                            const selectedCount = Object.values(currentBonuses).filter((v) => v > 0).length
                            const newBonuses = { ...currentBonuses }

                            if (isSelected) {
                              // Deseleccionar
                              delete newBonuses[score]
                            } else if (selectedCount < 2) {
                              // Seleccionar (máximo 2)
                              newBonuses[score] = 1
                            }
                            onBonusesChange(newBonuses)
                          }}
                          disabled={!isSelected && Object.values(currentBonuses).filter((v) => v > 0).length >= 2}
                          className={`rounded-md border p-2 text-xs transition-colors ${
                            isSelected
                              ? "border-primary bg-primary/10 text-primary font-medium"
                              : "border-border bg-background hover:bg-muted"
                          } ${
                            !isSelected && Object.values(currentBonuses).filter((v) => v > 0).length >= 2
                              ? "opacity-50 cursor-not-allowed"
                              : ""
                          }`}
                        >
                          {abilityScoreNames[score]}
                          {isSelected && <span className="ml-1 text-primary">+1</span>}
                        </button>
                      )
                    })}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Seleccionadas: {Object.values(currentBonuses).filter((v) => v > 0).length}/2
                  </p>
                </div>
              </CardContent>
            </Card>
          ) : null}
        </div>
      )}

      {/* Mostrar bonos aplicados */}
      {Object.keys(calculatedBonuses).some((key) => calculatedBonuses[key as keyof typeof calculatedBonuses] && calculatedBonuses[key as keyof typeof calculatedBonuses]! > 0) && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm">Bonificaciones Aplicadas</CardTitle>
            <CardDescription className="text-xs">
              Estos bonos se aplicarán automáticamente a tus características base
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {Object.entries(calculatedBonuses)
                .filter(([_, value]) => value && value > 0)
                .map(([score, bonus]) => (
                  <Badge key={score} variant="default" className="text-xs">
                    {abilityScoreNames[score]}: +{bonus}
                  </Badge>
                ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

