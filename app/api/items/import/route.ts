import { NextRequest, NextResponse } from 'next/server'
import { itemApiService } from '@/lib/services/item-api-service'
import { getAiProvider, type Language, type AiProvider } from '@/lib/services/item-ai-providers'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

interface ImportRequest {
  api: 'dnd5eapi' | 'open5e'
  itemId: string
  language: Language
  provider?: AiProvider
}

export async function POST(request: NextRequest) {
  try {
    const body: ImportRequest = await request.json()

    // Validate request
    if (!body.api || !body.itemId || !body.language) {
      return NextResponse.json(
        { error: 'Missing required fields: api, itemId, language' },
        { status: 400 }
      )
    }

    if (body.api !== 'dnd5eapi' && body.api !== 'open5e') {
      return NextResponse.json(
        { error: 'Invalid api. Must be "dnd5eapi" or "open5e"' },
        { status: 400 }
      )
    }

    const validLanguages = ['en', 'es', 'fr', 'pt']
    if (!validLanguages.includes(body.language)) {
      return NextResponse.json(
        { error: 'Invalid language. Must be en, es, fr, or pt' },
        { status: 400 }
      )
    }

    // Fetch item from API
    let apiItem
    if (body.api === 'dnd5eapi') {
      apiItem = await itemApiService.getItemFromDnd5eApi(body.itemId)
    } else {
      apiItem = await itemApiService.getItemFromOpen5e(body.itemId)
    }

    if (!apiItem) {
      return NextResponse.json(
        { error: 'Item not found in API' },
        { status: 404 }
      )
    }

    // Map to our format (this will be in English)
    const itemInEnglish = itemApiService.mapToShopItem(apiItem, body.api)

    // Translate if needed
    let translatedItem = itemInEnglish
    if (body.language !== 'en') {
      const provider = body.provider || 'gemini'
      const aiService = getAiProvider(provider)
      translatedItem = await aiService.translateItem(itemInEnglish, body.language)
    }

    return NextResponse.json({
      item: translatedItem,
      original_en: itemInEnglish,
    })
  } catch (error) {
    console.error('Error importing item:', error)
    
    return NextResponse.json(
      {
        error: 'Failed to import item',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}

// Search endpoint
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const api = searchParams.get('api') as 'dnd5eapi' | 'open5e' | null
    const query = searchParams.get('query')

    if (!api || !query) {
      return NextResponse.json(
        { error: 'Missing required parameters: api, query' },
        { status: 400 }
      )
    }

    if (api !== 'dnd5eapi' && api !== 'open5e') {
      return NextResponse.json(
        { error: 'Invalid api. Must be "dnd5eapi" or "open5e"' },
        { status: 400 }
      )
    }

    // Search API
    let results
    if (api === 'dnd5eapi') {
      results = await itemApiService.searchDnd5eApi(query)
    } else {
      results = await itemApiService.searchOpen5e(query)
    }

    return NextResponse.json({ results })
  } catch (error) {
    console.error('Error searching items:', error)
    
    return NextResponse.json(
      {
        error: 'Failed to search items',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}
