"use client"

import { useState } from "react"
import { CurrencyExchangeCard } from "@/components/currency-exchange-card"
import { CharactersUnified } from "@/components/characters-unified"
import { WelcomeDashboard } from "@/components/welcome-dashboard"
import { CharacterSelector } from "@/components/character-selector"
import { LanguageSelector } from "@/components/language-selector"
import { UserMenu } from "@/components/user-menu"
import { Sidebar } from "@/components/sidebar"
import { Finances } from "@/components/finances"
import { Inventory } from "@/components/inventory"
import { useLanguage } from "@/lib/language-context"

export function MainLayout() {
  const [activeModule, setActiveModule] = useState("welcome")
  const { language, setLanguage, t } = useLanguage()

  return (
    <div className="min-h-screen flex">
      <Sidebar activeModule={activeModule} onModuleChange={setActiveModule} language={language} />

      <div className="flex-1 flex flex-col">
        <header className="py-6 px-4 md:px-8 text-center border-b border-border relative">
          <div className="absolute top-4 right-4 flex items-center gap-3">
            <CharacterSelector language={language} onNavigateToCharacters={() => setActiveModule("characters")} />
            <LanguageSelector language={language} onLanguageChange={setLanguage} />
            <UserMenu />
          </div>

          <h1 className="text-2xl md:text-3xl font-bold text-balance mb-2 text-foreground">{t.header.title}</h1>
          <p className="text-sm md:text-base text-muted-foreground">{t.header.subtitle}</p>
        </header>

        <main className="flex-1 flex items-center justify-center p-4 md:p-8">
          {activeModule === "welcome" && <WelcomeDashboard language={language} onNavigate={setActiveModule} />}
          {activeModule === "characters" && <CharactersUnified language={language} />}
          {activeModule === "currency-converter" && <CurrencyExchangeCard language={language} />}
          {activeModule === "finances" && <Finances language={language} />}
          {activeModule === "inventory" && <Inventory language={language} />}
        </main>

        <footer className="py-6 px-4 text-center text-sm text-muted-foreground border-t border-border">
          <p>{t.footer.text}</p>
        </footer>
      </div>
    </div>
  )
}
