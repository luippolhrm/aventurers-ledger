"use client"

import { useEffect, useRef } from "react"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { useLanguage } from "@/lib/language-context"
import { RacialTraitService } from "@/lib/services/racial-traits-service"
import { FeatService } from "@/lib/application/services/feat-service"
import type { Character } from "@/lib/infrastructure/repositories/character-repository"
import { AbilityBonusSelector } from "@/components/molecules/character-sheet"
// import { RaceSubraceSelector2014 } from "@/components/molecules/character-sheet" // Preparado para futuro (sistema 2014)
import { User, Sparkles, Shield, Info } from "lucide-react"

interface BasicInfoSectionProps {
  formData: Partial<Character>
  onChange: (field: keyof Character, value: any) => void
  language: "es" // Siempre español ahora
  errors?: Record<string, string>
}

export function BasicInfoSection({ formData, onChange, language, errors }: BasicInfoSectionProps) {
  const { t } = useLanguage()
  const origins = RacialTraitService.getOrigins()
  const backgrounds = RacialTraitService.getBackgrounds()

  // Ref para evitar bucles infinitos
  const lastTraitsKeyRef = useRef<string>("")

  // Obtener origin y background seleccionados
  const selectedOrigin = formData.race ? RacialTraitService.getOriginById(formData.race) : null
  const selectedBackground = formData.character_background
    ? RacialTraitService.getBackgroundById(formData.character_background)
    : null

  // Obtener linaje seleccionado si existe
  const selectedLineage = selectedOrigin?.lineages?.find(
    (lineage) => lineage.id === formData.selected_lineage
  )

  // Obtener traits del origin (base + linaje, MOSTRAR TODOS pero marcar los bloqueados)
  const characterLevel = formData.level || 0 // 0 si no tiene nivel
  const originTraits = selectedOrigin
    ? [
        // Traits base (siempre activos)
        ...selectedOrigin.traits.map((traitId) => RacialTraitService.getTraitById(traitId)).filter(Boolean),
        // Traits del linaje seleccionado (MOSTRAR TODOS, no filtrar)
        ...(selectedLineage
          ? selectedLineage.traits
              .map((traitId) => RacialTraitService.getTraitById(traitId))
              .filter(Boolean) // Solo filtrar nulls, no por nivel
          : []),
      ]
        // Eliminar duplicados por ID (ej: si base y linaje tienen darkvision)
        .filter((trait, index, self) => 
          index === self.findIndex((t) => t?.id === trait?.id)
        )
    : []

  // Obtener bonificadores de compra/tienda
  const shopBonuses = formData.race
    ? RacialTraitService.getShopBonuses(formData.race, formData.racial_traits || [])
    : null

  // Cuando se selecciona un origin, aplicar sus traits automáticamente
  const handleOriginChange = (originId: string) => {
    if (!originId || originId === "__none__") {
      // Limpiar todo cuando se selecciona la opción neutra
      onChange("race", null)
      onChange("racial_traits", [])
      onChange("selected_lineage", null)
      onChange("goliath_giant_lineage", null)
      onChange("human_skill_proficiency", null)
      onChange("selected_origin_feat", null)
      onChange("size", null)
      return
    }
    
    const origin = RacialTraitService.getOriginById(originId)
    if (origin) {
      onChange("race", originId)
      
      // Limpiar linaje gigante si no es goliat
      if (originId !== "goliath") {
        onChange("goliath_giant_lineage", null)
        // Remover traits de linaje gigante si existen
        const currentTraits = formData.racial_traits || []
        const giantLineageTraitIds = RacialTraitService.getAllGiantLineageTraitIds()
        const cleanedTraits = currentTraits.filter(
          (traitId) => !giantLineageTraitIds.includes(traitId)
        )
        if (cleanedTraits.length !== currentTraits.length) {
          onChange("racial_traits", cleanedTraits)
        }
      }
      
      // Limpiar campos específicos de humanos si no es humano
      if (originId !== "human") {
        onChange("human_skill_proficiency", null)
        onChange("selected_origin_feat", null)
      }
      
      // Si el origin tiene linajes, limpiar el linaje seleccionado para que el usuario elija
      if (origin.lineages) {
        onChange("selected_lineage", null)
        onChange("racial_traits", origin.traits) // Solo traits base inicialmente
      } else {
        onChange("racial_traits", origin.traits)
      }
      // Si el origin tiene sizeOptions, no establecer automáticamente el tamaño
      // El usuario debe elegir. Si no tiene sizeOptions, usar defaultSize
      if (!origin.sizeOptions && !formData.size) {
        onChange("size", origin.defaultSize)
      }
      // Si tiene sizeOptions pero no hay tamaño seleccionado, establecer el defaultSize como inicial
      if (origin.sizeOptions && !formData.size) {
        onChange("size", origin.defaultSize)
      }
    } else {
      onChange("race", originId)
    }
  }

  // Cuando se selecciona un linaje, actualizar los traits disponibles
  const handleLineageChange = (lineageId: string) => {
    if (!lineageId || lineageId === "__none__") {
      // Limpiar linaje cuando se selecciona la opción neutra
      onChange("selected_lineage", null)
      const origin = RacialTraitService.getOriginById(formData.race || "")
      if (origin) {
        onChange("racial_traits", origin.traits) // Solo traits base
      }
      return
    }
    
    onChange("selected_lineage", lineageId)
    const origin = RacialTraitService.getOriginById(formData.race || "")
    const lineage = origin?.lineages?.find((l) => l.id === lineageId)
    if (origin && lineage) {
      const characterLevel = formData.level || 0
      const availableLineageTraits = lineage.traits.filter((traitId) => {
        const trait = RacialTraitService.getTraitById(traitId)
        if (!trait) return false
        if (trait.requiredLevel !== undefined) {
          return characterLevel >= trait.requiredLevel
        }
        return true
      })
      const newTraits = [...origin.traits, ...availableLineageTraits]
      const traitsKey = `${origin.id}-${lineageId}-${characterLevel}-${newTraits.sort().join(",")}`
      
      // Solo actualizar si realmente cambió
      if (lastTraitsKeyRef.current !== traitsKey) {
        lastTraitsKeyRef.current = traitsKey
        onChange("racial_traits", newTraits)
      }
    }
  }

  // Cuando se selecciona un linaje gigante, actualizar los traits
  const handleGiantLineageChange = (lineage: string) => {
    if (!lineage || lineage === "__none__") {
      // Limpiar linaje gigante cuando se selecciona la opción neutra
      onChange("goliath_giant_lineage", null)
      // Remover traits de linaje gigante
      const currentTraits = formData.racial_traits || []
      const giantLineageTraitIds = RacialTraitService.getAllGiantLineageTraitIds()
      const cleanedTraits = currentTraits.filter(
        (traitId) => !giantLineageTraitIds.includes(traitId)
      )
      onChange("racial_traits", cleanedTraits)
      return
    }
    
    onChange("goliath_giant_lineage", lineage || null)
    
    // Obtener el ID del trait correspondiente
    const lineageTraitId = RacialTraitService.getGiantLineageTraitId(lineage)
    if (!lineageTraitId) return
    
    // Obtener traits actuales
    const currentTraits = formData.racial_traits || []
    
    // Remover cualquier trait de linaje gigante anterior
    const giantLineageTraitIds = RacialTraitService.getAllGiantLineageTraitIds()
    const cleanedTraits = currentTraits.filter(
      (traitId) => !giantLineageTraitIds.includes(traitId)
    )
    
    // Agregar el nuevo trait de linaje gigante
    const newTraits = [...cleanedTraits, lineageTraitId]
    
    onChange("racial_traits", newTraits)
  }

  // Actualizar traits disponibles cuando cambia el nivel del personaje
  useEffect(() => {
    if (selectedOrigin) {
      const characterLevel = formData.level || 0
      
      // Si tiene linaje seleccionado (elfos, etc.), manejar traits del linaje
      if (formData.selected_lineage) {
        const lineage = selectedOrigin.lineages?.find((l) => l.id === formData.selected_lineage)
        if (lineage) {
          const availableLineageTraits = lineage.traits.filter((traitId) => {
            const trait = RacialTraitService.getTraitById(traitId)
            if (!trait) return false
            if (trait.requiredLevel !== undefined) {
              return characterLevel >= trait.requiredLevel
            }
            return true
          })
          const newTraits = [...selectedOrigin.traits, ...availableLineageTraits]
          const traitsKey = `${selectedOrigin.id}-${formData.selected_lineage}-${characterLevel}-${newTraits.sort().join(",")}`
          
          // Solo actualizar si realmente cambió
          if (lastTraitsKeyRef.current !== traitsKey) {
            lastTraitsKeyRef.current = traitsKey
            onChange("racial_traits", newTraits)
          }
        }
      } else {
        // Para origins sin linajes (como goliat), verificar traits base con requiredLevel
        const baseTraits = selectedOrigin.traits || []
        const currentTraits = formData.racial_traits || []
        
        // Filtrar traits base que deben estar activos según el nivel
        const availableBaseTraits = baseTraits.filter((traitId) => {
          const trait = RacialTraitService.getTraitById(traitId)
          if (!trait) return false
          if (trait.requiredLevel !== undefined) {
            return characterLevel >= trait.requiredLevel
          }
          return true
        })
        
        // Mantener traits adicionales (como linaje gigante seleccionado)
        const additionalTraits = currentTraits.filter(
          (traitId) => !baseTraits.includes(traitId)
        )
        
        const newTraits = [...availableBaseTraits, ...additionalTraits]
        const traitsKey = `${selectedOrigin.id}-${characterLevel}-${newTraits.sort().join(",")}`
        
        // Solo actualizar si realmente cambió
        if (lastTraitsKeyRef.current !== traitsKey) {
          lastTraitsKeyRef.current = traitsKey
          onChange("racial_traits", newTraits)
        }
      }
    }
  }, [formData.level, formData.race, formData.selected_lineage]) // Usar IDs primitivos, no objetos

  // Cuando se selecciona un background, solo actualizar el ID (las bonificaciones se seleccionan manualmente)
  const handleBackgroundChange = (backgroundId: string) => {
    if (!backgroundId || backgroundId === "__none__") {
      onChange("character_background", null)
      onChange("background_ability_bonuses", {})
      return
    }
    onChange("character_background", backgroundId)
    // Limpiar bonificaciones anteriores cuando se cambia el background
    onChange("background_ability_bonuses", {})
  }

  // Siempre usar sistema 2024 (PHB 2024)
  const rulesSystem = "5e_2024"
  const is2024 = true
  const is2014 = false // Siempre false, código del 2014 preparado para futuro pero no activo

  return (
    <div className="space-y-6">
      {/* Sistema de Reglas - OCULTO: Siempre usamos D&D 5e 2024 (PHB 2024) */}
      {/* El código del sistema 2014 está preparado pero no activo por ahora */}

      {/* Card 1: Identidad del Personaje - INCLUYE ORIGEN Y BACKGROUND */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <User className="w-5 h-5" />
            Identidad del Personaje
          </CardTitle>
          <CardDescription>
            Información básica sobre tu personaje
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Nombre */}
          <div className="space-y-2">
            <Label htmlFor="name">
              {t.character.characterName} <span className="text-destructive">*</span>
            </Label>
            <Input
              id="name"
              value={formData.name || ""}
              onChange={(e) => onChange("name", e.target.value)}
              placeholder={t.character.enterName}
              className={errors?.name ? "border-destructive" : ""}
            />
            {errors?.name && <p className="text-xs text-destructive">{errors.name}</p>}
          </div>

          {/* Género */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="gender">{t.character.gender}</Label>
              <Select value={formData.gender || ""} onValueChange={(value) => onChange("gender", value || null)}>
                <SelectTrigger id="gender">
                  <SelectValue placeholder={t.character.selectGender} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="male">{t.character.genderMale}</SelectItem>
                  <SelectItem value="female">{t.character.genderFemale}</SelectItem>
                  <SelectItem value="other">{t.character.genderOther}</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">Usado para la selección de avatar por defecto</p>
            </div>
          </div>

          <Separator />

          {/* Especie */}
          <div className="space-y-2">
            <Label htmlFor="origin">
              Especie <span className="text-destructive">*</span>
            </Label>
            <Select value={formData.race || ""} onValueChange={handleOriginChange}>
              <SelectTrigger id="origin" className={errors?.race ? "border-destructive" : ""}>
                <SelectValue placeholder="Selecciona una especie" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="__none__">Selecciona una especie</SelectItem>
                {origins.map((origin) => (
                  <SelectItem key={origin.id} value={origin.id}>
                    {origin.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {selectedOrigin && (
              <p className="text-xs text-muted-foreground mt-1">{selectedOrigin.description}</p>
            )}
            {errors?.race && <p className="text-xs text-destructive">{errors.race}</p>}
          </div>

          {/* Selector de Linaje - Mostrar si el origin tiene linajes */}
          {selectedOrigin && selectedOrigin.lineages && selectedOrigin.lineages.length > 0 && (
            <div className="space-y-2">
              <Label htmlFor="lineage">
                {selectedOrigin.lineageTypeName || "Linaje"} <span className="text-destructive">*</span>
              </Label>
              <Select
                value={formData.selected_lineage || "__none__"}
                onValueChange={handleLineageChange}
              >
                <SelectTrigger id="lineage">
                  <SelectValue placeholder="Selecciona un linaje" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__none__">Selecciona un linaje</SelectItem>
                  {selectedOrigin.lineages.map((lineage) => (
                    <SelectItem key={lineage.id} value={lineage.id}>
                      {lineage.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {selectedLineage && (
                <p className="text-xs text-muted-foreground mt-1">{selectedLineage.description}</p>
              )}
              <p className="text-xs text-muted-foreground">
                El linaje determina habilidades adicionales que se desbloquean en niveles 1, 3 y 5
              </p>
            </div>
          )}

          {/* Selector de Tamaño - Mostrar si el origin tiene sizeOptions */}
          {selectedOrigin && selectedOrigin.sizeOptions && selectedOrigin.sizeOptions.length > 1 && (
            <div className="space-y-2">
              <Label htmlFor="size">
                Tamaño <span className="text-destructive">*</span>
              </Label>
              <Select
                value={formData.size || selectedOrigin.defaultSize || "__none__"}
                onValueChange={(value) => onChange("size", value === "__none__" ? null : (value as "small" | "medium" | "large"))}
              >
                <SelectTrigger id="size">
                  <SelectValue placeholder="Selecciona un tamaño" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__none__">Selecciona un tamaño</SelectItem>
                  {selectedOrigin.sizeOptions.map((size) => (
                    <SelectItem key={size} value={size}>
                      {size === "small" ? "Pequeño" : size === "medium" ? "Mediano" : "Grande"}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                Esta especie puede elegir entre diferentes tamaños
              </p>
            </div>
          )}

          {/* Traits Raciales - Mostrar siempre que haya un origen seleccionado */}
          {originTraits.length > 0 && (
            <div className="rounded-lg border bg-muted/50 p-4 space-y-3">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-primary" />
                <h4 className="text-sm font-semibold">Traits Raciales Automáticos</h4>
              </div>
              <div className="space-y-2">
                {originTraits.map((trait) => {
                  const isAvailable = trait?.requiredLevel 
                    ? (characterLevel >= (trait.requiredLevel || 0))
                    : true
                  
                  // Obtener rango de darkvision si aplica
                  let darkvisionRange: number | null = null
                  if (trait?.id === "darkvision") {
                    // Para linajes, verificar primero el linaje, luego la especie base
                    if (selectedLineage) {
                      darkvisionRange = RacialTraitService.getDarkvisionRange(selectedLineage.id)
                    }
                    if (!darkvisionRange && selectedOrigin) {
                      darkvisionRange = RacialTraitService.getDarkvisionRange(selectedOrigin.id)
                    }
                  }
                  
                  return (
                    <div 
                      key={trait?.id} 
                      className={`flex items-start gap-2 ${!isAvailable ? "opacity-60" : ""}`}
                    >
                      <Badge 
                        variant={isAvailable ? "secondary" : "outline"} 
                        className={`text-xs shrink-0 ${!isAvailable ? "line-through" : ""}`}
                      >
                        {trait?.name}
                        {darkvisionRange && (
                          <span className="ml-1 text-xs opacity-75">
                            ({darkvisionRange}m)
                          </span>
                        )}
                        {trait?.requiredLevel && (
                          <span className="ml-1 text-xs opacity-75">
                            (Nivel {trait.requiredLevel})
                          </span>
                        )}
                      </Badge>
                      <p className={`text-xs flex-1 ${!isAvailable ? "line-through text-muted-foreground" : "text-muted-foreground"}`}>
                        {trait?.description}
                        {darkvisionRange && (
                          <span className="block mt-1 font-medium text-foreground">
                            Rango: {darkvisionRange}m
                          </span>
                        )}
                      </p>
                    </div>
                  )
                })}
              </div>
              {selectedLineage && characterLevel < 5 && (
                <p className="text-xs text-muted-foreground italic mt-2">
                  Los traits tachados se desbloquearán al alcanzar el nivel requerido
                </p>
              )}
            </div>
          )}

          {/* Selector de Habilidad para Humanos (Diestro) */}
          {selectedOrigin?.id === "human" && originTraits.some((t) => t?.id === "human_skilled") && (
            <div className="space-y-2">
              <Label htmlFor="human_skill">
                Habilidad - Diestro <span className="text-destructive">*</span>
              </Label>
              <Select
                value={formData.human_skill_proficiency || "__none__"}
                onValueChange={(value) => onChange("human_skill_proficiency", value === "__none__" ? null : value || null)}
              >
                <SelectTrigger id="human_skill">
                  <SelectValue placeholder="Selecciona una habilidad" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__none__">Selecciona una habilidad</SelectItem>
                  <SelectItem value="athletics">Atletismo</SelectItem>
                  <SelectItem value="acrobatics">Acrobacias</SelectItem>
                  <SelectItem value="sleight_of_hand">Juego de Manos</SelectItem>
                  <SelectItem value="stealth">Sigilo</SelectItem>
                  <SelectItem value="arcana">Arcano</SelectItem>
                  <SelectItem value="history">Historia</SelectItem>
                  <SelectItem value="investigation">Investigación</SelectItem>
                  <SelectItem value="nature">Naturaleza</SelectItem>
                  <SelectItem value="religion">Religión</SelectItem>
                  <SelectItem value="animal_handling">Trato con Animales</SelectItem>
                  <SelectItem value="insight">Perspicacia</SelectItem>
                  <SelectItem value="medicine">Medicina</SelectItem>
                  <SelectItem value="perception">Percepción</SelectItem>
                  <SelectItem value="survival">Supervivencia</SelectItem>
                  <SelectItem value="deception">Engaño</SelectItem>
                  <SelectItem value="intimidation">Intimidación</SelectItem>
                  <SelectItem value="performance">Interpretación</SelectItem>
                  <SelectItem value="persuasion">Persuasión</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                Elige una habilidad en la que ganas competencia gracias al trait "Diestro"
              </p>
            </div>
          )}

          {/* Selector de Dote de Origen para Humanos (Versátil) */}
          {selectedOrigin?.id === "human" && originTraits.some((t) => t?.id === "human_versatile") && (
            <div className="space-y-2">
              <Label htmlFor="origin_feat">
                Dote de Origen - Versátil <span className="text-destructive">*</span>
              </Label>
              {FeatService.getOriginFeats().length === 0 ? (
                <>
                  <Select disabled>
                    <SelectTrigger id="origin_feat">
                      <SelectValue placeholder="Dotes de origen próximamente" />
                    </SelectTrigger>
                  </Select>
                  <p className="text-xs text-muted-foreground">
                    Las dotes de origen se implementarán próximamente. Por ahora, elige una dote del manual manualmente y anótala en tus notas.
                  </p>
                </>
              ) : (
                <Select
                  value={formData.selected_origin_feat || "__none__"}
                  onValueChange={(value) => onChange("selected_origin_feat", value === "__none__" ? null : value || null)}
                >
                  <SelectTrigger id="origin_feat">
                    <SelectValue placeholder="Selecciona una dote de origen" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__none__">Selecciona una dote de origen</SelectItem>
                    {FeatService.getOriginFeats().map((feat) => (
                      <SelectItem key={feat.id} value={feat.id}>
                        {feat.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
              <p className="text-xs text-muted-foreground">
                Elige una dote de origen gracias al trait "Versátil". Se recomienda "Habilidoso".
              </p>
            </div>
          )}

          {/* Selector de Linaje Gigante para Goliat */}
          {selectedOrigin?.id === "goliath" && (
            <div className="space-y-2">
              <Label htmlFor="giant_lineage">
                Linaje Gigante <span className="text-destructive">*</span>
              </Label>
              <Select
                value={formData.goliath_giant_lineage || "__none__"}
                onValueChange={handleGiantLineageChange}
              >
                <SelectTrigger id="giant_lineage">
                  <SelectValue placeholder="Selecciona un linaje gigante" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__none__">Selecciona un linaje gigante</SelectItem>
                  <SelectItem value="fire">Abrasión del fuego (gigante de fuego)</SelectItem>
                  <SelectItem value="hill">Caída de las colinas (gigante de las colinas)</SelectItem>
                  <SelectItem value="cloud">Excursión de las nubes (gigante de las nubes)</SelectItem>
                  <SelectItem value="frost">Frío de la escarcha (gigante de escarcha)</SelectItem>
                  <SelectItem value="stone">Resistencia de la piedra (gigante de piedra)</SelectItem>
                  <SelectItem value="storm">Trueno de la tormenta (gigante de las tormentas)</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                Elige uno de los beneficios sobrenaturales de tu linaje gigante. Podrás usarlo un número de veces igual a tu bonificador por competencia, recuperando todos los usos tras un descanso largo.
              </p>
            </div>
          )}

          {/* Background (D&D 2024) */}
          <Separator />
          <div className="space-y-2">
            <Label htmlFor="background">
              Background (D&D 2024) <span className="text-destructive">*</span>
            </Label>
            <Select
              value={formData.character_background || "__none__"}
              onValueChange={handleBackgroundChange}
            >
              <SelectTrigger id="background">
                <SelectValue placeholder="Selecciona un background" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="__none__">Selecciona un background</SelectItem>
                {backgrounds.map((bg) => (
                  <SelectItem key={bg.id} value={bg.id}>
                    {bg.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {selectedBackground && (
              <>
                <p className="text-xs text-muted-foreground mt-1">{selectedBackground.description}</p>
                <div className="mt-3">
                  <AbilityBonusSelector
                    abilityScoreOptions={selectedBackground.abilityScoreOptions}
                    currentBonuses={formData.background_ability_bonuses || {}}
                    onBonusesChange={(bonuses) => onChange("background_ability_bonuses", bonuses)}
                    suggestedBonuses={selectedBackground.suggestedBonuses}
                  />
                </div>
              </>
            )}
          </div>

          {/* Bonificaciones Raciales (D&D 2014) - OCULTO: Preparado para futuro */}
          {/* {is2014 && (
            <RaceSubraceSelector2014 ... />
          )} */}
        </CardContent>
      </Card>

      {/* Card 3: Clase y Nivel */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Shield className="w-5 h-5" />
            Clase y Nivel
          </CardTitle>
          <CardDescription>
            Configura la clase y el nivel de tu personaje
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="class">{t.character.class}</Label>
              <Select value={formData.class || "__none__"} onValueChange={(value) => onChange("class", value === "__none__" ? null : value || null)}>
                <SelectTrigger id="class">
                  <SelectValue placeholder={t.character.selectClass} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__none__">Selecciona una clase</SelectItem>
                  <SelectItem value="barbarian">{t.character.classes.barbarian}</SelectItem>
                  <SelectItem value="bard">{t.character.classes.bard}</SelectItem>
                  <SelectItem value="cleric">{t.character.classes.cleric}</SelectItem>
                  <SelectItem value="druid">{t.character.classes.druid}</SelectItem>
                  <SelectItem value="fighter">{t.character.classes.fighter}</SelectItem>
                  <SelectItem value="monk">{t.character.classes.monk}</SelectItem>
                  <SelectItem value="paladin">{t.character.classes.paladin}</SelectItem>
                  <SelectItem value="ranger">{t.character.classes.ranger}</SelectItem>
                  <SelectItem value="rogue">{t.character.classes.rogue}</SelectItem>
                  <SelectItem value="sorcerer">{t.character.classes.sorcerer}</SelectItem>
                  <SelectItem value="warlock">{t.character.classes.warlock}</SelectItem>
                  <SelectItem value="wizard">{t.character.classes.wizard}</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="level">{t.character.level}</Label>
              <Input
                id="level"
                type="number"
                min={1}
                max={20}
                value={formData.level || ""}
                onChange={(e) => onChange("level", e.target.value ? Number.parseInt(e.target.value) : null)}
                placeholder="1-20"
                className={errors?.level ? "border-destructive" : ""}
              />
              {errors?.level && <p className="text-xs text-destructive">{errors.level}</p>}
            </div>
          </div>

          <Separator />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="alignment">{t.character.alignment}</Label>
              <Select
                value={formData.alignment || "__none__"}
                onValueChange={(value) => onChange("alignment", value === "__none__" ? null : value || null)}
              >
                <SelectTrigger id="alignment">
                  <SelectValue placeholder="Seleccionar alineamiento" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__none__">Selecciona un alineamiento</SelectItem>
                  <SelectItem value="lawful_good">Legal Bueno</SelectItem>
                  <SelectItem value="neutral_good">Neutral Bueno</SelectItem>
                  <SelectItem value="chaotic_good">Caótico Bueno</SelectItem>
                  <SelectItem value="lawful_neutral">Legal Neutral</SelectItem>
                  <SelectItem value="true_neutral">Neutral Verdadero</SelectItem>
                  <SelectItem value="chaotic_neutral">Caótico Neutral</SelectItem>
                  <SelectItem value="lawful_evil">Legal Malvado</SelectItem>
                  <SelectItem value="neutral_evil">Neutral Malvado</SelectItem>
                  <SelectItem value="chaotic_evil">Caótico Malvado</SelectItem>
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
        </CardContent>
      </Card>

      {/* Card 4: Bonificadores de Tienda (opcional, solo si existen) */}
      {shopBonuses && (
        <Card className="opacity-75">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center gap-2">
              <Info className="w-4 h-4" />
              Bonificadores de Compra/Tienda (Referencia)
            </CardTitle>
            <CardDescription className="text-xs">
              Estos bonificadores no se aplican aún, solo se muestran como referencia
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {shopBonuses.discount_percent && (
                <div className="flex items-center justify-between p-2 rounded bg-muted/30">
                  <span className="text-xs font-medium">Descuento:</span>
                  <Badge variant="outline" className="text-xs">
                    {shopBonuses.discount_percent}%
                  </Badge>
                </div>
              )}
              {shopBonuses.negotiation_bonus && (
                <div className="flex items-center justify-between p-2 rounded bg-muted/30">
                  <span className="text-xs font-medium">Bonus de Negociación:</span>
                  <Badge variant="outline" className="text-xs">
                    +{shopBonuses.negotiation_bonus}
                  </Badge>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

