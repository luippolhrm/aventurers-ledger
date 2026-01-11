"use client"

import { useCharacterNotes } from "@/hooks/use-character-notes"
import { CharacterNotesDisplay } from "@/components/organisms/character-sheet/character-notes-display"
import type { Character } from "@/lib/infrastructure/repositories/character-repository"

interface CharacterNotesPanelProps {
  characterId: string
  character?: Character | null
  className?: string
}

/**
 * Componente contenedor que combina hook (lógica de datos) + display (presentación)
 * Patrón Container/Presentational para separación de responsabilidades
 */
export function CharacterNotesPanel({ 
  characterId, 
  character,
  className 
}: CharacterNotesPanelProps) {
  const { notes, loading, error } = useCharacterNotes(characterId, character)
  
  return (
    <CharacterNotesDisplay
      characterId={characterId}
      notes={notes}
      loading={loading}
      error={error}
      className={className}
    />
  )
}
