"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { LoadingState } from "@/components/molecules/loading"
import { EmptyState } from "@/components/molecules/empty"
import { useAuth } from "@/lib/auth-context"
import { useServices } from "@/hooks/use-services"
import { useLanguage } from "@/lib/language-context"
import { useToast } from "@/hooks/use-toast"
import { ArrowLeft, MapPin, Info, Skull } from "lucide-react"
import { DIFFICULTY_LEVEL_OPTIONS, DIFFICULTY_LEVEL_METADATA, type DifficultyLevel } from "@/lib/constants/dungeon-constants"
import { Badge } from "@/components/ui/badge"

interface DungeonCreateViewProps {
  campaignId: string
  locationId: string
}

export function DungeonCreateView({ campaignId, locationId }: DungeonCreateViewProps) {
  const { t } = useLanguage()
  const router = useRouter()
  const { user } = useAuth()
  const services = useServices()
  const { toast } = useToast()

  const [recommendedLevel, setRecommendedLevel] = useState<string>("")
  const [difficultyLevel, setDifficultyLevel] = useState<string>("")
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isOwner, setIsOwner] = useState(false)

  useEffect(() => {
    if (user && campaignId && locationId) {
      loadData()
    }
  }, [user, campaignId, locationId])

  const loadData = async () => {
    if (!user || !campaignId || !locationId) return

    setIsLoading(true)
    setError(null)
    try {
      const [campaign, location] = await Promise.all([
        services.campaign.getCampaign(campaignId),
        services.location.getLocation(locationId),
      ])

      const owner = campaign.game_master_id === user.id
      setIsOwner(owner)

      if (location.location_type !== "dungeon") {
        setError("Esta ubicación no es de tipo dungeon")
      }
    } catch (err: any) {
      console.error("Error loading data:", err)
      setError(err?.message || "Error al cargar los datos")
    } finally {
      setIsLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user) {
      setError("Debes estar autenticado para crear dungeons")
      return
    }

    setIsSaving(true)
    setError(null)
    try {
      const newDungeon = await services.dungeon.createDungeon(
        locationId,
        {
          location_id: locationId,
          recommended_level: recommendedLevel ? parseInt(recommendedLevel) : null,
          difficulty_level: difficultyLevel || null,
          is_cleared: false,
          map_data: null,
        },
        user.id
      )

      router.push(`/campaigns/${campaignId}/locations/${locationId}/dungeon`)
    } catch (err: any) {
      console.error("Error creating dungeon:", err)
      setError(err?.message || "Error al crear la mazmorra")
    } finally {
      setIsSaving(false)
    }
  }

  const handleCancel = () => {
    router.push(`/campaigns/${campaignId}/locations/${locationId}`)
  }

  const getDifficultyLabel = (level: string) => {
    return t.marketplace?.difficultyLevels?.[level as keyof typeof t.marketplace.difficultyLevels] || level
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
          Volver a Ubicación
        </Button>
        <EmptyState icon={Skull} title="Acceso Denegado" description="Solo el Game Master puede crear dungeons" />
      </div>
    )
  }

  return (
    <div className="w-full max-w-3xl mx-auto space-y-4 md:space-y-6">
      <Button variant="ghost" onClick={handleCancel} className="text-sm md:text-base">
        <ArrowLeft className="w-4 h-4 mr-2" />
        Volver a Ubicación
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
            {t.marketplace?.dungeons?.description || "Crea una nueva mazmorra para esta ubicación"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="recommended_level">{t.marketplace?.dungeons?.recommendedLevel || "Nivel Recomendado"}</Label>
              <Input
                id="recommended_level"
                type="number"
                min="1"
                max="20"
                value={recommendedLevel}
                onChange={(e) => setRecommendedLevel(e.target.value)}
                placeholder="Ej: 5"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="difficulty_level">{t.marketplace?.dungeons?.difficultyLevel || "Nivel de Dificultad"}</Label>
              <Select value={difficultyLevel} onValueChange={setDifficultyLevel}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecciona un nivel de dificultad" />
                </SelectTrigger>
                <SelectContent>
                  {DIFFICULTY_LEVEL_OPTIONS.map((level) => (
                    <SelectItem key={level} value={level}>
                      {getDifficultyLabel(level)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {selectedDifficultyInfo && selectedDifficultyInfo.description && (
                <Alert>
                  <Info className="w-4 h-4" />
                  <AlertDescription className="space-y-2">
                    <p className="text-sm">{selectedDifficultyInfo.description}</p>
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

            <div className="flex gap-2 justify-end">
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
                disabled={isSaving}
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

