"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { LoadingState } from "@/components/molecules/loading"
import { EmptyState } from "@/components/molecules/empty"
import { useAuth } from "@/lib/auth-context"
import { useServices } from "@/hooks/use-services"
import { useLanguage } from "@/lib/language-context"
import { ArrowLeft, MapPin, Info } from "lucide-react"
import { DIFFICULTY_LEVEL_OPTIONS, DIFFICULTY_LEVEL_METADATA, type DifficultyLevel } from "@/lib/constants/dungeon-constants"

interface DungeonFullCreateViewProps {
  campaignId: string
}

export function DungeonFullCreateView({ campaignId }: DungeonFullCreateViewProps) {
  const { t } = useLanguage()
  const router = useRouter()
  const { user } = useAuth()
  const services = useServices()

  // Estados para Location
  const [locationName, setLocationName] = useState("")
  const [locationDescription, setLocationDescription] = useState("")

  // Estados para Dungeon
  const [recommendedLevel, setRecommendedLevel] = useState<string>("")
  const [difficultyLevel, setDifficultyLevel] = useState<string>("")

  // Estados de control
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isOwner, setIsOwner] = useState(false)

  useEffect(() => {
    if (user && campaignId) {
      loadData()
    }
  }, [user, campaignId])

  const loadData = async () => {
    if (!user || !campaignId) return

    setIsLoading(true)
    setError(null)
    try {
      const campaign = await services.campaign.getCampaign(campaignId)
      const owner = campaign.game_master_id === user.id
      setIsOwner(owner)
    } catch (err: any) {
      console.error("Error loading campaign:", err)
      setError(err?.message || "Error al cargar la campaña")
    } finally {
      setIsLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user) {
      setError("Debes estar autenticado para crear mazmorras")
      return
    }

    if (!locationName.trim()) {
      setError("El nombre de la ubicación es requerido")
      return
    }

    setIsSaving(true)
    setError(null)
    try {
      // Paso 1: Crear la Location de tipo "dungeon"
      const newLocation = await services.location.createLocation(
        {
          name: locationName.trim(),
          description: locationDescription || null,
          location_type: "dungeon",
          campaign_id: campaignId,
        },
        user.id
      )

      // Paso 2: Crear el Dungeon asociado
      const newDungeon = await services.dungeon.createDungeon(
        newLocation.id,
        {
          location_id: newLocation.id,
          recommended_level: recommendedLevel ? parseInt(recommendedLevel) : null,
          difficulty_level: difficultyLevel || null,
          is_cleared: false,
          map_data: null,
        },
        user.id
      )

      // Redirigir a la vista de la mazmorra
      router.push(`/campaigns/${campaignId}/locations/${newLocation.id}/dungeon`)
    } catch (err: any) {
      console.error("Error creating dungeon:", err)
      setError(err?.message || "Error al crear la mazmorra")
    } finally {
      setIsSaving(false)
    }
  }

  const handleCancel = () => {
    router.push(`/campaigns/${campaignId}?view=world`)
  }

  const getDifficultyLabel = (level: string) => {
    return t.marketplace?.difficultyLevels?.[level] || level
  }

  const getSelectedDifficultyInfo = () => {
    if (!difficultyLevel) return null
    const metadata = DIFFICULTY_LEVEL_METADATA[difficultyLevel as DifficultyLevel]
    const description = t.marketplace?.difficultyLevelDescriptions?.[difficultyLevel as DifficultyLevel]
    return { metadata, description }
  }

  const selectedDifficultyInfo = getSelectedDifficultyInfo()

  if (isLoading) {
    return <LoadingState message="Cargando..." />
  }

  if (!isOwner) {
    return (
      <div className="w-full max-w-3xl mx-auto space-y-4 md:space-y-6">
        <Button variant="ghost" onClick={handleCancel} className="text-sm md:text-base">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Volver a Configuración
        </Button>
        <EmptyState
          icon={MapPin}
          title="Acceso Denegado"
          description="Solo el Game Master puede crear mazmorras"
        />
      </div>
    )
  }

  return (
    <div className="w-full max-w-3xl mx-auto space-y-4 md:space-y-6">
      <Button variant="ghost" onClick={handleCancel} className="text-sm md:text-base">
        <ArrowLeft className="w-4 h-4 mr-2" />
        Volver a Configuración
      </Button>

      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MapPin className="w-5 h-5" />
            {t.marketplace?.dungeons?.createDungeon || "Crear Mazmorra"}
          </CardTitle>
          <CardDescription>
            Crea una nueva mazmorra con su ubicación y características
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Sección: Información de Ubicación */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 pb-2 border-b">
                <MapPin className="w-4 h-4 text-muted-foreground" />
                <h3 className="font-semibold">Información de Ubicación</h3>
              </div>

              <div className="space-y-2">
                <Label htmlFor="location-name">
                  Nombre de la Ubicación <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="location-name"
                  value={locationName}
                  onChange={(e) => setLocationName(e.target.value)}
                  placeholder="Ej: Cavernas Oscuras de Moria"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="location-description">Descripción de la Ubicación</Label>
                <Textarea
                  id="location-description"
                  value={locationDescription}
                  onChange={(e) => setLocationDescription(e.target.value)}
                  placeholder="Describe la ubicación de esta mazmorra en el mundo..."
                  rows={3}
                />
              </div>
            </div>

            {/* Sección: Características de la Mazmorra */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 pb-2 border-b">
                <Info className="w-4 h-4 text-muted-foreground" />
                <h3 className="font-semibold">Características de la Mazmorra</h3>
              </div>

              <div className="space-y-2">
                <Label htmlFor="recommended-level">Nivel Recomendado</Label>
                <Input
                  id="recommended-level"
                  type="number"
                  min="1"
                  max="20"
                  value={recommendedLevel}
                  onChange={(e) => setRecommendedLevel(e.target.value)}
                  placeholder="Ej: 5"
                />
                <p className="text-xs text-muted-foreground">
                  Nivel de personaje recomendado para enfrentar esta mazmorra
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="difficulty-level">Dificultad</Label>
                <Select value={difficultyLevel} onValueChange={setDifficultyLevel}>
                  <SelectTrigger id="difficulty-level">
                    <SelectValue placeholder="Selecciona la dificultad" />
                  </SelectTrigger>
                  <SelectContent>
                    {DIFFICULTY_LEVEL_OPTIONS.map((level) => (
                      <SelectItem key={level} value={level}>
                        {getDifficultyLabel(level)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                {selectedDifficultyInfo && (
                  <Alert>
                    <Info className="w-4 h-4" />
                    <AlertDescription className="space-y-2">
                      {selectedDifficultyInfo.description && (
                        <p className="text-sm">{selectedDifficultyInfo.description}</p>
                      )}
                      {selectedDifficultyInfo.metadata && (
                        <div className="flex flex-wrap gap-2 mt-2">
                          {selectedDifficultyInfo.metadata.recommendedLevelRange && (
                            <Badge variant="secondary" className="text-xs">
                              Nivel: {selectedDifficultyInfo.metadata.recommendedLevelRange}
                            </Badge>
                          )}
                          {selectedDifficultyInfo.metadata.typicalEnemyCR && (
                            <Badge variant="secondary" className="text-xs">
                              CR: {selectedDifficultyInfo.metadata.typicalEnemyCR}
                            </Badge>
                          )}
                          {selectedDifficultyInfo.metadata.typicalRewardRarity && (
                            <Badge variant="secondary" className="text-xs">
                              Recompensas: {selectedDifficultyInfo.metadata.typicalRewardRarity}
                            </Badge>
                          )}
                        </div>
                      )}
                    </AlertDescription>
                  </Alert>
                )}
              </div>
            </div>

            {/* Botones de Acción */}
            <div className="flex gap-2 justify-end pt-4">
              <button
                type="button"
                onClick={handleCancel}
                className="px-4 py-2 text-sm font-medium text-muted-foreground hover:text-foreground"
                disabled={isSaving}
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="px-4 py-2 text-sm font-medium bg-primary text-primary-foreground rounded-md hover:bg-primary/90 disabled:opacity-50"
                disabled={isSaving || !locationName.trim()}
              >
                {isSaving ? "Creando..." : "Crear Mazmorra"}
              </button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}

