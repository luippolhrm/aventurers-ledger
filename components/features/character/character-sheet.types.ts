import type { Character } from "@/lib/infrastructure/repositories/character-repository"

export type CharacterSheetSection = "basic" | "ability_scores" | "background" | "notes"

export interface CharacterSheetFormData extends Partial<Character> {
  // Todos los campos de Character ya están incluidos
}

export interface CharacterSheetFormErrors {
  [key: string]: string
}

