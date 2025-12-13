"use client"

import type { ReactNode } from "react"
import { useRouter, usePathname } from "next/navigation"
import { Sidebar } from "@/components/sidebar"
import { CharacterSelector } from "@/components/character-selector"
import { UserMenu } from "@/components/user-menu"
import { useLanguage } from "@/lib/language-context"

interface AppLayoutProps {
  children: ReactNode
}

export function AppLayout({ children }: AppLayoutProps) {
  const { language, t } = useLanguage()
  const router = useRouter()
  const pathname = usePathname()

  const getActiveModule = () => {
    if (pathname?.includes("/profile")) return "profile"
    if (pathname?.includes("/settings")) return "settings"
    return "welcome"
  }

  const handleModuleChange = (module: string) => {
    const routes: Record<string, string> = {
      welcome: "/dashboard",
      characters: "/dashboard",
      finances: "/dashboard",
      inventory: "/dashboard",
      "currency-converter": "/dashboard",
      profile: "/profile",
      settings: "/settings",
    }

    const route = routes[module]
    if (route) {
      router.push(route)
    }
  }

  return (
    <div className="min-h-screen flex">
      <Sidebar activeModule={getActiveModule()} onModuleChange={handleModuleChange} language={language} />

      <div className="flex-1 flex flex-col">
        <header className="py-6 px-4 md:px-8 text-center border-b border-border relative">
          <div className="absolute top-4 right-4 flex items-center gap-3">
            <CharacterSelector language={language} onNavigateToCharacters={() => handleModuleChange("characters")} />
            <UserMenu />
          </div>

          <h1 className="text-2xl md:text-3xl font-bold text-balance mb-2 text-foreground">{t.header.title}</h1>
          <p className="text-sm md:text-base text-muted-foreground">{t.header.subtitle}</p>
        </header>

        <main className="flex-1 p-4 md:p-8 overflow-auto">{children}</main>

        <footer className="py-6 px-4 text-center text-sm text-muted-foreground border-t border-border">
          <p>{t.footer.text}</p>
        </footer>
      </div>
    </div>
  )
}
