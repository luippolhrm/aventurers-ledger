"use client"

import type React from "react"
import { createContext, useContext } from "react"
import { texts } from "@/lib/texts"

/** Idiomas soportados. Por ahora la app es solo español. */
export type Language = "es"

interface LanguageContextType {
  t: typeof texts
  language: Language
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined)

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  return <LanguageContext.Provider value={{ t: texts, language: "es" }}>{children}</LanguageContext.Provider>
}

export function useLanguage() {
  const context = useContext(LanguageContext)
  if (context === undefined) {
    throw new Error("useLanguage must be used within a LanguageProvider")
  }
  return context
}
