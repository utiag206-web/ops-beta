import { NextResponse } from 'next/server'
import os from 'os'

export const dynamic = 'force-dynamic'

export async function GET() {
  const mem = process.memoryUsage()
  return NextResponse.json({
    status: 'ok',
    service: 'inthaly-global',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
    uptimeSeconds: Math.floor(process.uptime()),
    system: {
      platform: os.platform(),
      totalMemMb: Math.round(os.totalmem() / (1024 * 1024)),
      freeMemMb: Math.round(os.freemem() / (1024 * 1024)),
      nodeRssMb: Math.round(mem.rss / (1024 * 1024)),
      heapUsedMb: Math.round(mem.heapUsed / (1024 * 1024))
    }
  })
}
