"use client"

import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { MapPin, Users, CheckCircle2, Circle, Skull } from "lucide-react"
import { useLanguage } from "@/lib/language-context"

interface MapNpcsSummaryProps {
  locationsCount: number
  npcsCount: number
  assignedNpcsCount: number
  unassignedNpcsCount: number
  dungeonsCount?: number
}

export function MapNpcsSummary({
  locationsCount,
  npcsCount,
  assignedNpcsCount,
  unassignedNpcsCount,
  dungeonsCount = 0,
}: MapNpcsSummaryProps) {
  const { t } = useLanguage()

  return (
    <Card>
      <CardContent className="pt-6">
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
          <div className="flex items-center gap-2">
            <MapPin className="w-4 h-4 text-muted-foreground" />
            <div>
              <p className="text-sm font-medium">{locationsCount}</p>
              <p className="text-xs text-muted-foreground">
                Ubicaciones
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Users className="w-4 h-4 text-muted-foreground" />
            <div>
              <p className="text-sm font-medium">{npcsCount}</p>
              <p className="text-xs text-muted-foreground">
                {t.marketplace?.npcs?.title || "NPCs"}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-green-600" />
            <div>
              <p className="text-sm font-medium">{assignedNpcsCount}</p>
              <p className="text-xs text-muted-foreground">
                {t.marketplace?.npcs?.assigned || "Asignados"}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Circle className="w-4 h-4 text-muted-foreground" />
            <div>
              <p className="text-sm font-medium">{unassignedNpcsCount}</p>
              <p className="text-xs text-muted-foreground">
                {t.marketplace?.npcs?.unassigned || "Sin asignar"}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Skull className="w-4 h-4 text-purple-600" />
            <div>
              <p className="text-sm font-medium">{dungeonsCount}</p>
              <p className="text-xs text-muted-foreground">
                Mazmorras
              </p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

