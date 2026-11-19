import { NextResponse } from 'next/server'
import {
  getSystemMetrics,
  getContainerServices,
  getBackupDisasterRecoveryStatus,
  getSecurityPerimeterStatus
} from '@/lib/telemetry/system-telemetry.service'

export const dynamic = 'force-dynamic'

/**
 * API Route de Telemetría Segura en Tiempo Real
 * URL: /api/telemetry
 */
export async function GET() {
  const metrics = getSystemMetrics()
  const containers = getContainerServices()
  const backup = getBackupDisasterRecoveryStatus()
  const security = getSecurityPerimeterStatus()

  return NextResponse.json({
    timestamp: new Date().toISOString(),
    metrics,
    containers,
    backup,
    security
  }, {
    status: 200,
    headers: {
      'Cache-Control': 'no-store, no-cache, must-revalidate',
      'Content-Type': 'application/json; charset=utf-8'
    }
  })
}
