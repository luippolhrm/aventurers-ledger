/**
 * AI Provider implementations for item generation
 * Supports both OpenAI and Google Gemini
 */

import OpenAI from 'openai'
import { GoogleGenerativeAI } from '@google/generative-ai'
import type { ShopItemExtended } from './item-api-service'

export type Language = 'en' | 'es' | 'fr' | 'pt'
export type AiProvider = 'openai' | 'gemini'

export interface AiProviderInterface {
  generateItem(prompt: string, language: Language): Promise<ShopItemExtended>
  searchOfficialItem(query: string, language: Language): Promise<ShopItemExtended>
  translateItem(item: ShopItemExtended, targetLang: Language): Promise<ShopItemExtended>
}

/**
 * OpenAI Provider Implementation
 */
export class OpenAiProvider implements AiProviderInterface {
  private openai: OpenAI

  constructor(apiKey: string) {
    this.openai = new OpenAI({ apiKey })
  }

  async generateItem(prompt: string, language: Language): Promise<ShopItemExtended> {
    const systemPrompt = this.getGenerateSystemPrompt(language)

    const completion = await this.openai.chat.completions.create({
      model: 'gpt-4-turbo-preview',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: prompt },
      ],
      response_format: { type: 'json_object' },
      temperature: 0.8,
    })

    const content = completion.choices[0]?.message?.content
    if (!content) {
      throw new Error('No response from OpenAI')
    }

    return this.parseItemData(JSON.parse(content), language)
  }

  async searchOfficialItem(query: string, language: Language): Promise<ShopItemExtended> {
    const systemPrompt = this.getSearchSystemPrompt(language)

    const completion = await this.openai.chat.completions.create({
      model: 'gpt-4-turbo-preview',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: `Search for: ${query}` },
      ],
      response_format: { type: 'json_object' },
      temperature: 0.3,
    })

    const content = completion.choices[0]?.message?.content
    if (!content) {
      throw new Error('No response from OpenAI')
    }

    return this.parseItemData(JSON.parse(content), language)
  }

  async translateItem(item: ShopItemExtended, targetLang: Language): Promise<ShopItemExtended> {
    const systemPrompt = this.getTranslateSystemPrompt(targetLang)
    const itemJson = JSON.stringify({
      name: item.item_name,
      type: item.item_type,
      description: item.description,
      category: item.item_category,
      damage_type: item.damage_type,
      requirements: item.requirements,
      properties: item.properties,
    })

    const completion = await this.openai.chat.completions.create({
      model: 'gpt-4-turbo-preview',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: itemJson },
      ],
      response_format: { type: 'json_object' },
      temperature: 0.3,
    })

    const content = completion.choices[0]?.message?.content
    if (!content) {
      throw new Error('No response from OpenAI')
    }

    const translated = JSON.parse(content)

    return {
      ...item,
      item_name: translated.name || item.item_name,
      item_type: translated.type || item.item_type,
      description: translated.description || item.description,
      item_category: translated.category || item.item_category,
      damage_type: translated.damage_type || item.damage_type,
      requirements: translated.requirements || item.requirements,
      properties: translated.properties || item.properties,
      original_name_en: item.original_name_en || item.item_name,
    }
  }

  private getGenerateSystemPrompt(language: Language): string {
    const languageNames = { en: 'English', es: 'Spanish', fr: 'French', pt: 'Portuguese' }

    return `You are an expert D&D 5e game designer. Generate balanced, creative magic items based on user descriptions.

IMPORTANT: Respond ONLY with valid JSON in this exact format:
{
  "name": "Item name in ${languageNames[language]}",
  "type": "Item type (weapon, armor, potion, etc.)",
  "description": "Detailed description in ${languageNames[language]}",
  "category": "weapon/armor/potion/scroll/wondrous/tool/gear",
  "rarity": "common/uncommon/rare/very_rare/legendary/artifact",
  "damage_dice": "1d8 (if weapon)",
  "damage_type": "slashing/piercing/bludgeoning/fire/cold/etc (if applicable)",
  "armor_class": 15 (if armor, as number),
  "properties": ["finesse", "versatile", "heavy"] (array of property names),
  "requirements": "Strength 13 or higher (if any)",
  "attunement": true/false,
  "weight": 3 (in pounds),
  "price_in_copper": 50000 (optional, will be auto-calculated)
}

Guidelines:
- Keep items balanced for D&D 5e
- Price should reflect rarity and power
- Include flavorful descriptions
- Use appropriate damage dice for weapons
- Specify attunement for powerful items
- Return ALL text in ${languageNames[language]}`
  }

  private getSearchSystemPrompt(language: Language): string {
    const languageNames = { en: 'English', es: 'Spanish', fr: 'French', pt: 'Portuguese' }

    return `You are a D&D 5e expert with knowledge of official items from Player's Handbook, Dungeon Master's Guide, and other sourcebooks.

When given an item name or description, provide the official D&D 5e item data.

IMPORTANT: Respond ONLY with valid JSON in this exact format:
{
  "name": "Official item name translated to ${languageNames[language]}",
  "original_name_en": "Original English name",
  "type": "Item type",
  "description": "Official description translated to ${languageNames[language]}",
  "category": "weapon/armor/potion/scroll/wondrous/tool/gear",
  "rarity": "common/uncommon/rare/very_rare/legendary/artifact",
  "damage_dice": "1d8 (if weapon)",
  "damage_type": "slashing/piercing/bludgeoning/fire/cold/etc",
  "armor_class": 15 (if armor),
  "properties": ["finesse", "light"],
  "requirements": "Strength 13 (if any)",
  "attunement": true/false,
  "weight": 3,
  "price_in_copper": 50000
}

Use official D&D 5e data. Translate to ${languageNames[language]} but keep original_name_en.`
  }

  private getTranslateSystemPrompt(language: Language): string {
    const languageNames = { en: 'English', es: 'Spanish', fr: 'French', pt: 'Portuguese' }

    return `You are a professional translator specializing in D&D 5e content.

Translate the provided item data to ${languageNames[language]}.

IMPORTANT: Respond ONLY with valid JSON in this exact format:
{
  "name": "Translated item name",
  "type": "Translated type",
  "description": "Translated description",
  "category": "Keep in English (weapon/armor/etc)",
  "damage_type": "Translated damage type if applicable",
  "requirements": "Translated requirements",
  "properties": ["Translated", "properties"]
}

Guidelines:
- Keep technical terms consistent with D&D ${languageNames[language]} translations
- Preserve game mechanical terms
- Maintain the flavor and tone of the original`
  }

  private parseItemData(data: any, language: Language): ShopItemExtended {
    const item: ShopItemExtended = {
      item_name: data.name || 'Unknown Item',
      item_type: data.type || null,
      description: data.description || null,
      price_in_copper: data.price_in_copper || 0,
      weight: data.weight || 0,
      quantity_available: data.quantity_available || 999,
      image_url: data.image_url,
      rarity: this.normalizeRarity(data.rarity),
      item_category: data.category,
      damage_dice: data.damage_dice,
      damage_type: data.damage_type,
      armor_class: data.armor_class ? parseInt(data.armor_class) : undefined,
      properties: Array.isArray(data.properties) ? data.properties : [],
      requirements: data.requirements,
      attunement: data.attunement === true || data.attunement === 'yes',
      original_name_en: language === 'en' ? data.name : data.original_name_en,
      source: 'openai',
    }

    if (!item.price_in_copper) {
      item.price_in_copper = this.calculatePrice(item)
    }

    return item
  }

  private normalizeRarity(rarity?: string): ShopItemExtended['rarity'] {
    if (!rarity) return 'common'
    const normalized = rarity.toLowerCase().replace(/\s+/g, '_')
    const validRarities = ['common', 'uncommon', 'rare', 'very_rare', 'legendary', 'artifact']
    if (validRarities.includes(normalized)) {
      return normalized as ShopItemExtended['rarity']
    }
    return 'common'
  }

  private calculatePrice(item: ShopItemExtended): number {
    const rarityPrices: Record<string, number> = {
      common: 5000,
      uncommon: 10000,
      rare: 500000,
      very_rare: 5000000,
      legendary: 50000000,
      artifact: 100000000,
    }

    let basePrice = rarityPrices[item.rarity || 'common'] || 5000

    if (item.attunement) basePrice *= 2
    if (item.damage_dice) basePrice *= 1.5
    if (item.armor_class && item.armor_class > 15) basePrice *= 2
    if (item.properties && item.properties.length > 2) basePrice *= 1.3

    return Math.round(basePrice)
  }
}

