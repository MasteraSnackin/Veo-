/**
 * Unit tests for error classes
 */

import { describe, it, expect } from 'vitest'
import {
  AppError,
  ValidationError,
  NotFoundError,
  RateLimitError,
  PythonExecutionError,
  TimeoutError,
  toAppError,
  isErrorType,
} from '@/lib/errors'

describe('Error Classes', () => {
  describe('AppError', () => {
    it('should create error with all properties', () => {
      const error = new AppError('Test error', 'TEST_ERROR', 400, { foo: 'bar' })

      expect(error.message).toBe('Test error')
      expect(error.code).toBe('TEST_ERROR')
      expect(error.statusCode).toBe(400)
      expect(error.details).toEqual({ foo: 'bar' })
      expect(error.name).toBe('AppError')
    })

    it('should default to 500 status code', () => {
      const error = new AppError('Test', 'TEST')
      expect(error.statusCode).toBe(500)
    })

    it('should serialize to JSON correctly', () => {
      const error = new AppError('Test', 'TEST_CODE', 400, { detail: 'info' })
      const json = error.toJSON()

      expect(json.code).toBe('TEST_CODE')
      expect(json.message).toBe('Test')
      expect(json.details).toEqual({ detail: 'info' })
    })

    it('should include stack in development', () => {
      process.env.NODE_ENV = 'development'
      const error = new AppError('Test', 'TEST')
      const json = error.toJSON()

      expect(json.stack).toBeDefined()
      process.env.NODE_ENV = 'test'
    })
  })

  describe('ValidationError', () => {
    it('should have correct code and status', () => {
      const error = new ValidationError('Invalid input')

      expect(error.code).toBe('VALIDATION_ERROR')
      expect(error.statusCode).toBe(400)
    })

    it('should accept details', () => {
      const details = { field: 'email', issue: 'invalid format' }
      const error = new ValidationError('Bad request', details)

      expect(error.details).toEqual(details)
    })
  })

  describe('NotFoundError', () => {
    it('should format message correctly', () => {
      const error = new NotFoundError('User')

      expect(error.message).toBe('User not found')
      expect(error.code).toBe('NOT_FOUND')
      expect(error.statusCode).toBe(404)
    })
  })

  describe('RateLimitError', () => {
    it('should include retry information', () => {
      const error = new RateLimitError(60)

      expect(error.code).toBe('RATE_LIMIT_EXCEEDED')
      expect(error.statusCode).toBe(429)
      expect(error.details?.retryAfter).toBe(60)
    })
  })

  describe('PythonExecutionError', () => {
    it('should be a server error', () => {
      const error = new PythonExecutionError('Script failed')

      expect(error.code).toBe('PYTHON_EXECUTION_ERROR')
      expect(error.statusCode).toBe(500)
    })
  })

  describe('TimeoutError', () => {
    it('should include operation and timeout details', () => {
      const error = new TimeoutError('API call', 5000)

      expect(error.message).toContain('API call')
      expect(error.code).toBe('TIMEOUT')
      expect(error.statusCode).toBe(504)
      expect(error.details).toEqual({ operation: 'API call', timeout: 5000 })
    })
  })

  describe('toAppError()', () => {
    it('should return AppError as-is', () => {
      const original = new ValidationError('Test')
      const converted = toAppError(original)

      expect(converted).toBe(original)
    })

    it('should convert standard Error to AppError', () => {
      const original = new Error('Standard error')
      const converted = toAppError(original)

      expect(converted).toBeInstanceOf(AppError)
      expect(converted.message).toBe('Standard error')
      expect(converted.code).toBe('INTERNAL_ERROR')
      expect(converted.statusCode).toBe(500)
    })

    it('should handle unknown errors', () => {
      const converted = toAppError('string error')

      expect(converted).toBeInstanceOf(AppError)
      expect(converted.message).toBe('An unknown error occurred')
      expect(converted.code).toBe('UNKNOWN_ERROR')
    })
  })

  describe('isErrorType()', () => {
    it('should correctly identify error types', () => {
      const validation = new ValidationError('Test')
      const notFound = new NotFoundError('Resource')

      expect(isErrorType(validation, ValidationError)).toBe(true)
      expect(isErrorType(validation, NotFoundError)).toBe(false)
      expect(isErrorType(notFound, NotFoundError)).toBe(true)
      expect(isErrorType(notFound, ValidationError)).toBe(false)
    })
  })
})
