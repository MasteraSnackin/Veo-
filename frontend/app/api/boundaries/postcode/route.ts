/**
 * ONS Boundaries API Endpoint
 * ----------------------------
 * Provides UK area boundaries from ONS Open Geography Portal
 * for map visualization and spatial analysis.
 * 
 * @author Builder (Functionality & Logic Lead)
 * @endpoint GET /api/boundaries/postcode?postcode=E1_6AN
 * @cache 90 days (boundaries rarely change)
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { executePythonScript, getToolsScriptPath } from '@/lib/python-bridge';
import { ValidationError, toAppError } from '@/lib/errors';
import { logger } from '@/lib/logger';
import { cache } from '@/lib/cache';
import { validate, formatValidationErrors } from '@/lib/validators';
import type { ApiResponse } from '@/lib/types';

const apiLogger = logger.child({ endpoint: '/api/boundaries/postcode' });

// Request validation schema
const BoundaryQuerySchema = z.object({
    postcode: z.string()
        .min(5, 'Postcode must be at least 5 characters')
        .max(10, 'Postcode must be at most 10 characters')
        .regex(/^[A-Z0-9 ]+$/i, 'Invalid postcode format'),
    level: z.enum(['simple', 'full']).optional().default('simple'),
    no_cache: z.string().optional().transform(v => v === 'true')
});

// Response types
interface BoundaryData {
    postcode: string;
    location: {
        latitude: number;
        longitude: number;
    };
    administrative_areas?: {
        country: string;
        region: string;
        district: string;
        ward: string;
    };
    codes?: {
        msoa?: string;
        lsoa?: string;
        admin_district?: string;
        admin_ward?: string;
    };
    boundary?: any; // GeoJSON
    boundaries?: {
        lsoa?: any;
        msoa?: any;
        ward?: any;
        district?: any;
    };
    timestamp: string;
}

/**
 * GET /api/boundaries/postcode
 * 
 * Query Parameters:
 * - postcode (required): UK postcode (e.g., "E1 6AN", "SW1A 1AA")
 * - level (optional): "simple" (MSOA only) or "full" (all hierarchy levels)
 * - no_cache (optional): "true" to bypass cache and force fresh API call
 * 
 * Returns:
 * - 200: Boundary data with GeoJSON geometries
 * - 400: Validation error (invalid parameters)
 * - 500: Server error (ONS API failure)
 * 
 * Example:
 * GET /api/boundaries/postcode?postcode=E1_6AN
 * GET /api/boundaries/postcode?postcode=E1_6AN&level=full
 */
export async function GET(request: NextRequest) {
    const startTime = Date.now();

    try {
        // Extract query parameters
        const searchParams = request.nextUrl.searchParams;
        const queryData = {
            postcode: searchParams.get('postcode'),
            level: searchParams.get('level'),
            no_cache: searchParams.get('no_cache')
        };

        // Validate parameters
        const validation = validate(BoundaryQuerySchema, queryData);

        if (!validation.success) {
            const errors = formatValidationErrors(validation.errors!);
            throw new ValidationError('Invalid query parameters', { errors });
        }

        const query = validation.data!;

        apiLogger.info('Boundary request received', {
            postcode: query.postcode,
            level: query.level
        });

        // Generate cache key
        const cacheKey = `boundaries:${query.postcode}:${query.level}`;

        // Cache for 90 days (boundaries rarely change)
        const boundaryData = await cache.getOrSet<BoundaryData>(
            cacheKey,
            async () => {
                // Prepare Python script arguments
                const args = [query.postcode];

                if (query.level === 'full') {
                    args.push('--full');
                } else {
                    args.push('--simple');
                }

                if (query.no_cache) {
                    args.push('--no-cache');
                }

                // Execute Python script to fetch boundaries from ONS
                apiLogger.info('Executing ONS boundaries script', {
                    postcode: query.postcode,
                    level: query.level
                });

                const script = getToolsScriptPath('fetch_ons_boundaries.py');
                const result = await executePythonScript({ script, args });

                // Parse boundary data
                const boundaries: BoundaryData = JSON.parse(result.stdout);

                // Check for errors
                if ((boundaries as any).error) {
                    throw new Error(`ONS lookup failed: ${(boundaries as any).error}`);
                }

                apiLogger.info('Boundary data fetched successfully', {
                    postcode: query.postcode,
                    has_boundary: !!(boundaries.boundary || boundaries.boundaries)
                });

                return boundaries;
            },
            90 * 24 * 60 * 60 // 90 days TTL - boundaries rarely change
        );

        const duration = Date.now() - startTime;

        const response: ApiResponse<BoundaryData> = {
            success: true,
            data: boundaryData,
            metadata: {
                timestamp: new Date().toISOString(),
                executionTimeMs: duration,
                sourcesUsed: ['ons_open_geography', 'postcodes_io'],
                cached: !query.no_cache
            }
        };

        return NextResponse.json(response);

    } catch (error) {
        const duration = Date.now() - startTime;
        const appError = toAppError(error);

        apiLogger.error('Boundary request failed', appError, {
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
 * OPTIONS /api/boundaries/postcode
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
