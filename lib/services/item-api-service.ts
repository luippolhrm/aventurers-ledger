/**
 * Service for interacting with external D&D APIs (D&D 5e API and Open5e)
 */

export interface ApiSearchResult {
  index: string
  name: string
  url: string
  source?: string
  document_slug?: string // For Open5e: sourcebook/edition identifier
  edition?: string // Human-readable edition/sourcebook name
  relevanceScore?: number // Internal: for sorting search results
}

export interface DndApiItem {
  index: string
  name: string
  equipment_category?: { name: string }
  weapon_category?: string
  armor_category?: string
  tool_category?: string
  gear_category?: { name: string }
  desc?: string[]
  cost?: { quantity: number; unit: string }
  weight?: number
  damage?: { damage_dice: string; damage_type: { name: string } }
  armor_class?: { base: number }
  properties?: Array<{ name: string }>
  rarity?: { name: string }
}

export interface Open5eItem {
  slug: string
  name: string
  type: string
  desc: string
  rarity: string
  requires_attunement?: string
  weight?: string
  document__slug?: string
  cost?: string
  damage_dice?: string
  damage_type?: string
  armor_class?: string
  properties?: string[]
}

export interface ShopItemExtended {
  item_name: string
  item_type: string | null
  description: string | null
  price_in_copper: number
  weight: number
  quantity_available: number
  image_url?: string
  rarity?: 'common' | 'uncommon' | 'rare' | 'very_rare' | 'legendary' | 'artifact'
  item_category?: string
  damage_dice?: string
  damage_type?: string
  armor_class?: number
  properties?: string[]
  requirements?: string
  attunement?: boolean
  original_name_en?: string
  source?: 'manual' | 'openai' | 'dnd5eapi' | 'open5e'
}

/**
 * ItemApiService
 * 
 * APIs utilizadas:
 * 1. D&D 5e API (dnd5eapi.co) - Versión 1.6
 *    - Base URL: https://www.dnd5eapi.co/api/
 *    - Solo contiene SRD (System Reference Document)
 *    - No requiere autenticación
 *    - Endpoints: /equipment, /equipment/{index}
 * 
 * 2. Open5e API - Versión v1
 *    - Base URL: https://api.open5e.com
 *    - Contiene múltiples sourcebooks/ediciones
 *    - No requiere autenticación
 *    - Endpoints: /v1/magicitems/, /v1/magicitems/{slug}
 *    - Soporta filtros: document__slug (edición/sourcebook)
 */
export class ItemApiService {
  private dnd5eApiUrl = 'https://www.dnd5eapi.co'
  private open5eApiUrl = 'https://api.open5e.com'
  
  // Sourcebooks/ediciones comunes en Open5e
  private readonly open5eSourcebooks = [
    { slug: 'basicrules', name: 'Basic Rules' },
    { slug: 'phb', name: "Player's Handbook" },
    { slug: 'dmg', name: "Dungeon Master's Guide" },
    { slug: 'xgte', name: "Xanathar's Guide to Everything" },
    { slug: 'tce', name: "Tasha's Cauldron of Everything" },
    { slug: 'ftod', name: "Fizban's Treasury of Dragons" },
    { slug: 'scc', name: "Strixhaven: A Curriculum of Chaos" },
    { slug: 'egw', name: "Explorer's Guide to Wildemount" },
    { slug: 'vrm', name: "Van Richten's Guide to Ravenloft" },
    { slug: 'wbw', name: "The Wild Beyond the Witchlight" },
  ]

  /**
   * Get all equipment from D&D 5e API
   * Note: D&D 5e API only contains SRD content, no edition filter needed
   */
  async getAllDnd5eApiItems(): Promise<ApiSearchResult[]> {
    try {
      const response = await fetch(`${this.dnd5eApiUrl}/api/equipment`)
      if (!response.ok) {
        throw new Error(`D&D 5e API error: ${response.statusText}`)
      }

      const data = await response.json()
      return (data.results || []).map((item: ApiSearchResult) => ({
        ...item,
        edition: 'SRD (System Reference Document)',
        source: 'srd',
      }))
    } catch (error) {
      console.error('Error fetching all items from D&D 5e API:', error)
      return []
    }
  }

  /**
   * Search D&D 5e API for equipment
   */
  async searchDnd5eApi(query: string): Promise<ApiSearchResult[]> {
    try {
      const allItems = await this.getAllDnd5eApiItems()
      
      // Filter results by query
      const filtered = allItems.filter((item: ApiSearchResult) =>
        item.name.toLowerCase().includes(query.toLowerCase())
      )

      return filtered.slice(0, 20) // Limit to 20 results
    } catch (error) {
      console.error('Error searching D&D 5e API:', error)
      return []
    }
  }

  /**
   * Get detailed item from D&D 5e API
   */
  async getItemFromDnd5eApi(index: string): Promise<DndApiItem | null> {
    try {
      const response = await fetch(`${this.dnd5eApiUrl}/api/equipment/${index}`)
      if (!response.ok) {
        throw new Error(`D&D 5e API error: ${response.statusText}`)
      }

      const data = await response.json()
      return data
    } catch (error) {
      console.error('Error fetching item from D&D 5e API:', error)
      return null
    }
  }

