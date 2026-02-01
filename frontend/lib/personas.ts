/**
 * Persona configurations with weights and priorities
 */

import type { Persona, PersonaConfig } from './types'

export const PERSONA_CONFIGS: Record<Persona, PersonaConfig> = {
  student: {
    name: 'student',
    displayName: 'Student',
    description: 'Affordable areas near universities with good transport and nightlife',
    weights: {
      safety: 0.15,
      commute: 0.25,
      schools: 0.05,
      amenities: 0.15,
      property_prices: 0.05,
      nightlife: 0.15,           // Reduced from 0.20
      green_spaces: 0.05,
      affordability: 0.25        // Reduced from 0.30
    },
    priorities: [
      'Affordable rent',
      'Short commute to university',
      'Active nightlife',
      'Good public transport',
      'Student-friendly areas'
    ]
  },

  parent: {
    name: 'parent',
    displayName: 'Parent',
    description: 'Family-friendly areas with excellent schools and safety',
    weights: {
      safety: 0.25,              // Reduced from 0.30
      commute: 0.10,
      schools: 0.30,
      amenities: 0.10,
      property_prices: 0.05,
      nightlife: 0.00,
      green_spaces: 0.15,
      affordability: 0.05        // Reduced from 0.20
    },
    priorities: [
      'Outstanding schools nearby',
      'Low crime rates',
      'Parks and green spaces',
      'Family-friendly amenities',
      'Safe neighborhoods'
    ]
  },

  developer: {
    name: 'developer',
    displayName: 'Property Developer',
    description: 'High-growth areas with development potential and investment opportunities',
    weights: {
      safety: 0.10,
      commute: 0.15,
      schools: 0.05,            // Reduced from 0.10
      amenities: 0.15,
      property_prices: 0.20,
      nightlife: 0.05,
      green_spaces: 0.05,
      affordability: 0.00,
      development: 0.25         // Increased from 0.20
    },
    priorities: [
      'High development potential',
      'Property value growth',
      'Transport improvements',
      'Regeneration areas',
      'Investment opportunities'
    ]
  }
}

/**
 * Gets persona configuration
 */
export function getPersonaConfig(persona: Persona): PersonaConfig {
  return PERSONA_CONFIGS[persona]
}

/**
 * Gets all available personas
 */
export function getAllPersonas(): PersonaConfig[] {
  return Object.values(PERSONA_CONFIGS)
}

/**
 * Validates persona exists
 */
export function isValidPersona(persona: string): persona is Persona {
  return persona in PERSONA_CONFIGS
}
