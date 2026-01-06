"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { useServices } from "@/hooks/use-services"
import { useAuth } from "@/lib/auth-context"
import { type Language, translations } from "@/lib/translations"
import type { Character } from "@/lib/infrastructure/repositories/character-repository"
import type { CharacterWithCampaign } from "@/lib/infrastructure/repositories/character-repository"
import { User, Plus, Check } from "lucide-react"
import { cn } from "@/lib/utils"

interface CharacterCampaignSelectorProps {
  language: Language
  open: boolean
  onOpenChange: (open: boolean) => void
  onSelect: (characterId: string) => void
  onCreateNew?: () => void
}

export function CharacterCampaignSelector({
  language,
  open,
  onOpenChange,
  onSelect,
  onCreateNew,
}: CharacterCampaignSelectorProps) {
  const t = translations[language]
  const { user } = useAuth()
  const services = useServices()
  const [assigned, setAssigned] = useState<CharacterWithCampaign[]>([])
  const [free, setFree] = useState<Character[]>([])
  const [loading, setLoading] = useState(false)
  const [selectedCharacterId, setSelectedCharacterId] = useState<string | null>(null)

  useEffect(() => {
    if (open && user) {
      loadCharacters()
    }
  }, [open, user])

  const loadCharacters = async () => {
    if (!user) return

    setLoading(true)
    try {
      const result = await services.character.getCharactersByStatus(user.id)
      setAssigned(result.assigned)
      setFree(result.free)
    } catch (error) {
      console.error("Error loading characters:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleSelect = (characterId: string) => {
    setSelectedCharacterId(characterId)
    onSelect(characterId)
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {t.campaigns?.selectCharacterToJoin || "Selecciona un personaje para unirte a la campaña"}
          </DialogTitle>
          <DialogDescription>
            {t.campaigns?.selectCharacterDescription ||
              "Elige un personaje libre o crea uno nuevo para participar en esta campaña"}
          </DialogDescription>
        </DialogHeader>

        {loading ? (
          <div className="py-8 text-center text-muted-foreground">Cargando personajes...</div>
        ) : (
          <div className="space-y-6">
            {/* Personajes Libres */}
            {free.length > 0 && (
              <div>
                <h3 className="text-sm font-semibold mb-3 text-foreground">
                  Personajes Libres
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {free.map((character) => (
                    <button
                      key={character.id}
                      onClick={() => handleSelect(character.id)}
                      className={cn(
                        "p-4 border rounded-lg text-left transition-colors",
                        "hover:bg-accent hover:border-primary",
                        selectedCharacterId === character.id && "border-primary bg-accent"
                      )}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <User className="w-4 h-4 text-muted-foreground" />
                            <span className="font-medium">{character.name}</span>
                          </div>
                          <div className="text-sm text-muted-foreground">
                            {character.race}
                            {character.class && ` • ${character.class}`}
                            {character.level && ` • Nivel ${character.level}`}
                          </div>
                        </div>
                        {selectedCharacterId === character.id && (
                          <Check className="w-5 h-5 text-primary" />
                        )}
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Personajes Asignados (solo lectura) */}
            {assigned.length > 0 && (
              <div>
                <h3 className="text-sm font-semibold mb-3 text-muted-foreground">
                  Personajes Asignados (en otras campañas)
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {assigned.map((character) => (
                    <div
                      key={character.id}
                      className="p-4 border rounded-lg bg-muted/50 opacity-75 cursor-not-allowed"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <User className="w-4 h-4 text-muted-foreground" />
                            <span className="font-medium">{character.name}</span>
                          </div>
                          <div className="text-sm text-muted-foreground">
                            {character.race}
                            {character.class && ` • ${character.class}`}
                            {character.level && ` • Nivel ${character.level}`}
                          </div>
                          <div className="text-xs text-muted-foreground mt-2">
                            En: {character.campaignName}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Mensaje si no hay personajes */}
            {free.length === 0 && assigned.length === 0 && (
              <div className="py-8 text-center text-muted-foreground">
                <p className="mb-4">No tienes personajes creados</p>
                {onCreateNew && (
                  <Button onClick={onCreateNew} variant="outline">
                    <Plus className="w-4 h-4 mr-2" />
                    Crear Primer Personaje
                  </Button>
                )}
              </div>
            )}

            {/* Botón crear nuevo personaje */}
            {free.length > 0 && onCreateNew && (
              <div className="pt-4 border-t">
                <Button onClick={onCreateNew} variant="outline" className="w-full">
                  <Plus className="w-4 h-4 mr-2" />
                  {t.character?.createCharacter || "Crear Nuevo Personaje"}
                </Button>
              </div>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}

