"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Edit } from "lucide-react"
import type { Location } from "@/lib/infrastructure/repositories/location-repository"

interface LocationCardProps {
  location: Location
  isSelected: boolean
  language?: "es" // Mantener por compatibilidad, pero ya no se usa
  onClick: () => void
  getLocationTypeLabel: (type: string) => string
  onEdit?: () => void
}

const getLocationTypeBadgeColor = (locationType: string | null): string => {
  if (locationType === "dungeon") {
    return "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200"
  }
  return "bg-primary/10 text-primary"
}

export function LocationCard({
  location,
  isSelected,
  language,
  onClick,
  getLocationTypeLabel,
  onEdit,
}: LocationCardProps) {
  return (
    <Card
      className={`transition-shadow cursor-pointer ${
        isSelected ? "border-2 border-primary" : "border"
      }`}
      onClick={onClick}
    >
      <CardHeader>
        <div className="flex justify-between items-start">
          <div className="flex-1">
            <CardTitle className="text-base md:text-lg">{location.name}</CardTitle>
            <CardDescription className="text-xs md:text-sm">{location.description}</CardDescription>
            {location.location_type && (
              <span
                className={`inline-block mt-2 text-xs px-2 py-1 rounded-full uppercase ${getLocationTypeBadgeColor(location.location_type)}`}
              >
                {getLocationTypeLabel(location.location_type)}
              </span>
            )}
          </div>
          {onEdit && (
            <Button
              size="icon"
              variant="ghost"
              className="h-8 w-8"
              onClick={(e) => {
                e.stopPropagation()
                onEdit()
              }}
            >
              <Edit className="w-4 h-4" />
            </Button>
          )}
        </div>
      </CardHeader>
    </Card>
  )
}

