"use client"

import { use } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { ArrowLeft } from "lucide-react"
import { CharacterNotesPanel } from "@/components/features/character/character-notes-panel"

export default function CharacterHistoryPage({ 
  params 
}: { 
  params: Promise<{ characterId: string }> 
}) {
  const { characterId } = use(params)
  const router = useRouter()

  return (
    <div className="w-full max-w-7xl mx-auto space-y-6 p-4 md:p-6">
      <Button
        variant="ghost"
        onClick={() => router.push(`/characters/${characterId}`)}
      >
        <ArrowLeft className="w-4 h-4 mr-2" />
        Volver al Hub
      </Button>

      <CharacterNotesPanel characterId={characterId} />
    </div>
  )
}
