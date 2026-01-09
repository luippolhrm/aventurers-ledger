"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
// @deprecated - Solo se usa para mantener compatibilidad con el estado visual (highlighting)
// TODO: Eliminar cuando se refactorice completamente el sistema de selección de personajes
import { useAuth } from "@/lib/auth-context"
import { useLanguage } from "@/lib/language-context"
import { useServices } from "@/hooks/use-services"
import { LoadingState } from "@/components/molecules/loading"
import type { Character as CharacterType } from "@/lib/infrastructure/repositories"
import {
  UserPlus,
  Edit,
  Loader2,
  User,
  MapPin,
  Power,
  PowerOff,
  FileText,
} from "lucide-react"
import { useRouter } from "next/navigation"
import { Badge } from "@/components/ui/badge"
import type { CharacterWithCampaign } from "@/lib/infrastructure/repositories/character-repository"
import { CharacterCampaignView } from "@/components/character-campaign-view"

interface CharactersUnifiedProps {
  language?: "es" // Mantener por compatibilidad, pero ya no se usa
}

export function CharactersUnified({ language }: CharactersUnifiedProps) {
  const { user } = useAuth()
  const router = useRouter()
  const [characters, setCharacters] = useState<CharacterType[]>([])
  const [assignedCharacters, setAssignedCharacters] = useState<CharacterWithCampaign[]>([])
  const [freeCharacters, setFreeCharacters] = useState<CharacterType[]>([])
  const [archivedCharacters, setArchivedCharacters] = useState<CharacterType[]>([])
  const [loading, setLoading] = useState(true)
  const [viewingCampaign, setViewingCampaign] = useState<{ characterId: string; campaignId: string } | null>(null)
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null)
  const { t } = useLanguage()

  const services = useServices()

  useEffect(() => {
    if (user && services) {
      loadCharacters()
    }
  }, [user, services])

  const loadCharacters = async () => {
    setLoading(true)
    try {
      if (!user) {
        setCharacters([])
        setAssignedCharacters([])
        setFreeCharacters([])
        setArchivedCharacters([])
        setLoading(false)
        return
      }

      const [charactersByStatus, archivedData] = await Promise.all([
        services.character.getCharactersByStatus(user.id),
        services.character.getUserCharacters(user.id, true),
      ])

      // Separar personajes activos en asignados y libres
      setAssignedCharacters(charactersByStatus.assigned)
      setFreeCharacters(charactersByStatus.free)
      
      // Combinar todos los activos para compatibilidad
      const allActive = [...charactersByStatus.assigned, ...charactersByStatus.free]
      setCharacters(allActive)
      
      // Personajes desactivados
      setArchivedCharacters(archivedData.filter((c) => c.archived))
    } catch (error) {
      console.error("[v0] Error loading characters:", error)
      setMessage({ type: "error", text: "Error loading characters" })
    } finally {
      setLoading(false)
    }
  }


  const handleDeactivate = async (character: CharacterType) => {
    if (!confirm("¿Desactivar este personaje? Puedes activarlo más tarde.")) {
      return
    }

    try {
      setMessage(null)
      await services.character.archiveCharacter(character.id)

      setMessage({ type: "success", text: "Personaje desactivado exitosamente" })
      await loadCharacters()

      setTimeout(() => {
        setMessage(null)
      }, 2000)
    } catch (error: any) {
      console.error("[v0] Error deactivating character:", error)
      setMessage({ type: "error", text: error?.message || t.character.error })
    }
  }

  const handleActivate = async (character: CharacterType) => {
    if (!confirm("¿Activar este personaje?")) {
      return
    }

    try {
      setMessage(null)
      await services.character.unarchiveCharacter(character.id)

      setMessage({ type: "success", text: "Personaje activado exitosamente" })
      await loadCharacters()

      setTimeout(() => {
        setMessage(null)
      }, 2000)
    } catch (error: any) {
      console.error("[v0] Error activating character:", error)
      setMessage({ type: "error", text: error?.message || t.character.error })
    }
  }

  const handleGoToCampaign = (campaignId: string, characterId: string) => {
    setViewingCampaign({ characterId, campaignId })
  }

  const handleBackFromCampaign = () => {
    setViewingCampaign(null)
  }

  const handleEditProfile = (character: CharacterType) => {
    router.push(`/characters/${character.id}/edit`)
  }

  if (loading) {
    return (
      <div className="w-full max-w-7xl mx-auto p-4 md:p-6">
        <LoadingState message={(t.character as any)?.loading || "Loading characters..."} />
      </div>
    )
  }

  // Si se está viendo una campaña, mostrar la vista de campaña
  if (viewingCampaign) {
    return (
      <CharacterCampaignView
        characterId={viewingCampaign.characterId}
        campaignId={viewingCampaign.campaignId}
        language={language}
        onBack={handleBackFromCampaign}
      />
    )
  }

  return (
    <div className="w-full max-w-7xl mx-auto space-y-4 md:space-y-6 p-4 md:p-6">
      {message && (
        <Alert variant={message.type === "error" ? "destructive" : "default"} className="mb-4">
          <AlertDescription>{message.text}</AlertDescription>
        </Alert>
      )}

      <div className="space-y-3 md:space-y-4">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 sm:gap-4 mb-4">
          <div>
            <h3 className="text-base md:text-lg font-semibold">{t.character.title}</h3>
            <p className="text-xs md:text-sm text-muted-foreground">
              {t.character.description}
            </p>
          </div>
          <Button onClick={() => router.push("/characters/new")} className="text-sm md:text-base w-full sm:w-auto">
            <UserPlus className="w-3 h-3 md:w-4 md:h-4 mr-1 md:mr-2" />
            {t.character.createCharacter}
          </Button>
        </div>

        {assignedCharacters.length === 0 && freeCharacters.length === 0 && archivedCharacters.length === 0 ? (
          <Card>
            <CardContent className="pt-6 text-center">
              <p className="mb-4">{t.character.noCharactersYet}</p>
              <Button onClick={() => router.push("/characters/new")}>
                <UserPlus className="w-4 h-4 mr-2" />
                {t.character.createCharacter}
              </Button>
            </CardContent>
          </Card>
        ) : (
          <>
            {/* Personajes Asignados */}
            {assignedCharacters.map((character) => (
              <Card
                key={character.id}
                className="border-purple-200 dark:border-purple-800"
              >
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 flex-wrap mb-2">
                        <CardTitle>{character.name}</CardTitle>
                        <Badge variant="secondary" className="bg-purple-100 dark:bg-purple-900 text-purple-800 dark:text-purple-100">
                          Asignado
                        </Badge>
                      </div>
                      <CardDescription>
                        {character.race}
                        {character.class && ` • ${character.class}`}
                        {character.level && ` • Nivel ${character.level}`}
                        {character.campaignName && ` • Campaña: ${character.campaignName}`}
                      </CardDescription>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation()
                          handleGoToCampaign(character.campaignId, character.id)
                        }}
                      >
                        <MapPin className="h-4 w-4 mr-1 md:mr-2" />
                        <span className="hidden sm:inline">Ir a Campaña</span>
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation()
                          router.push(`/characters/${character.id}/sheet`)
                        }}
                      >
                        <FileText className="h-4 w-4 mr-1 md:mr-2" />
                        <span className="hidden sm:inline">Ver Hoja</span>
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation()
                          handleEditProfile(character)
                        }}
                      >
                        <Edit className="h-4 w-4 mr-1 md:mr-2" />
                        <span className="hidden sm:inline">Editar</span>
                      </Button>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation()
                          handleDeactivate(character)
                        }}
                      >
                        <PowerOff className="h-4 w-4 mr-1 md:mr-2" />
                        <span className="hidden sm:inline">Desactivar</span>
                      </Button>
                    </div>
                  </div>
                </CardHeader>
              </Card>
            ))}

            {/* Personajes Libres */}
            {freeCharacters.map((character) => (
              <Card
                key={character.id}
                className="border-green-200 dark:border-green-800"
              >
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 flex-wrap mb-2">
                        <CardTitle>{character.name}</CardTitle>
                        <Badge variant="outline" className="bg-green-50 dark:bg-green-950 text-green-700 dark:text-green-300 border-green-200 dark:border-green-700">
                          Libre
                        </Badge>
                      </div>
                      <CardDescription>
                        {character.race}
                        {character.class && ` • ${character.class}`}
                        {character.level && ` • Nivel ${character.level}`}
                      </CardDescription>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation()
                          router.push(`/characters/${character.id}/sheet`)
                        }}
                      >
                        <FileText className="h-4 w-4 mr-1 md:mr-2" />
                        <span className="hidden sm:inline">Ver Hoja</span>
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation()
                          handleEditProfile(character)
                        }}
                      >
                        <Edit className="h-4 w-4 mr-1 md:mr-2" />
                        <span className="hidden sm:inline">Editar</span>
                      </Button>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation()
                          handleDeactivate(character)
                        }}
                      >
                        <PowerOff className="h-4 w-4 mr-1 md:mr-2" />
                        <span className="hidden sm:inline">Desactivar</span>
                      </Button>
                    </div>
                  </div>
                </CardHeader>
              </Card>
            ))}

            {/* Personajes Desactivados */}
            {archivedCharacters.length > 0 && (
              <>
                <div className="border-t border-border my-2 md:my-3"></div>
                <div className="space-y-3 md:space-y-4">
                  {archivedCharacters.map((character) => (
                    <Card
                      key={character.id}
                      className="border-gray-200 dark:border-gray-800 opacity-60"
                    >
                      <CardHeader>
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 flex-wrap mb-2">
                              <CardTitle className="text-muted-foreground">{character.name}</CardTitle>
                              <Badge variant="secondary" className="bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400">
                                Desactivado
                              </Badge>
                            </div>
                            <CardDescription className="text-muted-foreground">
                              {character.race}
                              {character.class && ` • ${character.class}`}
                              {character.level && ` • Nivel ${character.level}`}
                            </CardDescription>
                          </div>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation()
                              handleActivate(character)
                            }}
                          >
                            <Power className="h-4 w-4 mr-1 md:mr-2" />
                            <span className="hidden sm:inline">Activar</span>
                          </Button>
                        </div>
                      </CardHeader>
                    </Card>
                  ))}
                </div>
              </>
            )}
          </>
        )}
      </div>

    </div>
  )
}
