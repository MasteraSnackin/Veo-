import { NextRequest, NextResponse } from 'next/server'
import {
  RecommendationRequestSchema,
  validate,
  formatValidationErrors
} from '@/lib/validators'
import {
  ValidationError,
  toAppError
} from '@/lib/errors'
import { logger } from '@/lib/logger'
import { cache, CacheTTL } from '@/lib/cache'
import {
  executePythonScript,
  getPythonScriptPath
} from '@/lib/python-bridge'
import type {
  RecommendationResponse,
  Recommendation
} from '@/lib/types'

const apiLogger = logger.child({ endpoint: '/api/recommendations' })

export async function POST(request: NextRequest) {
  const startTime = Date.now()

  try {
    // Parse and validate request body
    const body = await request.json()
    const validation = validate(RecommendationRequestSchema, body)

    if (!validation.success) {
      const errors = formatValidationErrors(validation.errors!)
      throw new ValidationError('Invalid request data', { errors })
    }

    const { persona, budget, locationType, destination, maxAreas } = validation.data!

    apiLogger.info('Recommendation request received', {
      persona,
      budget,
      locationType,
      destination,
      maxAreas
    })

    // Generate cache key
    const cacheKey = `recommendations:${persona}:${budget}:${locationType}:${destination}:${maxAreas}`

    // Try to get from cache
    const recommendations = await cache.getOrSet<Recommendation[]>(
      cacheKey,
      async () => {
        // Execute Python pipeline
        const pythonScript = getPythonScriptPath('demo_pipeline.py')
        const args = [
          '--persona', persona,
          '--budget', budget.toString(),
          '--type', locationType,
          '--max-areas', maxAreas!.toString(),
          '--no-explanations', // Skip explanations for faster response
          '--json' // Request JSON output
        ]

        // Add destination if provided
        if (destination) {
          args.push('--destination', destination)
        }

        apiLogger.debug('Executing Python pipeline', { script: pythonScript, args })

        const result = await executePythonScript({
          script: pythonScript,
          args,
          timeout: 60000 // 60 seconds
        })

        // Parse JSON output - strip out log lines that start with [ INFO], [CACHE], etc.
        const stdout = result.stdout
        const jsonLines = stdout.split('\n').filter(line =>
          !line.trim().startsWith('[') && line.trim().length > 0
        )
        const jsonString = jsonLines.join('\n')

        const jsonOutput = JSON.parse(jsonString)
        return jsonOutput.data.recommendations
      },
      CacheTTL.RECOMMENDATIONS
    )

    const executionTime = Date.now() - startTime

    const response: RecommendationResponse = {
      success: true,
      persona,
      budget,
      recommendations,
      metadata: {
        timestamp: new Date().toISOString(),
        executionTimeMs: executionTime,
        sourcesUsed: ['scansan', 'tfl', 'crime', 'schools', 'amenities'],
        cached: executionTime < 1000 // If very fast, likely cached
      }
    }

    apiLogger.info('Recommendation request completed', {
      recommendationCount: recommendations.length,
      executionTimeMs: executionTime
    })

    return NextResponse.json(response)

  } catch (error) {
    const appError = toAppError(error)
    const executionTime = Date.now() - startTime

    apiLogger.error('Recommendation request failed', appError, {
      executionTimeMs: executionTime
    })

    return NextResponse.json(
      {
        success: false,
        error: appError.toJSON(),
        metadata: {
          timestamp: new Date().toISOString(),
          executionTimeMs: executionTime,
          sourcesUsed: []
        }
      },
      { status: appError.statusCode }
    )
  }
}

/**
 * Parses Python script output into structured recommendations
 */
function parsePythonOutput(output: string): Recommendation[] {
  const recommendations: Recommendation[] = []
  const lines = output.split('\n')

  let currentRec: Partial<Recommendation> | null = null

  for (const line of lines) {
    // Parse recommendation rank and name
    // Format: #1. Stratford (E15) - Score: 85.5
    const rankMatch = line.match(/#(\d+)\.\s+([^(]+)\(([^)]+)\)\s+-\s+Score:\s+([\d.]+)/)
    if (rankMatch) {
      if (currentRec && currentRec.rank) {
        recommendations.push(currentRec as Recommendation)
      }
      currentRec = {
        rank: parseInt(rankMatch[1]),
        name: rankMatch[2].trim(),
        areaCode: rankMatch[3],
        score: Math.round(parseFloat(rankMatch[4])),
        factors: {},
        strengths: [],
        weaknesses: []
      }
    }

    // Parse factor scores
    // Format: safety: 85/100
    const factorMatch = line.match(/^\s+(\w+)\s*:\s*(\d+)\/100/)
    if (factorMatch && currentRec) {
      currentRec.factors![factorMatch[1]] = parseInt(factorMatch[2])
    }

    // Parse strengths
    // Format: [+] Strengths: good safety, excellent commute
    const strengthMatch = line.match(/\[[\+✓]\]\s*Strengths:\s*(.+)/)
    if (strengthMatch && currentRec) {
      currentRec.strengths = strengthMatch[1]
        .split(',')
        .map(s => s.trim())
        .filter(s => s.length > 0)
    }

    // Parse weaknesses
    // Format: [-] Weaknesses: high prices, limited schools
    const weaknessMatch = line.match(/\[[\-!]\]\s*(?:Weaknesses|Considerations):\s*(.+)/)
    if (weaknessMatch && currentRec) {
      currentRec.weaknesses = weaknessMatch[1]
        .split(',')
        .map(s => s.trim())
        .filter(s => s.length > 0)
    }
  }

  // Add last recommendation
  if (currentRec && currentRec.rank) {
    recommendations.push(currentRec as Recommendation)
  }

  return recommendations
}
