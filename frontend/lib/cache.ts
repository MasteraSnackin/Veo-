/**
 * Cache abstraction layer
 * Supports in-memory caching with future Redis/Vercel KV support
 */

import { logger } from './logger'
import type { CachedData, CacheConfig } from './types'

interface CacheStore {
  [key: string]: CachedData<any>
}

class Cache {
  private store: CacheStore = {}
  private cleanupInterval: NodeJS.Timeout | null = null

  constructor() {
    // Run cleanup every 5 minutes
    this.cleanupInterval = setInterval(() => this.cleanup(), 5 * 60 * 1000)
  }

  /**
   * Gets a value from cache
   */
  async get<T>(key: string): Promise<T | null> {
    const cached = this.store[key]

    if (!cached) {
      logger.debug('Cache miss', { key })
      return null
    }

    // Check if expired
    const now = Date.now()
    const age = now - cached.timestamp
    if (age > cached.ttl * 1000) {
      logger.debug('Cache expired', { key, ageMs: age })
      delete this.store[key]
      return null
    }

    logger.debug('Cache hit', { key, ageMs: age })
    return cached.data as T
  }

  /**
   * Sets a value in cache
   */
  async set<T>(key: string, data: T, ttl: number): Promise<void> {
    this.store[key] = {
      data,
      timestamp: Date.now(),
      ttl
    }

    logger.debug('Cache set', { key, ttl })
  }

  /**
   * Deletes a value from cache
   */
  async delete(key: string): Promise<void> {
    delete this.store[key]
    logger.debug('Cache delete', { key })
  }

  /**
   * Clears all cache
   */
  async clear(): Promise<void> {
    this.store = {}
    logger.info('Cache cleared')
  }

  /**
   * Gets or sets a value using a factory function
   */
  async getOrSet<T>(
    key: string,
    factory: () => Promise<T>,
    ttl: number
  ): Promise<T> {
    // Try to get from cache
    const cached = await this.get<T>(key)
    if (cached !== null) {
      return cached
    }

    // Cache miss - execute factory
    logger.debug('Cache miss - executing factory', { key })
    const data = await factory()

    // Store in cache
    await this.set(key, data, ttl)

    return data
  }

  /**
   * Removes expired entries
   */
  private cleanup(): void {
    const now = Date.now()
    let removed = 0

    for (const [key, cached] of Object.entries(this.store)) {
      const age = now - cached.timestamp
      if (age > cached.ttl * 1000) {
        delete this.store[key]
        removed++
      }
    }

    if (removed > 0) {
      logger.debug('Cache cleanup completed', { removed })
    }
  }

  /**
   * Gets cache statistics
   */
  getStats() {
    const entries = Object.entries(this.store)
    const now = Date.now()

    return {
      totalEntries: entries.length,
      byTTL: entries.reduce((acc, [_, cached]) => {
        const remaining = Math.max(0, cached.ttl - (now - cached.timestamp) / 1000)
        const bucket = remaining < 60 ? '<1m' : remaining < 3600 ? '<1h' : '>1h'
        acc[bucket] = (acc[bucket] || 0) + 1
        return acc
      }, {} as Record<string, number>)
    }
  }

  /**
   * Stops the cleanup interval (for testing/shutdown)
   */
  destroy(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval)
      this.cleanupInterval = null
    }
  }
}

// ============================================================================
// Cache Configuration Presets
// ============================================================================

export const CacheTTL = {
  AREA_DATA: 24 * 60 * 60,      // 24 hours
  COMMUTE: 7 * 24 * 60 * 60,    // 7 days
  CRIME: 30 * 24 * 60 * 60,     // 30 days
  SCHOOLS: 90 * 24 * 60 * 60,   // 90 days
  RECOMMENDATIONS: 60 * 60,      // 1 hour
  SIX_HOURS: 6 * 60 * 60,       // 6 hours (for real-time data)
  HEALTH_CHECK: 60,              // 1 minute
} as const

// Export singleton instance
export const cache = new Cache()

// Export class for testing
export { Cache }
