"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { useLanguage } from "@/lib/language-context"
import { RacialTraitService } from "@/lib/services/racial-traits-service"
import type { Character } from "@/lib/infrastructure/repositories/character-repository"
import { Info, Zap } from "lucide-react"

interface RacialTraitsSectionProps {
  formData: Partial<Character>
  onChange: (field: keyof Character, value: any) => void
  language: "es" // Siempre español ahora
  errors?: Record<string, string>
}

export function RacialTraitsSection({ formData, onChange, language, errors }: RacialTraitsSectionProps) {
  const { t } = useLanguage()

  // Obtener traits activos
  const activeTraitIds = formData.racial_traits || []
  const activeTraits = activeTraitIds
    .map((traitId) => RacialTraitService.getTraitById(traitId))
    .filter(Boolean)

  // Obtener origin seleccionado
  const selectedOrigin = formData.race ? RacialTraitService.getOriginById(formData.race) : null

  // Agrupar traits por categoría de afectación
  const traitsByCategory = activeTraits.reduce(
    (acc, trait) => {
      if (!trait) return acc
      for (const affect of trait.affects) {
        if (!acc[affect]) {
          acc[affect] = []
        }
        acc[affect].push(trait)
      }
      return acc
    },
    {} as Record<string, typeof activeTraits>
  )

  const categoryLabels: Record<string, string> = {
    carrying_capacity: "Capacidad de Carga",
    ability_scores: "Atributos",
    speed: "Velocidad",
    vision: "Visión",
    saving_throws: "Tiradas de Salvación",
    skills: "Habilidades",
    shop: "Compras/Tienda",
    other: "Otros",
  }

  return (
    <div className="space-y-4">
      {selectedOrigin ? (
        <>
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center gap-2">
                <Zap className="w-4 h-4" />
                Origen: {selectedOrigin.name}
              </CardTitle>
              <CardDescription className="text-xs">{selectedOrigin.description}</CardDescription>
            </CardHeader>
          </Card>

          {activeTraits.length > 0 ? (
            <div className="space-y-4">
              {Object.entries(traitsByCategory).map(([category, traits]) => (
                <Card key={category}>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm">{categoryLabels[category] || category}</CardTitle>
                    <CardDescription className="text-xs">
                      Traits que afectan {categoryLabels[category] || category}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {traits.map((trait) => {
                        // Obtener rango de darkvision si aplica
                        let darkvisionRange: number | null = null
                        if (trait?.id === "darkvision" && selectedOrigin) {
                          // Para linajes, verificar primero el linaje, luego la especie base
                          const selectedLineage = selectedOrigin.lineages?.find(
                            (lineage) => lineage.id === formData.selected_lineage
                          )
                          if (selectedLineage) {
                            darkvisionRange = RacialTraitService.getDarkvisionRange(selectedLineage.id)
                          }
                          if (!darkvisionRange) {
                            darkvisionRange = RacialTraitService.getDarkvisionRange(selectedOrigin.id)
                          }
                        }
                        
                        return (
                          <div key={trait?.id} className="space-y-2">
                            <div className="flex items-start gap-2">
                              <Badge variant="secondary" className="text-xs">
                                {trait?.name}
                                {darkvisionRange && (
                                  <span className="ml-1 text-xs opacity-75">
                                    ({darkvisionRange}m)
                                  </span>
                                )}
                              </Badge>
                            </div>
                            <p className="text-xs text-muted-foreground pl-2 border-l-2 border-primary/20">
                              {trait?.description}
                              {darkvisionRange && (
                                <span className="block mt-1 font-medium text-foreground">
                                  Rango: {darkvisionRange}m
                                </span>
                              )}
                            </p>
                          {/* carryingCapacityMultiplier - Campo no existe en la interfaz actual, comentado por ahora */}
                          {/* {trait?.carryingCapacityMultiplier && (
                            <div className="mt-1 pl-2">
                              <Badge variant="outline" className="text-xs">
                                Multiplicador de Capacidad: ×{trait.carryingCapacityMultiplier}
                              </Badge>
                            </div>
                          )} */}
                          {trait?.shopEffects && (
                            <div className="mt-1 pl-2 space-y-1">
                              {trait.shopEffects.discount_percent && (
                                <Badge variant="outline" className="text-xs mr-1">
                                  Descuento: {trait.shopEffects.discount_percent}%
                                </Badge>
                              )}
                              {trait.shopEffects.negotiation_bonus && (
                                <Badge variant="outline" className="text-xs">
                                  Bonus Negociación: +{trait.shopEffects.negotiation_bonus}
                                </Badge>
                              )}
                            </div>
                          )}
                        </div>
                        )
                      })}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="py-6">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Info className="w-4 h-4" />
                  <p className="text-sm">
                    Este origen no tiene traits raciales adicionales, o los traits aún no están
                    configurados.
                  </p>
                </div>
              </CardContent>
            </Card>
          )}
        </>
      ) : (
        <Card>
          <CardContent className="py-6">
            <div className="flex items-center gap-2 text-muted-foreground">
              <Info className="w-4 h-4" />
              <p className="text-sm">
                Selecciona un Origen de Personaje en la pestaña "Información Básica" para ver los
                traits raciales disponibles.
              </p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

