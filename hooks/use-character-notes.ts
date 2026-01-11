import { useState, useEffect } from "react"
import { useServices } from "@/hooks/use-services"
import type { Character } from "@/lib/infrastructure/repositories/character-repository"

export interface UseCharacterNotesResult {
  character: Character | null
  notes: string | null
  loading: boolean
  error: string | null
}

/**
 * Hook para manejar la lógica de carga de datos del character para las notas
 * Separa la lógica de datos de la presentación
 * 
 * @param characterId - ID del personaje
 * @param character - Character opcional: si ya está cargado, evita fetch duplicado
 * @returns Objeto con character, notes, loading y error
 */
export function useCharacterNotes(
  characterId: string,
  character?: Character | null
): UseCharacterNotesResult {
  const services = useServices()
  const [characterData, setCharacterData] = useState<Character | null>(character || null)
  const [loading, setLoading] = useState(!character)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    // Si character ya está proporcionado, no hacer fetch
    if (character) {
      setCharacterData(character)
      setLoading(false)
      setError(null)
      return
    }

    // Si no hay character, hacer fetch
    if (characterId) {
      loadCharacter()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [characterId])

  // Actualizar cuando character prop cambia
  useEffect(() => {
    if (character) {
      setCharacterData(character)
      setLoading(false)
      setError(null)
    }
  }, [character])

  const loadCharacter = async () => {
    setLoading(true)
    setError(null)
    try {
      const data = await services.character.getCharacter(characterId)
      setCharacterData(data)
    } catch (err: any) {
      console.error("Error loading character for notes:", err)
      setError(err.message || "Error al cargar el personaje")
    } finally {
      setLoading(false)
    }
  }

  return {
    character: characterData,
    notes: characterData?.preparation_notes || null,
    loading,
    error,
  }
}
