"use client"

import { useState, useEffect } from "react"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useLanguage } from "@/lib/language-context"

// Conversión: 1 kg = 2.20462 lbs
const KG_TO_LBS = 2.20462

interface WeightInputProps {
  id: string
  name?: string
  label: string
  value: string
  onChange: (value: string) => void
  min?: number
  step?: number
  className?: string
}

export function WeightInput({
  id,
  name,
  label,
  value,
  onChange,
  min = 0,
  step = 0.1,
  className,
}: WeightInputProps) {
  const { t } = useLanguage()
  const [unit, setUnit] = useState<"kg" | "lbs">("lbs")
  const [displayValue, setDisplayValue] = useState("")

  // Convertir valor almacenado (lbs) a unidad de visualización
  useEffect(() => {
    const lbsValue = Number.parseFloat(value) || 0
    if (unit === "kg") {
      const kgValue = lbsValue / KG_TO_LBS
      setDisplayValue(kgValue.toFixed(2))
    } else {
      setDisplayValue(lbsValue.toFixed(2))
    }
  }, [value, unit])

  const handleValueChange = (newDisplayValue: string) => {
    setDisplayValue(newDisplayValue)
    const numValue = Number.parseFloat(newDisplayValue) || 0

    // Convertir a lbs para almacenar
    let lbsValue: number
    if (unit === "kg") {
      lbsValue = numValue * KG_TO_LBS
    } else {
      lbsValue = numValue
    }

    // Actualizar valor en lbs
    onChange(lbsValue.toString())
  }

  const handleUnitChange = (newUnit: "kg" | "lbs") => {
    const currentLbs = Number.parseFloat(value) || 0

    setUnit(newUnit)

    // Convertir valor actual a nueva unidad
    if (newUnit === "kg") {
      const kgValue = currentLbs / KG_TO_LBS
      setDisplayValue(kgValue.toFixed(2))
    } else {
      setDisplayValue(currentLbs.toFixed(2))
    }
  }

  return (
    <div className={`space-y-2 ${className || ""}`}>
      <Label htmlFor={id}>{label}</Label>
      <div className="flex gap-2">
        <Input
          id={id}
          name={name}
          type="number"
          min={min}
          step={step}
          value={displayValue}
          onChange={(e) => handleValueChange(e.target.value)}
          className="flex-1"
        />
        <Select value={unit} onValueChange={handleUnitChange}>
          <SelectTrigger className="w-24">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="lbs">{t.inventory.pounds || "lbs"}</SelectItem>
            <SelectItem value="kg">kg</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  )
}
