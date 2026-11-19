/**
 * Servicio Central de Configuración Global del Ecosistema INTHALY
 * Arquitectura Desacoplada e Independiente
 */

export interface GeneralSettings {
  ecosystemName: string
  commercialName: string
  brandColor: string
  defaultLanguage: string
  defaultTimezone: string
  defaultCurrency: string
  dateFormat: string
  commercialWhatsapp: string
  supportEmail: string
}

export interface CapabilitiesSettings {
  industries: { id: string; name: string; active: boolean; archetypesCount: number }[]
  capabilities: { id: string; name: string; key: string; enabled: boolean; category: string }[]
}

export interface SecuritySettings {
  sessionTimeoutMinutes: number
  maxLoginAttempts: number
  lockoutDurationMinutes: number
  mfaEnforcedForAdmins: boolean
  passwordMinLength: number
  preventConcurrentSessions: boolean
}

export interface MultiempresaSettings {
  defaultWorkerQuota: number
  allowSelfRegistration: boolean
  demoRetentionDays: number
  requireRucVerification: boolean
  autoProvisionSchema: boolean
}

export interface NotificationsSettings {
  smtpHost: string
  smtpPort: number
  senderEmail: string
  alertOnFailedLogins: boolean
  whatsappAlertsEnabled: boolean
  dailySummaryEmail: string
}

export interface IntegrationsSettings {
  oidcDiscoveryUrl: string
  satelliteSyncIntervalMinutes: number
  webhookEndpoint: string
  allowPublicRegistrations: boolean
}

export interface SystemSettings {
  maintenanceMode: boolean
  telemetryIntervalSec: number
  logLevel: 'debug' | 'info' | 'warn' | 'error'
  cacheDriver: string
}

export interface AuditSettings {
  retentionDays: number
  immutableLogStore: boolean
  exportFormat: 'json' | 'csv'
  logSecurityEvents: boolean
}

export interface AboutSettings {
  version: string
  ecosystemVersion: string
  buildId: string
  architecture: string
  license: string
  lastUpdated: string
}

// In-Memory store con persistencia en runtime
let generalSettingsState: GeneralSettings = {
  ecosystemName: 'INTHALY GLOBAL',
  commercialName: 'Ecosistema Tecnológico Inthaly',
  brandColor: '#2563EB',
  defaultLanguage: 'es-PE',
  defaultTimezone: 'America/Lima (UTC-5)',
  defaultCurrency: 'PEN (S/.)',
  dateFormat: 'DD/MM/YYYY',
  commercialWhatsapp: '+51 987 654 321',
  supportEmail: 'soporte@inthaly.com'
}

let capabilitiesState: CapabilitiesSettings = {
  industries: [
    { id: 'ind-1', name: 'Minería Subterránea & Superficial', active: true, archetypesCount: 14 },
    { id: 'ind-2', name: 'Construcción Pesada & Viales', active: true, archetypesCount: 8 },
    { id: 'ind-3', name: 'Transporte de Personal & Carga', active: true, archetypesCount: 6 },
    { id: 'ind-4', name: 'Manufactura & Agroindustria', active: false, archetypesCount: 4 }
  ],
  capabilities: [
    { id: 'cap-1', name: 'Tareo Minero en Faena', key: 'tareo_minero', enabled: true, category: 'Operaciones' },
    { id: 'cap-2', name: 'Control de Horas Extras y Bonos', key: 'overtime_calc', enabled: true, category: 'Nómina' },
    { id: 'cap-3', name: 'Sincronización Offline PWA', key: 'offline_pwa', enabled: true, category: 'Conectividad' },
    { id: 'cap-4', name: 'Validación Biométrica Facial', key: 'facial_biometrics', enabled: false, category: 'Seguridad' },
    { id: 'cap-5', name: 'Trazabilidad GPS de Cuadrillas', key: 'gps_tracking', enabled: false, category: 'Geolocalización' }
  ]
}

