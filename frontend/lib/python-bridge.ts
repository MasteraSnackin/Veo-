/**
 * Python Bridge - Clean interface for executing Python scripts
 * Supports both local execution and Modal serverless functions
 * 
 * Handles process spawning, timeout, error handling, and output parsing
 * 
 * Environment Variables:
 * - PYTHON_COMMAND: Local Python command (default: 'python')
 * - MODAL_ENDPOINT_URL: Modal serverless function URL (optional)
 * - USE_MODAL: 'true' to use Modal instead of local execution
 */

import { spawn } from 'child_process'
import path from 'path'
import { PythonExecutionError, TimeoutError } from './errors'
import { logger } from './logger'
import type { PythonScriptOptions, PythonScriptResult } from './types'

const DEFAULT_TIMEOUT = 30000 // 30 seconds
const PYTHON_COMMAND = process.env.PYTHON_COMMAND || 'python'
const MODAL_ENDPOINT_URL = process.env.MODAL_ENDPOINT_URL
const USE_MODAL = process.env.USE_MODAL === 'true'

/**
 * Executes Python script via Modal HTTP endpoint
 */
async function executeViaModal(
  options: PythonScriptOptions
): Promise<PythonScriptResult> {
  const { script, args, timeout = DEFAULT_TIMEOUT } = options
  const startTime = Date.now()

  const scriptLogger = logger.child({
    operation: 'modal_execution',
    script: path.basename(script)
  })

  if (!MODAL_ENDPOINT_URL) {
    throw new PythonExecutionError('Modal endpoint not configured')
  }

  scriptLogger.debug('Starting Modal execution', { args })

  try {
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), timeout)

    const response = await fetch(MODAL_ENDPOINT_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        script: path.basename(script),
        args
      }),
      signal: controller.signal
    })

    clearTimeout(timeoutId)

    if (!response.ok) {
      const errorText = await response.text()
      throw new PythonExecutionError(
        `Modal execution failed: ${response.status} ${response.statusText}`,
        { stderr: errorText, exitCode: response.status }
      )
    }

    const result = await response.json()
    const executionTime = Date.now() - startTime

    scriptLogger.info('Modal execution completed', { executionTime })

    return {
      stdout: result.stdout || JSON.stringify(result),
      stderr: result.stderr || '',
      exitCode: 0,
      executionTime
    }
  } catch (error) {
    if (error instanceof Error && error.name === 'AbortError') {
      throw new TimeoutError('Modal execution', timeout)
    }
    throw error
  }
}

/**
 * Executes a Python script and returns structured result
 * Uses Modal if configured, otherwise falls back to local execution
 */
export async function executePythonScript(
  options: PythonScriptOptions
): Promise<PythonScriptResult> {
  // Use Modal if enabled and configured
  if (USE_MODAL && MODAL_ENDPOINT_URL) {
    try {
      return await executeViaModal(options)
    } catch (error) {
      logger.warn('Modal execution failed, falling back to local', {
        error: error instanceof Error ? error.message : 'Unknown error'
      })
      // Fall through to local execution
    }
  }

  // Local Python execution
  const { script, args, timeout = DEFAULT_TIMEOUT, cwd } = options
  const startTime = Date.now()

  const scriptLogger = logger.child({
    operation: 'python_execution',
    script: path.basename(script)
  })

  scriptLogger.debug('Starting Python script execution', { args })

  return new Promise((resolve, reject) => {
    const python = spawn(PYTHON_COMMAND, [script, ...args], {
      cwd: cwd || path.join(process.cwd(), '..'),
      env: process.env
    })

    let stdout = ''
    let stderr = ''
    let timedOut = false

    // Set timeout
    const timeoutId = setTimeout(() => {
      timedOut = true
      python.kill('SIGTERM')

      // Force kill after 5 seconds if not dead
      setTimeout(() => {
        if (!python.killed) {
          python.kill('SIGKILL')
        }
      }, 5000)
    }, timeout)

    // Capture stdout
    python.stdout.on('data', (data) => {
      stdout += data.toString()
    })

    // Capture stderr
    python.stderr.on('data', (data) => {
      stderr += data.toString()
    })

    // Handle completion
    python.on('close', (code) => {
      clearTimeout(timeoutId)
      const executionTime = Date.now() - startTime

      if (timedOut) {
        const error = new TimeoutError('Python script execution', timeout)
        scriptLogger.error('Script timed out', error, { executionTime })
        reject(error)
        return
      }

      const result: PythonScriptResult = {
        stdout,
        stderr,
        exitCode: code || 0,
        executionTime
      }

      if (code === 0) {
        scriptLogger.info('Script executed successfully', { executionTime })
        resolve(result)
      } else {
        const error = new PythonExecutionError(
          `Python script exited with code ${code}`,
          { stderr: stderr.trim(), exitCode: code }
        )
        scriptLogger.error('Script execution failed', error, { executionTime })
        reject(error)
      }
    })

    // Handle spawn errors
    python.on('error', (error) => {
      clearTimeout(timeoutId)
      const execError = new PythonExecutionError(
        'Failed to spawn Python process',
        { originalError: error.message }
      )
      scriptLogger.error('Failed to spawn process', execError)
      reject(execError)
    })
  })
}

/**
 * Executes Python script and parses JSON output
 */
export async function executePythonScriptJSON<T = any>(
  options: PythonScriptOptions
): Promise<T> {
  const result = await executePythonScript(options)

  try {
    return JSON.parse(result.stdout) as T
  } catch (error) {
    throw new PythonExecutionError(
      'Failed to parse Python script JSON output',
      { stdout: result.stdout, stderr: result.stderr }
    )
  }
}

/**
 * Builds the path to a Python script in the project
 */
export function getPythonScriptPath(scriptName: string): string {
  // Scripts are in the parent directory (project root)
  return path.join(process.cwd(), '..', scriptName)
}

/**
 * Builds the path to an execution script
 */
export function getExecutionScriptPath(scriptName: string): string {
  return path.join(process.cwd(), '..', 'execution', scriptName)
}

/**
 * Builds the path to a tools script
 */
export function getToolsScriptPath(scriptName: string): string {
  return path.join(process.cwd(), '..', 'tools', scriptName)
}
