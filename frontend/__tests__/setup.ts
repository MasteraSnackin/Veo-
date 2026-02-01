/**
 * Test setup file
 * Runs before all tests to configure the testing environment
 * 
 * NOTE: With globals: true in vitest.config, afterEach and vi are available globally
 * We should NOT import them here to avoid the "Vitest failed to find the runner" error
 */

import '@testing-library/jest-dom'
