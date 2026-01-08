"use client"

import { cn } from "@/lib/utils"
import { Coins, Menu, X, Users, Home, DollarSign, Package, Map, Settings, User, Store } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useState } from "react"
import { useLanguage } from "@/lib/language-context"

interface SidebarProps {
  activeModule: string
  onModuleChange: (module: string) => void
  language?: "es" // Mantener por compatibilidad, pero ya no se usa
  includeProfileSettings?: boolean
}

export function Sidebar({ activeModule, onModuleChange, language, includeProfileSettings = false }: SidebarProps) {
  const [isMobileOpen, setIsMobileOpen] = useState(false)
  const { t } = useLanguage()

  const mainModules = [
    {
      id: "welcome",
      name: t.sidebar.welcome,
      icon: Home,
    },
    {
      id: "characters",
      name: t.sidebar.characters,
      icon: Users,
    },
    {
      id: "campaigns",
      name: t.sidebar.campaigns,
      icon: Map,
    },
    {
      id: "currency-converter",
      name: t.sidebar.currencyConverter,
      icon: Coins,
    },
  ]

  const allModules = includeProfileSettings
    ? [
        ...mainModules,
        {
          id: "profile",
          name: t.userMenu.profile,
          icon: User,
        },
        {
          id: "settings",
          name: t.userMenu.settings,
          icon: Settings,
        },
      ]
    : mainModules

  const SidebarContent = () => (
    <div className="flex flex-col h-full">
      <div className="p-6 border-b border-border">
        <h2 className="text-xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
          {t.sidebar.title}
        </h2>
      </div>

      <nav className="flex-1 p-4">
        <ul className="space-y-2">
          {allModules.map((module) => {
            const Icon = module.icon
            return (
              <li key={module.id}>
                <button
                  onClick={() => {
                    onModuleChange(module.id)
                    setIsMobileOpen(false)
                  }}
                  className={cn(
                    "w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors text-left",
                    activeModule === module.id
                      ? "bg-primary text-primary-foreground"
                      : "hover:bg-accent hover:text-accent-foreground",
                  )}
                >
                  <Icon className="w-5 h-5" />
                  <span className="font-medium">{module.name}</span>
                </button>
              </li>
            )
          })}
        </ul>

        {!includeProfileSettings && (
          <div className="mt-8 p-4 bg-muted rounded-lg">
            <p className="text-sm text-muted-foreground text-center">{t.sidebar.comingSoon}</p>
          </div>
        )}
      </nav>
    </div>
  )

  return (
    <>
      {/* Mobile menu button */}
      <Button
        variant="outline"
        size="icon"
        className="fixed top-4 left-4 z-50 md:hidden bg-transparent"
        onClick={() => setIsMobileOpen(!isMobileOpen)}
      >
        {isMobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
      </Button>

      {/* Mobile sidebar overlay */}
      {isMobileOpen && (
        <div className="fixed inset-0 bg-black/50 z-40 md:hidden" onClick={() => setIsMobileOpen(false)} />
      )}

      {/* Mobile sidebar */}
      <aside
        className={cn(
          "fixed top-0 left-0 h-full w-64 bg-background border-r border-border z-40 transition-transform md:hidden",
          isMobileOpen ? "translate-x-0" : "-translate-x-full",
        )}
      >
        <SidebarContent />
      </aside>

      {/* Desktop sidebar */}
      <aside className="hidden md:block w-64 bg-background border-r border-border">
        <SidebarContent />
      </aside>
    </>
  )
}
