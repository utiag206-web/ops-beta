/**
 * Contratos y Tipos Compartidos del Ecosistema INTHALY
 */

export interface ActionResponse<T = any> {
  success: boolean
  data?: T
  error?: string
  code?: string
  warnings?: string[]
}

export interface EcosystemUser {
  id: string
  email: string
  name: string
  role: string
  companyId?: string
  isSuperAdmin?: boolean
  avatarUrl?: string
}

export interface SystemServiceStatus {
  name: string
  port: number
  status: 'operational' | 'degraded' | 'offline' | 'pending'
  latencyMs?: number
  lastChecked: string
  details?: string
}

export interface CorporateCompany {
  id: string
  name: string
  slug: string
  status: 'active' | 'pending' | 'suspended'
  industry?: string
  workersCount?: number
}
