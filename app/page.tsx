"use client"

import { useState, useEffect } from "react"
import { CurrencyExchangeCard } from "@/components/currency-exchange-card"
import { WalletManager } from "@/components/wallet-manager"
import { CharactersList } from "@/components/characters-list"
import { WelcomeDashboard } from "@/components/welcome-dashboard"
import { LanguageSelector } from "@/components/language-selector"
import { CharacterSelector } from "@/components/character-selector"
import { Sidebar } from "@/components/sidebar"
import { Movements } from "@/components/movements"
import { ActiveCharacterProvider } from "@/lib/active-character-context"
import { type Language, translations } from "@/lib/translations"

function getBrowserLanguage(): Language {
  if (typeof window === "undefined") return "en"

  const browserLang = navigator.language.toLowerCase()

  if (browserLang.startsWith("es")) return "es"
  if (browserLang.startsWith("fr")) return "fr"
  if (browserLang.startsWith("pt")) return "pt"

  return "en"
}

function HomeContent() {
  const [language, setLanguage] = useState<Language>("en")
  const [activeModule, setActiveModule] = useState("welcome")

  useEffect(() => {
    setLanguage(getBrowserLanguage())
  }, [])

  const t = translations[language]

  return (
    <div className="min-h-screen flex">
      <Sidebar activeModule={activeModule} onModuleChange={setActiveModule} language={language} />

      <div className="flex-1 flex flex-col">
        <header className="py-6 px-4 md:px-8 text-center border-b border-border relative">
          <div className="absolute top-4 right-4 flex items-center gap-3">
            <CharacterSelector language={language} onNavigateToCharacters={() => setActiveModule("characters")} />
            <LanguageSelector language={language} onLanguageChange={setLanguage} />
          </div>

          <h1 className="text-2xl md:text-3xl font-bold text-balance mb-2 text-foreground">{t.header.title}</h1>
          <p className="text-sm md:text-base text-muted-foreground">{t.header.subtitle}</p>
        </header>

        <main className="flex-1 flex items-center justify-center p-4 md:p-8">
          {activeModule === "welcome" && <WelcomeDashboard language={language} onNavigate={setActiveModule} />}
          {activeModule === "characters" && <CharactersList language={language} />}
          {activeModule === "currency-converter" && <CurrencyExchangeCard language={language} />}
          {activeModule === "wallet" && <WalletManager language={language} />}
          {activeModule === "movements" && <Movements language={language} />}
        </main>

        <footer className="py-6 px-4 text-center text-sm text-muted-foreground border-t border-border">
          <p>{t.footer.text}</p>
        </footer>
      </div>
    </div>
  )
}

export default function Home() {
  return (
    <ActiveCharacterProvider>
      <HomeContent />
    </ActiveCharacterProvider>
  )
}
