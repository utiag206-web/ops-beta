-- ==============================================================================
-- PROPUESTA DE MIGRACIÓN: BASE DE DATOS DEDICADA DE INTHALY ID
-- Clasificación: Infraestructura Soberana de Identidad y Autenticación
-- ADVERTENCIA: ARCHIVO DE ESPECIFICACIÓN Y DISEÑO. NO EJECUTAR REMOTAMENTE.
-- ==============================================================================
--
-- PRINCIPIO ARQUITECTÓNICO:
-- Esta migración está diseñada para ejecutarse EXCLUSIVAMENTE en una instancia
-- PostgreSQL DEDICADA e INDEPENDIENTE de InthalyOps.
-- Garantiza aislamiento de fallos, credenciales de conexión separadas y cero 
-- acoplamiento con las operaciones de contratistas mineros.
-- ==============================================================================

-- 1. Creación del Esquema Soberano
CREATE SCHEMA IF NOT EXISTS inthaly_id;

-- Extensiones Criptográficas Obligatorias
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ==============================================================================
-- TABLA 1: IDENTIDADES GLOBALES (inthaly_id.identities)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS inthaly_id.identities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE NOT NULL,
  display_name TEXT NOT NULL,
  password_hash TEXT NOT NULL, -- Formato: Scrypt derived key hex
  salt TEXT NOT NULL,          -- 32 bytes (64 hex chars) de entropía criptográfica
  is_verified BOOLEAN NOT NULL DEFAULT false,
  verification_token_hash TEXT, -- Hash SHA-256 del token de verificación (almacenamiento ciego)
  verification_token_expires_at TIMESTAMPTZ,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'suspended', 'pending_verification', 'archived')),
  mfa_enabled BOOLEAN NOT NULL DEFAULT false,
  mfa_secret_encrypted TEXT,    -- Clave TOTP cifrada con AES-256-GCM a nivel de aplicación
  failed_login_attempts INT NOT NULL DEFAULT 0,
  lockout_until TIMESTAMPTZ,
  last_login_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now())
);

CREATE INDEX IF NOT EXISTS idx_identities_email ON inthaly_id.identities(lower(email));
CREATE INDEX IF NOT EXISTS idx_identities_status ON inthaly_id.identities(status);

-- ==============================================================================
-- TABLA 2: SESIONES ACTIVAS Y REFRESH TOKENS (inthaly_id.sessions)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS inthaly_id.sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  identity_id UUID NOT NULL REFERENCES inthaly_id.identities(id) ON DELETE CASCADE,
  session_token_hash TEXT UNIQUE NOT NULL,  -- Hash SHA-256 del token de sesión
  refresh_token_hash TEXT UNIQUE NOT NULL,  -- Hash SHA-256 del refresh token (almacenamiento ciego)
  user_agent TEXT NOT NULL,
  ip_address INET NOT NULL,
  device_name TEXT NOT NULL,
  is_revoked BOOLEAN NOT NULL DEFAULT false,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now()),
  last_active_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now())
);

CREATE INDEX IF NOT EXISTS idx_sessions_identity ON inthaly_id.sessions(identity_id);
CREATE INDEX IF NOT EXISTS idx_sessions_token_hash ON inthaly_id.sessions(session_token_hash);
CREATE INDEX IF NOT EXISTS idx_sessions_refresh_hash ON inthaly_id.sessions(refresh_token_hash);
CREATE INDEX IF NOT EXISTS idx_sessions_active ON inthaly_id.sessions(identity_id) WHERE is_revoked = false;

-- ==============================================================================
-- TABLA 3: TOKENS DE RECUPERACIÓN DE CONTRASEÑA (inthaly_id.password_reset_tokens)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS inthaly_id.password_reset_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  identity_id UUID NOT NULL REFERENCES inthaly_id.identities(id) ON DELETE CASCADE,
  token_hash TEXT UNIQUE NOT NULL, -- Hash SHA-256 del token entregado por email
  is_used BOOLEAN NOT NULL DEFAULT false,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now())
);

CREATE INDEX IF NOT EXISTS idx_reset_token_hash ON inthaly_id.password_reset_tokens(token_hash);

