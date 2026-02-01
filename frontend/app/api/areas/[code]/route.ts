import { NextRequest, NextResponse } from 'next/server'
import { logger } from '@/lib/logger'
import { cache, CacheTTL } from '@/lib/cache'
import { toAppError, NotFoundError } from '@/lib/errors'
import { executePythonScript, getPythonScriptPath } from '@/lib/python-bridge'
import type { AreaData, ApiResponse } from '@/lib/types'

const apiLogger = logger.child({ endpoint: '/api/areas/[code]' })

/**
 * Validates UK area code format
 */
function isValidAreaCode(code: string): boolean {
    // UK postcode area format: 1-2 letters followed by optional digits
    return /^[A-Z]{1,2}\d{0,2}$/.test(code)
}

export async function GET(
    request: NextRequest,
    { params }: { params: { code: string } }
) {
    const startTime = Date.now()
    const areaCode = params.code?.toUpperCase()

    try {
        if (!areaCode || !isValidAreaCode(areaCode)) {
            throw new NotFoundError(`Invalid area code: ${areaCode}`)
        }

        apiLogger.info('Area data request received', { areaCode })

        // Extract optional destination from query params
        const searchParams = request.nextUrl.searchParams
        const destination = searchParams.get('destination') || undefined

        // Generate cache key
        const cacheKey = `area:${areaCode}:${destination || 'no-dest'}`

        // Try to get from cache
        const areaData = await cache.getOrSet<AreaData>(
            cacheKey,
            async () => {
                // In production, this would call Modal function: fetch_area_data
                // For now, aggregate data from Python scripts

                const data: AreaData = {
                    areaCode,
                    name: areaCode, // Would be enriched from Scansan data
                }

                // Fetch Scansan data
                try {
                    const scansanScript = getPythonScriptPath('tools/fetch_scansan.py')
                    const scansanResult = await executePythonScript({
                        script: scansanScript,
                        args: [areaCode],
                        timeout: 10000
                    })
                    if (scansanResult.stdout) {
                        data.scansan = JSON.parse(scansanResult.stdout)
                    }
                } catch (error) {
                    apiLogger.warn('Failed to fetch Scansan data', { areaCode, error })
                }

                // Fetch crime data
                try {
                    const crimeScript = getPythonScriptPath('tools/fetch_crime_data.py')
                    const crimeResult = await executePythonScript({
                        script: crimeScript,
                        args: [areaCode],
                        timeout: 10000
                    })
                    if (crimeResult.stdout) {
                        data.crime = JSON.parse(crimeResult.stdout)
                    }
                } catch (error) {
                    apiLogger.warn('Failed to fetch crime data', { areaCode, error })
                }

                // Fetch schools data
                try {
                    const schoolsScript = getPythonScriptPath('tools/fetch_schools.py')
                    const schoolsResult = await executePythonScript({
                        script: schoolsScript,
                        args: [areaCode],
                        timeout: 10000
                    })
                    if (schoolsResult.stdout) {
                        data.schools = JSON.parse(schoolsResult.stdout)
                    }
                } catch (error) {
                    apiLogger.warn('Failed to fetch schools data', { areaCode, error })
                }

                // Fetch amenities data
                try {
                    const amenitiesScript = getPythonScriptPath('tools/fetch_amenities.py')
                    const amenitiesResult = await executePythonScript({
                        script: amenitiesScript,
                        args: [areaCode],
                        timeout: 10000
                    })
                    if (amenitiesResult.stdout) {
                        data.amenities = JSON.parse(amenitiesResult.stdout)
                    }
                } catch (error) {
                    apiLogger.warn('Failed to fetch amenities data', { areaCode, error })
                }

                // Fetch commute data if destination provided
                if (destination) {
                    try {
                        const commuteScript = getPythonScriptPath('tools/fetch_tfl_commute.py')
                        const commuteResult = await executePythonScript({
                            script: commuteScript,
                            args: [areaCode, destination],
                            timeout: 10000
                        })
                        if (commuteResult.stdout) {
                            data.commute = JSON.parse(commuteResult.stdout)
                        }
                    } catch (error) {
                        apiLogger.warn('Failed to fetch commute data', { areaCode, destination, error })
                    }
                }

                return data
            },
            CacheTTL.AREA_DATA
        )

        const executionTime = Date.now() - startTime

        const response: ApiResponse<AreaData> = {
            success: true,
            data: areaData,
            metadata: {
                timestamp: new Date().toISOString(),
                executionTimeMs: executionTime,
                sourcesUsed: [
                    areaData.scansan ? 'scansan' : '',
                    areaData.crime ? 'crime' : '',
                    areaData.schools ? 'schools' : '',
                    areaData.amenities ? 'amenities' : '',
                    areaData.commute ? 'commute' : ''
                ].filter(Boolean),
                cached: executionTime < 100
            }
        }

        apiLogger.info('Area data request completed', {
            areaCode,
            executionTimeMs: executionTime,
            sources: response.metadata?.sourcesUsed
        })

        return NextResponse.json(response)

    } catch (error) {
        const appError = toAppError(error)
        const executionTime = Date.now() - startTime

        apiLogger.error('Area data request failed', appError, {
            areaCode,
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
