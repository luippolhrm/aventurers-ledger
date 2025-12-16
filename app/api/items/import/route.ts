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
    try {
      if (body.api === 'dnd5eapi') {
        apiItem = await itemApiService.getItemFromDnd5eApi(body.itemId)
      } else {
        apiItem = await itemApiService.getItemFromOpen5e(body.itemId)
      }

      if (!apiItem) {
        return NextResponse.json(
          { 
            error: 'Item not found in API',
            details: `Could not find item with ID: ${body.itemId} in ${body.api}`
          },
          { status: 404 }
        )
      }
    } catch (fetchError) {
      console.error('Error fetching item from API:', fetchError)
      return NextResponse.json(
        {
          error: 'Failed to fetch item from API',
          details: fetchError instanceof Error ? fetchError.message : 'Unknown error fetching item'
        },
        { status: 500 }
      )
    }

    // Map to our format (this will be in English)
    let itemInEnglish
    try {
      itemInEnglish = itemApiService.mapToShopItem(apiItem, body.api)
    } catch (mapError) {
      console.error('Error mapping item:', mapError)
      return NextResponse.json(
        {
          error: 'Failed to process item data',
          details: mapError instanceof Error ? mapError.message : 'Unknown error processing item'
        },
        { status: 500 }
      )
    }

    // Translate if needed
    let translatedItem = itemInEnglish
    if (body.language !== 'en') {
      try {
        const provider = body.provider || 'gemini'
        const aiService = getAiProvider(provider)
        translatedItem = await aiService.translateItem(itemInEnglish, body.language)
      } catch (translationError) {
        console.error('Translation error:', translationError)
        // If translation fails, return the English version
        // This allows the import to succeed even if translation fails
        console.warn('Translation failed, returning English version')
        translatedItem = itemInEnglish
      }
    }

    return NextResponse.json({
      item: translatedItem,
      original_en: itemInEnglish,
    })
  } catch (error) {
    console.error('Error importing item:', error)
    
    // Provide more detailed error information
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    const isApiKeyError = errorMessage.includes('API_KEY') || errorMessage.includes('not configured')
    
    return NextResponse.json(
      {
        error: 'Failed to import item',
        details: isApiKeyError 
          ? 'AI service not configured. Please check your API keys.'
          : errorMessage,
      },
      { status: 500 }
    )
  }
}

// Search endpoint - supports both search and list all, with optional sourcebook filter
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const api = searchParams.get('api') as 'dnd5eapi' | 'open5e' | null
    const query = searchParams.get('query') // Optional - if not provided, return all items
    const action = searchParams.get('action') || 'search' // 'search' or 'list'
    const sourcebook = searchParams.get('sourcebook') // Optional - filter by sourcebook/edition (Open5e only)

    if (!api) {
      return NextResponse.json(
        { error: 'Missing required parameter: api' },
        { status: 400 }
      )
    }

    if (api !== 'dnd5eapi' && api !== 'open5e') {
      return NextResponse.json(
        { error: 'Invalid api. Must be "dnd5eapi" or "open5e"' },
        { status: 400 }
      )
    }

    // Get all items or search
    let results
    if (action === 'list') {
      // Get all items
      if (api === 'dnd5eapi') {
        results = await itemApiService.getAllDnd5eApiItems()
      } else {
        // For Open5e, fetch all items with optional sourcebook filter
        results = await itemApiService.getAllOpen5eItems(sourcebook || undefined)
      }
    } else {
      // Search with query
      if (!query) {
        return NextResponse.json(
          { error: 'Missing required parameter: query' },
          { status: 400 }
        )
      }
      
      if (api === 'dnd5eapi') {
        results = await itemApiService.searchDnd5eApi(query)
      } else {
        results = await itemApiService.searchOpen5e(query, sourcebook || undefined)
      }
    }

    // Also return available sourcebooks for Open5e
    const sourcebooks = api === 'open5e' ? itemApiService.getOpen5eSourcebooks() : []

    return NextResponse.json({ 
      results,
      sourcebooks: sourcebooks.length > 0 ? sourcebooks : undefined,
    })
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
