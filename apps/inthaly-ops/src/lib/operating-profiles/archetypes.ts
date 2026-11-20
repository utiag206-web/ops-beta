/**
 * INTHALY OPS — Operating Profiles Architecture
 * Industry Archetypes & Default Operational Presets
 */

import { IndustryArchetype, IndustryCode, CapabilityKey, CapabilityStatus } from './types'
import { INDUSTRY_DICTIONARIES } from './dictionaries'
import { getDefaultCoreCapabilities } from './capabilities'

/**
 * Función auxiliar para generar un mapa de capacidades combinando
 * el Core Universal obligatorio con las personalizaciones del arquetipo.
 */
function buildArchetypeCapabilities(
  overrides: Partial<Record<CapabilityKey, CapabilityStatus>>
): Record<CapabilityKey, CapabilityStatus> {
  const base = getDefaultCoreCapabilities()
  return {
    ...base,
    ...overrides
  }
}

export const INDUSTRY_ARCHETYPES: Record<IndustryCode, IndustryArchetype> = {
  // 1. Minería y Metalurgia
  MINERIA_METALURGIA: {
    industry_code: 'MINERIA_METALURGIA',
    industry_label: 'Minería y Metalurgia',
    description: 'Arquetipo para operaciones mineras extractivas, socavón, tajo y plantas concentradoras.',
    terminology: INDUSTRY_DICTIONARIES.MINERIA_METALURGIA,
    recommended_capabilities: buildArchetypeCapabilities({
      operaciones_mina: 'ACTIVE',
      planta_mineral: 'ACTIVE',
      maderas: 'ACTIVE',
      mecanica_vehiculos: 'ACTIVE',
      combustible: 'ACTIVE',
      checklists: 'ACTIVE',
      herramientas: 'ACTIVE',
      logistica_rutas: 'DISABLED',
      campo_lotes: 'DISABLED',
      produccion_agricola: 'DISABLED',
      salud_ocupacional: 'COMING_SOON',
      bienestar_social: 'COMING_SOON',
      avance_obra: 'DISABLED',
      telemetria_gps: 'DISABLED'
    }),
    default_context: {
      work_regime: 'ROTATIVO',
      base_location_type: 'MINA',
      primary_asset_type: 'MAQUINARIA_PESADA'
    }
  },

  // 2. Construcción e Infraestructura
  CONSTRUCCION_INFRAESTRUCTURA: {
    industry_code: 'CONSTRUCCION_INFRAESTRUCTURA',
    industry_label: 'Construcción e Infraestructura',
    description: 'Arquetipo para empresas constructoras, ingeniería civil, obras viales y montajes.',
    terminology: INDUSTRY_DICTIONARIES.CONSTRUCCION_INFRAESTRUCTURA,
    recommended_capabilities: buildArchetypeCapabilities({
      operaciones_mina: 'DISABLED',
      planta_mineral: 'DISABLED',
      maderas: 'DISABLED',
      mecanica_vehiculos: 'ACTIVE',
      combustible: 'ACTIVE',
      checklists: 'ACTIVE',
      herramientas: 'ACTIVE',
      logistica_rutas: 'DISABLED',
      campo_lotes: 'DISABLED',
      produccion_agricola: 'DISABLED',
      salud_ocupacional: 'COMING_SOON',
      bienestar_social: 'COMING_SOON',
      avance_obra: 'COMING_SOON',
      telemetria_gps: 'DISABLED'
    }),
    default_context: {
      work_regime: 'FIJO_SEMANAL',
      base_location_type: 'OBRA',
      primary_asset_type: 'MAQUINARIA_PESADA'
    }
  },

  // 3. Transporte y Logística
  TRANSPORTE_LOGISTICA: {
    industry_code: 'TRANSPORTE_LOGISTICA',
    industry_label: 'Transporte y Logística',
    description: 'Arquetipo para flotas de transporte terrestre, carga pesada y traslado de personal.',
    terminology: INDUSTRY_DICTIONARIES.TRANSPORTE_LOGISTICA,
    recommended_capabilities: buildArchetypeCapabilities({
      operaciones_mina: 'DISABLED',
      planta_mineral: 'DISABLED',
      maderas: 'DISABLED',
      mecanica_vehiculos: 'ACTIVE',
      combustible: 'ACTIVE',
      checklists: 'ACTIVE',
      herramientas: 'ACTIVE',
      logistica_rutas: 'BETA',
      campo_lotes: 'DISABLED',
      produccion_agricola: 'DISABLED',
      salud_ocupacional: 'COMING_SOON',
      bienestar_social: 'COMING_SOON',
      avance_obra: 'DISABLED',
      telemetria_gps: 'COMING_SOON'
    }),
    default_context: {
      work_regime: '24_7',
      base_location_type: 'TALLER_PATIO',
      primary_asset_type: 'VEHICULOS'
    }
  },

  // 4. Manufactura e Industria
  MANUFACTURA_INDUSTRIA: {
    industry_code: 'MANUFACTURA_INDUSTRIA',
    industry_label: 'Manufactura e Industria',
    description: 'Arquetipo para plantas de manufactura, procesamiento industrial y ensamblaje.',
    terminology: INDUSTRY_DICTIONARIES.MANUFACTURA_INDUSTRIA,
    recommended_capabilities: buildArchetypeCapabilities({
      operaciones_mina: 'DISABLED',
      planta_mineral: 'DISABLED',
      maderas: 'DISABLED',
      mecanica_vehiculos: 'BETA',
      combustible: 'BETA',
      checklists: 'ACTIVE',
      herramientas: 'ACTIVE',
      logistica_rutas: 'DISABLED',
      campo_lotes: 'DISABLED',
      produccion_agricola: 'DISABLED',
      salud_ocupacional: 'COMING_SOON',
      bienestar_social: 'COMING_SOON',
      avance_obra: 'DISABLED',
      telemetria_gps: 'DISABLED'
    }),
    default_context: {
      work_regime: 'FIJO_SEMANAL',
      base_location_type: 'PLANTA',
      primary_asset_type: 'LINEAS_PRODUCCION'
    }
  },

  // 5. Servicios Generales y Contratistas
  SERVICIOS_CONTRATISTAS: {
    industry_code: 'SERVICIOS_CONTRATISTAS',
    industry_label: 'Servicios Generales y Contratistas',
    description: 'Arquetipo versátil para contratas de mantenimiento, servicios tercerizados y soporte.',
    terminology: INDUSTRY_DICTIONARIES.SERVICIOS_CONTRATISTAS,
    recommended_capabilities: buildArchetypeCapabilities({
      operaciones_mina: 'DISABLED',
      planta_mineral: 'DISABLED',
      maderas: 'DISABLED',
      mecanica_vehiculos: 'ACTIVE',
      combustible: 'ACTIVE',
      checklists: 'ACTIVE',
      herramientas: 'ACTIVE',
      logistica_rutas: 'BETA',
      campo_lotes: 'DISABLED',
      produccion_agricola: 'DISABLED',
      salud_ocupacional: 'COMING_SOON',
      bienestar_social: 'COMING_SOON',
      avance_obra: 'DISABLED',
      telemetria_gps: 'DISABLED'
    }),
    default_context: {
      work_regime: 'FLEXIBLE',
      base_location_type: 'SEDE_OFICINA',
      primary_asset_type: 'HERRAMIENTAS'
    }
  },

  // 6. Agroindustria y Alimentos
  AGROINDUSTRIA_ALIMENTOS: {
    industry_code: 'AGROINDUSTRIA_ALIMENTOS',
    industry_label: 'Agroindustria y Alimentos',
    description: 'Arquetipo para fundos agrícolas, cosecha, empaque y agroexportación.',
    terminology: INDUSTRY_DICTIONARIES.AGROINDUSTRIA_ALIMENTOS,
    recommended_capabilities: buildArchetypeCapabilities({
      operaciones_mina: 'DISABLED',
      planta_mineral: 'DISABLED',
      maderas: 'DISABLED',
      mecanica_vehiculos: 'ACTIVE',
      combustible: 'ACTIVE',
      checklists: 'ACTIVE',
      herramientas: 'ACTIVE',
      logistica_rutas: 'DISABLED',
      campo_lotes: 'PROTOTYPE',
      produccion_agricola: 'COMING_SOON',
      salud_ocupacional: 'COMING_SOON',
      bienestar_social: 'COMING_SOON',
      avance_obra: 'DISABLED',
      telemetria_gps: 'DISABLED'
    }),
    default_context: {
      work_regime: 'POR_CAMPANA',
      base_location_type: 'FUNDO',
      primary_asset_type: 'IMPLEMENTOS_AGRICOLAS'
    }
  },

  // 7. Seguridad y Vigilancia
  SEGURIDAD_VIGILANCIA: {
    industry_code: 'SEGURIDAD_VIGILANCIA',
    industry_label: 'Seguridad y Vigilancia',
    description: 'Arquetipo para empresas de seguridad patrimonial, resguardo y control de accesos.',
    terminology: INDUSTRY_DICTIONARIES.SEGURIDAD_VIGILANCIA,
    recommended_capabilities: buildArchetypeCapabilities({
      operaciones_mina: 'DISABLED',
      planta_mineral: 'DISABLED',
      maderas: 'DISABLED',
      mecanica_vehiculos: 'BETA',
      combustible: 'BETA',
      checklists: 'ACTIVE',
      herramientas: 'DISABLED',
      logistica_rutas: 'DISABLED',
      campo_lotes: 'DISABLED',
      produccion_agricola: 'DISABLED',
      salud_ocupacional: 'COMING_SOON',
      bienestar_social: 'DISABLED',
      avance_obra: 'DISABLED',
      telemetria_gps: 'DISABLED'
    }),
    default_context: {
      work_regime: '24_7',
      base_location_type: 'PUESTO_CONTROL',
      primary_asset_type: 'EQUIPOS_SEGURIDAD'
    }
  },

  // 8. Otro Sector (Core Universal Neutral)
  OTRO_SECTOR: {
    industry_code: 'OTRO_SECTOR',
    industry_label: 'Otro Sector',
    description: 'Arquetipo neutral basado 100% en el Core Universal de INTHALY OPS.',
    terminology: INDUSTRY_DICTIONARIES.OTRO_SECTOR,
    recommended_capabilities: buildArchetypeCapabilities({
      operaciones_mina: 'DISABLED',
      planta_mineral: 'DISABLED',
      maderas: 'DISABLED',
      mecanica_vehiculos: 'ACTIVE',
      combustible: 'BETA',
      checklists: 'ACTIVE',
      herramientas: 'ACTIVE',
      logistica_rutas: 'DISABLED',
      campo_lotes: 'DISABLED',
      produccion_agricola: 'DISABLED',
      salud_ocupacional: 'COMING_SOON',
      bienestar_social: 'COMING_SOON',
      avance_obra: 'DISABLED',
      telemetria_gps: 'DISABLED'
    }),
    default_context: {
      work_regime: 'FIJO_SEMANAL',
      base_location_type: 'SEDE_OFICINA',
      primary_asset_type: 'ACTIVOS_GENERALES'
    }
  }
}

/**
 * Obtiene el arquetipo predefinido para un código de industria.
 */
export function getIndustryArchetype(code: IndustryCode): IndustryArchetype {
  return INDUSTRY_ARCHETYPES[code] || INDUSTRY_ARCHETYPES.OTRO_SECTOR
}
