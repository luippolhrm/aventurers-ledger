"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Loader2, User, Activity, FileText, Zap } from "lucide-react"
import { BasicInfoSection, AbilityScoresSection, NotesSection, RacialTraitsSection } from "@/components/organisms/character-sheet"
import { CharacterSheetConfigService } from "@/lib/services/character-sheet-config"
import { RacialTraitService } from "@/lib/services/racial-traits-service"
import { useLanguage } from "@/lib/language-context"
import type { Character } from "@/lib/infrastructure/repositories/character-repository"
import type { CharacterSheetFormData, CharacterSheetFormErrors } from "./character-sheet.types"
import { validateFormData, calculateCarryingCapacityFromForm, getInitialFormData } from "./character-sheet.utils"

interface CharacterSheetFormProps {
  initialData?: Partial<Character>
  language: "es" // Siempre español ahora
  onSubmit: (data: Partial<Character>) => Promise<void>
  onCancel: () => void
  isLoading?: boolean
}

export function CharacterSheetForm({
  initialData,
  language,
  onSubmit,
  onCancel,
  isLoading = false,
}: CharacterSheetFormProps) {
  const { t } = useLanguage()
  const [formData, setFormData] = useState<CharacterSheetFormData>(getInitialFormData(initialData))
  const [errors, setErrors] = useState<CharacterSheetFormErrors>({})
  const [activeTab, setActiveTab] = useState<string>("basic")

  // Actualizar formData cuando cambia initialData
  useEffect(() => {
    if (initialData) {
      setFormData(getInitialFormData(initialData))
    }
  }, [initialData])

  // Calcular capacidad de carga automáticamente cuando cambia strength, size o traits
  useEffect(() => {
    if (formData.strength || formData.size) {
      // Calcular tamaño efectivo considerando traits
      const effectiveSize = RacialTraitService.calculateEffectiveSize(
        formData.size || "medium",
        formData.racial_traits || []
      )
      
      // Determinar qué sistema está activo (default: 5e_2024)
      const rulesSystem = formData.rules_system || "5e_2024"
      const is2024 = rulesSystem === "5e_2024"
      
      // Obtener valor final de strength (base + bonificaciones según el sistema)
      const baseStrength = formData.strength || null
      const abilityBonuses = is2024
        ? formData.background_ability_bonuses || {}
        : formData.racial_ability_bonuses || {}
      const finalStrength = baseStrength !== null ? baseStrength + (abilityBonuses.strength || 0) : null
      
      // Calcular capacidad de carga con tamaño efectivo
      const capacity = CharacterSheetConfigService.calculateCarryingCapacity(finalStrength, effectiveSize)
      setFormData((prev) => ({ ...prev, carrying_capacity: capacity }))
    }
  }, [formData.strength, formData.size, formData.racial_traits, formData.background_ability_bonuses, formData.racial_ability_bonuses, formData.rules_system])

  const handleFieldChange = (field: keyof Character, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
    // Limpiar error del campo cuando se modifica
    if (errors[field]) {
      setErrors((prev) => {
        const newErrors = { ...prev }
        delete newErrors[field]
        return newErrors
      })
    }
  }

  const handleSubmit = async () => {
    // Validar formulario
    const validation = validateFormData(formData)
    if (!validation.isValid) {
      setErrors(validation.errors)
      // Ir a la primera pestaña con error
      const sections = CharacterSheetConfigService.getSections()
      for (const section of sections) {
        const sectionFields = CharacterSheetConfigService.getSectionFields(section.id)
        for (const field of sectionFields) {
          if (validation.errors[field.id]) {
            setActiveTab(section.id)
            return
          }
        }
      }
      return
    }

    // Calcular capacidad de carga final con traits y bonificaciones
    const effectiveSize = RacialTraitService.calculateEffectiveSize(
      formData.size || "medium",
      formData.racial_traits || []
    )
    
    // Determinar qué sistema está activo (default: 5e_2024)
    const rulesSystem = formData.rules_system || "5e_2024"
    const is2024 = rulesSystem === "5e_2024"
    
    // Obtener valor final de strength (base + bonificaciones según el sistema)
    const baseStrength = formData.strength || null
    const abilityBonuses = is2024
      ? formData.background_ability_bonuses || {}
      : formData.racial_ability_bonuses || {}
    const finalStrength = baseStrength !== null ? baseStrength + (abilityBonuses.strength || 0) : null
    
    const finalCapacity = CharacterSheetConfigService.calculateCarryingCapacity(finalStrength, effectiveSize)
    
    const finalData = {
      ...formData,
      carrying_capacity: finalCapacity,
    }

    await onSubmit(finalData)
  }

  const isEditing = !!initialData?.id

  return (
    <div className="space-y-4">
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-2 sm:grid-cols-4 gap-1 h-auto">
          <TabsTrigger value="basic" className="text-xs sm:text-sm py-2">
            <User className="w-3 h-3 sm:w-4 sm:h-4 sm:mr-1.5" />
            <span className="hidden sm:inline">{t.character.tabs?.basicInfo || "Básico"}</span>
          </TabsTrigger>
          <TabsTrigger value="ability_scores" className="text-xs sm:text-sm py-2">
            <Activity className="w-3 h-3 sm:w-4 sm:h-4 sm:mr-1.5" />
            <span className="hidden sm:inline">{t.character.tabs?.abilityScores || "Atributos"}</span>
          </TabsTrigger>
          <TabsTrigger value="racial_traits" className="text-xs sm:text-sm py-2">
            <Zap className="w-3 h-3 sm:w-4 sm:h-4 sm:mr-1.5" />
            <span className="hidden sm:inline">{t.character.tabs?.racialTraits || "Traits"}</span>
          </TabsTrigger>
          <TabsTrigger value="notes" className="text-xs sm:text-sm py-2">
            <FileText className="w-3 h-3 sm:w-4 sm:h-4 sm:mr-1.5" />
            <span className="hidden sm:inline">{t.character.tabs?.notes || "Notas"}</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="basic" className="space-y-4 mt-4">
          <BasicInfoSection
            formData={formData}
            onChange={handleFieldChange}
            language={language}
            errors={errors}
          />
        </TabsContent>

        <TabsContent value="ability_scores" className="space-y-4 mt-4">
          <AbilityScoresSection
            formData={formData}
            onChange={handleFieldChange}
            language={language}
            errors={errors}
          />
        </TabsContent>

        <TabsContent value="racial_traits" className="space-y-4 mt-4">
          <RacialTraitsSection
            formData={formData}
            onChange={handleFieldChange}
            language={language}
            errors={errors}
          />
        </TabsContent>

        <TabsContent value="notes" className="space-y-4 mt-4">
          <NotesSection
            formData={formData}
            onChange={handleFieldChange}
            language={language}
            errors={errors}
          />
        </TabsContent>
      </Tabs>

      {Object.keys(errors).length > 0 && (
        <Alert variant="destructive">
          <AlertDescription>
            Por favor, corrige los errores en el formulario antes de guardar.
          </AlertDescription>
        </Alert>
      )}

      <div className="flex justify-end gap-2 pt-4 border-t">
        <Button variant="outline" onClick={onCancel} disabled={isLoading}>
          {t.character.cancel}
        </Button>
        <Button onClick={handleSubmit} disabled={isLoading}>
          {isLoading ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Guardando...
            </>
          ) : isEditing ? (
            t.character.updateCharacter
          ) : (
            t.character.createCharacter
          )}
        </Button>
      </div>
    </div>
  )
}

