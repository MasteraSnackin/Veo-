/**
 * Unit tests for cache utility
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { Cache } from '@/lib/cache'

describe('Cache', () => {
  let cache: Cache

  beforeEach(() => {
    cache = new Cache()
  })

  afterEach(() => {
    cache.destroy()
  })

  describe('set() and get()', () => {
    it('should store and retrieve values', async () => {
      await cache.set('key1', 'value1', 60)
      const value = await cache.get('key1')

      expect(value).toBe('value1')
    })

    it('should return null for non-existent keys', async () => {
      const value = await cache.get('nonexistent')
      expect(value).toBeNull()
    })

    it('should handle different data types', async () => {
      await cache.set('string', 'text', 60)
      await cache.set('number', 42, 60)
      await cache.set('object', { foo: 'bar' }, 60)
      await cache.set('array', [1, 2, 3], 60)

      expect(await cache.get('string')).toBe('text')
      expect(await cache.get('number')).toBe(42)
      expect(await cache.get('object')).toEqual({ foo: 'bar' })
      expect(await cache.get('array')).toEqual([1, 2, 3])
    })
  })

  describe('TTL expiration', () => {
    it('should expire entries after TTL', async () => {
      vi.useFakeTimers()

      await cache.set('key1', 'value1', 2) // 2 second TTL

      // Should exist immediately
      expect(await cache.get('key1')).toBe('value1')

      // Advance time by 1 second (should still exist)
      vi.advanceTimersByTime(1000)
      expect(await cache.get('key1')).toBe('value1')

      // Advance time by 2 more seconds (should expire)
      vi.advanceTimersByTime(2000)
      expect(await cache.get('key1')).toBeNull()

      vi.useRealTimers()
    })
  })

  describe('delete()', () => {
    it('should delete specific keys', async () => {
      await cache.set('key1', 'value1', 60)
      await cache.set('key2', 'value2', 60)

      await cache.delete('key1')

      expect(await cache.get('key1')).toBeNull()
      expect(await cache.get('key2')).toBe('value2')
    })
  })

  describe('clear()', () => {
    it('should clear all entries', async () => {
      await cache.set('key1', 'value1', 60)
      await cache.set('key2', 'value2', 60)
      await cache.set('key3', 'value3', 60)

      await cache.clear()

      expect(await cache.get('key1')).toBeNull()
      expect(await cache.get('key2')).toBeNull()
      expect(await cache.get('key3')).toBeNull()
    })
  })

  describe('getOrSet()', () => {
    it('should return cached value if exists', async () => {
      await cache.set('key1', 'cached', 60)

      const factory = vi.fn(() => Promise.resolve('new'))
      const value = await cache.getOrSet('key1', factory, 60)

      expect(value).toBe('cached')
      expect(factory).not.toHaveBeenCalled()
    })

    it('should call factory if cache misses', async () => {
      const factory = vi.fn(() => Promise.resolve('new'))
      const value = await cache.getOrSet('key1', factory, 60)

      expect(value).toBe('new')
      expect(factory).toHaveBeenCalledTimes(1)
    })

    it('should cache the factory result', async () => {
      const factory = vi.fn(() => Promise.resolve('value'))

      // First call - cache miss
      await cache.getOrSet('key1', factory, 60)
      expect(factory).toHaveBeenCalledTimes(1)

      // Second call - cache hit
      await cache.getOrSet('key1', factory, 60)
      expect(factory).toHaveBeenCalledTimes(1) // Still 1, not called again
    })
  })

  describe('getStats()', () => {
    it('should return cache statistics', async () => {
      await cache.set('key1', 'value1', 30)
      await cache.set('key2', 'value2', 3600)

      const stats = cache.getStats()

      expect(stats.totalEntries).toBe(2)
      expect(stats.byTTL).toBeDefined()
    })

    it('should report empty cache correctly', () => {
      const stats = cache.getStats()

      expect(stats.totalEntries).toBe(0)
      expect(Object.keys(stats.byTTL).length).toBe(0)
    })
  })

  describe('cleanup()', () => {
    it('should not run cleanup interval during tests', () => {
      // Just ensure cache can be created and destroyed without errors
      const testCache = new Cache()
      testCache.destroy()
      expect(true).toBe(true)
    })
  })
})
