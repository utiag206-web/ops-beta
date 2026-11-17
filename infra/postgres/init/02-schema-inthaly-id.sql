-- ==============================================================================
-- ESQUEMA SOBERANO: BASE DE DATOS inthaly_id
-- Ecosistema Inthaly: Identidad, Sesiones y Proveedor OIDC / OAuth 2.0
-- ==============================================================================

\connect inthaly_id

CREATE SCHEMA IF NOT EXISTS inthaly_id;
SET search_path TO inthaly_id, public;

-- Tabla 1: Identidades Globales
CREATE TABLE IF NOT EXISTS inthaly_id.identities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE NOT NULL,
  display_name TEXT NOT NULL,
  password_hash TEXT NOT NULL,
  salt TEXT NOT NULL,
  is_verified BOOLEAN NOT NULL DEFAULT false,
  verification_token_hash TEXT,
  verification_token_expires_at TIMESTAMPTZ,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'suspended', 'pending_verification', 'archived')),
  mfa_enabled BOOLEAN NOT NULL DEFAULT false,
  mfa_secret_encrypted TEXT,
  failed_login_attempts INT NOT NULL DEFAULT 0,
  lockout_until TIMESTAMPTZ,
  last_login_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now())
);

CREATE INDEX IF NOT EXISTS idx_identities_email ON inthaly_id.identities(lower(email));
CREATE INDEX IF NOT EXISTS idx_identities_status ON inthaly_id.identities(status);

-- Tabla 2: Sesiones Activas y Almacenamiento Ciego de Refresh Tokens
CREATE TABLE IF NOT EXISTS inthaly_id.sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  identity_id UUID NOT NULL REFERENCES inthaly_id.identities(id) ON DELETE CASCADE,
  session_token_hash TEXT UNIQUE NOT NULL,
  refresh_token_hash TEXT UNIQUE NOT NULL,
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

-- Tabla 3: Recuperación de Contraseñas (Hash Ciego de Un Solo Uso)
CREATE TABLE IF NOT EXISTS inthaly_id.password_reset_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  identity_id UUID NOT NULL REFERENCES inthaly_id.identities(id) ON DELETE CASCADE,
  token_hash TEXT UNIQUE NOT NULL,
  is_used BOOLEAN NOT NULL DEFAULT false,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now())
);

CREATE INDEX IF NOT EXISTS idx_reset_token_hash ON inthaly_id.password_reset_tokens(token_hash);

-- Tabla 4: Clientes OIDC / OAuth 2.0
CREATE TABLE IF NOT EXISTS inthaly_id.oidc_clients (
  client_id TEXT PRIMARY KEY,
  client_name TEXT NOT NULL,
  client_type TEXT NOT NULL CHECK (client_type IN ('public', 'confidential')),
  client_secret_hash TEXT,
  redirect_uris TEXT[] NOT NULL,
  allowed_scopes TEXT[] NOT NULL DEFAULT '{"openid", "profile", "email"}',
  require_pkce BOOLEAN NOT NULL DEFAULT true,
  icon_url TEXT,
  description TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now())
);

-- Tabla 5: Códigos de Autorización OIDC (Un Solo Uso y PKCE S256)
CREATE TABLE IF NOT EXISTS inthaly_id.oidc_auth_codes (
  code_hash TEXT PRIMARY KEY,
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

-- Tabla 6: Tickets Administrativos Delegados (Consumo Atómico de Un Solo Uso - ADR-ID-004)
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

-- Tabla 7: Aplicaciones Conectadas por Usuario
CREATE TABLE IF NOT EXISTS inthaly_id.connected_apps (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  identity_id UUID NOT NULL REFERENCES inthaly_id.identities(id) ON DELETE CASCADE,
  client_id TEXT NOT NULL REFERENCES inthaly_id.oidc_clients(client_id) ON DELETE CASCADE,
  granted_scopes TEXT[] NOT NULL DEFAULT '{}',
  connected_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now()),
  last_used_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now()),
  UNIQUE(identity_id, client_id)
);

-- Tabla 8: Bitácora Inmutable de Seguridad
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

-- Clientes OIDC Registrados por Defecto
INSERT INTO inthaly_id.oidc_clients (client_id, client_name, client_type, redirect_uris, allowed_scopes, require_pkce, description)
VALUES 
  ('inthaly-community-web', 'Comunidad Inthaly Web', 'public', ARRAY['http://localhost:3000/comunidad/callback', 'https://comunidad.inthaly.com/callback'], ARRAY['openid', 'profile', 'email', 'community.read', 'community.write'], true, 'Red social profesional de la minería e industria'),
  ('inthaly-global-console', 'Consola Global del Ecosistema', 'confidential', ARRAY['http://localhost:3000/super-admin/callback', 'https://admin.inthaly.com/callback'], ARRAY['openid', 'profile', 'email', 'admin.all'], false, 'Centro de control administrativo del ecosistema')
ON CONFLICT (client_id) DO NOTHING;
