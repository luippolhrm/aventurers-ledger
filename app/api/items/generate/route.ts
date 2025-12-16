import { NextRequest, NextResponse } from 'next/server'
import { getAiProvider, type Language, type AiProvider } from '@/lib/services/item-ai-providers'
import type { ShopItemExtended } from '@/lib/services/item-api-service'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

interface GenerateRequest {
  prompt: string
  mode: 'generate' | 'search'
  language: Language
  provider?: AiProvider
}

export async function POST(request: NextRequest) {
  try {
    const body: GenerateRequest = await request.json()

    // Validate request
    if (!body.prompt || !body.mode || !body.language) {
      return NextResponse.json(
        { error: 'Missing required fields: prompt, mode, language' },
        { status: 400 }
      )
    }

    if (body.mode !== 'generate' && body.mode !== 'search') {
      return NextResponse.json(
        { error: 'Invalid mode. Must be "generate" or "search"' },
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

    // Get AI provider (defaults to Gemini if not specified)
    const provider = body.provider || 'gemini'
    let aiService
    try {
      aiService = getAiProvider(provider)
    } catch (providerError) {
      console.error('Error getting AI provider:', providerError)
      const isApiKeyError = providerError instanceof Error && 
        (providerError.message.includes('API_KEY') || providerError.message.includes('not configured'))
      
      return NextResponse.json(
        {
          error: 'AI service not available',
          details: isApiKeyError
            ? 'AI service not configured. Please check your API keys.'
            : providerError instanceof Error ? providerError.message : 'Failed to initialize AI provider'
        },
        { status: 500 }
      )
    }

    // Generate or search based on mode
    let item: ShopItemExtended | undefined
    let items: ShopItemExtended[] | undefined
    let originalEn: ShopItemExtended | undefined = undefined

    try {
      if (body.mode === 'generate') {
        item = await aiService.generateItem(body.prompt, body.language)
        
        // If not in English, also generate English version
        if (body.language !== 'en') {
          try {
            originalEn = await aiService.generateItem(body.prompt, 'en')
          } catch (enError) {
            console.warn('Failed to generate English version, continuing with translated version only')
            // Continue without English version if it fails
          }
        }

        if (!item) {
          return NextResponse.json(
            {
              error: 'Failed to generate item',
              details: 'No item was generated. Please try again with a different prompt.'
            },
            { status: 500 }
          )
        }
      } else {
        // Search mode: return multiple results
        items = await aiService.searchOfficialItems(body.prompt, body.language, 5)
        
        if (!items || items.length === 0) {
          return NextResponse.json(
            {
              error: 'No items found',
              details: 'No matching items found. Try a different search term.'
            },
            { status: 404 }
          )
        }

        // For backward compatibility, also set item to the first result
        item = items[0]
        
        // If not in English, also search in English for original
        if (body.language !== 'en') {
          try {
            const enResults = await aiService.searchOfficialItems(body.prompt, 'en', 1)
            if (enResults && enResults.length > 0) {
              originalEn = enResults[0]
            }
          } catch (enError) {
            console.warn('Failed to search English version, continuing with translated version only')
            // Continue without English version if it fails
          }
        }
      }
    } catch (generationError) {
      console.error('Error during item generation:', generationError)
      
      // Check if it's an API-related error
      const errorMessage = generationError instanceof Error ? generationError.message : 'Unknown error'
      const isApiError = errorMessage.includes('API') || errorMessage.includes('rate limit') || errorMessage.includes('quota') || errorMessage.includes('model')
      
      return NextResponse.json(
        {
          error: 'Failed to generate item',
          details: isApiError
            ? `AI service error: ${errorMessage}. Please check your API configuration and rate limits.`
            : errorMessage
        },
        { status: 500 }
      )
    }

    return NextResponse.json({
      item,
      items: items || undefined, // Include items array for search mode
      original_en: originalEn || undefined,
    })
  } catch (error) {
    console.error('Error generating item:', error)
    
    return NextResponse.json(
      {
        error: 'Failed to generate item',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}
