"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import type { Location } from "@/lib/infrastructure/repositories/location-repository"

interface LocationCardProps {
  location: Location
  isSelected: boolean
  language?: "es" // Mantener por compatibilidad, pero ya no se usa
  onClick: () => void
  getLocationTypeLabel: (type: string) => string
}

export function LocationCard({
  location,
  isSelected,
  language,
  onClick,
  getLocationTypeLabel,
}: LocationCardProps) {
  return (
    <Card
      className={`transition-shadow cursor-pointer ${
        isSelected ? "border-2 border-primary" : "border"
      }`}
      onClick={onClick}
    >
      <CardHeader>
        <CardTitle className="text-base md:text-lg">{location.name}</CardTitle>
        <CardDescription className="text-xs md:text-sm">{location.description}</CardDescription>
        {location.location_type && (
          <span className="inline-block mt-2 text-xs px-2 py-1 rounded-full bg-primary/10 text-primary uppercase">
            {getLocationTypeLabel(location.location_type)}
          </span>
        )}
      </CardHeader>
    </Card>
  )
}

