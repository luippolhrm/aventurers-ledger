"use client"

import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { CharacterSheetConfigService } from "@/lib/services/character-sheet-config"
import { useLanguage } from "@/lib/language-context"
import { cn } from "@/lib/utils"

interface AbilityScoreInputProps {
  value: number | null | undefined
  onChange: (value: number | null) => void
  label: string
  language?: "es" // Mantener por compatibilidad, pero ya no se usa
  error?: string
  className?: string
}

export function AbilityScoreInput({
  value,
  onChange,
  label,
  language,
  error,
  className,
}: AbilityScoreInputProps) {
  const { t } = useLanguage()
  const modifier = CharacterSheetConfigService.calculateAbilityModifier(value)
  const modifierStr = modifier >= 0 ? `+${modifier}` : `${modifier}`

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const inputValue = e.target.value
    if (inputValue === "") {
      onChange(null)
      return
    }

    const num = Number.parseInt(inputValue, 10)
    if (!isNaN(num)) {
      if (num < 1) {
        onChange(1)
      } else if (num > 30) {
        onChange(30)
      } else {
        onChange(num)
      }
    }
  }

  return (
    <div className={cn("space-y-2", className)}>
      <Label htmlFor={label.toLowerCase()}>{label}</Label>
      <div className="flex items-center gap-2">
        <Input
          id={label.toLowerCase()}
          type="number"
          min={1}
          max={30}
          value={value || ""}
          onChange={handleChange}
          placeholder="—"
          className={cn("w-20", error && "border-destructive")}
        />
        {value && (
          <span className="text-sm text-muted-foreground min-w-[3rem]">
            ({modifierStr})
          </span>
        )}
      </div>
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  )
}

