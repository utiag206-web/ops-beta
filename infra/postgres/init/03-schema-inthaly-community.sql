-- ==============================================================================
-- ESQUEMA SOBERANO: BASE DE DATOS inthaly_community
-- Ecosistema Inthaly: Red Social Profesional, Foros Técnicos y Perfiles de Campo
-- ==============================================================================

\connect inthaly_community

CREATE SCHEMA IF NOT EXISTS inthaly_community;
SET search_path TO inthaly_community, public;

-- Tabla 1: Perfiles Profesionales Soberanos
CREATE TABLE IF NOT EXISTS inthaly_community.profiles (
  id UUID PRIMARY KEY, -- Coincide con identity_id de Inthaly ID
  display_name TEXT NOT NULL,
  headline TEXT NOT NULL DEFAULT '',
  bio TEXT NOT NULL DEFAULT '',
  location_region TEXT NOT NULL DEFAULT 'Perú',
  phone TEXT,
  email TEXT,
  specialties TEXT[] NOT NULL DEFAULT '{}',
  avatar_url TEXT,
  cover_url TEXT,
  cv_url TEXT,
  cv_completeness_pct INT NOT NULL DEFAULT 50 CHECK (cv_completeness_pct BETWEEN 0 AND 100),
  allow_employer_matching BOOLEAN NOT NULL DEFAULT false,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now())
);

CREATE INDEX IF NOT EXISTS idx_com_profiles_specialties ON inthaly_community.profiles USING gin(specialties);
CREATE INDEX IF NOT EXISTS idx_com_profiles_region ON inthaly_community.profiles(location_region);

-- Tabla 2: Experiencias Profesionales (Historial Técnico)
CREATE TABLE IF NOT EXISTS inthaly_community.experiences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id UUID NOT NULL REFERENCES inthaly_community.profiles(id) ON DELETE CASCADE,
  role_title TEXT NOT NULL,
  company_name TEXT NOT NULL,
  location TEXT,
  description TEXT NOT NULL DEFAULT '',
  start_date DATE NOT NULL,
  end_date DATE,
  is_current BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now())
);

CREATE INDEX IF NOT EXISTS idx_com_exp_profile ON inthaly_community.experiences(profile_id);

-- Tabla 3: Estudios y Formación Técnica
CREATE TABLE IF NOT EXISTS inthaly_community.education (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id UUID NOT NULL REFERENCES inthaly_community.profiles(id) ON DELETE CASCADE,
  degree_title TEXT NOT NULL,
  institution_name TEXT NOT NULL,
  field_of_study TEXT,
  start_date DATE NOT NULL,
  end_date DATE,
  is_current BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now())
);

CREATE INDEX IF NOT EXISTS idx_com_edu_profile ON inthaly_community.education(profile_id);

-- Tabla 4: Idiomas y Evaluaciones
CREATE TABLE IF NOT EXISTS inthaly_community.languages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id UUID NOT NULL REFERENCES inthaly_community.profiles(id) ON DELETE CASCADE,
  language_name TEXT NOT NULL,
  proficiency_level TEXT NOT NULL DEFAULT 'Básico',
  test_score TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now())
);

-- Tabla 5: Grupos y Foros Técnicos Dinámicos
CREATE TABLE IF NOT EXISTS inthaly_community.groups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  description TEXT,
  category TEXT NOT NULL,
  privacy TEXT NOT NULL DEFAULT 'public' CHECK (privacy IN ('public', 'closed', 'secret')),
  rules TEXT[] NOT NULL DEFAULT '{}',
  custom_tags TEXT[] NOT NULL DEFAULT '{}',
  created_by UUID NOT NULL REFERENCES inthaly_community.profiles(id) ON DELETE CASCADE,
  members_count INT NOT NULL DEFAULT 1,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now())
);

CREATE INDEX IF NOT EXISTS idx_com_groups_category ON inthaly_community.groups(category);

-- Tabla 6: Membresías de Grupo y Roles
CREATE TABLE IF NOT EXISTS inthaly_community.group_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id UUID NOT NULL REFERENCES inthaly_community.groups(id) ON DELETE CASCADE,
  profile_id UUID NOT NULL REFERENCES inthaly_community.profiles(id) ON DELETE CASCADE,
  role TEXT NOT NULL DEFAULT 'member' CHECK (role IN ('owner', 'admin', 'moderator', 'member')),
  joined_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now()),
  UNIQUE(group_id, profile_id)
);

-- Tabla 7: Publicaciones del Muro Profesional
CREATE TABLE IF NOT EXISTS inthaly_community.posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  author_id UUID NOT NULL REFERENCES inthaly_community.profiles(id) ON DELETE CASCADE,
  group_id UUID REFERENCES inthaly_community.groups(id) ON DELETE SET NULL,
  content TEXT NOT NULL,
  media_urls TEXT[] NOT NULL DEFAULT '{}',
  tags TEXT[] NOT NULL DEFAULT '{}',
  likes_count INT NOT NULL DEFAULT 0,
  comments_count INT NOT NULL DEFAULT 0,
  is_flagged BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now())
);

CREATE INDEX IF NOT EXISTS idx_com_posts_author ON inthaly_community.posts(author_id);
CREATE INDEX IF NOT EXISTS idx_com_posts_group ON inthaly_community.posts(group_id);
CREATE INDEX IF NOT EXISTS idx_com_posts_created ON inthaly_community.posts(created_at DESC);

-- Tabla 8: Reacciones
CREATE TABLE IF NOT EXISTS inthaly_community.reactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES inthaly_community.profiles(id) ON DELETE CASCADE,
  target_id UUID NOT NULL,
  target_type TEXT NOT NULL CHECK (target_type IN ('post', 'comment')),
  reaction_type TEXT NOT NULL DEFAULT 'like' CHECK (reaction_type IN ('like', 'support', 'insightful', 'curious')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now()),
  UNIQUE(user_id, target_id, target_type)
);

-- Tabla 9: Comentarios
CREATE TABLE IF NOT EXISTS inthaly_community.comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID NOT NULL REFERENCES inthaly_community.posts(id) ON DELETE CASCADE,
  author_id UUID NOT NULL REFERENCES inthaly_community.profiles(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now())
);

CREATE INDEX IF NOT EXISTS idx_com_comments_post ON inthaly_community.comments(post_id);

-- Tabla 10: Mensajería Directa Peer-to-Peer
CREATE TABLE IF NOT EXISTS inthaly_community.direct_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sender_id UUID NOT NULL REFERENCES inthaly_community.profiles(id) ON DELETE CASCADE,
  recipient_id UUID NOT NULL REFERENCES inthaly_community.profiles(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  is_read BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now())
);

CREATE INDEX IF NOT EXISTS idx_com_dm_conversation ON inthaly_community.direct_messages(sender_id, recipient_id);
