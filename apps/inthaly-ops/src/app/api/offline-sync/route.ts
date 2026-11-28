import { NextResponse } from 'next/server'
import { attendanceSyncHandler } from '@/lib/sync-handlers/attendance-sync'
import { cajaChicaSyncHandler } from '@/lib/sync-handlers/caja-chica-sync'
import { hsecSyncHandler } from '@/lib/sync-handlers/hsec-sync'
import { incidenciasSyncHandler } from '@/lib/sync-handlers/incidencias-sync'
import { mecanicaSyncHandler } from '@/lib/sync-handlers/mecanica-sync'
import { movementsSyncHandler } from '@/lib/sync-handlers/movements-sync'
import { plantaSyncHandler } from '@/lib/sync-handlers/planta-sync'
import { ppeSyncHandler } from '@/lib/sync-handlers/ppe-sync'
import { requerimientosSyncHandler } from '@/lib/sync-handlers/requerimientos-sync'
import { tareoSyncHandler } from '@/lib/sync-handlers/tareo-sync'
import { workersSyncHandler } from '@/lib/sync-handlers/workers-sync'

export async function POST(request: Request) {
  try {
    const { entity, action, payload } = await request.json()
    let result: any = false

    switch (entity) {
      case 'workers':
        result = await workersSyncHandler(action, payload)
        break
      case 'caja_chica':
        result = await cajaChicaSyncHandler(action, payload)
        break
      case 'planta_mineral':
        result = await plantaSyncHandler(action, payload)
        break
      case 'mecanica':
        result = await mecanicaSyncHandler(action, payload)
        break
      case 'requerimientos':
        result = await requerimientosSyncHandler(action, payload)
        break
      case 'incidencias':
        result = await incidenciasSyncHandler(action, payload)
        break
      case 'attendance':
        result = await attendanceSyncHandler(action, payload)
        break
      case 'tareo':
        result = await tareoSyncHandler(action, payload)
        break
      case 'movements':
        result = await movementsSyncHandler(action, payload)
        break
      case 'hsec':
        result = await hsecSyncHandler(action, payload)
        break
      case 'ppe':
        result = await ppeSyncHandler(action, payload)
        break
      default:
        return NextResponse.json({ success: false, error: `Unknown entity: ${entity}` }, { status: 400 })
    }

    if (typeof result === 'object' && result !== null) {
      return NextResponse.json(result)
    }
    return NextResponse.json({ success: Boolean(result) })
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error?.message || 'Sync error' }, { status: 500 })
  }
}
