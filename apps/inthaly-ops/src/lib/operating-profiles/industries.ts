/**
 * INTHALY OPS — Operating Profiles Architecture
 * Industries Registry & Normalization
 */

import { IndustryCode, IndustryMeta } from './types'

export const INDUSTRIES_METADATA: Record<IndustryCode, IndustryMeta> = {
  MINERIA_METALURGIA: {
    code: 'MINERIA_METALURGIA',
    officialLabel: 'Minería y Metalurgia',
    legacyAliases: [
      'Minería y Metalurgia',
      'mineria y metalurgia',
      'mineria',
      'metalurgia',
      'minera'
    ],
    description: 'Operaciones extractivas, minería subterránea, tajo abierto, procesamiento metalúrgico y plantas concentradoras.',
    iconName: 'Pickaxe'
  },
  CONSTRUCCION_INFRAESTRUCTURA: {
    code: 'CONSTRUCCION_INFRAESTRUCTURA',
    officialLabel: 'Construcción e Infraestructura',
    legacyAliases: [
      'Construcción e Infraestructura',
      'construccion e infraestructura',
      'construccion',
      'infraestructura',
      'obras civiles',
      'constructora'
    ],
    description: 'Edificación, obras viales, ingeniería civil, movimientos de tierras y montaje electromecánico.',
    iconName: 'HardHat'
  },
  TRANSPORTE_LOGISTICA: {
    code: 'TRANSPORTE_LOGISTICA',
    officialLabel: 'Transporte y Logística',
    legacyAliases: [
      'Transporte y Logística',
      'transporte y logistica',
      'transporte',
      'logistica',
      'flota',
      'carga pesada',
      'transporte de personal'
    ],
    description: 'Transporte de carga terrestre, traslado de personal, distribución de última milla y operadores logísticos.',
    iconName: 'Truck'
  },
  MANUFACTURA_INDUSTRIA: {
    code: 'MANUFACTURA_INDUSTRIA',
    officialLabel: 'Manufactura e Industria',
    legacyAliases: [
      'Manufactura e Industria',
      'manufactura e industria',
      'manufactura',
      'industria',
      'fabrica',
      'produccion industrial'
    ],
    description: 'Transformación de materias primas, plantas de manufactura, ensamblaje y procesamiento industrial.',
    iconName: 'Factory'
  },
  SERVICIOS_CONTRATISTAS: {
    code: 'SERVICIOS_CONTRATISTAS',
    officialLabel: 'Servicios Generales y Contratistas',
    legacyAliases: [
      'Servicios Generales y Contratistas',
      'servicios generales y contratistas',
      'servicios generales',
      'contratistas',
      'servicios',
      'contrata',
      'mantenimiento industrial'
    ],
    description: 'Empresas contratistas, servicios tercerizados, mantenimiento integral, instalaciones y soporte operativo.',
    iconName: 'Briefcase'
  },
  AGROINDUSTRIA_ALIMENTOS: {
    code: 'AGROINDUSTRIA_ALIMENTOS',
    officialLabel: 'Agroindustria y Alimentos',
    legacyAliases: [
      'Agroindustria y Alimentos',
      'agroindustria y alimentos',
      'agroindustria',
      'alimentos',
      'agricola',
      'agro',
      'fundo',
      'packing'
    ],
    description: 'Producción agrícola, fundos de cultivo, empaque, procesamiento de alimentos y agroexportación.',
    iconName: 'Wheat'
  },
  SEGURIDAD_VIGILANCIA: {
    code: 'SEGURIDAD_VIGILANCIA',
    officialLabel: 'Seguridad y Vigilancia',
    legacyAliases: [
      'Seguridad y Vigilancia',
      'seguridad y vigilancia',
      'seguridad',
      'vigilancia',
      'resguardo',
      'custodia'
    ],
    description: 'Vigilancia física armada/desarmada, control de accesos, seguridad patrimonial y resguardo de activos.',
    iconName: 'Shield'
  },
  OTRO_SECTOR: {
    code: 'OTRO_SECTOR',
    officialLabel: 'Otro Sector',
    legacyAliases: [
      'Otro Sector',
      'otro sector',
      'otro',
      'general',
      'otros'
    ],
    description: 'Empresas multisectoriales o actividades operativas no clasificadas en los sectores anteriores.',
    iconName: 'Building2'
  }
}

export const ALL_INDUSTRIES: IndustryMeta[] = Object.values(INDUSTRIES_METADATA)

/**
 * Normaliza una cadena de texto (proveniente de BD, formulario o select)
 * hacia una clave interna estable IndustryCode de forma determinista y segura.
 */
export function normalizeIndustryCode(rawInput: string | null | undefined): IndustryCode {
  if (!rawInput || typeof rawInput !== 'string') {
    return 'OTRO_SECTOR'
  }

  const clean = rawInput
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // Elimina tildes
    .replace(/[^a-z0-9\s]/g, '')     // Remueve caracteres especiales
    .replace(/\s+/g, ' ')

  if (!clean) return 'OTRO_SECTOR'

  // 1. Verificación directa contra IndustryCode en mayúsculas
  const uppercaseCandidate = rawInput.trim().toUpperCase().replace(/[\s-]+/g, '_')
  if (uppercaseCandidate in INDUSTRIES_METADATA) {
    return uppercaseCandidate as IndustryCode
  }

  // 2. Coincidencia por etiquetas o alias conocidos
  for (const meta of ALL_INDUSTRIES) {
    for (const alias of meta.legacyAliases) {
      const cleanAlias = alias
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-z0-9\s]/g, '')
        .replace(/\s+/g, ' ')

      if (clean === cleanAlias) {
        return meta.code
      }
    }
  }

  // 3. Coincidencia parcial por palabras clave
  if (clean.includes('miner') || clean.includes('metalurg')) return 'MINERIA_METALURGIA'
  if (clean.includes('construc') || clean.includes('infraestruct') || clean.includes('obra')) return 'CONSTRUCCION_INFRAESTRUCTURA'
  if (clean.includes('transport') || clean.includes('logistic') || clean.includes('flota') || clean.includes('carga')) return 'TRANSPORTE_LOGISTICA'
  if (clean.includes('manufactur') || clean.includes('fabrica') || clean.includes('planta')) return 'MANUFACTURA_INDUSTRIA'
  if (clean.includes('servici') || clean.includes('contrat')) return 'SERVICIOS_CONTRATISTAS'
  if (clean.includes('agro') || clean.includes('agricol') || clean.includes('alimento') || clean.includes('fundo')) return 'AGROINDUSTRIA_ALIMENTOS'
  if (clean.includes('segurid') || clean.includes('vigilanc') || clean.includes('resguardo')) return 'SEGURIDAD_VIGILANCIA'

  return 'OTRO_SECTOR'
}

/**
 * Obtiene la metadata oficial de una industria por su código interno.
 */
export function getIndustryMeta(code: IndustryCode): IndustryMeta {
  return INDUSTRIES_METADATA[code] || INDUSTRIES_METADATA.OTRO_SECTOR
}
