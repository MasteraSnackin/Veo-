import { NextResponse } from 'next/server'
import type { HealthCheckResponse, ServiceHealth } from '@/lib/types'
import { cache } from '@/lib/cache'

const START_TIME = Date.now()
const VERSION = '1.0.0'

export async function GET() {
  const services: ServiceHealth[] = []

  // Check cache service
  try {
    const cacheStats = cache.getStats()
    services.push({
      name: 'cache',
      status: 'up',
      latency: 0
    })
  } catch (error) {
    services.push({
      name: 'cache',
      status: 'down',
      error: error instanceof Error ? error.message : 'Unknown error'
    })
  }

  // Check Python availability
  try {
    const { spawn } = await import('child_process')
    const pythonCheck = spawn('python', ['--version'])

    await new Promise((resolve, reject) => {
      pythonCheck.on('close', (code) => {
        if (code === 0) {
          services.push({
            name: 'python',
            status: 'up'
          })
          resolve(true)
        } else {
          services.push({
            name: 'python',
            status: 'down',
            error: `Exit code: ${code}`
          })
          reject()
        }
      })

      pythonCheck.on('error', (error) => {
        services.push({
          name: 'python',
          status: 'down',
          error: error.message
        })
        reject()
      })

      // Timeout after 5 seconds
      setTimeout(() => {
        pythonCheck.kill()
        services.push({
          name: 'python',
          status: 'down',
          error: 'Health check timeout'
        })
        reject()
      }, 5000)
    }).catch(() => {})
  } catch (error) {
    services.push({
      name: 'python',
      status: 'down',
      error: error instanceof Error ? error.message : 'Unknown error'
    })
  }

  // Determine overall status
  const hasDown = services.some(s => s.status === 'down')
  const hasDegraded = services.some(s => s.status === 'degraded')

  const status = hasDown ? 'unhealthy' : hasDegraded ? 'degraded' : 'healthy'

  const response: HealthCheckResponse = {
    status,
    version: VERSION,
    timestamp: new Date().toISOString(),
    services,
    uptime: Math.floor((Date.now() - START_TIME) / 1000) // seconds
  }

  return NextResponse.json(response, {
    status: status === 'healthy' ? 200 : status === 'degraded' ? 200 : 503
  })
}
