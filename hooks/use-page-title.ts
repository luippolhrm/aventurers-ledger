"use client"

import { useEffect } from "react"
import { usePathname } from "next/navigation"
import { getFullPageTitle } from "@/lib/page-titles"

/**
 * Hook para actualizar el título de la página dinámicamente
 */
export function usePageTitle() {
  const pathname = usePathname()

  useEffect(() => {
    const fullTitle = getFullPageTitle(pathname)
    document.title = fullTitle
  }, [pathname])
}
