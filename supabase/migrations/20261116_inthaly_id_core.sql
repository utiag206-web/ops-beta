-- ==============================================================================
-- MIGRACIÓN MAESTRA: NÚCLEO DE IDENTIDAD GLOBAL (INTHALY ID)
-- Clasificación: Esquema de Seguridad y Soberanía Inter-Sistemas
-- Totalmente Aislado: No modifica esquemas existentes de InthalyOps ni Comunidad.
-- ==============================================================================

-- 1. Tabla de Identidades Globales
CREATE TABLE IF NOT EXISTS inthaly_identities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE NOT NULL,
  display_name TEXT NOT NULL,
  password_hash TEXT NOT NULL,
  salt TEXT NOT NULL,
  is_verified BOOLEAN NOT NULL DEFAULT false,
  verification_token TEXT,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'suspended', 'pending_verification')),
  mfa_enabled BOOLEAN NOT NULL DEFAULT false,
  mfa_secret TEXT,
  last_login_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now())
);

CREATE INDEX IF NOT EXISTS idx_inthaly_identities_email ON inthaly_identities(email);
CREATE INDEX IF NOT EXISTS idx_inthaly_identities_status ON inthaly_identities(status);

-- 2. Tabla de Sesiones Activas
CREATE TABLE IF NOT EXISTS inthaly_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  identity_id UUID NOT NULL REFERENCES inthaly_identities(id) ON DELETE CASCADE,
  session_token TEXT UNIQUE NOT NULL,
  refresh_token_hash TEXT NOT NULL,
  user_agent TEXT NOT NULL,
  ip_address TEXT NOT NULL,
  device_name TEXT NOT NULL,
  is_revoked BOOLEAN NOT NULL DEFAULT false,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now()),
  last_active_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now())
);

CREATE INDEX IF NOT EXISTS idx_inthaly_sessions_identity ON inthaly_sessions(identity_id);
CREATE INDEX IF NOT EXISTS idx_inthaly_sessions_token ON inthaly_sessions(session_token);

-- 3. Registro de Eventos de Seguridad y Auditoría
CREATE TABLE IF NOT EXISTS inthaly_security_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  identity_id UUID REFERENCES inthaly_identities(id) ON DELETE SET NULL,
  event_type TEXT NOT NULL,
  ip_address TEXT NOT NULL,
  user_agent TEXT NOT NULL,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now())
);

CREATE INDEX IF NOT EXISTS idx_inthaly_sec_events_identity ON inthaly_security_events(identity_id);
CREATE INDEX IF NOT EXISTS idx_inthaly_sec_events_type ON inthaly_security_events(event_type);

-- 4. Clientes OIDC / OAuth 2.0 Autorizados
CREATE TABLE IF NOT EXISTS inthaly_oidc_clients (
  client_id TEXT PRIMARY KEY,
  client_name TEXT NOT NULL,
  client_secret_hash TEXT NOT NULL,
  redirect_uris TEXT[] NOT NULL DEFAULT '{}',
  allowed_scopes TEXT[] NOT NULL DEFAULT '{"openid", "profile", "email"}',
  icon_url TEXT,
  description TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now())
);

-- 5. Códigos de Autorización OIDC (Un solo uso)
CREATE TABLE IF NOT EXISTS inthaly_oidc_auth_codes (
  code TEXT PRIMARY KEY,
  client_id TEXT NOT NULL REFERENCES inthaly_oidc_clients(client_id) ON DELETE CASCADE,
  identity_id UUID NOT NULL REFERENCES inthaly_identities(id) ON DELETE CASCADE,
  redirect_uri TEXT NOT NULL,
  scope TEXT NOT NULL,
  code_challenge TEXT,
  expires_at TIMESTAMPTZ NOT NULL
);

-- 6. Aplicaciones Conectadas por Usuario
CREATE TABLE IF NOT EXISTS inthaly_connected_apps (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  identity_id UUID NOT NULL REFERENCES inthaly_identities(id) ON DELETE CASCADE,
  client_id TEXT NOT NULL REFERENCES inthaly_oidc_clients(client_id) ON DELETE CASCADE,
  scopes TEXT[] NOT NULL DEFAULT '{}',
  connected_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now()),
  last_used_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now()),
  UNIQUE(identity_id, client_id)
);

-- Habilitar RLS estricto
ALTER TABLE inthaly_identities ENABLE ROW LEVEL SECURITY;
ALTER TABLE inthaly_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE inthaly_security_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE inthaly_oidc_clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE inthaly_oidc_auth_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE inthaly_connected_apps ENABLE ROW LEVEL SECURITY;
