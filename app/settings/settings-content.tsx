"use client"

import { useLanguage } from "@/lib/language-context"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

export default function SettingsPageContent() {
  const { t } = useLanguage()

  return (
    <div className="w-full max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">{t.userMenu.settings}</h1>

      <div className="grid gap-6">
        {/* Future Settings Placeholder */}
        <Card>
          <CardHeader>
            <CardTitle>{t.settings?.additionalSettings || "Configuración Adicional"}</CardTitle>
            <CardDescription>{t.settings?.comingSoon || "Más opciones de personalización próximamente"}</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              {t.settings?.futureSettings ||
                "Configuraciones futuras como preferencias de tema, notificaciones y valores predeterminados de campaña aparecerán aquí."}
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
