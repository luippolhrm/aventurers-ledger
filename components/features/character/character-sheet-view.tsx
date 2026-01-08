"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { useServices } from "@/hooks/use-services"
import { LoadingState } from "@/components/molecules/loading"
import { EmptyState } from "@/components/molecules/empty"
import { CarryingCapacityDisplay } from "@/components/molecules/character-sheet"
import { CharacterSheetConfigService } from "@/lib/services/character-sheet-config"
import type { Character } from "@/lib/infrastructure/repositories/character-repository"
import { useLanguage } from "@/lib/language-context"
import { ArrowLeft, User, Activity, Book, FileText, Edit, MapPin } from "lucide-react"

interface CharacterSheetViewProps {
  characterId: string
  language?: "es" // Mantener por compatibilidad, pero ya no se usa
  editable?: boolean
}

export function CharacterSheetView({ characterId, language, editable = false }: CharacterSheetViewProps) {
  const { t } = useLanguage()
  const services = useServices()
  const router = useRouter()

  const [character, setCharacter] = useState<Character | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (characterId) {
      loadCharacter()
    }
  }, [characterId])

  const loadCharacter = async () => {
    setLoading(true)
    try {
      const characterData = await services.character.getCharacter(characterId)
      setCharacter(characterData)
    } catch (error) {
      console.error("Error loading character:", error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return <LoadingState message="Cargando hoja de personaje..." />
  }

  if (!character) {
    return (
      <EmptyState
        icon={User}
        title="Personaje no encontrado"
        description="No se pudo cargar la información del personaje"
      />
    )
  }

  const formatAbilityScore = (score: number | null | undefined) => {
    if (!score) return "—"
    const modifier = CharacterSheetConfigService.calculateAbilityModifier(score)
    const modifierStr = modifier >= 0 ? `+${modifier}` : `${modifier}`
    return `${score} (${modifierStr})`
  }

  return (
    <div className="space-y-6">
      {/* Header con botón volver */}
      <div className="flex items-center justify-between">
        <Button variant="ghost" onClick={() => router.push("/dashboard?module=characters")}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          Volver a Personajes
        </Button>
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            onClick={() => router.push(`/characters/${characterId}/join-campaign`)}
          >
            <MapPin className="w-4 h-4 mr-2" />
            Unir a Campaña
          </Button>
          <Button 
            variant="outline" 
            onClick={() => router.push(`/characters/${characterId}/edit`)}
          >
            <Edit className="w-4 h-4 mr-2" />
            Editar
          </Button>
        </div>
      </div>

      {/* Información Básica */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="w-5 h-5" />
            {t.character.sections?.basic || "Información Básica"}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-muted-foreground">{t.character.characterName}</p>
              <p className="font-medium">{character.name}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">{t.character.race}</p>
              <p className="font-medium">{character.race}</p>
            </div>
            {character.class && (
              <div>
                <p className="text-sm text-muted-foreground">{t.character.class}</p>
                <p className="font-medium">{character.class}</p>
              </div>
            )}
            {character.level && (
              <div>
                <p className="text-sm text-muted-foreground">{t.characterProfile?.level || "Level"}</p>
                <p className="font-medium">{character.level}</p>
              </div>
            )}
            {character.gender && (
              <div>
                <p className="text-sm text-muted-foreground">Género</p>
                <p className="font-medium">{character.gender}</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Atributos */}
      {(character.strength ||
        character.dexterity ||
        character.constitution ||
        character.intelligence ||
        character.wisdom ||
        character.charisma) && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="w-5 h-5" />
              {t.character.sections?.abilityScores || "Atributos"}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {character.strength && (
                <div>
                  <p className="text-sm text-muted-foreground">{t.character.strength}</p>
                  <p className="font-medium text-lg">{formatAbilityScore(character.strength)}</p>
                </div>
              )}
              {character.dexterity && (
                <div>
                  <p className="text-sm text-muted-foreground">{t.character.dexterity}</p>
                  <p className="font-medium text-lg">{formatAbilityScore(character.dexterity)}</p>
                </div>
              )}
              {character.constitution && (
                <div>
                  <p className="text-sm text-muted-foreground">{t.character.constitution}</p>
                  <p className="font-medium text-lg">{formatAbilityScore(character.constitution)}</p>
                </div>
              )}
              {character.intelligence && (
                <div>
                  <p className="text-sm text-muted-foreground">{t.character.intelligence}</p>
                  <p className="font-medium text-lg">{formatAbilityScore(character.intelligence)}</p>
                </div>
              )}
              {character.wisdom && (
                <div>
                  <p className="text-sm text-muted-foreground">{t.character.wisdom}</p>
                  <p className="font-medium text-lg">{formatAbilityScore(character.wisdom)}</p>
                </div>
              )}
              {character.charisma && (
                <div>
                  <p className="text-sm text-muted-foreground">{t.character.charisma}</p>
                  <p className="font-medium text-lg">{formatAbilityScore(character.charisma)}</p>
                </div>
              )}
            </div>

            {character.size && (
              <div className="mt-4 pt-4 border-t">
                <p className="text-sm text-muted-foreground mb-2">{t.character.size}</p>
                <Badge variant="secondary">
                  {character.size === "small"
                    ? t.character.sizeSmall
                    : character.size === "large"
                      ? t.character.sizeLarge
                      : t.character.sizeMedium}
                </Badge>
              </div>
            )}

            {character.carrying_capacity && (
              <div className="mt-4">
                <CarryingCapacityDisplay
                  currentWeight={0}
                  maxCapacity={character.carrying_capacity}
                  language={language || "es"}
                />
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Trasfondo */}
      {(character.background || character.alignment || character.experience_points) && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Book className="w-5 h-5" />
              {t.character.sections?.background || "Trasfondo"}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {character.background && (
              <div>
                <p className="text-sm text-muted-foreground">{t.character.background}</p>
                <p className="font-medium">{character.background}</p>
              </div>
            )}
            {character.alignment && (
              <div>
                <p className="text-sm text-muted-foreground">{t.character.alignment}</p>
                <p className="font-medium">{character.alignment}</p>
              </div>
            )}
            {character.experience_points !== null && character.experience_points !== undefined && (
              <div>
                <p className="text-sm text-muted-foreground">{t.character.experiencePoints}</p>
                <p className="font-medium">{character.experience_points.toLocaleString()}</p>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Notas */}
      {character.preparation_notes && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="w-5 h-5" />
              {t.character.sections?.notes || "Notas"}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm whitespace-pre-wrap">{character.preparation_notes}</p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