  /**
   * Get all sourcebooks/editions available in Open5e
   */
  getOpen5eSourcebooks(): Array<{ slug: string; name: string }> {
    return this.open5eSourcebooks
  }

  /**
   * Get all magic items from Open5e API (optionally filtered by sourcebook)
   */
  async getAllOpen5eItems(sourcebook?: string): Promise<ApiSearchResult[]> {
    try {
      let url = `${this.open5eApiUrl}/v1/magicitems/?limit=1000`
      if (sourcebook && sourcebook !== 'all') {
        url += `&document__slug=${encodeURIComponent(sourcebook)}`
      }

      const allResults: ApiSearchResult[] = []
      let nextUrl: string | null = url

      // Handle pagination
      while (nextUrl) {
        const response = await fetch(nextUrl)
        if (!response.ok) {
          throw new Error(`Open5e API error: ${response.statusText}`)
        }

        const data = await response.json()
        const results = data.results || []

        const mapped = results.map((item: Open5eItem) => {
          const sourcebookInfo = this.open5eSourcebooks.find(s => s.slug === item.document__slug)
          return {
            index: item.slug,
            name: item.name,
            url: `${this.open5eApiUrl}/v1/magicitems/${item.slug}`,
            source: item.document__slug,
            document_slug: item.document__slug,
            edition: sourcebookInfo?.name || item.document__slug || 'Unknown',
          }
        })

        allResults.push(...mapped)

        // Check for next page
        nextUrl = data.next || null
        if (nextUrl && !nextUrl.startsWith('http')) {
          nextUrl = `${this.open5eApiUrl}${nextUrl}`
        }
      }

      return allResults
    } catch (error) {
      console.error('Error fetching all items from Open5e:', error)
      return []
    }
  }

  /**
   * Search Open5e API for magic items and equipment
   * The API search parameter searches across name and description, so we filter client-side
   * to prioritize exact name matches and ensure relevance
   */
  async searchOpen5e(query: string, sourcebook?: string): Promise<ApiSearchResult[]> {
    try {
      // Use a higher limit to get more results, then filter client-side for better relevance
      let url = `${this.open5eApiUrl}/v1/magicitems/?search=${encodeURIComponent(query)}&limit=100`
      if (sourcebook && sourcebook !== 'all') {
        url += `&document__slug=${encodeURIComponent(sourcebook)}`
      }

      const response = await fetch(url)
      if (!response.ok) {
        throw new Error(`Open5e API error: ${response.statusText}`)
      }

      const data = await response.json()
      const results = data.results || []

      // Map and filter results to prioritize name matches
      const queryLower = query.toLowerCase()
      const mapped = results.map((item: Open5eItem) => {
        const sourcebookInfo = this.open5eSourcebooks.find(s => s.slug === item.document__slug)
        const nameLower = item.name.toLowerCase()
        
        // Calculate relevance score:
        // - Exact name match: highest priority
        // - Name starts with query: high priority
        // - Name contains query: medium priority
        // - Description contains query: lower priority
        let relevanceScore = 0
        if (nameLower === queryLower) {
          relevanceScore = 100 // Exact match
        } else if (nameLower.startsWith(queryLower)) {
          relevanceScore = 80 // Starts with query
        } else if (nameLower.includes(queryLower)) {
          relevanceScore = 60 // Contains query
        } else {
          // Only in description, lower priority
          relevanceScore = 20
        }

        return {
          index: item.slug,
          name: item.name,
          url: `${this.open5eApiUrl}/v1/magicitems/${item.slug}`,
          source: item.document__slug,
          document_slug: item.document__slug,
          edition: sourcebookInfo?.name || item.document__slug || 'Unknown',
          relevanceScore, // Add score for sorting
        }
      })

      // Filter: only include items where name contains the query (not just description)
      // This ensures "ring" returns rings, not items that mention "ring" in description
      const nameMatches = mapped.filter((item) => {
        const nameLower = item.name.toLowerCase()
        return nameLower.includes(queryLower)
      })

      // Sort by relevance (exact matches first, then starts with, then contains)
      nameMatches.sort((a, b) => {
        // First sort by relevance score
        if (b.relevanceScore !== a.relevanceScore) {
          return b.relevanceScore - a.relevanceScore
        }
        // Then alphabetically
        return a.name.localeCompare(b.name)
      })

      // Return top 50 results (prioritizing name matches)
      return nameMatches.slice(0, 50).map(({ relevanceScore, ...item }) => item)
    } catch (error) {
      console.error('Error searching Open5e:', error)
      return []
    }
  }

