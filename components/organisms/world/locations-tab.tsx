"use client"

import { Card, CardContent } from "@/components/ui/card"
import { EmptyState } from "@/components/molecules/empty"
import { LocationCard } from "@/components/molecules/world/location-card"
import type { Location } from "@/lib/infrastructure/repositories/location-repository"
import { MapPin } from "lucide-react"
import { useLanguage } from "@/lib/language-context"

interface LocationsTabProps {
  locations: Location[]
  selectedLocationId: string
  language?: "es" // Mantener por compatibilidad, pero ya no se usa
  onLocationSelect: (locationId: string) => void
  getLocationTypeLabel: (type: string) => string
}

export function LocationsTab({
  locations,
  selectedLocationId,
  language,
  onLocationSelect,
  getLocationTypeLabel,
}: LocationsTabProps) {
  const { t } = useLanguage()

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-base md:text-lg font-semibold flex items-center gap-2">
          <MapPin className="w-4 h-4 md:w-5 md:h-5" />
          {t.marketplace?.yourLocations || "Ubicaciones"}
        </h3>
      </div>
      {locations.length === 0 ? (
        <EmptyState
          icon={MapPin}
          title={t.marketplace?.emptyLocations || "No hay ubicaciones"}
          description={t.marketplace?.emptyLocations || "No hay ubicaciones disponibles."}
        />
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {locations.map((location) => (
            <LocationCard
              key={location.id}
              location={location}
              isSelected={selectedLocationId === location.id}
              language={language}
              onClick={() => onLocationSelect(location.id)}
              getLocationTypeLabel={getLocationTypeLabel}
            />
          ))}
        </div>
      )}
    </div>
  )
}