/**
 * Google Gemini Provider Implementation
 */
export class GeminiProvider implements AiProviderInterface {
  private genAI: GoogleGenerativeAI
  private model: any

  constructor(apiKey: string) {
    this.genAI = new GoogleGenerativeAI(apiKey)
    this.model = this.genAI.getGenerativeModel({ model: 'gemini-1.5-flash' })
  }

  async generateItem(prompt: string, language: Language): Promise<ShopItemExtended> {
    const systemPrompt = this.getGenerateSystemPrompt(language)
    const fullPrompt = `${systemPrompt}\n\nUser request: ${prompt}`

    const result = await this.model.generateContent(fullPrompt)
    const response = await result.response
    const text = response.text()

    // Extract JSON from response (Gemini might include markdown)
    const jsonMatch = text.match(/\{[\s\S]*\}/)
    if (!jsonMatch) {
      throw new Error('No valid JSON in Gemini response')
    }

    return this.parseItemData(JSON.parse(jsonMatch[0]), language, 'gemini')
  }

  async searchOfficialItem(query: string, language: Language): Promise<ShopItemExtended> {
    const systemPrompt = this.getSearchSystemPrompt(language)
    const fullPrompt = `${systemPrompt}\n\nSearch for: ${query}`

    const result = await this.model.generateContent(fullPrompt)
    const response = await result.response
    const text = response.text()

    const jsonMatch = text.match(/\{[\s\S]*\}/)
    if (!jsonMatch) {
      throw new Error('No valid JSON in Gemini response')
    }

    return this.parseItemData(JSON.parse(jsonMatch[0]), language, 'gemini')
  }

