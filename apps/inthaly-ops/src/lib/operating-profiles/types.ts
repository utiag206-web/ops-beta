/**
 * INTHALY OPS — Operating Profiles Architecture
 * Core Type Definitions & Contracts
 * 
 * Capa 100% aislada, pura y fuertemente tipada.
 * NO acoplada a Supabase, React ni componentes de UI.
 */

// ============================================================================
// 1. INDUSTRIAS Y CLAVES ESTABLES
// ============================================================================

export type IndustryCode =
  | 'MINERIA_METALURGIA'
  | 'CONSTRUCCION_INFRAESTRUCTURA'
  | 'TRANSPORTE_LOGISTICA'
  | 'MANUFACTURA_INDUSTRIA'
  | 'SERVICIOS_CONTRATISTAS'
  | 'AGROINDUSTRIA_ALIMENTOS'
  | 'SEGURIDAD_VIGILANCIA'
  | 'OTRO_SECTOR'

export interface IndustryMeta {
  code: IndustryCode
  officialLabel: string
  legacyAliases: readonly string[]
  description: string
  iconName: string
}

// ============================================================================
// 2. CAPACIDADES Y ESTADOS DE CICLO DE VIDA
// ============================================================================

export type CapabilityStatus =
  | 'ACTIVE'      // En producción, completamente funcional y conectado a BD
  | 'BETA'        // Funcional en pruebas controladas o pilotos
  | 'PROTOTYPE'   // Maqueta visual / prototipo para levantamiento o validación comercial
  | 'COMING_SOON' // Definido en hoja de ruta, no disponible operativamente
  | 'DISABLED'    // Deshabilitado y oculto para el contexto de la empresa

export type CapabilityCategory =
  | 'CORE'
  | 'OPERACIONES'
  | 'LOGISTICA_MECANICA'
  | 'SEGURIDAD_SOMA'
  | 'SERVICIOS_PERSONAL'
  | 'ADMINISTRACION'

export type CapabilityKey =
  // Core Universal (Común a toda empresa)
  | 'workers'
  | 'attendance'
  | 'tareo'
  | 'inventory'
  | 'requerimientos'
  | 'caja-chica'
  | 'soma'
  | 'documents'
  | 'bonuses'
  | 'assets'
  | 'reports'
  | 'users'
  | 'company'
  | 'profile'
  // Capacidades Verticales / Especializadas
  | 'mecanica'
  | 'mecanica_vehiculos'
  | 'combustible'
  | 'checklists'
  | 'herramientas'
  | 'operaciones_mina'
  | 'planta_mineral'
  | 'maderas'
  | 'logistica_rutas'
  | 'campo_lotes'
  // Capacidades de Modelo Operativo Multiindustria (Roadmap / Progresivas)
  | 'produccion_agricola'
  | 'salud_ocupacional'
  | 'bienestar_social'
  | 'avance_obra'
  | 'telemetria_gps'

export interface CapabilityDefinition {
  key: CapabilityKey
  name: string
  description: string
  category: CapabilityCategory
  isCore: boolean
  defaultStatus: CapabilityStatus
  route?: string
}

// ============================================================================
// 3. TOKENS SEMÁNTICOS (ARQUITECTURA DE LENGUAJE)
// ============================================================================

export type SemanticToken =
  // Activos y Equipos
  | 'asset.primary.singular'
  | 'asset.primary.plural'
  | 'asset.secondary.singular'
  | 'asset.secondary.plural'
  // Personal y Colaboradores
  | 'worker.singular'
  | 'worker.plural'
  | 'worker.lead.singular'
  | 'worker.lead.plural'
  // Operaciones y Ubicaciones
  | 'location.primary'
  | 'location.secondary'
  | 'operation.shift'
  | 'operation.module_name'
  | 'operation.task'
  | 'maintenance.module_name'
  // Inventario y Logística
  | 'inventory.item'
  | 'inventory.warehouse'
  // Seguridad y Prevención
  | 'safety.inspection'
  | 'safety.incident'

export type TerminologyDictionary = Record<SemanticToken, string>

// ============================================================================
// 4. CONTEXTO OPERATIVO
// ============================================================================

export type WorkRegime =
  | 'ROTATIVO'       // Ej: 14x7, 20x10, turnos de campamento
  | 'FIJO_SEMANAL'   // Ej: Lunes a Viernes / Sábado estándar
  | 'POR_CAMPANA'    // Ej: Agroindustria, zafra, temporada
  | '24_7'           // Ej: Transporte, vigilancia, plantas continúas
  | 'FLEXIBLE'

export type BaseLocationType =
  | 'MINA'
  | 'TALLER_PATIO'
  | 'OBRA'
  | 'FUNDO'
  | 'PLANTA'
  | 'SEDE_OFICINA'
  | 'PUESTO_CONTROL'

export type PrimaryAssetType =
  | 'VEHICULOS'
  | 'MAQUINARIA_PESADA'
  | 'HERRAMIENTAS'
  | 'IMPLEMENTOS_AGRICOLAS'
  | 'LINEAS_PRODUCCION'
  | 'EQUIPOS_SEGURIDAD'
  | 'ACTIVOS_GENERALES'

export interface OperationalContext {
  work_regime?: WorkRegime
  base_location_type?: BaseLocationType
  primary_asset_type?: PrimaryAssetType
  custom_attributes?: Record<string, string | number | boolean>
}

// ============================================================================
// 5. ARQUETIPOS SECTORIALES
// ============================================================================

export interface IndustryArchetype {
  industry_code: IndustryCode
  industry_label: string
  description: string
  terminology: Partial<TerminologyDictionary>
  recommended_capabilities: Record<CapabilityKey, CapabilityStatus>
  default_context: OperationalContext
}

// ============================================================================
export interface CompanyOperatingProfile {
  id?: string
  company_id: string
  industry_key: IndustryCode
  archetype_code?: string
  is_legacy_mode?: boolean
  operational_context: OperationalContext
  capabilities: Record<CapabilityKey, CapabilityStatus>
  custom_capabilities?: Partial<Record<CapabilityKey, CapabilityStatus>>
  custom_terminology?: Partial<TerminologyDictionary>
  terminology_overrides: Partial<TerminologyDictionary>
  metadata?: Record<string, any>
  created_at?: string
  updated_at?: string
}
