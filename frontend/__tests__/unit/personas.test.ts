/**
 * Unit tests for persona configurations
 */

import { describe, it, expect } from 'vitest'
import {
  PERSONA_CONFIGS,
  getPersonaConfig,
  getAllPersonas,
  isValidPersona,
} from '@/lib/personas'

describe('Personas', () => {
  describe('PERSONA_CONFIGS', () => {
    it('should have configurations for all personas', () => {
      expect(PERSONA_CONFIGS.student).toBeDefined()
      expect(PERSONA_CONFIGS.parent).toBeDefined()
      expect(PERSONA_CONFIGS.developer).toBeDefined()
    })

    it('should have required properties for each persona', () => {
      Object.values(PERSONA_CONFIGS).forEach((config) => {
        expect(config.name).toBeDefined()
        expect(config.displayName).toBeDefined()
        expect(config.description).toBeDefined()
        expect(config.weights).toBeDefined()
        expect(config.priorities).toBeDefined()
      })
    })

    it('should have valid weight configurations', () => {
      Object.values(PERSONA_CONFIGS).forEach((config) => {
        const weights = config.weights
        const weightValues = Object.values(weights)

        // All weights should be numbers
        weightValues.forEach((weight) => {
          expect(typeof weight).toBe('number')
        })

        // Weights should be between 0 and 1
        weightValues.forEach((weight) => {
          expect(weight).toBeGreaterThanOrEqual(0)
          expect(weight).toBeLessThanOrEqual(1)
        })

        // Weights should sum to approximately 1.0 (allowing for floating point)
        const sum = weightValues.reduce((acc, w) => acc + w, 0)
        expect(sum).toBeCloseTo(1.0, 2)
      })
    })
  })

  describe('Student persona', () => {
    it('should prioritize affordability and commute', () => {
      const student = PERSONA_CONFIGS.student

      expect(student.weights.affordability).toBeGreaterThan(0.2)
      expect(student.weights.commute).toBeGreaterThan(0.2)
      expect(student.weights.nightlife).toBeGreaterThan(0.1)
    })

    it('should deprioritize schools', () => {
      const student = PERSONA_CONFIGS.student
      expect(student.weights.schools).toBeLessThan(0.1)
    })
  })

  describe('Parent persona', () => {
    it('should prioritize safety and schools', () => {
      const parent = PERSONA_CONFIGS.parent

      expect(parent.weights.safety).toBeGreaterThan(0.2)
      expect(parent.weights.schools).toBeGreaterThan(0.2)
      expect(parent.weights.green_spaces).toBeGreaterThan(0.1)
    })

    it('should not care about nightlife', () => {
      const parent = PERSONA_CONFIGS.parent
      expect(parent.weights.nightlife).toBe(0)
    })
  })

  describe('Developer persona', () => {
    it('should prioritize development potential', () => {
      const developer = PERSONA_CONFIGS.developer

      expect(developer.weights.development).toBeDefined()
      expect(developer.weights.development).toBeGreaterThan(0.2)
      expect(developer.weights.property_prices).toBeGreaterThan(0.1)
    })
  })

  describe('getPersonaConfig()', () => {
    it('should return correct config for each persona', () => {
      expect(getPersonaConfig('student').name).toBe('student')
      expect(getPersonaConfig('parent').name).toBe('parent')
      expect(getPersonaConfig('developer').name).toBe('developer')
    })
  })

  describe('getAllPersonas()', () => {
    it('should return array of all persona configs', () => {
      const personas = getAllPersonas()

      expect(Array.isArray(personas)).toBe(true)
      expect(personas.length).toBe(3)
      expect(personas.map(p => p.name)).toEqual(
        expect.arrayContaining(['student', 'parent', 'developer'])
      )
    })
  })

  describe('isValidPersona()', () => {
    it('should validate persona names', () => {
      expect(isValidPersona('student')).toBe(true)
      expect(isValidPersona('parent')).toBe(true)
      expect(isValidPersona('developer')).toBe(true)

      expect(isValidPersona('invalid')).toBe(false)
      expect(isValidPersona('')).toBe(false)
      expect(isValidPersona('Student')).toBe(false) // case sensitive
    })
  })
})
