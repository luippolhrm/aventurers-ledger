"use client"

import type React from "react"
import { createContext, useContext, useState, useEffect } from "react"
import { type Language, translations } from "@/lib/translations"

function getBrowserLanguage(): Language {
  if (typeof window === "undefined") return "en"

  const browserLang = navigator.language.toLowerCase()

  if (browserLang.startsWith("es")) return "es"
  if (browserLang.startsWith("fr")) return "fr"
  if (browserLang.startsWith("pt")) return "pt"

  return "en"
}

interface LanguageContextType {
  language: Language
  setLanguage: (lang: Language) => void
  t: (typeof translations)[Language]
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined)

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguage] = useState<Language>("en")

  useEffect(() => {
    setLanguage(getBrowserLanguage())
  }, [])

  const t = translations[language]

  return <LanguageContext.Provider value={{ language, setLanguage, t }}>{children}</LanguageContext.Provider>
}

export function useLanguage() {
  const context = useContext(LanguageContext)
  if (context === undefined) {
    throw new Error("useLanguage must be used within a LanguageProvider")
  }
  return context
}
