import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { logger } from '@/lib/logger'
import { cache, CacheTTL } from '@/lib/cache'
import { toAppError, ValidationError } from '@/lib/errors'
import { validate, formatValidationErrors } from '@/lib/validators'
import { executePythonScript, getPythonScriptPath } from '@/lib/python-bridge'
import type { CommuteData, ApiResponse } from '@/lib/types'

const apiLogger = logger.child({ endpoint: '/api/commute/calculate' })

// Request validation schema
const CommuteRequestSchema = z.object({
    origin: z.string().min(2).max(10),
    destination: z.string().min(2).max(50)
})

export async function POST(request: NextRequest) {
    const startTime = Date.now()

    try {
        // Parse and validate request body
        const body = await request.json()
        const validation = validate(CommuteRequestSchema, body)

        if (!validation.success) {
            const errors = formatValidationErrors(validation.errors!)
            throw new ValidationError('Invalid request data', { errors })
        }

        const { origin, destination } = validation.data!

        apiLogger.info('Commute calculation request received', {
            origin,
            destination
        })

        // Generate cache key
        const cacheKey = `commute:${origin}:${destination}`

        // Try to get from cache
        const commuteData = await cache.getOrSet<CommuteData>(
            cacheKey,
            async () => {
                // In production, this would call Modal function: calculate_commute
                // For now, call Python script directly

                const script = getPythonScriptPath('tools/fetch_tfl_commute.py')
                const result = await executePythonScript({
                    script,
                    args: [origin, destination],
                    timeout: 30000 // 30 seconds
                })

                if (!result.stdout) {
                    throw new Error('No commute data returned from TfL API')
                }

                // Parse JSON output
                try {
                    return JSON.parse(result.stdout) as CommuteData
                } catch (parseError) {
                    apiLogger.error('Failed to parse commute data', parseError as Error, {
                        stdout: result.stdout
                    })
                    throw new Error('Invalid commute data format')
                }
            },
            CacheTTL.COMMUTE
        )

        const executionTime = Date.now() - startTime

        const response: ApiResponse<CommuteData> = {
            success: true,
            data: commuteData,
            metadata: {
                timestamp: new Date().toISOString(),
                executionTimeMs: executionTime,
                sourcesUsed: ['tfl'],
                cached: executionTime < 100
            }
        }

        apiLogger.info('Commute calculation completed', {
            origin,
            destination,
            duration: commuteData.duration,
            executionTimeMs: executionTime
        })

        return NextResponse.json(response)

    } catch (error) {
        const appError = toAppError(error)
        const executionTime = Date.now() - startTime

        apiLogger.error('Commute calculation failed', appError, {
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
