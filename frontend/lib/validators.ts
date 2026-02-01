/**
 * Validation schemas using Zod
 * Provides runtime validation for all API inputs and outputs
 */

import { z } from 'zod'

// ============================================================================
// Request Validation Schemas
// ============================================================================

export const PersonaSchema = z.enum(['student', 'parent', 'developer'], {
  errorMap: () => ({ message: 'Persona must be one of: student, parent, developer' })
})

export const LocationTypeSchema = z.enum(['rent', 'buy'], {
  errorMap: () => ({ message: 'Location type must be either rent or buy' })
})

export const RecommendationRequestSchema = z.object({
  persona: PersonaSchema,
  budget: z.number()
    .min(500, 'Budget must be at least £500')
    .max(50000, 'Budget must not exceed £50,000'),
  locationType: LocationTypeSchema,
  destination: z.string().optional(),
  maxAreas: z.number()
    .int('Max areas must be an integer')
    .min(1, 'Must request at least 1 area')
    .max(20, 'Cannot request more than 20 areas')
    .default(5)
})

export const CommuteRequestSchema = z.object({
  origin: z.string().min(1, 'Origin is required'),
  destination: z.string().min(1, 'Destination is required'),
  modes: z.array(z.string()).optional()
})

export const AreaCodeSchema = z.string()
  .regex(/^[A-Z]{1,2}\d{1,2}[A-Z]?$/, 'Invalid UK postcode area format')

// ============================================================================
// Response Validation Schemas
// ============================================================================

export const FactorScoresSchema = z.record(z.number().min(0).max(100))

export const RecommendationSchema = z.object({
  rank: z.number().int().min(1),
  name: z.string().min(1),
  areaCode: z.string().min(1),
  score: z.number().min(0).max(100),
  factors: FactorScoresSchema,
  strengths: z.array(z.string()),
  weaknesses: z.array(z.string()),
  explanation: z.string().optional()
})

export const RecommendationResponseSchema = z.object({
  success: z.boolean(),
  persona: z.string(),
  budget: z.number(),
  recommendations: z.array(RecommendationSchema),
  metadata: z.object({
    timestamp: z.string(),
    executionTimeMs: z.number(),
    sourcesUsed: z.array(z.string()),
    cached: z.boolean().optional()
  }).optional()
})

// ============================================================================
// Validation Helper Functions
// ============================================================================

/**
 * Validates data against a schema and returns typed result
 */
export function validate<T>(schema: z.ZodSchema<T>, data: unknown): {
  success: boolean
  data?: T
  errors?: z.ZodIssue[]
} {
  const result = schema.safeParse(data)

  if (result.success) {
    return { success: true, data: result.data }
  } else {
    return { success: false, errors: result.error.issues }
  }
}

/**
 * Validates data and throws on error
 */
export function validateOrThrow<T>(schema: z.ZodSchema<T>, data: unknown): T {
  return schema.parse(data)
}

/**
 * Formats validation errors into readable messages
 */
export function formatValidationErrors(errors: z.ZodIssue[]): string[] {
  return errors.map(err => {
    const path = err.path.join('.')
    return path ? `${path}: ${err.message}` : err.message
  })
}
