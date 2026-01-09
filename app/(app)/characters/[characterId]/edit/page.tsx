"use client"

import { use } from "react"
import { CharacterManagementView } from "@/components/features/character"

export default function EditCharacterPage({ params }: { params: Promise<{ characterId: string }> }) {
  const { characterId } = use(params)

  return <CharacterManagementView characterId={characterId} />
}