-- ==============================================================================
-- TABLA 4: CLIENTES OIDC / OAUTH 2.0 REGISTRADOS (inthaly_id.oidc_clients)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS inthaly_id.oidc_clients (
  client_id TEXT PRIMARY KEY,
  client_name TEXT NOT NULL,
  client_type TEXT NOT NULL CHECK (client_type IN ('public', 'confidential')),
  client_secret_hash TEXT, -- Requerido solo si client_type = 'confidential'
  redirect_uris TEXT[] NOT NULL,
  allowed_scopes TEXT[] NOT NULL DEFAULT '{"openid", "profile", "email"}',
  require_pkce BOOLEAN NOT NULL DEFAULT true, -- Obligatorio true para clientes públicos
  icon_url TEXT,
  description TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now())
);

-- ==============================================================================
-- TABLA 5: CÓDIGOS DE AUTORIZACIÓN OIDC (inthaly_id.oidc_auth_codes)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS inthaly_id.oidc_auth_codes (
  code_hash TEXT PRIMARY KEY, -- Hash SHA-256 del authorization_code
  client_id TEXT NOT NULL REFERENCES inthaly_id.oidc_clients(client_id) ON DELETE CASCADE,
  identity_id UUID NOT NULL REFERENCES inthaly_id.identities(id) ON DELETE CASCADE,
  redirect_uri TEXT NOT NULL,
  scope TEXT NOT NULL,
  code_challenge TEXT,
  code_challenge_method TEXT CHECK (code_challenge_method IN ('S256', 'plain')),
  nonce TEXT,
  state TEXT,
  is_consumed BOOLEAN NOT NULL DEFAULT false,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now())
);

CREATE INDEX IF NOT EXISTS idx_auth_codes_expiry ON inthaly_id.oidc_auth_codes(expires_at);

-- ==============================================================================
-- TABLA 6: TICKETS DE ACCESO DELEGADO DE UN SOLO USO (inthaly_id.delegated_tickets)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS inthaly_id.delegated_tickets (
  jti UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  super_admin_id UUID NOT NULL REFERENCES inthaly_id.identities(id) ON DELETE CASCADE,
  target_product TEXT NOT NULL CHECK (target_product IN ('comunidad', 'academia', 'inthalyops')),
  reason TEXT NOT NULL,
  is_consumed BOOLEAN NOT NULL DEFAULT false,
  consumed_at TIMESTAMPTZ,
  consumed_by_ip INET,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now())
);

CREATE INDEX IF NOT EXISTS idx_delegated_tickets_active ON inthaly_id.delegated_tickets(jti) WHERE is_consumed = false;

-- ==============================================================================
-- TABLA 7: APLICACIONES CONECTADAS POR USUARIO (inthaly_id.connected_apps)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS inthaly_id.connected_apps (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  identity_id UUID NOT NULL REFERENCES inthaly_id.identities(id) ON DELETE CASCADE,
  client_id TEXT NOT NULL REFERENCES inthaly_id.oidc_clients(client_id) ON DELETE CASCADE,
  granted_scopes TEXT[] NOT NULL DEFAULT '{}',
  connected_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now()),
  last_used_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now()),
  UNIQUE(identity_id, client_id)
);

-- ==============================================================================
-- TABLA 8: BITÁCORA INMUTABLE DE EVENTOS DE SEGURIDAD (inthaly_id.security_logs)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS inthaly_id.security_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  identity_id UUID REFERENCES inthaly_id.identities(id) ON DELETE SET NULL,
  event_type TEXT NOT NULL,
  ip_address INET NOT NULL,
  user_agent TEXT NOT NULL,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now())
);

CREATE INDEX IF NOT EXISTS idx_security_logs_identity ON inthaly_id.security_logs(identity_id);
CREATE INDEX IF NOT EXISTS idx_security_logs_created ON inthaly_id.security_logs(created_at DESC);

-- ==============================================================================
-- MODELO DE ROLES Y PERMISOS DE CONEXIÓN
-- ==============================================================================
-- No se expone acceso directo anon ni authenticated a estas tablas.
-- El acceso a la base de datos de Inthaly ID se realiza EXCLUSIVAMENTE a través
-- de un usuario de servicio con permisos mínimos: `inthaly_id_app_user`.
-- ==============================================================================