  async translateItem(item: ShopItemExtended, targetLang: Language): Promise<ShopItemExtended> {
    const systemPrompt = this.getTranslateSystemPrompt(targetLang)
    const itemJson = JSON.stringify({
      name: item.item_name,
      type: item.item_type,
      description: item.description,
      category: item.item_category,
      damage_type: item.damage_type,
      requirements: item.requirements,
      properties: item.properties,
    })

    const fullPrompt = `${systemPrompt}\n\nTranslate this item:\n${itemJson}`

    const result = await this.model.generateContent(fullPrompt)
    const response = await result.response
    const text = response.text()

    const jsonMatch = text.match(/\{[\s\S]*\}/)
    if (!jsonMatch) {
      throw new Error('No valid JSON in Gemini response')
    }

    const translated = JSON.parse(jsonMatch[0])

    return {
      ...item,
      item_name: translated.name || item.item_name,
      item_type: translated.type || item.item_type,
      description: translated.description || item.description,
      item_category: translated.category || item.item_category,
      damage_type: translated.damage_type || item.damage_type,
      requirements: translated.requirements || item.requirements,
      properties: translated.properties || item.properties,
      original_name_en: item.original_name_en || item.item_name,
    }
  }

  private getGenerateSystemPrompt(language: Language): string {
    const languageNames = { en: 'English', es: 'Spanish', fr: 'French', pt: 'Portuguese' }

    return `You are an expert D&D 5e game designer. Generate balanced, creative magic items based on user descriptions.

IMPORTANT: Respond ONLY with valid JSON (no markdown, no extra text) in this exact format:
{
  "name": "Item name in ${languageNames[language]}",
  "type": "Item type (weapon, armor, potion, etc.)",
  "description": "Detailed description in ${languageNames[language]}",
  "category": "weapon/armor/potion/scroll/wondrous/tool/gear",
  "rarity": "common/uncommon/rare/very_rare/legendary/artifact",
  "damage_dice": "1d8 (if weapon)",
  "damage_type": "slashing/piercing/bludgeoning/fire/cold/etc (if applicable)",
  "armor_class": 15 (if armor, as number),
  "properties": ["finesse", "versatile", "heavy"],
  "requirements": "Strength 13 or higher (if any)",
  "attunement": true,
  "weight": 3,
  "price_in_copper": 50000
}

Guidelines:
- Keep items balanced for D&D 5e
- Include flavorful descriptions
- Return ALL text in ${languageNames[language]}
- Respond with ONLY the JSON object, nothing else`
  }

