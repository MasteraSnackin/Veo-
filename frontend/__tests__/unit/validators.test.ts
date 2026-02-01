/**
 * Unit tests for validation schemas
 */

import { describe, it, expect } from 'vitest'
import {
  PersonaSchema,
  LocationTypeSchema,
  RecommendationRequestSchema,
  CommuteRequestSchema,
  AreaCodeSchema,
  validate,
  validateOrThrow,
  formatValidationErrors,
} from '@/lib/validators'

describe('Validators', () => {
  describe('PersonaSchema', () => {
    it('should accept valid personas', () => {
      expect(PersonaSchema.parse('student')).toBe('student')
      expect(PersonaSchema.parse('parent')).toBe('parent')
      expect(PersonaSchema.parse('developer')).toBe('developer')
    })

    it('should reject invalid personas', () => {
      expect(() => PersonaSchema.parse('invalid')).toThrow()
      expect(() => PersonaSchema.parse('')).toThrow()
      expect(() => PersonaSchema.parse(123)).toThrow()
    })
  })

  describe('LocationTypeSchema', () => {
    it('should accept valid location types', () => {
      expect(LocationTypeSchema.parse('rent')).toBe('rent')
      expect(LocationTypeSchema.parse('buy')).toBe('buy')
    })

    it('should reject invalid location types', () => {
      expect(() => LocationTypeSchema.parse('lease')).toThrow()
      expect(() => LocationTypeSchema.parse('')).toThrow()
    })
  })

  describe('RecommendationRequestSchema', () => {
    it('should accept valid recommendation requests', () => {
      const valid = {
        persona: 'student',
        budget: 1000,
        locationType: 'rent',
        destination: 'UCL',
        maxAreas: 5,
      }

      const result = RecommendationRequestSchema.parse(valid)
      expect(result).toEqual(valid)
    })

    it('should apply default maxAreas', () => {
      const input = {
        persona: 'parent',
        budget: 2000,
        locationType: 'buy',
      }

      const result = RecommendationRequestSchema.parse(input)
      expect(result.maxAreas).toBe(5)
    })

    it('should validate budget range', () => {
      const base = {
        persona: 'student',
        locationType: 'rent',
      }

      // Too low
      expect(() =>
        RecommendationRequestSchema.parse({ ...base, budget: 400 })
      ).toThrow(/at least £500/)

      // Too high
      expect(() =>
        RecommendationRequestSchema.parse({ ...base, budget: 60000 })
      ).toThrow(/not exceed £50,000/)

      // Valid
      expect(
        RecommendationRequestSchema.parse({ ...base, budget: 1500 })
      ).toBeTruthy()
    })

    it('should validate maxAreas range', () => {
      const base = {
        persona: 'student',
        budget: 1000,
        locationType: 'rent',
      }

      // Too low
      expect(() =>
        RecommendationRequestSchema.parse({ ...base, maxAreas: 0 })
      ).toThrow(/at least 1/)

      // Too high
      expect(() =>
        RecommendationRequestSchema.parse({ ...base, maxAreas: 25 })
      ).toThrow(/more than 20/)

      // Valid
      expect(
        RecommendationRequestSchema.parse({ ...base, maxAreas: 10 })
      ).toBeTruthy()
    })
  })

  describe('CommuteRequestSchema', () => {
    it('should accept valid commute requests', () => {
      const valid = {
        origin: 'E15',
        destination: 'UCL',
        modes: ['tube', 'bus'],
      }

      const result = CommuteRequestSchema.parse(valid)
      expect(result).toEqual(valid)
    })

    it('should reject empty origin/destination', () => {
      expect(() =>
        CommuteRequestSchema.parse({ origin: '', destination: 'UCL' })
      ).toThrow()

      expect(() =>
        CommuteRequestSchema.parse({ origin: 'E15', destination: '' })
      ).toThrow()
    })
  })

  describe('AreaCodeSchema', () => {
    it('should accept valid UK area codes', () => {
      expect(AreaCodeSchema.parse('E1')).toBe('E1')
      expect(AreaCodeSchema.parse('SW1A')).toBe('SW1A')
      expect(AreaCodeSchema.parse('N10')).toBe('N10')
      expect(AreaCodeSchema.parse('W2')).toBe('W2')
    })

    it('should reject invalid area codes', () => {
      expect(() => AreaCodeSchema.parse('e1')).toThrow() // lowercase
      expect(() => AreaCodeSchema.parse('123')).toThrow() // no letters
      expect(() => AreaCodeSchema.parse('ABCD')).toThrow() // invalid format
    })
  })

  describe('validate() helper', () => {
    it('should return success for valid data', () => {
      const result = validate(PersonaSchema, 'student')
      expect(result.success).toBe(true)
      expect(result.data).toBe('student')
      expect(result.errors).toBeUndefined()
    })

    it('should return errors for invalid data', () => {
      const result = validate(PersonaSchema, 'invalid')
      expect(result.success).toBe(false)
      expect(result.data).toBeUndefined()
      expect(result.errors).toBeDefined()
      expect(result.errors!.length).toBeGreaterThan(0)
    })
  })

  describe('validateOrThrow() helper', () => {
    it('should return data for valid input', () => {
      const data = validateOrThrow(PersonaSchema, 'student')
      expect(data).toBe('student')
    })

    it('should throw for invalid input', () => {
      expect(() => validateOrThrow(PersonaSchema, 'invalid')).toThrow()
    })
  })

  describe('formatValidationErrors() helper', () => {
    it('should format errors into readable messages', () => {
      const result = validate(RecommendationRequestSchema, {
        persona: 'invalid',
        budget: 100,
      })

      const messages = formatValidationErrors(result.errors!)
      expect(messages.length).toBeGreaterThan(0)
      expect(messages.some(m => m.includes('persona'))).toBe(true)
      expect(messages.some(m => m.includes('budget'))).toBe(true)
    })
  })
})
