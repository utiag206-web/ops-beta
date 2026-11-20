/**
 * INTHALY OPS — Operating Profiles Architecture
 * Barrel Export & Public API
 * 
 * Capa 100% aislada, pura y tipada.
 * FASE 1: Arquitectura de Lenguaje y Contexto Multiindustria.
 */

// 1. Tipos e Interfaces
export * from './types'

// 2. Industrias y Normalización
export * from './industries'

// 3. Tokens Semánticos
export * from './tokens'

// 4. Diccionarios Core y Sectoriales
export * from './dictionaries'

// 5. Registro Central de Capacidades
export * from './capabilities'

// 6. Arquetipos Sectoriales
export * from './archetypes'

// 7. Motor de Resolución Semántica y Capacidades
export * from './resolver'

// 8. Capa de Contexto y Hooks React (Fase 2)
export {
  OperationalContextProvider,
  useOperationalContext,
  useTerminology
} from '@/components/providers/operational-context-provider'
export type {
  OperationalContextValue,
  OperationalContextProviderProps
} from '@/components/providers/operational-context-provider'

// 9. Capability Gateway & Adaptive Navigation (Fase 3)
export * from './gateway'

// 10. Persistencia del Perfil Operativo en Supabase (Fase 4)
export * from './persistence'
