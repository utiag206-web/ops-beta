/**
 * INTHALY OPS — Operating Profiles Architecture
 * Semantic Tokens Catalog
 */

import { SemanticToken } from './types'

export const ALL_SEMANTIC_TOKENS: readonly SemanticToken[] = [
  // Activos y Equipos
  'asset.primary.singular',
  'asset.primary.plural',
  'asset.secondary.singular',
  'asset.secondary.plural',
  // Personal y Colaboradores
  'worker.singular',
  'worker.plural',
  'worker.lead.singular',
  'worker.lead.plural',
  // Operaciones y Ubicaciones
  'location.primary',
  'location.secondary',
  'operation.shift',
  'operation.module_name',
  'operation.task',
  'maintenance.module_name',
  // Inventario y Logística
  'inventory.item',
  'inventory.warehouse',
  // Seguridad y Prevención
  'safety.inspection',
  'safety.incident'
] as const

/**
 * Metadata descriptiva de cada token semántico para guiar
 * a desarrolladores y administradores sobre su propósito.
 */
export const SEMANTIC_TOKEN_DESCRIPTIONS: Record<SemanticToken, string> = {
  'asset.primary.singular': 'Activo o equipo principal del negocio en singular (ej: Equipo, Unidad, Maquinaria).',
  'asset.primary.plural': 'Activos o equipos principales del negocio en plural (ej: Equipos, Unidades, Maquinaria).',
  'asset.secondary.singular': 'Herramienta, implemento o activo secundario en singular.',
  'asset.secondary.plural': 'Herramientas, implementos o activos secundarios en plural.',
  'worker.singular': 'Colaborador u operario base en singular (ej: Trabajador, Conductor, Jornalero, Obrero).',
  'worker.plural': 'Colaboradores u operarios base en plural (ej: Trabajadores, Conductores, Jornaleros, Personal).',
  'worker.lead.singular': 'Líder o supervisor inmediato de campo en singular (ej: Supervisor, Jefe de Flota, Capataz, Maestro de Obra).',
  'worker.lead.plural': 'Líderes o supervisores inmediatos de campo en plural.',
  'location.primary': 'Ubicación o centro de operaciones principal (ej: Ubicación, Frente de Mina, Ruta, Fundo, Obra, Planta).',
  'location.secondary': 'Sub-área o subdivisión de trabajo (ej: Área, Socavón, Parada, Lote, Tramo, Nave).',
  'operation.shift': 'Ciclo o turno de trabajo (ej: Turno, Guardia, Servicio/Ruta, Jornal, Ronda).',
  'operation.module_name': 'Nombre representativo del módulo operativo (ej: Operaciones, Gestión de Mina, Operaciones y Flota, Labores de Campo).',
  'operation.task': 'Actividad o tarea operativa asignada (ej: Actividad, Labor, Despacho, Tarea, Servicio).',
  'maintenance.module_name': 'Nombre representativo del módulo de mantenimiento/maquinaria (ej: Maquinaria y Mantenimiento, Área de Mecánica, Flota y Mantenimiento).',
  'inventory.item': 'Artículo o elemento almacenado en bodega (ej: Producto / Insumo, Repuesto, Semilla/Insumo, Material).',
  'inventory.warehouse': 'Instalación de almacenamiento (ej: Almacén, Bodega, Taller de Repuestos, Depósito).',
  'safety.inspection': 'Revisión preventiva de seguridad (ej: Inspección de Seguridad, Charla SOMA, Check Pre-viaje, Inspección de Campo).',
  'safety.incident': 'Evento no deseado o anomalía reportada (ej: Incidencia, Incidente SOMA, Novedad, Anomalía).'
}

export function isValidSemanticToken(candidate: string): candidate is SemanticToken {
  return ALL_SEMANTIC_TOKENS.includes(candidate as SemanticToken)
}
