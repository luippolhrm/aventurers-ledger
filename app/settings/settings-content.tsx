"use client"

import { useLanguage } from "@/lib/language-context"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { LanguageSelector } from "@/components/language-selector"

export default function SettingsPageContent() {
  const { t, language, setLanguage } = useLanguage()

  return (
    <div className="w-full max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">{t.userMenu.settings}</h1>

      <div className="grid gap-6">
        {/* Language Settings Card */}
        <Card>
          <CardHeader>
            <CardTitle>{t.settings?.languagePreferences || "Language Preferences"}</CardTitle>
            <CardDescription>
              {t.settings?.chooseLanguage || "Choose your preferred language for the interface"}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-2">
              <Label>{t.settings?.interfaceLanguage || "Interface Language"}</Label>
              <LanguageSelector language={language} onLanguageChange={setLanguage} />
            </div>
          </CardContent>
        </Card>

        {/* Future Settings Placeholder */}
        <Card>
          <CardHeader>
            <CardTitle>{t.settings?.additionalSettings || "Additional Settings"}</CardTitle>
            <CardDescription>{t.settings?.comingSoon || "More customization options coming soon"}</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              {t.settings?.futureSettings ||
                "Future settings like theme preferences, notifications, and campaign defaults will appear here."}
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
