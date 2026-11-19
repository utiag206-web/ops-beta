/**
 * Tipos de Autenticación y Sesión de INTHALY GLOBAL
 * Arquitectura Soberana e Independiente
 */

export interface AdminUser {
  id: string
  email: string
  name: string
  roles: string[]
  isSuperAdmin: boolean
  authProvider: 'inthaly_id' | 'legacy_bridge'
  avatarUrl?: string
}

export interface AdminSession {
  user: AdminUser
  token: string
  expiresAt: number
  createdAt: number
}

export interface AdminAuthResult {
  success: boolean
  user?: AdminUser
  error?: string
  bridgeUsed?: boolean
}
