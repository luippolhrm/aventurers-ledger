"use client"

import { useState, useEffect, useRef } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { useLanguage } from "@/lib/language-context"
import { Info } from "lucide-react"
import { cn } from "@/lib/utils"

type AbilityScore = "strength" | "dexterity" | "constitution" | "intelligence" | "wisdom" | "charisma"

interface AbilityBonusSelectorProps {
  /** Las tres características que este background puede mejorar */
  abilityScoreOptions: AbilityScore[]
  /** Bonificaciones actuales del background */
  currentBonuses: {
    strength?: number | null
    dexterity?: number | null
    constitution?: number | null
    intelligence?: number | null
    wisdom?: number | null
    charisma?: number | null
  }
  /** Callback cuando cambian las bonificaciones */
  onBonusesChange: (bonuses: {
    strength?: number | null
    dexterity?: number | null
    constitution?: number | null
    intelligence?: number | null
    wisdom?: number | null
    charisma?: number | null
  }) => void
  /** Bonificaciones sugeridas (opcional, para mostrar como referencia) */
  suggestedBonuses?: {
    strength?: number
    dexterity?: number
    constitution?: number
    intelligence?: number
    wisdom?: number
    charisma?: number
  }
}

type DistributionMode = "two_and_one" | "three_ones"