  private getSearchSystemPrompt(language: Language): string {
    const languageNames = { en: 'English', es: 'Spanish', fr: 'French', pt: 'Portuguese' }

    return `You are a D&D 5e expert with knowledge of official items from Player's Handbook, Dungeon Master's Guide, and other sourcebooks.

IMPORTANT: Respond ONLY with valid JSON (no markdown, no extra text) in this exact format:
{
  "name": "Official item name translated to ${languageNames[language]}",
  "original_name_en": "Original English name",
  "type": "Item type",
  "description": "Official description translated to ${languageNames[language]}",
  "category": "weapon/armor/potion/scroll/wondrous/tool/gear",
  "rarity": "common/uncommon/rare/very_rare/legendary/artifact",
  "damage_dice": "1d8",
  "damage_type": "slashing",
  "armor_class": 15,
  "properties": ["finesse", "light"],
  "requirements": "Strength 13",
  "attunement": true,
  "weight": 3,
  "price_in_copper": 50000
}

Use official D&D 5e data. Translate to ${languageNames[language]}.`
  }

  private getTranslateSystemPrompt(language: Language): string {
    const languageNames = { en: 'English', es: 'Spanish', fr: 'French', pt: 'Portuguese' }

    return `You are a professional translator specializing in D&D 5e content.

IMPORTANT: Respond ONLY with valid JSON (no markdown, no extra text):
{
  "name": "Translated item name",
  "type": "Translated type",
  "description": "Translated description",
  "category": "weapon",
  "damage_type": "Translated damage type",
  "requirements": "Translated requirements",
  "properties": ["Translated", "properties"]
}

Translate to ${languageNames[language]}. Keep technical terms consistent.`
  }

  private parseItemData(data: any, language: Language, source: 'openai' | 'gemini'): ShopItemExtended {
    const item: ShopItemExtended = {
      item_name: data.name || 'Unknown Item',
      item_type: data.type || null,
      description: data.description || null,
      price_in_copper: data.price_in_copper || 0,
      weight: data.weight || 0,
      quantity_available: data.quantity_available || 999,
      image_url: data.image_url,
      rarity: this.normalizeRarity(data.rarity),
      item_category: data.category,
      damage_dice: data.damage_dice,
      damage_type: data.damage_type,
      armor_class: data.armor_class ? parseInt(data.armor_class) : undefined,
      properties: Array.isArray(data.properties) ? data.properties : [],
      requirements: data.requirements,
      attunement: data.attunement === true || data.attunement === 'yes',
      original_name_en: language === 'en' ? data.name : data.original_name_en,
      source,
    }

    if (!item.price_in_copper) {
      item.price_in_copper = this.calculatePrice(item)
    }

    return item
  }

  private normalizeRarity(rarity?: string): ShopItemExtended['rarity'] {
    if (!rarity) return 'common'
    const normalized = rarity.toLowerCase().replace(/\s+/g, '_')
    const validRarities = ['common', 'uncommon', 'rare', 'very_rare', 'legendary', 'artifact']
    if (validRarities.includes(normalized)) {
      return normalized as ShopItemExtended['rarity']
    }
    return 'common'
  }

  private calculatePrice(item: ShopItemExtended): number {
    const rarityPrices: Record<string, number> = {
      common: 5000,
      uncommon: 10000,
      rare: 500000,
      very_rare: 5000000,
      legendary: 50000000,
      artifact: 100000000,
    }

    let basePrice = rarityPrices[item.rarity || 'common'] || 5000

    if (item.attunement) basePrice *= 2
    if (item.damage_dice) basePrice *= 1.5
    if (item.armor_class && item.armor_class > 15) basePrice *= 2
    if (item.properties && item.properties.length > 2) basePrice *= 1.3

    return Math.round(basePrice)
  }
}

/**
 * Factory function to get the appropriate AI provider
 */
export function getAiProvider(provider: AiProvider = 'gemini'): AiProviderInterface {
  if (provider === 'openai') {
    const apiKey = process.env.OPENAI_API_KEY
    if (!apiKey) {
      throw new Error('OPENAI_API_KEY not configured')
    }
    return new OpenAiProvider(apiKey)
  } else {
    const apiKey = process.env.GEMINI_API_KEY
    if (!apiKey) {
      throw new Error('GEMINI_API_KEY not configured')
    }
    return new GeminiProvider(apiKey)
  }
}
