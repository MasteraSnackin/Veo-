/**
 * Area Research API Endpoint
 * ---------------------------
 * Provides real-time research and contextual information about areas
 * using Perplexity API for current developments, market trends, and news.
 * 
 * @author Builder (Functionality & Logic Lead)
 * @endpoint GET /api/research/area?area_code=E1_6AN&persona=student
 * @cache 6 hours (shorter for real-time data)
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { executePythonScript, getToolsScriptPath } from '@/lib/python-bridge';
import { ValidationError, toAppError } from '@/lib/errors';
import { logger } from '@/lib/logger';
import { cache, CacheTTL } from '@/lib/cache';
import { validate, formatValidationErrors } from '@/lib/validators';
import type { ApiResponse } from '@/lib/types';

const apiLogger = logger.child({ endpoint: '/api/research/area' });

// Request validation schema
const ResearchQuerySchema = z.object({
    area_code: z.string()
        .min(2, 'Area code must be at least 2 characters')
        .max(10, 'Area code must be at most 10 characters'),
    persona: z.enum(['student', 'parent', 'developer']).optional(),
    postcode: z.string().optional(),
    no_cache: z.string().optional().transform(v => v === 'true')
});

// Response type
interface PerplexityResearch {
    area_code: string;
    postcode?: string;
    research_type: string;
    overview: {
        content: string;
        citations: string[];
        summary_points: string[];
    };
    persona_insights?: {
        content: string;
        citations: string[];
        summary_points: string[];
    };
    timestamp: string;
}

/**
 * GET /api/research/area
 * 
 * Query Parameters:
 * - area_code (required): UK area code (e.g., "E1_6AN", "SW1A")
 * - persona (optional): "student" | "parent" | "developer" for specific insights
 * - postcode (optional): Full postcode for more specific results
 * - no_cache (optional): "true" to bypass cache and force fresh API call
 * 
 * Returns:
 * - 200: Research data with overview and optional persona insights
 * - 400: Validation error (invalid parameters)
 * - 500: Server error (Perplexity API failure)
 * 
 * Example:
 * GET /api/research/area?area_code=E1_6AN&persona=student
 */
export async function GET(request: NextRequest) {
    const startTime = Date.now();

    try {
        // Extract query parameters
        const searchParams = request.nextUrl.searchParams;
        const queryData = {
            area_code: searchParams.get('area_code'),
            persona: searchParams.get('persona'),
            postcode: searchParams.get('postcode'),
            no_cache: searchParams.get('no_cache')
        };

        // Validate parameters
        const validation = validate(ResearchQuerySchema, queryData);

        if (!validation.success) {
            const errors = formatValidationErrors(validation.errors!);
            throw new ValidationError('Invalid query parameters', { errors });
        }

        const query = validation.data!;

        apiLogger.info('Research request received', {
            area_code: query.area_code,
            persona: query.persona
        });

        // Generate cache key (include persona for cache separation)
        const cacheKey = `research:${query.area_code}:${query.persona || 'overview'}`;

        // Try to get from cache (6 hours TTL for real-time data)
        const researchData = await cache.getOrSet<PerplexityResearch>(
            cacheKey,
            async () => {
                // Prepare Python script arguments
                const args = [query.area_code];

                if (query.persona) {
                    args.push('--persona', query.persona);
                }

                if (query.postcode) {
                    args.push('--postcode', query.postcode);
                }

                if (query.no_cache) {
                    args.push('--no-cache');
                }

                // Execute Python script to fetch research from Perplexity
                apiLogger.info('Executing Perplexity research script', {
                    area_code: query.area_code,
                    persona: query.persona
                });

                const script = getToolsScriptPath('fetch_perplexity.py');
                const result = await executePythonScript({ script, args });

                // Parse research data
                const research: PerplexityResearch = JSON.parse(result.stdout);

                // Validate we got actual research content
                if (!research.overview || !research.overview.content) {
                    throw new Error('Research data incomplete or missing content');
                }

                apiLogger.info('Research data fetched successfully', {
                    area_code: query.area_code,
                    has_overview: !!research.overview,
                    has_insights: !!research.persona_insights
                });

                return research;
            },
            CacheTTL.SIX_HOURS // 6 hours TTL for real-time data
        );

        const duration = Date.now() - startTime;

        const response: ApiResponse<PerplexityResearch> = {
            success: true,
            data: researchData,
            metadata: {
                timestamp: new Date().toISOString(),
                executionTimeMs: duration,
                sourcesUsed: ['perplexity_api'],
                cached: !query.no_cache
            }
        };

        return NextResponse.json(response);

    } catch (error) {
        const duration = Date.now() - startTime;
        const appError = toAppError(error);

        apiLogger.error('Research request failed', appError, {
            duration,
            stack: appError.stack
        });

        const response: ApiResponse<null> = {
            success: false,
            error: {
                code: appError.name,
                message: appError.message,
                details: (appError as any).context
            },
            metadata: {
                timestamp: new Date().toISOString(),
                executionTimeMs: duration,
                sourcesUsed: []
            }
        };

        return NextResponse.json(
            response,
            { status: appError instanceof ValidationError ? 400 : 500 }
        );
    }
}

/**
 * OPTIONS /api/research/area
 * CORS preflight handler
 */
export async function OPTIONS(request: NextRequest) {
    return new NextResponse(null, {
        status: 200,
        headers: {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'GET, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        },
    });
}
