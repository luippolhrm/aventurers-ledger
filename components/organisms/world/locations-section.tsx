"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { Button } from "@/components/ui/button"
import { EmptyState } from "@/components/molecules/empty"
import { LocationCard } from "@/components/molecules/world/location-card"
import type { Location } from "@/lib/infrastructure/repositories/location-repository"
import { MapPin, Plus } from "lucide-react"
import { useLanguage } from "@/lib/language-context"
import { useRouter } from "next/navigation"

interface LocationsSectionProps {
  locations: Location[]
  selectedLocationId: string
  language?: "es" // Mantener por compatibilidad, pero ya no se usa
  onLocationSelect: (locationId: string) => void
  getLocationTypeLabel: (type: string) => string
  campaignId: string
  isOwner: boolean
}

export function LocationsSection({
  locations,
  selectedLocationId,
  language,
  onLocationSelect,
  getLocationTypeLabel,
  campaignId,
  isOwner,
}: LocationsSectionProps) {
  const { t } = useLanguage()
  const router = useRouter()

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div className="space-y-1 flex-1 min-w-0">
            <CardTitle className="flex items-center gap-2">
              <MapPin className="w-5 h-5" />
              {t.marketplace?.yourLocations || "Ubicaciones"} ({locations.length})
            </CardTitle>
            <CardDescription>
              {t.marketplace?.locationsDescription || "Gestiona las ubicaciones de tu campaña"}
            </CardDescription>
          </div>
          {isOwner && (
            <Button
              onClick={() => router.push(`/campaigns/${campaignId}/locations/new`)}
              className="shrink-0"
            >
              <Plus className="w-4 h-4 mr-2" />
              <span className="hidden sm:inline">{t.marketplace?.createLocation || "Crear Ubicación"}</span>
              <span className="sm:hidden">Crear</span>
            </Button>
          )}
        </div>
      </CardHeader>
      <Separator />
      <CardContent className="pt-6">
        {locations.length === 0 ? (
          <EmptyState
            icon={MapPin}
            title={t.marketplace?.emptyLocations || "No hay ubicaciones"}
            description={`No hay ubicaciones creadas aún. ${isOwner ? 'Crea la primera ubicación para comenzar a construir tu mundo.' : ''}`}
          >
            {isOwner && (
              <Button
                onClick={() => router.push(`/campaigns/${campaignId}/locations/new`)}
                className="mt-4"
              >
                <Plus className="w-4 h-4 mr-2" />
                {t.marketplace?.createFirstLocation || "Crear Primera Ubicación"}
              </Button>
            )}
          </EmptyState>
        ) : (
          <div className="grid gap-4 sm:grid-cols-1 md:grid-cols-2 xl:grid-cols-3">
            {locations.map((location) => (
              <LocationCard
                key={location.id}
                location={location}
                isSelected={selectedLocationId === location.id}
                language={language}
                onClick={() => onLocationSelect(location.id)}
                getLocationTypeLabel={getLocationTypeLabel}
                onEdit={isOwner ? () => router.push(`/campaigns/${campaignId}/locations/${location.id}`) : undefined}
              />
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}

