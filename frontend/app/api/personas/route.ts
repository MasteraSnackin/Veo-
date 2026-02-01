import { NextResponse } from 'next/server'
import { getAllPersonas } from '@/lib/personas'
import type { ApiResponse, PersonaConfig } from '@/lib/types'

export async function GET() {
  try {
    const personas = getAllPersonas()

    const response: ApiResponse<PersonaConfig[]> = {
      success: true,
      data: personas,
      metadata: {
        timestamp: new Date().toISOString(),
        executionTimeMs: 0,
        sourcesUsed: []
      }
    }

    return NextResponse.json(response)
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: error instanceof Error ? error.message : 'Failed to fetch personas'
        }
      },
      { status: 500 }
    )
  }
}
