"use client"

import { cn } from "@/lib/utils"
import { Coins, Menu, X, Users, Home, Map, Settings, User, LogOut } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useState } from "react"
import { useLanguage } from "@/lib/language-context"
import { useRouter, usePathname } from "next/navigation"
import { useServices } from "@/hooks/use-services"

interface SidebarProps {
  includeProfileSettings?: boolean
}

interface MenuItem {
  id: string
  name: string
  icon: any
  path?: string
  onClick?: () => void
  isDestructive?: boolean
}

export function Sidebar({ includeProfileSettings = false }: SidebarProps) {
  const [isMobileOpen, setIsMobileOpen] = useState(false)
  const { t } = useLanguage()
  const router = useRouter()
  const pathname = usePathname()
  const services = useServices()

  // Determinar módulo activo internamente
  const getActiveModule = () => {
    if (pathname?.includes("/characters")) return "characters"
    if (pathname?.includes("/campaigns")) return "campaigns"
    if (pathname?.includes("/currency")) return "currency-converter"
    if (pathname?.includes("/profile")) return "profile"
    if (pathname?.includes("/settings")) return "settings"
    return "welcome"
  }

  const activeModule = getActiveModule()

  const mainModules: MenuItem[] = [
    {
      id: "welcome",
      name: "Inicio",
      icon: Home,
      path: "/dashboard",
    },
    {
      id: "characters",
      name: "Aventureros",
      icon: Users,
      path: "/characters",
    },
    {
      id: "campaigns",
      name: "Campañas",
      icon: Map,
      path: "/campaigns",
    },
    {
      id: "currency-converter",
      name: "Conversor de Monedas",
      icon: Coins,
      path: "/currency-converter",
    },
  ]

  const handleLogout = async () => {
    try {
      await services.auth.signOut()
      router.push("/auth/login")
    } catch (error) {
      console.error("Error signing out:", error)
      // Redirect anyway
      router.push("/auth/login")
    }
    setIsMobileOpen(false)
  }

  const userSettingsModules: MenuItem[] = [
    {
      id: "profile",
      name: t.userMenu.profile,
      icon: User,
      path: "/profile",
    },
    {
      id: "settings",
      name: t.userMenu.settings,
      icon: Settings,
      path: "/settings",
    },
    {
      id: "logout",
      name: t.userMenu.logout,
      icon: LogOut,
      onClick: handleLogout,
      isDestructive: true,
    },
  ]

  const handleNavigation = (path: string) => {
    if (path.startsWith("/")) {
      router.push(path)
    }
    setIsMobileOpen(false)
  }

  const isPathActive = (path: string) => {
    if (path === "/dashboard") {
      return pathname === "/dashboard"
    }
    return pathname?.startsWith(path)
  }

  const renderMenuItem = (module: MenuItem) => {
    const Icon = module.icon
    const isActive = module.path ? (module.id === activeModule || isPathActive(module.path)) : false

    const handleClick = () => {
      if (module.onClick) {
        module.onClick()
      } else if (module.path) {
        handleNavigation(module.path)
      }
    }

    return (
      <li key={module.id}>
        <button
          onClick={handleClick}
          className={cn(
            "w-full flex items-center gap-3 px-4 py-2.5 rounded-lg transition-colors text-left",
            module.isDestructive
              ? "text-destructive hover:bg-destructive/10 hover:text-destructive"
              : isActive
              ? "bg-primary text-primary-foreground"
              : "hover:bg-accent hover:text-accent-foreground"
          )}
        >
          <Icon className="w-5 h-5 shrink-0" />
          <span className="font-medium">{module.name}</span>
        </button>
      </li>
    )
  }

  const SidebarContent = () => (
    <div className="flex flex-col h-full">
      {/* Módulos principales */}
      <nav className="flex-1 p-4 overflow-y-auto">
        <ul className="space-y-1">
          {mainModules.map(renderMenuItem)}
        </ul>
      </nav>

      {/* Sección de usuario en la parte inferior */}
      <div className="border-t border-border p-4">
        <ul className="space-y-1">
          {userSettingsModules.map(renderMenuItem)}
        </ul>
      </div>
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
          isMobileOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <SidebarContent />
      </aside>

      {/* Desktop sidebar - Fijo */}
      <aside className="hidden md:block fixed top-0 left-0 h-screen w-64 bg-background border-r border-border z-30">
        <SidebarContent />
      </aside>
    </>
  )
}
