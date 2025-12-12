"use client"

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Languages } from "lucide-react"
import type { Language } from "@/lib/translations"

interface LanguageSelectorProps {
  language: Language
  onLanguageChange: (language: Language) => void
}

export function LanguageSelector({ language, onLanguageChange }: LanguageSelectorProps) {
  return (
    <div className="flex items-center gap-2">
      <Languages className="h-4 w-4 text-muted-foreground" />
      <Select value={language} onValueChange={(value) => onLanguageChange(value as Language)}>
        <SelectTrigger className="w-[120px]">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="en">English</SelectItem>
          <SelectItem value="es">Español</SelectItem>
          <SelectItem value="fr">Français</SelectItem>
          <SelectItem value="pt">Português</SelectItem>
        </SelectContent>
      </Select>
    </div>
  )
}
