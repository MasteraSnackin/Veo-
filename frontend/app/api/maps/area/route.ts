import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { logger } from '@/lib/logger'
import { cache, CacheTTL } from '@/lib/cache'
import { toAppError, ValidationError } from '@/lib/errors'
import { validate, formatValidationErrors } from '@/lib/validators'
import { executePythonScript, getPythonScriptPath } from '@/lib/python-bridge'
import type { ApiResponse } from '@/lib/types'

const apiLogger = logger.child({ endpoint: '/api/maps/area' })

// Request validation schema
const MapsRequestSchema = z.object({
    areaCode: z.string().min(2).max(10),
    destination: z.string().optional(),
    downloadMap: z.boolean().optional().default(false)
})

export interface MapsData {
    areaCode: string
    geocoding: {
        lat: number
        lng: number
        formattedAddress: string
        placeId?: string
    } | null
    staticMapUrl: string | null
    nearbyPlaces: {
        restaurant?: number
        school?: number
        park?: number
        supermarket?: number
        hospital?: number
    }
    distanceToDestination?: {
        distance: string
        distanceMeters: number
        duration: string
        durationSeconds: number
    } | null
}

export async function POST(request: NextRequest) {
    const startTime = Date.now()

    try {
        // Parse and validate request body
        const body = await request.json()
        const validation = validate(MapsRequestSchema, body)

        if (!validation.success) {
            const errors = formatValidationErrors(validation.errors!)
            throw new ValidationError('Invalid request data', { errors })
        }

        const { areaCode, destination, downloadMap } = validation.data!

        apiLogger.info('Maps data request received', {
            areaCode,
            destination,
            downloadMap
        })

        // Generate cache key
        const cacheKey = `maps:${areaCode}:${destination || 'no-dest'}`

        // Try to get from cache (7 days - maps don't change frequently)
        const mapsData = await cache.getOrSet<MapsData>(
            cacheKey,
            async () => {
                // Execute Python Google Maps script
                const script = getPythonScriptPath('tools/fetch_google_maps.py')
                const args = [areaCode, '--json']

                if (destination) {
                    args.splice(1, 0, '--destination', destination)
                }

                apiLogger.debug('Executing Google Maps script', { script, args })

                const result = await executePythonScript({
                    script,
                    args,
                    timeout: 15000 // 15 seconds
                })

                if (!result.stdout) {
                    throw new Error('No output from Google Maps script')
                }

                // Parse JSON output
                try {
                    return JSON.parse(result.stdout) as MapsData
                } catch (parseError) {
                    apiLogger.error('Failed to parse maps data', parseError as Error, {
                        stdout: result.stdout
                    })
                    throw new Error('Invalid maps data format')
                }
            },
            CacheTTL.COMMUTE // 7 days cache
        )

        const executionTime = Date.now() - startTime

        const response: ApiResponse<MapsData> = {
            success: true,
            data: mapsData,
            metadata: {
                timestamp: new Date().toISOString(),
                executionTimeMs: executionTime,
                sourcesUsed: ['google-maps'],
                cached: executionTime < 100
            }
        }

        apiLogger.info('Maps data request completed', {
            areaCode,
            hasGeocoding: !!mapsData.geocoding,
            hasMap: !!mapsData.staticMapUrl,
            executionTimeMs: executionTime
        })

        return NextResponse.json(response)

    } catch (error) {
        const appError = toAppError(error)
        const executionTime = Date.now() - startTime

        apiLogger.error('Maps data request failed', appError, {
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
