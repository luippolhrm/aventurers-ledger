/**
 * Constantes para tipos de tiendas alineadas con D&D 2024
 * Basado en Player's Handbook y DM's Guide
 */

export const SHOP_TYPE_OPTIONS = [
  "trading_post",
  "general_store",
  "blacksmith",
  "armorer",
  "magic_shop",
  "alchemist",
  "temple",
  "tavern",
  "stables",
  "apothecary",
  "library",
  "thieves_guild",
] as const

export type ShopType = (typeof SHOP_TYPE_OPTIONS)[number]

/**
 * Metadatos básicos para cada tipo de tienda
 * Nota: Los textos/traducciones están en lib/texts.ts
 */
export interface ShopTypeMetadata {
  typicalItems: string[]
  maxRarity?: "common" | "uncommon" | "rare" | "very_rare" | "legendary" | "artifact"
  services?: string[]
  typicalLocationTypes?: string[]
}

export const SHOP_TYPE_METADATA: Record<ShopType, ShopTypeMetadata> = {
  trading_post: {
    typicalItems: ["equipment", "supplies", "tools", "gear"],
    maxRarity: "uncommon",
    services: ["trade", "repair"],
    typicalLocationTypes: ["village", "city", "port", "camp"],
  },
  general_store: {
    typicalItems: ["equipment", "supplies", "tools", "gear", "consumables"],
    maxRarity: "common",
    services: [],
    typicalLocationTypes: ["village", "city", "town"],
  },
  blacksmith: {
    typicalItems: ["weapon", "armor", "tools"],
    maxRarity: "uncommon",
    services: ["repair", "craft"],
    typicalLocationTypes: ["village", "city", "town"],
  },
  armorer: {
    typicalItems: ["armor", "shield"],
    maxRarity: "rare",
    services: ["repair", "craft", "custom"],
    typicalLocationTypes: ["city", "town"],
  },
  magic_shop: {
    typicalItems: ["wondrous", "scroll", "potion", "weapon", "armor"],
    maxRarity: "very_rare",
    services: ["identify", "enchant", "attune"],
    typicalLocationTypes: ["city"],
  },
  alchemist: {
    typicalItems: ["potion", "consumable", "component"],
    maxRarity: "rare",
    services: ["craft", "brew"],
    typicalLocationTypes: ["city", "town", "village"],
  },
  temple: {
    typicalItems: ["scroll", "consumable", "wondrous"],
    maxRarity: "rare",
    services: ["heal", "bless", "remove_curse", "resurrection"],
    typicalLocationTypes: ["city", "town", "village"],
  },
  tavern: {
    typicalItems: ["consumable", "supplies"],
    maxRarity: "common",
    services: ["lodging", "food", "information", "entertainment"],
    typicalLocationTypes: ["village", "city", "town", "port"],
  },
  stables: {
    typicalItems: ["equipment", "supplies"],
    maxRarity: "common",
    services: ["mount_rental", "mount_care", "transport"],
    typicalLocationTypes: ["village", "city", "town", "port"],
  },
  apothecary: {
    typicalItems: ["consumable", "component", "potion"],
    maxRarity: "uncommon",
    services: ["heal", "cure", "antidote"],
    typicalLocationTypes: ["city", "town", "village"],
  },
  library: {
    typicalItems: ["scroll", "wondrous", "consumable"],
    maxRarity: "rare",
    services: ["research", "copy_spell", "identify"],
    typicalLocationTypes: ["city", "town"],
  },
  thieves_guild: {
    typicalItems: ["weapon", "armor", "tool", "wondrous", "consumable"],
    maxRarity: "very_rare",
    services: ["fence", "information", "illegal"],
    typicalLocationTypes: ["city"],
  },
}