export function AbilityBonusSelector({
  abilityScoreOptions,
  currentBonuses,
  onBonusesChange,
  suggestedBonuses,
}: AbilityBonusSelectorProps) {
  const { t } = useLanguage()
  const [distributionMode, setDistributionMode] = useState<DistributionMode>("two_and_one")
  const [selectedForPlus2, setSelectedForPlus2] = useState<AbilityScore | "">("")
  const [selectedForPlus1, setSelectedForPlus1] = useState<AbilityScore | "">("")
  const [selectedForThreePlus1, setSelectedForThreePlus1] = useState<AbilityScore[]>([])
  const isInitializing = useRef(false)
  const lastBonusesRef = useRef<string>("")
  const onBonusesChangeRef = useRef(onBonusesChange)
  
  // Actualizar la referencia cuando cambia la función
  useEffect(() => {
    onBonusesChangeRef.current = onBonusesChange
  }, [onBonusesChange])

  // Mapeo de nombres de características
  const abilityScoreNames: Record<AbilityScore, string> = {
    strength: t.character.strength,
    dexterity: t.character.dexterity,
    constitution: t.character.constitution,
    intelligence: t.character.intelligence,
    wisdom: t.character.wisdom,
    charisma: t.character.charisma,
  }

  // Inicializar desde currentBonuses si existen (solo cuando cambian desde fuera)
  useEffect(() => {
    const currentBonusesStr = JSON.stringify(currentBonuses)
    
    // Si los bonos no han cambiado desde fuera, no hacer nada
    if (currentBonusesStr === lastBonusesRef.current) {
      return
    }
    
    lastBonusesRef.current = currentBonusesStr
    isInitializing.current = true

    const bonuses = Object.entries(currentBonuses).filter(([_, value]) => value && value > 0) as [
      AbilityScore,
      number
    ][]

    if (bonuses.length === 0) {
      // Sin bonificaciones, resetear a valores por defecto
      setDistributionMode("two_and_one")
      setSelectedForPlus2("")
      setSelectedForPlus1("")
      setSelectedForThreePlus1([])
      isInitializing.current = false
      return
    }

    // Detectar el modo de distribución
    const hasPlus2 = bonuses.some(([_, value]) => value === 2)
    const plus1Count = bonuses.filter(([_, value]) => value === 1).length

    if (hasPlus2 && plus1Count === 1) {
      // Modo +2/+1
      setDistributionMode("two_and_one")
      const plus2Entry = bonuses.find(([_, value]) => value === 2)
      const plus1Entry = bonuses.find(([_, value]) => value === 1)
      if (plus2Entry) setSelectedForPlus2(plus2Entry[0])
      if (plus1Entry) setSelectedForPlus1(plus1Entry[0])
    } else if (plus1Count === 3) {
      // Modo +1/+1/+1
      setDistributionMode("three_ones")
      setSelectedForThreePlus1(bonuses.map(([score]) => score))
    }
    
    isInitializing.current = false
  }, [currentBonuses])

  // Aplicar cambios cuando cambia el modo o las selecciones (solo si no estamos inicializando)
  useEffect(() => {
    // No aplicar cambios si estamos inicializando desde currentBonuses
    if (isInitializing.current) {
      return
    }

    const newBonuses: typeof currentBonuses = {}

    if (distributionMode === "two_and_one") {
      if (selectedForPlus2) {
        newBonuses[selectedForPlus2] = 2
      }
      if (selectedForPlus1 && selectedForPlus1 !== selectedForPlus2) {
        newBonuses[selectedForPlus1] = 1
      }
    } else {
      // three_ones
      selectedForThreePlus1.forEach((score) => {
        newBonuses[score] = 1
      })
    }

    // Solo llamar a onBonusesChange si los bonos realmente cambiaron
    const currentBonusesStr = JSON.stringify(currentBonuses)
    const newBonusesStr = JSON.stringify(newBonuses)
    
    if (currentBonusesStr !== newBonusesStr) {
      lastBonusesRef.current = newBonusesStr
      onBonusesChangeRef.current(newBonuses)
    }
  }, [distributionMode, selectedForPlus2, selectedForPlus1, selectedForThreePlus1, currentBonuses])

  const handleModeChange = (mode: DistributionMode) => {
    setDistributionMode(mode)
    setSelectedForPlus2("")
    setSelectedForPlus1("")
    setSelectedForThreePlus1([])
  }

  const handleThreePlus1Toggle = (score: AbilityScore) => {
    setSelectedForThreePlus1((prev) => {
      if (prev.includes(score)) {
        return prev.filter((s) => s !== score)
      } else if (prev.length < 3) {
        return [...prev, score]
      }
      return prev
    })
  }

  // Aplicar sugerencias si existen
  const handleApplySuggested = () => {
    if (suggestedBonuses) {
      onBonusesChange(suggestedBonuses)
      // Actualizar UI para reflejar las sugerencias
      const bonuses = Object.entries(suggestedBonuses).filter(([_, value]) => value && value > 0) as [
        AbilityScore,
        number
      ][]
      const hasPlus2 = bonuses.some(([_, value]) => value === 2)
      const plus1Count = bonuses.filter(([_, value]) => value === 1).length

      if (hasPlus2 && plus1Count === 1) {
        setDistributionMode("two_and_one")
        const plus2Entry = bonuses.find(([_, value]) => value === 2)
        const plus1Entry = bonuses.find(([_, value]) => value === 1)
        if (plus2Entry) setSelectedForPlus2(plus2Entry[0])
        if (plus1Entry) setSelectedForPlus1(plus1Entry[0])
      } else if (plus1Count === 3) {
        setDistributionMode("three_ones")
        setSelectedForThreePlus1(bonuses.map(([score]) => score))
      }
    }
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm">Bonificaciones de Atributos del Background</CardTitle>
        <CardDescription className="text-xs">
          Elige cómo distribuir las bonificaciones entre las características disponibles para este background.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Opciones disponibles */}
        <div className="rounded-md bg-muted/50 p-3">
          <p className="text-xs font-medium mb-2">Características disponibles:</p>
          <div className="flex flex-wrap gap-2">
            {abilityScoreOptions.map((score) => (
              <Badge key={score} variant="secondary" className="text-xs">
                {abilityScoreNames[score]}
              </Badge>
            ))}
          </div>
        </div>

        {/* Botón para aplicar sugerencias si existen */}
        {suggestedBonuses && Object.keys(suggestedBonuses).length > 0 && (
          <div className="flex items-center justify-between rounded-md border bg-primary/5 p-3">
            <div className="flex items-start gap-2">
              <Info className="w-3 h-3 mt-0.5 shrink-0 text-muted-foreground" />
              <div className="flex-1">
                <p className="text-xs font-medium mb-1">Sugerencias del PHB:</p>
                <div className="flex flex-wrap gap-2">
                  {Object.entries(suggestedBonuses).map(([score, bonus]) => (
                    <Badge key={score} variant="default" className="text-xs">
                      {abilityScoreNames[score as AbilityScore]}: +{bonus}
                    </Badge>
                  ))}
                </div>
              </div>
            </div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleApplySuggested}
              className="ml-2 shrink-0"
            >
              Aplicar
            </Button>
          </div>
        )}

        {/* Selector de modo de distribución */}
        <div className="space-y-3">
          <Label className="text-sm">Modo de distribución:</Label>
          <RadioGroup value={distributionMode} onValueChange={handleModeChange}>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="two_and_one" id="two_and_one" />
              <Label htmlFor="two_and_one" className="text-sm font-normal cursor-pointer">
                +2 a una característica y +1 a otra
              </Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="three_ones" id="three_ones" />
              <Label htmlFor="three_ones" className="text-sm font-normal cursor-pointer">
                +1 a tres características diferentes
              </Label>
            </div>
          </RadioGroup>
        </div>

        {/* Selector para modo +2/+1 */}
        {distributionMode === "two_and_one" && (
          <div className="space-y-3 rounded-lg border bg-muted/30 p-3">
            <div className="space-y-2">
              <Label htmlFor="plus2-select" className="text-xs">
                Característica con +2:
              </Label>
              <Select value={selectedForPlus2} onValueChange={(value) => setSelectedForPlus2(value as AbilityScore)}>
                <SelectTrigger id="plus2-select" className="h-9">
                  <SelectValue placeholder="Selecciona una característica" />
                </SelectTrigger>
                <SelectContent>
                  {abilityScoreOptions.map((score) => (
                    <SelectItem key={score} value={score}>
                      {abilityScoreNames[score]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="plus1-select" className="text-xs">
                Característica con +1:
              </Label>
              <Select
                value={selectedForPlus1}
                onValueChange={(value) => setSelectedForPlus1(value as AbilityScore)}
                disabled={!selectedForPlus2}
              >
                <SelectTrigger id="plus1-select" className="h-9">
                  <SelectValue placeholder="Selecciona una característica" />
                </SelectTrigger>
                <SelectContent>
                  {abilityScoreOptions
                    .filter((score) => score !== selectedForPlus2)
                    .map((score) => (
                      <SelectItem key={score} value={score}>
                        {abilityScoreNames[score]}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        )}

        {/* Selector para modo +1/+1/+1 */}
        {distributionMode === "three_ones" && (
          <div className="space-y-3 rounded-lg border bg-muted/30 p-3">
            <Label className="text-xs">Selecciona tres características (haz clic para seleccionar/deseleccionar):</Label>
            <div className="grid grid-cols-3 gap-2">
              {abilityScoreOptions.map((score) => {
                const isSelected = selectedForThreePlus1.includes(score)
                return (
                  <button
                    key={score}
                    type="button"
                    onClick={() => handleThreePlus1Toggle(score)}
                    disabled={!isSelected && selectedForThreePlus1.length >= 3}
                    className={cn(
                      "rounded-md border p-2 text-xs transition-colors",
                      isSelected
                        ? "border-primary bg-primary/10 text-primary font-medium"
                        : "border-border bg-background hover:bg-muted",
                      !isSelected && selectedForThreePlus1.length >= 3 && "opacity-50 cursor-not-allowed"
                    )}
                  >
                    {abilityScoreNames[score]}
                    {isSelected && <span className="ml-1 text-primary">+1</span>}
                  </button>
                )
              })}
            </div>
            {selectedForThreePlus1.length > 0 && (
              <p className="text-xs text-muted-foreground">
                Seleccionadas: {selectedForThreePlus1.length}/3
              </p>
            )}
          </div>
        )}

        {/* Resumen de bonificaciones aplicadas */}
        {Object.keys(currentBonuses).some((key) => currentBonuses[key as AbilityScore] && currentBonuses[key as AbilityScore]! > 0) && (
          <div className="rounded-md border bg-primary/5 p-3">
            <p className="text-xs font-medium mb-2">Bonificaciones aplicadas:</p>
            <div className="flex flex-wrap gap-2">
              {Object.entries(currentBonuses)
                .filter(([_, value]) => value && value > 0)
                .map(([score, bonus]) => (
                  <Badge key={score} variant="default" className="text-xs">
                    {abilityScoreNames[score as AbilityScore]}: +{bonus}
                  </Badge>
                ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

