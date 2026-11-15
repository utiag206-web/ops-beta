-- ==============================================================================
-- INTHALY — FASE 3: COMUNIDAD INTHALY CORE MIGRATION (PROPUESTA NO EJECUTADA)
-- Archivo: 20261115_phase3_community_core.sql
-- Estado: PENDIENTE DE AUTORIZACIÓN EXPRESA PARA EJECUCIÓN EN PRODUCCIÓN
-- Propósito: Esquema de base de datos relacional para Comunidad Inthaly,
--            garantizando soberanía personal, grupos abiertos, privacidad
--            frente a empleadores y desacoplamiento de company_id.
-- ==============================================================================

-- 1. EXTENSIONES
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. TABLA: community_profiles (Perfil Profesional Soberano de la Persona)
CREATE TABLE IF NOT EXISTS public.community_profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    slug TEXT UNIQUE NOT NULL,
    display_name TEXT NOT NULL,
    headline TEXT, -- ej. "Ingeniero Residente de Mina / Especialista en Molienda"
    bio TEXT,
    avatar_url TEXT,
    banner_url TEXT,
    location_region TEXT, -- ej. "Arequipa, Perú"
    specialties TEXT[] DEFAULT '{}',
    is_active BOOLEAN DEFAULT TRUE, -- Soporte para Pausa de Perfil (Nivel 1 de Desconexión)
    visibility TEXT DEFAULT 'public' CHECK (visibility IN ('public', 'connections', 'private')),
    allow_employer_matching BOOLEAN DEFAULT FALSE, -- Salvaguarda anti-espionaje laboral
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. TABLA: community_groups (Grupos Dinámicos y Foros Especializados Abiertos)
CREATE TABLE IF NOT EXISTS public.community_groups (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    slug TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    description TEXT,
    icon_url TEXT,
    banner_url TEXT,
    category TEXT NOT NULL, -- Taxonomía orientativa
    custom_tags TEXT[] DEFAULT '{}',
    privacy TEXT DEFAULT 'public' CHECK (privacy IN ('public', 'closed', 'secret')),
    join_policy TEXT DEFAULT 'open' CHECK (join_policy IN ('open', 'requires_approval', 'invite_only')),
    group_rules JSONB DEFAULT '[]'::jsonb,
    created_by UUID REFERENCES public.community_profiles(id) ON DELETE SET NULL,
    members_count INT DEFAULT 1,
    posts_count INT DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. TABLA: community_group_members (Membresía y Gobernanza de Grupos)
CREATE TABLE IF NOT EXISTS public.community_group_members (
    group_id UUID NOT NULL REFERENCES public.community_groups(id) ON DELETE CASCADE,
    profile_id UUID NOT NULL REFERENCES public.community_profiles(id) ON DELETE CASCADE,
    role TEXT NOT NULL DEFAULT 'member' CHECK (role IN ('owner', 'admin', 'moderator', 'member')),
    status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'pending_approval', 'banned')),
    joined_at TIMESTAMPTZ DEFAULT NOW(),
    PRIMARY KEY (group_id, profile_id)
);

-- 5. TABLA: community_posts (Publicaciones y Artículos Técnicos)
CREATE TABLE IF NOT EXISTS public.community_posts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    author_id UUID NOT NULL REFERENCES public.community_profiles(id) ON DELETE CASCADE,
    group_id UUID REFERENCES public.community_groups(id) ON DELETE SET NULL,
    content TEXT NOT NULL,
    media_urls JSONB DEFAULT '[]'::jsonb,
    tags TEXT[] DEFAULT '{}',
    visibility TEXT NOT NULL DEFAULT 'public' CHECK (visibility IN ('public', 'connections', 'group')),
    likes_count INT DEFAULT 0,
    comments_count INT DEFAULT 0,
    shares_count INT DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. TABLA: community_comments (Comentarios y Debates Técnicos)
CREATE TABLE IF NOT EXISTS public.community_comments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    post_id UUID NOT NULL REFERENCES public.community_posts(id) ON DELETE CASCADE,
    author_id UUID NOT NULL REFERENCES public.community_profiles(id) ON DELETE CASCADE,
    parent_comment_id UUID REFERENCES public.community_comments(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    likes_count INT DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. TABLA: community_reactions (Reacciones Profesionales Ponderadas)
CREATE TABLE IF NOT EXISTS public.community_reactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.community_profiles(id) ON DELETE CASCADE,
    target_type TEXT NOT NULL CHECK (target_type IN ('post', 'comment')),
    target_id UUID NOT NULL,
    reaction_type TEXT NOT NULL CHECK (reaction_type IN ('like', 'insightful', 'applaud', 'helpful')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE (user_id, target_type, target_id)
);

-- 8. TABLA: community_connections (Red de Contactos Profesionales)
CREATE TABLE IF NOT EXISTS public.community_connections (
    requester_id UUID NOT NULL REFERENCES public.community_profiles(id) ON DELETE CASCADE,
    addressee_id UUID NOT NULL REFERENCES public.community_profiles(id) ON DELETE CASCADE,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'declined', 'blocked')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    PRIMARY KEY (requester_id, addressee_id),
    CHECK (requester_id != addressee_id)
);

