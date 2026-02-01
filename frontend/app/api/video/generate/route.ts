import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { logger } from '@/lib/logger'
import { cache, CacheTTL } from '@/lib/cache'
import { toAppError, ValidationError } from '@/lib/errors'
import { validate, formatValidationErrors } from '@/lib/validators'
import { executePythonScript, getPythonScriptPath } from '@/lib/python-bridge'
import type { Recommendation, ApiResponse } from '@/lib/types'

const apiLogger = logger.child({ endpoint: '/api/video/generate' })

// Request validation schema
const VideoGenerationRequestSchema = z.object({
    areaData: z.object({
        rank: z.number(),
        name: z.string(),
        areaCode: z.string(),
        score: z.number(),
        factors: z.record(z.string(), z.number()),
        strengths: z.array(z.string()),
        weaknesses: z.array(z.string())
    }),
    persona: z.enum(['student', 'parent', 'developer']),
    apiPreference: z.enum(['veo', 'sora', 'ltx', 'nano']).optional().default('veo'),
    duration: z.number().min(30).max(60).optional().default(45),
    includeSubtitles: z.boolean().optional().default(true)
})

export type VideoGenerationRequest = z.infer<typeof VideoGenerationRequestSchema>

export interface VideoGenerationResult {
    areaCode: string
    videoUrl: string
    thumbnailUrl: string
    durationSeconds: number
    script: string
    generationApi: string
    generationTimeSeconds: number
    costUsd: number
    hasSubtitles: boolean
    timestamp: string
}

export async function POST(request: NextRequest) {
    const startTime = Date.now()

    try {
        // Parse and validate request body
        const body = await request.json()
        const validation = validate(VideoGenerationRequestSchema, body)

        if (!validation.success) {
            const errors = formatValidationErrors(validation.errors!)
            throw new ValidationError('Invalid request data', { errors })
        }

        const { areaData, persona, apiPreference, duration, includeSubtitles } = validation.data!

        apiLogger.info('Video generation request received', {
            areaCode: areaData.areaCode,
            persona,
            apiPreference,
            duration
        })

        // Generate cache key (cache for 30 days as per directive)
        const cacheKey = `video:${areaData.areaCode}:${persona}:${duration}`

        // Try to get from cache (expensive operation)
        const videoResult = await cache.getOrSet<VideoGenerationResult>(
            cacheKey,
            async () => {
                // Execute Python video generation script
                const script = getPythonScriptPath('execution/generate_video.py')
                const args = [
                    '--area-data', JSON.stringify(areaData),
                    '--persona', persona,
                    '--api', apiPreference!,
                    '--duration', duration!.toString(),
                    '--json'
                ]

                if (!includeSubtitles) {
                    args.push('--no-subtitles')
                }

                apiLogger.debug('Executing video generation script', { script, args })

                const result = await executePythonScript({
                    script,
                    args,
                    timeout: 180000 // 3 minutes (video generation is slow)
                })

                if (!result.stdout) {
                    throw new Error('No output from video generation script')
                }

                // Parse JSON output
                try {
                    const output = JSON.parse(result.stdout)
                    if (!output.success) {
                        throw new Error(output.error || 'Video generation failed')
                    }
                    return output as VideoGenerationResult
                } catch (parseError) {
                    apiLogger.error('Failed to parse video generation output', parseError as Error, {
                        stdout: result.stdout
                    })
                    throw new Error('Invalid video generation output format')
                }
            },
            30 * 24 * 60 * 60 // 30 days cache (videos are expensive to generate)
        )

        const executionTime = Date.now() - startTime

        const response: ApiResponse<VideoGenerationResult> = {
            success: true,
            data: videoResult,
            metadata: {
                timestamp: new Date().toISOString(),
                executionTimeMs: executionTime,
                sourcesUsed: [videoResult.generationApi],
                cached: executionTime < 1000
            }
        }

        apiLogger.info('Video generation completed', {
            areaCode: areaData.areaCode,
            api: videoResult.generationApi,
            costUsd: videoResult.costUsd,
            executionTimeMs: executionTime
        })

        return NextResponse.json(response)

    } catch (error) {
        const appError = toAppError(error)
        const executionTime = Date.now() - startTime

        apiLogger.error('Video generation failed', appError, {
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
