/**
 * INTHALY OPS — Operating Profiles Architecture
 * Core Universal & Sectorial Terminology Dictionaries
 * 
 * REGLA DE ORO:
 * El CORE UNIVERSAL es 100% NEUTRAL. Minería es un arquetipo sectorial,
 * NO el fallback del sistema. Si una empresa no tiene industria o perfil,
 * recibe vocabulario neutral (Equipo, Trabajador, Ubicación, Turno, Operaciones).
 */

import { IndustryCode, SemanticToken, TerminologyDictionary } from './types'

// ============================================================================
// 1. DICCIONARIO CORE UNIVERSAL (NEUTRAL - FALLBACK CANÓNICO)
// ============================================================================

export const CORE_TERMINOLOGY_DICTIONARY: TerminologyDictionary = {
  // Activos y Equipos
  'asset.primary.singular': 'Equipo',
  'asset.primary.plural': 'Equipos',
  'asset.secondary.singular': 'Herramienta',
  'asset.secondary.plural': 'Herramientas',

  // Personal y Colaboradores
  'worker.singular': 'Trabajador',
  'worker.plural': 'Trabajadores',
  'worker.lead.singular': 'Supervisor',
  'worker.lead.plural': 'Supervisores',

  // Operaciones y Ubicaciones
  'location.primary': 'Ubicación',
  'location.secondary': 'Área',
  'operation.shift': 'Turno',
  'operation.module_name': 'Operaciones',
  'operation.task': 'Actividad',
  'maintenance.module_name': 'Maquinaria y Mantenimiento',

  // Inventario y Logística
  'inventory.item': 'Producto / Insumo',
  'inventory.warehouse': 'Almacén',

  // Seguridad y Prevención
  'safety.inspection': 'Inspección de Seguridad',
  'safety.incident': 'Incidencia'
}

// ============================================================================
// 2. DICCIONARIOS SECTORIALES (PRESETS POR ARQUETIPO)
// ============================================================================

