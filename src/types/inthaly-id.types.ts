/**
 * Contratos de Datos: Inthaly ID — Sistema Propio de Identidad Global
 * Arquitectura Soberana del Ecosistema INTHALY
 */

export type IdentityStatus = 'active' | 'suspended' | 'pending_verification'

export interface InthalyIdentity {
  id: string
  email: string
  display_name: string
  password_hash: string
  salt: string
  is_verified: boolean
  verification_token?: string | null
  verification_token_hash?: string | null
  verification_token_expires_at?: number | null
  status: IdentityStatus
  mfa_enabled: boolean
  mfa_secret?: string | null
  last_login_at?: string | null
  created_at: string
  updated_at: string
}

export interface InthalySession {
  id: string
  identity_id: string
  session_token: string
  refresh_token_hash: string
  user_agent: string
  ip_address: string
  device_name: string
  is_revoked: boolean
  expires_at: string
  created_at: string
  last_active_at: string
}

export type SecurityEventType = 
  | 'login_success'
  | 'login_failed'
  | 'register'
  | 'logout'
  | 'password_changed'
  | 'password_reset_request'
  | 'password_reset_success'
  | 'session_revoked'
  | 'session_revoked_all'
  | 'email_verified'
  | 'mfa_enabled'
  | 'mfa_disabled'
  | 'app_authorized'
  | 'app_revoked'
  | 'delegated_ticket_rejected'
  | 'open_redirect_blocked'

export interface InthalySecurityEvent {
  id: string
  identity_id: string
  event_type: SecurityEventType
  ip_address: string
  user_agent: string
  metadata?: Record<string, unknown>
  created_at: string
}

export type OidcClientType = 'public' | 'confidential'

export interface OidcClient {
  client_id: string
  client_name: string
  client_type: OidcClientType
  client_secret_hash?: string // Solo requerido para clientes confidenciales
  redirect_uris: string[]
  allowed_scopes: string[]
  require_pkce: boolean
  icon_url?: string
  description?: string
  is_active: boolean
  created_at: string
}

export interface OidcAuthorizationCode {
  code: string
  client_id: string
  identity_id: string
  redirect_uri: string
  scope: string
  code_challenge?: string
  code_challenge_method?: 'S256' | 'plain'
  nonce?: string
  state?: string
  expires_at: number // timestamp en ms
}

export interface ConnectedApp {
  id: string
  identity_id: string
  client_id: string
  app_name: string
  app_icon?: string
  description?: string
  scopes: string[]
  connected_at: string
  last_used_at: string
}

export interface EcosystemStats {
  totalIdentities: number
  verifiedIdentities: number
  activeSessions: number
  totalSecurityEvents: number
  connectedAppsCount: number
  communityUsersCount: number
  inthalyOpsCompaniesCount: number
  academySyncStatus: 'satellite_autonomous' | 'oidc_ready' | 'pending' | 'prepared_contract'
  communityStatus?: 'active' | 'unavailable' | 'disconnected'
  inthalyOpsStatus?: 'active' | 'unavailable' | 'disconnected'
  academyStatus?: 'prepared_contract' | 'disconnected'
  identityPersistenceStatus?: 'in_memory_transitional' | 'postgresql_connected' | 'error'
}
