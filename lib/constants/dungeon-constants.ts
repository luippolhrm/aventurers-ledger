/**
 * Constantes para dungeons
 * Basado en D&D 2024 DM's Guide
 */

export const ROOM_TYPE_OPTIONS = ["entrance", "combat", "treasure", "boss", "puzzle", "trap"] as const

export const DIFFICULTY_LEVEL_OPTIONS = ["easy", "medium", "hard", "deadly"] as const

export type RoomType = (typeof ROOM_TYPE_OPTIONS)[number]

export type DifficultyLevel = (typeof DIFFICULTY_LEVEL_OPTIONS)[number]

/**
 * Metadatos básicos para cada tipo de sala
 * Nota: Los textos/traducciones están en lib/texts.ts
 */
export interface RoomTypeMetadata {
  typicalEnemies?: string[]
  typicalRewards?: string[]
  environmentalHazards?: string[]
}

export const ROOM_TYPE_METADATA: Record<RoomType, RoomTypeMetadata> = {
  entrance: {
    typicalEnemies: ["guards", "sentries", "scouts"],
    typicalRewards: ["common", "uncommon"],
    environmentalHazards: ["traps", "alarms"],
  },
  combat: {
    typicalEnemies: ["monsters", "bandits", "undead", "beasts"],
    typicalRewards: ["common", "uncommon", "rare"],
    environmentalHazards: ["difficult_terrain", "hazards", "cover"],
  },
  treasure: {
    typicalEnemies: ["guards", "traps"],
    typicalRewards: ["uncommon", "rare", "very_rare"],
    environmentalHazards: ["traps", "puzzles", "curses"],
  },
  boss: {
    typicalEnemies: ["boss", "elite", "legendary"],
    typicalRewards: ["rare", "very_rare", "legendary"],
    environmentalHazards: ["lair_actions", "hazards", "terrain"],
  },
  puzzle: {
    typicalEnemies: ["constructs", "guards"],
    typicalRewards: ["uncommon", "rare", "information"],
    environmentalHazards: ["puzzles", "traps", "time_limits"],
  },
  trap: {
    typicalEnemies: ["constructs", "traps"],
    typicalRewards: ["common", "uncommon"],
    environmentalHazards: ["mechanical_traps", "magical_traps", "environmental"],
  },
}

/**
 * Metadatos básicos para cada nivel de dificultad
 * Nota: Los textos/traducciones están en lib/texts.ts
 */
export interface DifficultyLevelMetadata {
  recommendedLevelRange?: string
  typicalEnemyCR?: string
  typicalRewardRarity?: string
}

export const DIFFICULTY_LEVEL_METADATA: Record<DifficultyLevel, DifficultyLevelMetadata> = {
  easy: {
    recommendedLevelRange: "1-4",
    typicalEnemyCR: "1/8 - 2",
    typicalRewardRarity: "common, uncommon",
  },
  medium: {
    recommendedLevelRange: "3-8",
    typicalEnemyCR: "2 - 8",
    typicalRewardRarity: "uncommon, rare",
  },
  hard: {
    recommendedLevelRange: "7-12",
    typicalEnemyCR: "8 - 15",
    typicalRewardRarity: "rare, very_rare",
  },
  deadly: {
    recommendedLevelRange: "11+",
    typicalEnemyCR: "15+",
    typicalRewardRarity: "very_rare, legendary",
  },
}

