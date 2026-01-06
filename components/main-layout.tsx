"use client"

import { useState, useEffect, useCallback } from "react"
import { useRouter } from "next/navigation"
import { DashboardOverview } from "@/components/dashboard-overview"
import { CurrencyExchangeCard } from "@/components/currency-exchange-card"
import { CharactersUnified } from "@/components/characters-unified"
import { UserMenu } from "@/components/user-menu"
import { Sidebar } from "@/components/sidebar"
import { Campaigns } from "@/components/campaigns"
import { useLanguage } from "@/lib/language-context"

export function MainLayout() {
  const { language, t } = useLanguage()
  const router = useRouter()
  
  // Inicializar con valor fijo para evitar error de hidratación
  // El query parameter se leerá después de la hidratación en useEffect
  const [activeModule, setActiveModule] = useState("welcome")
  
  // Función para actualizar el módulo y la URL
  const handleModuleChange = useCallback((module: string) => {
    setActiveModule(module)
    // Actualizar la URL para reflejar el cambio
    // Si es "welcome", remover el query parameter; si no, agregarlo/actualizarlo
    if (module === "welcome") {
      router.push("/dashboard")
    } else {
      router.push(`/dashboard?module=${module}`)
    }
  }, [router])
  
  // Leer el módulo del query parameter cuando cambia la URL (navegación)
  useEffect(() => {
    // Solo ejecutar en el cliente
    if (typeof window === "undefined") return
    
    const getModuleFromUrl = () => {
      const urlParams = new URLSearchParams(window.location.search)
      return urlParams.get("module") || "welcome"
    }
    
    // Verificar inmediatamente después de la hidratación
    const moduleFromUrl = getModuleFromUrl()
    setActiveModule(moduleFromUrl)
    
    // Escuchar cambios en la URL del navegador (botón back/forward)
    const handlePopState = () => {
      const moduleFromUrl = getModuleFromUrl()
      setActiveModule(moduleFromUrl)
    }
    window.addEventListener("popstate", handlePopState)
    
    // Verificar periódicamente para capturar cambios programáticos de Next.js
    // (router.push no dispara popstate, así que necesitamos verificar periódicamente)
    // Solo actualizar si la URL realmente cambió y el módulo es diferente
    let lastSearch = window.location.search
    const interval = setInterval(() => {
      const currentSearch = window.location.search
      if (currentSearch !== lastSearch) {
        lastSearch = currentSearch
        const moduleFromUrl = getModuleFromUrl()
        setActiveModule((prevModule) => {
          // Solo actualizar si el módulo de la URL es diferente al actual
          return moduleFromUrl !== prevModule ? moduleFromUrl : prevModule
        })
      }
    }, 100)
    
    return () => {
      window.removeEventListener("popstate", handlePopState)
      clearInterval(interval)
    }
  }, []) // Sin dependencias - solo se ejecuta una vez al montar

  return (
    <div className="min-h-screen flex">
      <Sidebar activeModule={activeModule} onModuleChange={handleModuleChange} language={language} />

      <div className="flex-1 flex flex-col">
        <header className="py-6 px-4 md:px-8 text-center border-b border-border relative">
          <div className="absolute top-4 right-4 flex items-center gap-3">
            <UserMenu />
          </div>

          <h1 className="text-2xl md:text-3xl font-bold text-balance mb-2 text-foreground">{t.header.title}</h1>
          <p className="text-sm md:text-base text-muted-foreground">{t.header.subtitle}</p>
        </header>

        <main className="flex-1 p-4 md:p-6 lg:p-8 overflow-auto">
          {activeModule === "welcome" && <DashboardOverview language={language} onNavigate={setActiveModule} />}
          {activeModule === "campaigns" && <Campaigns language={language} />}
          {activeModule === "characters" && <CharactersUnified language={language} />}
          {activeModule === "currency-converter" && <CurrencyExchangeCard language={language} />}
        </main>

        <footer className="py-6 px-4 text-center text-sm text-muted-foreground border-t border-border">
          <p>{t.footer.text}</p>
        </footer>
      </div>
    </div>
  )
}
