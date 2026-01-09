"use client"

import { useState, useEffect, useCallback } from "react"
import { useRouter } from "next/navigation"
import { DashboardOverview } from "@/components/dashboard-overview"
import { CurrencyExchangeCard } from "@/components/currency-exchange-card"
import { CharactersUnified } from "@/components/characters-unified"
import { Campaigns } from "@/components/campaigns"
import { useLanguage } from "@/lib/language-context"
import { usePageTitle } from "@/hooks/use-page-title"

export default function DashboardPage() {
  const { language } = useLanguage()
  const router = useRouter()
  usePageTitle()
  
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
    <>
      {activeModule === "welcome" && <DashboardOverview language={language} onNavigate={setActiveModule} />}
      {activeModule === "campaigns" && <Campaigns language={language} />}
      {activeModule === "characters" && <CharactersUnified language={language} />}
      {activeModule === "currency-converter" && <CurrencyExchangeCard language={language} />}
    </>
  )
}
