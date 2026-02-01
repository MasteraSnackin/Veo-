/**
 * Redis Cache Implementation using Upstash
 * 
 * Serverless-friendly HTTP-based Redis caching for production.
 * Falls back to in-memory cache if Redis is not configured.
 * 
 * Environment Variables Required:
 * - UPSTASH_REDIS_REST_URL
 * - UPSTASH_REDIS_REST_TOKEN
 */

import { Redis } from '@upstash/redis'
import { logger } from './logger'
import { cache as memoryCache, CacheTTL } from './cache'
import type { CachedData } from './types'

class RedisCache {
    private redis: Redis | null = null
    private isConfigured = false

    constructor() {
        // Try to initialize Redis
        const url = process.env.UPSTASH_REDIS_REST_URL
        const token = process.env.UPSTASH_REDIS_REST_TOKEN

        if (url && token) {
            try {
                this.redis = new Redis({
                    url,
                    token
                })
                this.isConfigured = true
                logger.info('Redis cache initialized', { provider: 'upstash' })
            } catch (error) {
                logger.warn('Failed to initialize Redis, falling back to memory cache', {
                    error: error instanceof Error ? error.message : 'Unknown error'
                })
            }
        } else {
            logger.info('Redis not configured, using memory cache', {
                missingVars: {
                    url: !url,
                    token: !token
                }
            })
        }
    }

    /**
     * Gets a value from cache
     */
    async get<T>(key: string): Promise<T | null> {
        if (!this.isConfigured || !this.redis) {
            return memoryCache.get<T>(key)
        }

        try {
            const value = await this.redis.get<T>(key)
            if (value) {
                logger.debug('Redis cache hit', { key })
                return value
            }
            logger.debug('Redis cache miss', { key })
            return null
        } catch (error) {
            logger.error('Redis get error, falling back to memory cache', error as Error, { key })
            return memoryCache.get<T>(key)
        }
    }

    /**
     * Sets a value in cache with TTL
     */
    async set<T>(key: string, data: T, ttl: number): Promise<void> {
        if (!this.isConfigured || !this.redis) {
            return memoryCache.set(key, data, ttl)
        }

        try {
            // Use SETEX for automatic TTL expiration
            await this.redis.setex(key, ttl, JSON.stringify(data))
            logger.debug('Redis cache set', { key, ttl })
        } catch (error) {
            logger.error('Redis set error, falling back to memory cache', error as Error, { key })
            return memoryCache.set(key, data, ttl)
        }
    }

    /**
     * Deletes a value from cache
     */
    async delete(key: string): Promise<void> {
        if (!this.isConfigured || !this.redis) {
            return memoryCache.delete(key)
        }

        try {
            await this.redis.del(key)
            logger.debug('Redis cache delete', { key })
        } catch (error) {
            logger.error('Redis delete error', error as Error, { key })
        }
    }

    /**
     * Clears all cache (dangerous - use with caution)
     */
    async clear(): Promise<void> {
        if (!this.isConfigured || !this.redis) {
            return memoryCache.clear()
        }

        logger.warn('Redis cache clear not implemented (use Upstash console)')
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
     * Gets cache statistics
     */
    async getStats() {
        if (!this.isConfigured || !this.redis) {
            return memoryCache.getStats()
        }

        try {
            const info = await this.redis.dbsize()
            return {
                totalEntries: info,
                provider: 'upstash-redis'
            }
        } catch (error) {
            logger.error('Redis stats error', error as Error)
            return {
                totalEntries: 0,
                provider: 'upstash-redis',
                error: true
            }
        }
    }

    /**
     * Check if Redis is configured and operational
     */
    isRedisAvailable(): boolean {
        return this.isConfigured && this.redis !== null
    }
}

// Export singleton instance
export const cache = new RedisCache()

// Export class for testing
export { RedisCache }

// Re-export TTL constants for convenience
export { CacheTTL }
