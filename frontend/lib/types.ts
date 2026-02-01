/**
 * Core TypeScript types for the Veo Housing Platform
 * Defines all data models used across the application
 */

// ============================================================================
// User Input Types
// ============================================================================

export type Persona = 'student' | 'parent' | 'developer'
export type LocationType = 'rent' | 'buy'

export interface RecommendationRequest {
  persona: Persona
  budget: number
  locationType: LocationType
  destination?: string
  maxAreas?: number
}

// ============================================================================
// Recommendation Types
// ============================================================================

export interface FactorScores {
  safety?: number
  commute?: number
  schools?: number
  amenities?: number
  property_prices?: number
  nightlife?: number
  green_spaces?: number
  affordability?: number
  development?: number
  [key: string]: number | undefined
}

export interface Recommendation {
  rank: number
  name: string
  areaCode: string
  score: number
  factors: FactorScores
  strengths: string[]
  weaknesses: string[]
  explanation?: string
}

export interface RecommendationResponse {
  success: boolean
  persona: string
  budget: number
  recommendations: Recommendation[]
  metadata?: ResponseMetadata
}

// ============================================================================
// Area Data Types
// ============================================================================

export interface AreaData {
  areaCode: string
  name: string
  scansan?: ScanSanData
  commute?: CommuteData
  crime?: CrimeData
  schools?: SchoolsData
  amenities?: AmenitiesData
}

export interface ScanSanData {
  averagePrice?: number
  priceChange?: number
  demand?: string
  supply?: string
  insights?: string[]
}

export interface CommuteData {
  destination: string
  duration: number
  modes: string[]
  routes?: CommuteRoute[]
}

export interface CommuteRoute {
  mode: string
  duration: number
  steps?: string[]
}

export interface CrimeData {
  totalCrimes: number
  crimeRate: number
  breakdown: {
    [category: string]: number
  }
  trend?: 'increasing' | 'decreasing' | 'stable'
}

export interface SchoolsData {
  count: number
  averageRating: number
  outstanding: number
  good: number
  schools?: School[]
}

export interface School {
  name: string
  rating: string
  distance?: number
}

export interface AmenitiesData {
  restaurants: number
  cafes: number
  gyms: number
  parks: number
  supermarkets: number
  total: number
}

// ============================================================================
// Persona Configuration Types
// ============================================================================

export interface PersonaWeights {
  safety: number
  commute: number
  schools: number
  amenities: number
  property_prices: number
  nightlife: number
  green_spaces: number
  affordability: number
  development?: number
}

export interface PersonaConfig {
  name: Persona
  displayName: string
  description: string
  weights: PersonaWeights
  priorities: string[]
}

// ============================================================================
// API Response Types
// ============================================================================

export interface ResponseMetadata {
  timestamp: string
  executionTimeMs: number
  sourcesUsed: string[]
  cached?: boolean
}

export interface ApiResponse<T = any> {
  success: boolean
  data?: T
  error?: ApiError
  metadata?: ResponseMetadata
}

export interface ApiError {
  code: string
  message: string
  details?: any
  stack?: string
}

// ============================================================================
// Health Check Types
// ============================================================================

export interface HealthCheckResponse {
  status: 'healthy' | 'degraded' | 'unhealthy'
  version: string
  timestamp: string
  services: ServiceHealth[]
  uptime: number
}

export interface ServiceHealth {
  name: string
  status: 'up' | 'down' | 'degraded'
  latency?: number
  error?: string
}

// ============================================================================
// Cache Types
// ============================================================================

export interface CacheConfig {
  ttl: number // Time to live in seconds
  key: string
}

export interface CachedData<T> {
  data: T
  timestamp: number
  ttl: number
}

// ============================================================================
// Python Bridge Types
// ============================================================================

export interface PythonScriptOptions {
  script: string
  args: string[]
  timeout?: number
  cwd?: string
}

export interface PythonScriptResult {
  stdout: string
  stderr: string
  exitCode: number
  executionTime: number
}
