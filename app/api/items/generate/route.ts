import { NextRequest, NextResponse } from 'next/server'
import { getAiProvider, type Language, type AiProvider } from '@/lib/services/item-ai-providers'

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
    const aiService = getAiProvider(provider)

    // Generate or search based on mode
    let item
    let originalEn

    if (body.mode === 'generate') {
      item = await aiService.generateItem(body.prompt, body.language)
      
      // If not in English, also generate English version
      if (body.language !== 'en') {
        originalEn = await aiService.generateItem(body.prompt, 'en')
      }
    } else {
      item = await aiService.searchOfficialItem(body.prompt, body.language)
      
      // If not in English, also search in English for original
      if (body.language !== 'en') {
        originalEn = await aiService.searchOfficialItem(body.prompt, 'en')
      }
    }

    return NextResponse.json({
      item,
      original_en: originalEn,
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
