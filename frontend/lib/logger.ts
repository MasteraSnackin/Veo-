/**
 * Structured logging utility
 * Provides consistent logging across the application
 */

type LogLevel = 'debug' | 'info' | 'warn' | 'error'

interface LogContext {
  [key: string]: any
}

class Logger {
  private context: LogContext = {}

  constructor(private defaultContext: LogContext = {}) {
    this.context = defaultContext
  }

  /**
   * Creates a child logger with additional context
   */
  child(context: LogContext): Logger {
    return new Logger({ ...this.context, ...context })
  }

  /**
   * Logs a debug message
   */
  debug(message: string, context?: LogContext) {
    this.log('debug', message, context)
  }

  /**
   * Logs an info message
   */
  info(message: string, context?: LogContext) {
    this.log('info', message, context)
  }

  /**
   * Logs a warning message
   */
  warn(message: string, context?: LogContext) {
    this.log('warn', message, context)
  }

  /**
   * Logs an error message
   */
  error(message: string, error?: Error, context?: LogContext) {
    this.log('error', message, {
      ...context,
      ...(error && {
        error: {
          name: error.name,
          message: error.message,
          stack: error.stack
        }
      })
    })
  }

  /**
   * Core logging function
   */
  private log(level: LogLevel, message: string, context?: LogContext) {
    const timestamp = new Date().toISOString()
    const logData = {
      timestamp,
      level,
      message,
      ...this.context,
      ...context
    }

    // In development, pretty print to console
    if (process.env.NODE_ENV === 'development') {
      const emoji = {
        debug: '🔍',
        info: 'ℹ️',
        warn: '⚠️',
        error: '❌'
      }[level]

      console[level === 'debug' ? 'log' : level](
        `${emoji} [${timestamp}] ${message}`,
        context || this.context
      )
    } else {
      // In production, output structured JSON for log aggregation
      console.log(JSON.stringify(logData))
    }
  }

  /**
   * Measures execution time of a function
   */
  async time<T>(
    operation: string,
    fn: () => Promise<T>,
    context?: LogContext
  ): Promise<T> {
    const start = Date.now()
    this.debug(`Starting: ${operation}`, context)

    try {
      const result = await fn()
      const duration = Date.now() - start
      this.info(`Completed: ${operation}`, { ...context, durationMs: duration })
      return result
    } catch (error) {
      const duration = Date.now() - start
      this.error(
        `Failed: ${operation}`,
        error as Error,
        { ...context, durationMs: duration }
      )
      throw error
    }
  }
}

// Export singleton instance
export const logger = new Logger({
  service: 'veo-api',
  env: process.env.NODE_ENV || 'development'
})

// Export class for creating custom loggers
export { Logger }