let securitySettingsState: SecuritySettings = {
  sessionTimeoutMinutes: 60,
  maxLoginAttempts: 5,
  lockoutDurationMinutes: 30,
  mfaEnforcedForAdmins: true,
  passwordMinLength: 12,
  preventConcurrentSessions: false
}

let multiempresaSettingsState: MultiempresaSettings = {
  defaultWorkerQuota: 50,
  allowSelfRegistration: false,
  demoRetentionDays: 14,
  requireRucVerification: true,
  autoProvisionSchema: true
}

let notificationsSettingsState: NotificationsSettings = {
  smtpHost: 'smtp.inthaly.com',
  smtpPort: 587,
  senderEmail: 'alertas@inthaly.com',
  alertOnFailedLogins: true,
  whatsappAlertsEnabled: true,
  dailySummaryEmail: 'admin@inthaly.com'
}

let integrationsSettingsState: IntegrationsSettings = {
  oidcDiscoveryUrl: 'http://localhost:3000/.well-known/openid-configuration',
  satelliteSyncIntervalMinutes: 15,
  webhookEndpoint: 'https://admin.inthaly.com/api/webhooks/events',
  allowPublicRegistrations: true
}

let systemSettingsState: SystemSettings = {
  maintenanceMode: false,
  telemetryIntervalSec: 5,
  logLevel: 'info',
  cacheDriver: 'Redis 7.2'
}

let auditSettingsState: AuditSettings = {
  retentionDays: 90,
  immutableLogStore: true,
  exportFormat: 'json',
  logSecurityEvents: true
}

export async function getGeneralSettings(): Promise<GeneralSettings> {
  return { ...generalSettingsState }
}

export async function updateGeneralSettings(data: Partial<GeneralSettings>): Promise<GeneralSettings> {
  generalSettingsState = { ...generalSettingsState, ...data }
  return { ...generalSettingsState }
}

export async function getCapabilitiesSettings(): Promise<CapabilitiesSettings> {
  return { ...capabilitiesState }
}

export async function toggleCapability(key: string): Promise<boolean> {
  const cap = capabilitiesState.capabilities.find(c => c.key === key)
  if (cap) {
    cap.enabled = !cap.enabled
    return cap.enabled
  }
  return false
}

export async function getSecuritySettings(): Promise<SecuritySettings> {
  return { ...securitySettingsState }
}

export async function updateSecuritySettings(data: Partial<SecuritySettings>): Promise<SecuritySettings> {
  securitySettingsState = { ...securitySettingsState, ...data }
  return { ...securitySettingsState }
}

export async function getMultiempresaSettings(): Promise<MultiempresaSettings> {
  return { ...multiempresaSettingsState }
}

export async function updateMultiempresaSettings(data: Partial<MultiempresaSettings>): Promise<MultiempresaSettings> {
  multiempresaSettingsState = { ...multiempresaSettingsState, ...data }
  return { ...multiempresaSettingsState }
}

export async function getNotificationsSettings(): Promise<NotificationsSettings> {
  return { ...notificationsSettingsState }
}

export async function getIntegrationsSettings(): Promise<IntegrationsSettings> {
  return { ...integrationsSettingsState }
}

export async function getSystemSettings(): Promise<SystemSettings> {
  return { ...systemSettingsState }
}

export async function updateSystemSettings(data: Partial<SystemSettings>): Promise<SystemSettings> {
  systemSettingsState = { ...systemSettingsState, ...data }
  return { ...systemSettingsState }
}

export async function getAuditSettings(): Promise<AuditSettings> {
  return { ...auditSettingsState }
}

export async function getAboutSettings(): Promise<AboutSettings> {
  return {
    version: '1.4.1',
    ecosystemVersion: 'INTHALY GLOBAL 2.0 (Arquitectura Soberana)',
    buildId: 'inthaly-global-20261119-prod',
    architecture: 'Monorepo Multi-App / Next.js 15 Decoupled',
    license: 'Propietaria & Soberana — INTHALY Technologies S.A.C.',
    lastUpdated: 'Noviembre 2026'
  }
}