-- 9. TABLA: community_invitations (Invitaciones Corporativas Voluntarias)
CREATE TABLE IF NOT EXISTS public.community_invitations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL,
    worker_dni TEXT NOT NULL,
    worker_name TEXT,
    target_email TEXT,
    invitation_token TEXT UNIQUE NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected', 'expired')),
    expires_at TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 10. TABLA: community_notifications (Notificaciones In-App Inteligentes)
CREATE TABLE IF NOT EXISTS public.community_notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.community_profiles(id) ON DELETE CASCADE,
    actor_id UUID REFERENCES public.community_profiles(id) ON DELETE SET NULL,
    type TEXT NOT NULL CHECK (type IN ('connection_request', 'connection_accepted', 'reaction', 'comment', 'reply', 'group_invite')),
    entity_id UUID,
    entity_type TEXT,
    payload JSONB DEFAULT '{}'::jsonb,
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 11. TABLA: community_unlinking_audit (Trazabilidad de Desconexión Soberana)
CREATE TABLE IF NOT EXISTS public.community_unlinking_audit (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    action_type TEXT NOT NULL CHECK (action_type IN ('pause_profile', 'resume_profile', 'leave_group', 'delete_community_presence')),
    details JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ==============================================================================
-- ÍNDICES DE RENDIMIENTO Y ESCALABILIDAD
-- ==============================================================================
CREATE INDEX IF NOT EXISTS idx_comm_posts_author ON public.community_posts(author_id);
CREATE INDEX IF NOT EXISTS idx_comm_posts_group ON public.community_posts(group_id);
CREATE INDEX IF NOT EXISTS idx_comm_posts_created ON public.community_posts(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_comm_comments_post ON public.community_comments(post_id);
CREATE INDEX IF NOT EXISTS idx_comm_connections_addressee ON public.community_connections(addressee_id, status);
CREATE INDEX IF NOT EXISTS idx_comm_notifs_user_unread ON public.community_notifications(user_id, is_read, created_at DESC);

-- ==============================================================================
-- POLÍTICAS ROW LEVEL SECURITY (RLS) — AISLAMIENTO Y PRIVACIDAD ABSOLUTA
-- ==============================================================================
ALTER TABLE public.community_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.community_groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.community_group_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.community_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.community_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.community_reactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.community_connections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.community_notifications ENABLE ROW LEVEL SECURITY;

-- 1. community_profiles RLS
CREATE POLICY "profiles_select_public_policy" ON public.community_profiles
FOR SELECT USING (
    is_active = TRUE AND (
        visibility = 'public' 
        OR id = auth.uid()
        OR (visibility = 'connections' AND EXISTS (
            SELECT 1 FROM public.community_connections
            WHERE ((requester_id = auth.uid() AND addressee_id = community_profiles.id)
               OR (addressee_id = auth.uid() AND requester_id = community_profiles.id))
              AND status = 'accepted'
        ))
    )
);

CREATE POLICY "profiles_update_owner_policy" ON public.community_profiles
FOR UPDATE USING (id = auth.uid());

CREATE POLICY "profiles_insert_owner_policy" ON public.community_profiles
FOR INSERT WITH CHECK (id = auth.uid());

-- 2. community_posts RLS
CREATE POLICY "posts_select_policy" ON public.community_posts
FOR SELECT USING (
    visibility = 'public'
    OR author_id = auth.uid()
    OR (visibility = 'group' AND EXISTS (
        SELECT 1 FROM public.community_group_members
        WHERE group_id = community_posts.group_id
          AND profile_id = auth.uid()
          AND status = 'active'
    ))
);

CREATE POLICY "posts_insert_policy" ON public.community_posts
FOR INSERT WITH CHECK (author_id = auth.uid());

CREATE POLICY "posts_update_policy" ON public.community_posts
FOR UPDATE USING (author_id = auth.uid());

CREATE POLICY "posts_delete_policy" ON public.community_posts
FOR DELETE USING (author_id = auth.uid());

-- 3. community_connections RLS: Solo los involucrados pueden ver o modificar
CREATE POLICY "connections_policy" ON public.community_connections
FOR ALL USING (auth.uid() = requester_id OR auth.uid() = addressee_id);

-- 4. community_notifications RLS: Privacidad absoluta para el destinatario
CREATE POLICY "notifications_owner_policy" ON public.community_notifications
FOR ALL USING (auth.uid() = user_id);

-- ==============================================================================
-- ESTRATEGIA DE ALMACENAMIENTO DE MEDIOS (STORAGE PROPOSAL - CONTROLADO)
-- ==============================================================================
-- No se utiliza un único bucket público indiscriminado.
-- 1. Bucket 'community-public-assets':
--    - Contenido: Avatares públicos de perfiles y portadas de grupos públicos.
--    - Acceso: Público con directivas CDN y compresión obligatoria previa en cliente (WebP).
--
-- 2. Bucket 'community-media-private':
--    - Contenido: Evidencias fotográficas de maquinaria, manuales técnicos de campo y
--                 documentos compartidos dentro de grupos cerrados o privados.
--    - Acceso: ESTRICTAMENTE PRIVADO.
--    - Generación de acceso: Exclusivamente mediante URLs Prefirmadas (Signed URLs)
--      con tiempo de expiración limitado (TTL 15 a 60 minutos), validando antes
--      la membresía activa del solicitante mediante RLS o Server Action:
--      supabase.storage.from('community-media-private').createSignedUrl(path, 1800);
-- ==============================================================================
