"use client"

import { use } from "react"
import { CharacterManagementView } from "@/components/features/character"
import { useLanguage } from "@/lib/language-context"
import { Sidebar } from "@/components/sidebar"
import { UserMenu } from "@/components/user-menu"
import { usePathname } from "next/navigation"

export default function EditCharacterPage({ params }: { params: Promise<{ characterId: string }> }) {
  const { characterId } = use(params)
  const { t } = useLanguage()
  const pathname = usePathname()

  const getActiveModule = () => {
    if (pathname?.includes("/characters")) return "characters"
    return "welcome"
  }

  const handleModuleChange = (module: string) => {
    if (module === "profile") {
      window.location.href = "/profile"
      return
    }
    if (module === "settings") {
      window.location.href = "/settings"
      return
    }
    window.location.href = "/dashboard" + (module !== "welcome" ? `?module=${module}` : "")
  }

  return (
    <div className="min-h-screen flex">
      <Sidebar
        activeModule={getActiveModule()}
        onModuleChange={handleModuleChange}
        language="es"
        includeProfileSettings={false}
      />

      <div className="flex-1 flex flex-col">
        <header className="py-6 px-4 md:px-8 text-center border-b border-border relative">
          <div className="absolute top-4 right-4 flex items-center gap-3">
            <UserMenu />
          </div>

          <h1 className="text-2xl md:text-3xl font-bold text-balance mb-2 text-foreground">{t.header.title}</h1>
          <p className="text-sm md:text-base text-muted-foreground">{t.header.subtitle}</p>
        </header>

        <main className="flex-1 p-4 md:p-6 lg:p-8 overflow-auto">
          <CharacterManagementView characterId={characterId} />
        </main>

        <footer className="py-6 px-4 text-center text-sm text-muted-foreground border-t border-border">
          <p>{t.footer.text}</p>
        </footer>
      </div>
    </div>
  )
}

