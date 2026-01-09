"use client"

import { use } from "react"
import { CharacterSheetView } from "@/components/features/character/character-sheet-view"
import { useLanguage } from "@/lib/language-context"

export default function CharacterSheetPage({ params }: { params: Promise<{ characterId: string }> }) {
  const { characterId } = use(params)
  const { language } = useLanguage()

  return <CharacterSheetView characterId={characterId} language={language} />
}