export const INDUSTRY_DICTIONARIES: Record<IndustryCode, Partial<TerminologyDictionary>> = {
  // 1. Minería y Metalurgia
  MINERIA_METALURGIA: {
    'asset.primary.singular': 'Equipo pesado',
    'asset.primary.plural': 'Equipos de Mina',
    'asset.secondary.singular': 'Herramienta de perforación',
    'asset.secondary.plural': 'Herramientas y Accesorios',
    'worker.singular': 'Personal de Mina',
    'worker.plural': 'Personal de Mina',
    'worker.lead.singular': 'Líder de Cuadrilla',
    'worker.lead.plural': 'Líderes de Cuadrilla',
    'location.primary': 'Frente de Mina / Labor',
    'location.secondary': 'Nivel / Socavón',
    'operation.shift': 'Guardia',
    'operation.module_name': 'Gestión de Mina',
    'operation.task': 'Labor de Avance',
    'maintenance.module_name': 'Área de Mecánica',
    'inventory.item': 'Insumo de Mina / Repuesto',
    'inventory.warehouse': 'Polvorín / Almacén Mina',
    'safety.inspection': 'Inspección HSEC / SOMA',
    'safety.incident': 'Incidente SOMA'
  },

  // 2. Construcción e Infraestructura
  CONSTRUCCION_INFRAESTRUCTURA: {
    'asset.primary.singular': 'Maquinaria / Equipo',
    'asset.primary.plural': 'Equipos de Obra',
    'asset.secondary.singular': 'Herramienta menor',
    'asset.secondary.plural': 'Herramientas de Obra',
    'worker.singular': 'Obrero / Técnico',
    'worker.plural': 'Personal de Obra',
    'worker.lead.singular': 'Maestro de Obra',
    'worker.lead.plural': 'Maestros y Capataces',
    'location.primary': 'Frente de Obra',
    'location.secondary': 'Tramo / Sector',
    'operation.shift': 'Turno de Obra',
    'operation.module_name': 'Control de Obra',
    'operation.task': 'Partida / Tarea',
    'maintenance.module_name': 'Maquinaria y Equipos',
    'inventory.item': 'Material de Construcción',
    'inventory.warehouse': 'Almacén de Obra',
    'safety.inspection': 'Charla de 5 Minutos / Inspección',
    'safety.incident': 'Incidente de Seguridad'
  },

  // 3. Transporte y Logística
  TRANSPORTE_LOGISTICA: {
    'asset.primary.singular': 'Unidad / Vehículo',
    'asset.primary.plural': 'Unidades de Transporte',
    'asset.secondary.singular': 'Accesorio de carga',
    'asset.secondary.plural': 'Accesorios de Flota',
    'worker.singular': 'Conductor / Operador',
    'worker.plural': 'Conductores y Personal',
    'worker.lead.singular': 'Jefe de Flota',
    'worker.lead.plural': 'Supervisores de Ruta',
    'location.primary': 'Ruta / Destino',
    'location.secondary': 'Base / Patio de Maniobras',
    'operation.shift': 'Servicio / Ruta',
    'operation.module_name': 'Operaciones y Flota',
    'operation.task': 'Servicio de Despacho',
    'maintenance.module_name': 'Flota y Mantenimiento',
    'inventory.item': 'Repuesto / Suministro',
    'inventory.warehouse': 'Taller y Depósito de Flota',
    'safety.inspection': 'Checklist Pre-viaje',
    'safety.incident': 'Siniestro / Incidencia Vial'
  },

  // 4. Manufactura e Industria
  MANUFACTURA_INDUSTRIA: {
    'asset.primary.singular': 'Línea / Maquinaria',
    'asset.primary.plural': 'Maquinaria de Planta',
    'asset.secondary.singular': 'Herramienta de taller',
    'asset.secondary.plural': 'Herramientas de Mantenimiento',
    'worker.singular': 'Operario de Planta',
    'worker.plural': 'Personal de Producción',
    'worker.lead.singular': 'Supervisor de Planta',
    'worker.lead.plural': 'Supervisores de Turno',
    'location.primary': 'Planta / Nave',
    'location.secondary': 'Línea de Ensamble',
    'operation.shift': 'Turno de Producción',
    'operation.module_name': 'Control de Producción',
    'operation.task': 'Orden de Fabricación',
    'maintenance.module_name': 'Mantenimiento de Planta',
    'inventory.item': 'Materia Prima / Insumo',
    'inventory.warehouse': 'Almacén Central de Planta',
    'safety.inspection': 'Inspección de Seguridad Industrial',
    'safety.incident': 'Incidencia Operativa'
  },

  // 5. Servicios Generales y Contratistas
  SERVICIOS_CONTRATISTAS: {
    'asset.primary.singular': 'Equipo / Vehículo',
    'asset.primary.plural': 'Equipos y Herramientas',
    'asset.secondary.singular': 'Herramienta de trabajo',
    'asset.secondary.plural': 'Herramientas y Equipos',
    'worker.singular': 'Técnico / Operario',
    'worker.plural': 'Personal Operativo',
    'worker.lead.singular': 'Coordinador de Servicio',
    'worker.lead.plural': 'Coordinadores de Cuadrilla',
    'location.primary': 'Sede del Cliente / Servicio',
    'location.secondary': 'Área de Instalación',
    'operation.shift': 'Turno de Servicio',
    'operation.module_name': 'Operaciones de Servicio',
    'operation.task': 'Orden de Servicio',
    'maintenance.module_name': 'Equipos y Mantenimiento',
    'inventory.item': 'Material / Suministro',
    'inventory.warehouse': 'Almacén de Suministros',
    'safety.inspection': 'Checklist de Trabajo Seguro',
    'safety.incident': 'Reporte de Novedad'
  },

  // 6. Agroindustria y Alimentos
  AGROINDUSTRIA_ALIMENTOS: {
    'asset.primary.singular': 'Maquinaria agrícola',
    'asset.primary.plural': 'Maquinaria de Campo',
    'asset.secondary.singular': 'Implemento agrícola',
    'asset.secondary.plural': 'Herramientas de Cosecha',
    'worker.singular': 'Jornalero / Operario',
    'worker.plural': 'Personal de Campo',
    'worker.lead.singular': 'Capataz de Campo',
    'worker.lead.plural': 'Capataces de Lote',
    'location.primary': 'Fundo / Finca',
    'location.secondary': 'Lote / Parcela',
    'operation.shift': 'Labor / Jornal',
    'operation.module_name': 'Labores de Campo',
    'operation.task': 'Labor de Cosecha / Siembra',
    'maintenance.module_name': 'Maquinaria y Mantenimiento',
    'inventory.item': 'Insumo Agrícola / Semilla',
    'inventory.warehouse': 'Almacén de Insumos y Empaque',
    'safety.inspection': 'Inspección de Salud y BPA',
    'safety.incident': 'Incidencia de Campo'
  },

  // 7. Seguridad y Vigilancia
  SEGURIDAD_VIGILANCIA: {
    'asset.primary.singular': 'Equipo de Seguridad',
    'asset.primary.plural': 'Equipos de Vigilancia',
    'asset.secondary.singular': 'Dispositivo de control',
    'asset.secondary.plural': 'Accesorios de Ronda',
    'worker.singular': 'Agente de Seguridad',
    'worker.plural': 'Agentes de Seguridad',
    'worker.lead.singular': 'Supervisor de Ronda',
    'worker.lead.plural': 'Supervisores Zonales',
    'location.primary': 'Puesto / Instalación',
    'location.secondary': 'Garita / Zona de Patrullaje',
    'operation.shift': 'Turno de Guardia',
    'operation.module_name': 'Operaciones de Seguridad',
    'operation.task': 'Consigna / Ronda',
    'maintenance.module_name': 'Mantenimiento y Control',
    'inventory.item': 'Uniforme / Equipo',
    'inventory.warehouse': 'Armería / Depósito de Equipamiento',
    'safety.inspection': 'Revista de Puesto / Protocolo',
    'safety.incident': 'Libro de Ocurrencias / Novedad'
  },

  // 8. Otro Sector (Hereda íntegramente el Core Neutral)
  OTRO_SECTOR: {
    // Utiliza el diccionario Core Universal neutral como base sin sobrescrituras
    'maintenance.module_name': 'Maquinaria y Mantenimiento'
  }
}
