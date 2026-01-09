"use client"

import { useLanguage } from "@/lib/language-context"
import { CharactersUnified } from "@/components/characters-unified"
import { usePageTitle } from "@/hooks/use-page-title"

export default function CharactersPage() {
  const { language } = useLanguage()
  usePageTitle()

  return <CharactersUnified language={language} />
}

