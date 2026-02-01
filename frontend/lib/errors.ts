/**
 * Custom error classes for the application
 * Provides typed errors with proper HTTP status codes
 */

export class AppError extends Error {
  constructor(
    message: string,
    public code: string,
    public statusCode: number = 500,
    public details?: any
  ) {
    super(message)
    this.name = this.constructor.name
    Error.captureStackTrace(this, this.constructor)
  }

  toJSON() {
    return {
      code: this.code,
      message: this.message,
      details: this.details,
      ...(process.env.NODE_ENV === 'development' && { stack: this.stack })
    }
  }
}

// ============================================================================
// Specific Error Classes
// ============================================================================

export class ValidationError extends AppError {
  constructor(message: string, details?: any) {
    super(message, 'VALIDATION_ERROR', 400, details)
  }
}

export class NotFoundError extends AppError {
  constructor(resource: string) {
    super(`${resource} not found`, 'NOT_FOUND', 404)
  }
}

export class RateLimitError extends AppError {
  constructor(retryAfter?: number) {
    super('Rate limit exceeded', 'RATE_LIMIT_EXCEEDED', 429, { retryAfter })
  }
}

export class PythonExecutionError extends AppError {
  constructor(message: string, details?: any) {
    super(message, 'PYTHON_EXECUTION_ERROR', 500, details)
  }
}

export class ExternalServiceError extends AppError {
  constructor(service: string, message: string) {
    super(`External service error: ${service} - ${message}`, 'EXTERNAL_SERVICE_ERROR', 502, { service })
  }
}

export class TimeoutError extends AppError {
  constructor(operation: string, timeout: number) {
    super(`Operation timed out: ${operation}`, 'TIMEOUT', 504, { operation, timeout })
  }
}

export class CacheError extends AppError {
  constructor(message: string, details?: any) {
    super(message, 'CACHE_ERROR', 500, details)
  }
}

// ============================================================================
// Error Handler Utility
// ============================================================================

/**
 * Converts any error to an AppError instance
 */
export function toAppError(error: unknown): AppError {
  if (error instanceof AppError) {
    return error
  }

  if (error instanceof Error) {
    return new AppError(error.message, 'INTERNAL_ERROR', 500)
  }

  return new AppError('An unknown error occurred', 'UNKNOWN_ERROR', 500)
}

/**
 * Checks if error is a specific type
 */
export function isErrorType(error: unknown, errorClass: typeof AppError): boolean {
  return error instanceof errorClass
}