  /**
   * Get detailed item from Open5e API
   */
  async getItemFromOpen5e(slug: string): Promise<Open5eItem | null> {
    try {
      const response = await fetch(`${this.open5eApiUrl}/v1/magicitems/${slug}`)
      if (!response.ok) {
        throw new Error(`Open5e API error: ${response.statusText}`)
      }

      const data = await response.json()
      return data
    } catch (error) {
      console.error('Error fetching item from Open5e:', error)
      return null
    }
  }

  /**
   * Map D&D 5e API item to our shop item format
   */
  private mapDnd5eToShopItem(apiItem: DndApiItem): ShopItemExtended {
    const description = apiItem.desc?.join('\n\n') || null
    const cost = this.parseDnd5eCost(apiItem.cost)
    
    return {
      item_name: apiItem.name,
      item_type: this.getDnd5eItemType(apiItem),
      description,
      price_in_copper: cost,
      weight: apiItem.weight || 0,
      quantity_available: 999,
      rarity: this.mapRarity(apiItem.rarity?.name),
      item_category: this.getDnd5eCategory(apiItem),
      damage_dice: apiItem.damage?.damage_dice,
      damage_type: apiItem.damage?.damage_type?.name,
      armor_class: apiItem.armor_class?.base,
      properties: apiItem.properties?.map(p => p.name) || [],
      attunement: false,
      original_name_en: apiItem.name,
      source: 'dnd5eapi',
    }
  }

  /**
   * Map Open5e item to our shop item format
   */
  private mapOpen5eToShopItem(apiItem: Open5eItem): ShopItemExtended {
    const cost = this.parseOpen5eCost(apiItem.cost)
    const weight = this.parseWeight(apiItem.weight)
    
    return {
      item_name: apiItem.name,
      item_type: apiItem.type,
      description: apiItem.desc,
      price_in_copper: cost,
      weight,
      quantity_available: 999,
      rarity: this.mapRarity(apiItem.rarity),
      item_category: apiItem.type,
      damage_dice: apiItem.damage_dice,
      damage_type: apiItem.damage_type,
      armor_class: apiItem.armor_class ? parseInt(apiItem.armor_class) : undefined,
      properties: apiItem.properties || [],
      attunement: apiItem.requires_attunement?.toLowerCase().includes('yes') || false,
      original_name_en: apiItem.name,
      source: 'open5e',
    }
  }

  /**
   * Universal mapper that detects source and maps accordingly
   */
  mapToShopItem(apiItem: any, source: 'dnd5eapi' | 'open5e'): ShopItemExtended {
    if (source === 'dnd5eapi') {
      return this.mapDnd5eToShopItem(apiItem as DndApiItem)
    } else {
      return this.mapOpen5eToShopItem(apiItem as Open5eItem)
    }
  }

  /**
   * Parse D&D 5e API cost format
   */
  private parseDnd5eCost(cost?: { quantity: number; unit: string }): number {
    if (!cost) return 0

    const { quantity, unit } = cost
    const unitMap: Record<string, number> = {
      cp: 1,
      sp: 10,
      ep: 50,
      gp: 100,
      pp: 1000,
    }

    return quantity * (unitMap[unit] || 0)
  }

  /**
   * Parse Open5e cost format (e.g., "50 gp", "2,000 gp")
   */
  private parseOpen5eCost(cost?: string): number {
    if (!cost) return 0

    const match = cost.match(/([0-9,]+)\s*(cp|sp|ep|gp|pp)/i)
    if (!match) return 0

    const quantity = parseInt(match[1].replace(/,/g, ''))
    const unit = match[2].toLowerCase()

    const unitMap: Record<string, number> = {
      cp: 1,
      sp: 10,
      ep: 50,
      gp: 100,
      pp: 1000,
    }

    return quantity * (unitMap[unit] || 0)
  }

  /**
   * Parse weight string to number
   */
  private parseWeight(weight?: string): number {
    if (!weight) return 0
    const match = weight.match(/([0-9.]+)/)
    return match ? parseFloat(match[1]) : 0
  }

  /**
   * Get item type from D&D 5e API item
   */
  private getDnd5eItemType(item: DndApiItem): string | null {
    return (
      item.weapon_category ||
      item.armor_category ||
      item.tool_category ||
      item.gear_category?.name ||
      item.equipment_category?.name ||
      null
    )
  }

  /**
   * Get category from D&D 5e API item
   */
  private getDnd5eCategory(item: DndApiItem): string | undefined {
    if (item.weapon_category) return 'weapon'
    if (item.armor_category) return 'armor'
    if (item.tool_category) return 'tool'
    return item.equipment_category?.name?.toLowerCase()
  }

  /**
   * Map rarity string to our enum
   */
  private mapRarity(rarity?: string): ShopItemExtended['rarity'] {
    if (!rarity) return 'common'

    const rarityMap: Record<string, ShopItemExtended['rarity']> = {
      common: 'common',
      uncommon: 'uncommon',
      rare: 'rare',
      'very rare': 'very_rare',
      legendary: 'legendary',
      artifact: 'artifact',
    }

    return rarityMap[rarity.toLowerCase()] || 'common'
  }
}

export const itemApiService = new ItemApiService()
