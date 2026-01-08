"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { LocationsMapContent } from "@/components/organisms/world"
import { useLanguage } from "@/lib/language-context"
import { MapPin } from "lucide-react"

interface LocationsMapProps {
  language?: "es" // Mantener por compatibilidad, pero ya no se usa
  campaignId?: string // Opcional: si se proporciona, filtrar por esta campaña
}

/**
 * Wrapper legacy para LocationsMapContent
 * Mantiene compatibilidad con usos existentes que esperan el Card externo
 * Para uso integrado en tabs, usar LocationsMapContent directamente
 */
export function LocationsMap({ language, campaignId }: LocationsMapProps) {
  const { t } = useLanguage()
  
  return (
    <Card className="w-full max-w-6xl">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MapPin className="w-6 h-6" />
          {t.marketplace?.mapTitle || t.sidebar.map || "Mapa"}
        </CardTitle>
        <CardDescription>
          {t.marketplace?.mapDescription || "Visualiza las ubicaciones y conecta tus tiendas."}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <LocationsMapContent language={language} campaignId={campaignId} />
      </CardContent>
    </Card>
  )
}
