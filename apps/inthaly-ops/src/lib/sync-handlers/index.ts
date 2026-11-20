'use client'

import { registerSyncHandler } from '@/components/providers/offline-provider'
import { plantaSyncHandler } from './planta-sync'
import { mecanicaSyncHandler } from './mecanica-sync'
import { requerimientosSyncHandler } from './requerimientos-sync'
import { incidenciasSyncHandler } from './incidencias-sync'
import { attendanceSyncHandler } from './attendance-sync'
import { tareoSyncHandler } from './tareo-sync'
import { movementsSyncHandler } from './movements-sync'
import { hsecSyncHandler } from './hsec-sync'

export function initializeSyncHandlers() {
  if (typeof window === 'undefined') return
  
  registerSyncHandler('planta_mineral', plantaSyncHandler)
  registerSyncHandler('mecanica', mecanicaSyncHandler)
  registerSyncHandler('requerimientos', requerimientosSyncHandler)
  registerSyncHandler('incidencias', incidenciasSyncHandler)
  registerSyncHandler('attendance', attendanceSyncHandler)
  registerSyncHandler('tareo', tareoSyncHandler)
  registerSyncHandler('movements', movementsSyncHandler)
  registerSyncHandler('hsec', hsecSyncHandler)
}
