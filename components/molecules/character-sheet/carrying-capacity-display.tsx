"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useLanguage } from "@/lib/language-context"
import { cn } from "@/lib/utils"
import { Package } from "lucide-react"

interface CarryingCapacityDisplayProps {
  currentWeight: number
  maxCapacity: number
  language: "es" // Siempre español ahora
  className?: string
}

export function CarryingCapacityDisplay({
  currentWeight,
  maxCapacity,
  language,
  className,
}: CarryingCapacityDisplayProps) {
  const { t } = useLanguage()

  const percentage = maxCapacity > 0 ? (currentWeight / maxCapacity) * 100 : 0

  // Determinar estado y color
  let status: "light" | "medium" | "heavy" | "overloaded"
  let colorClass: string

  if (percentage < 50) {
    status = "light"
    colorClass = "bg-green-500"
  } else if (percentage < 75) {
    status = "medium"
    colorClass = "bg-yellow-500"
  } else if (percentage <= 100) {
    status = "heavy"
    colorClass = "bg-orange-500"
  } else {
    status = "overloaded"
    colorClass = "bg-red-500"
  }

  const statusText = t.character.capacityStatus?.[status] || status

  return (
    <Card className={cn(className)}>
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2">
          <Package className="w-4 h-4" />
          {t.character.carryingCapacity}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">{t.character.currentWeight}</span>
          <span className="font-medium">
            {currentWeight.toFixed(1)} lbs / {maxCapacity} lbs
          </span>
        </div>

        {/* Barra de progreso */}
        <div className="w-full bg-muted rounded-full h-3 overflow-hidden">
          <div
            className={cn("h-full transition-all duration-300", colorClass)}
            style={{ width: `${Math.min(percentage, 100)}%` }}
          />
        </div>

        {/* Estado */}
        <div className="flex items-center justify-between text-xs">
          <span className={cn("font-medium", status === "overloaded" && "text-destructive")}>
            {statusText}
          </span>
          <span className="text-muted-foreground">{percentage.toFixed(1)}%</span>
        </div>

        {status === "overloaded" && (
          <p className="text-xs text-destructive font-medium">
            El personaje está sobrecargado y su velocidad se reduce a 5 pies
          </p>
        )}
      </CardContent>
    </Card>
  )
}

