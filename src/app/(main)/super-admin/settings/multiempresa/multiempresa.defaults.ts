// multiempresa.defaults.ts

export interface MultiCompanySettings {
  // Gestión de Empresas
  allowNewCompanies: boolean
  defaultCompanyStatus: 'ACTIVA' | 'PENDIENTE' | 'REVISIÓN'
  companyIdentifierMode: 'AUTOMÁTICO' | 'MANUAL'
  
  // Configuración Predeterminada
  defaultTimezone: string
  defaultDateFormat: string
  defaultLanguage: string
  defaultCurrency: string
  
  // Límites por Empresa
  maxUsers: number
  maxWorkers: number
  maxConcurrentSessions: number
  storageLimitGB: number
  availableModules: string[] // 'TAREO', 'WORKERS', etc
  
  // Ciclo de Vida
  allowSuspension: boolean
  allowReactivation: boolean
  requireCriticalActionConfirmation: boolean
  gracePeriodDays: number
  
  // Identidad y Acceso (Visuales / Preparados)
  slugIdentification: boolean
  workerPortalEnabled: boolean
  domainAccessEnabled: boolean
  customizationEnabled: boolean
}

export const defaultMultiCompanySettings: MultiCompanySettings = {
  allowNewCompanies: true,
  defaultCompanyStatus: 'ACTIVA',
  companyIdentifierMode: 'AUTOMÁTICO',
  
  defaultTimezone: 'America/Lima',
  defaultDateFormat: 'DD/MM/YYYY',
  defaultLanguage: 'ESPAÑOL',
  defaultCurrency: 'PEN — SOL PERUANO',
  
  maxUsers: 50,
  maxWorkers: 500,
  maxConcurrentSessions: 10,
  storageLimitGB: 5,
  availableModules: ['TAREO', 'WORKERS', 'INVENTARIO', 'PPE', 'REPORTES', 'TRANSPORTE', 'BONOS', 'DOCUMENTOS', 'CAMPAMENTO'],
  
  allowSuspension: true,
  allowReactivation: true,
  requireCriticalActionConfirmation: true,
  gracePeriodDays: 7,
  
  slugIdentification: true,
  workerPortalEnabled: true,
  domainAccessEnabled: false,
  customizationEnabled: true,
}
