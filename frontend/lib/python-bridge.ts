/**
 * Python Bridge - Clean interface for executing Python scripts
 * Handles process spawning, timeout, error handling, and output parsing
 */

import { spawn } from 'child_process'
import path from 'path'
import { PythonExecutionError, TimeoutError } from './errors'
import { logger } from './logger'
import type { PythonScriptOptions, PythonScriptResult } from './types'

const DEFAULT_TIMEOUT = 30000 // 30 seconds
const PYTHON_COMMAND = process.env.PYTHON_COMMAND || 'python'

/**
 * Executes a Python script and returns structured result
 */
export async function executePythonScript(
  options: PythonScriptOptions
): Promise<PythonScriptResult> {
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
