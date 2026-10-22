-- ================================================================
-- RBAC Granular V1 — Tabla de Overrides por Usuario
-- Migración: 20260925_rbac_granular_v1_core.sql
--
-- Premisas:
--   1. NO toca tablas existentes (roles, user_roles, users)
--   2. NO tiene migraciones destructivas
--   3. Compatibilidad total con el sistema de roles actuales
--   4. Sin Scope, sin Cuadro de Muestreo, sin Mecánica adicional
-- ================================================================

-- 1. Tabla de overrides granulares por usuario
-- Permite conceder o revocar acciones específicas SIN cambiar el rol.
CREATE TABLE IF NOT EXISTS public.user_permissions (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  company_id  UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  module      TEXT NOT NULL,          -- ej: 'inventory', 'requerimientos'
  action      TEXT NOT NULL,          -- ej: 'read', 'create', 'approve', 'delete', 'export', 'manage'
  granted     BOOLEAN NOT NULL DEFAULT true,  -- true = conceder, false = revocar
  granted_by  UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  reason      TEXT,                   -- Motivo del override (auditoría)
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  
  -- Un usuario solo puede tener un override por (company, module, action)
  CONSTRAINT user_permissions_unique UNIQUE (user_id, company_id, module, action)
);

-- 2. Índices para consultas frecuentes en auth.ts
CREATE INDEX IF NOT EXISTS idx_user_permissions_user_company
  ON public.user_permissions (user_id, company_id);

CREATE INDEX IF NOT EXISTS idx_user_permissions_module
  ON public.user_permissions (user_id, company_id, module);

-- 3. RLS — Activar Row Level Security
ALTER TABLE public.user_permissions ENABLE ROW LEVEL SECURITY;

-- 4. Política: Solo admins de la empresa pueden gestionar overrides
-- Super Admin bypassa RLS por service_role
DROP POLICY IF EXISTS "user_permissions_admin_manage" ON public.user_permissions;
CREATE POLICY "user_permissions_admin_manage"
  ON public.user_permissions
  FOR ALL
  TO authenticated
  USING (
    -- El usuario debe ser admin de la misma empresa
    EXISTS (
      SELECT 1 FROM public.user_roles ur
      WHERE ur.user_id = auth.uid()
        AND ur.company_id = user_permissions.company_id
        AND ur.role_id IN ('admin', 'super_admin')
    )
    OR
    -- O ser el propio usuario leyendo sus propios overrides
    (user_permissions.user_id = auth.uid())
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.user_roles ur
      WHERE ur.user_id = auth.uid()
        AND ur.company_id = user_permissions.company_id
        AND ur.role_id IN ('admin', 'super_admin')
    )
  );

-- 5. Trigger para actualizar updated_at automáticamente
CREATE OR REPLACE FUNCTION public.update_user_permissions_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_user_permissions_updated_at ON public.user_permissions;
CREATE TRIGGER trigger_user_permissions_updated_at
  BEFORE UPDATE ON public.user_permissions
  FOR EACH ROW
  EXECUTE FUNCTION public.update_user_permissions_timestamp();

-- 6. Comentarios de documentación
COMMENT ON TABLE public.user_permissions IS 
  'RBAC Granular V1: Overrides de permisos por usuario/empresa. 
   Permite conceder o revocar acciones específicas sin cambiar el rol base.
   El rol sigue siendo la fuente de verdad principal (user_roles).';

COMMENT ON COLUMN public.user_permissions.module IS 'Módulo del sistema: inventory, requerimientos, caja-chica, etc.';
COMMENT ON COLUMN public.user_permissions.action IS 'Acción granular: read, create, update, delete, approve, export, manage';
COMMENT ON COLUMN public.user_permissions.granted IS 'true = conceder permiso adicional; false = revocar permiso del rol';
COMMENT ON COLUMN public.user_permissions.granted_by IS 'UUID del admin que realizó el override (auditoría)';
COMMENT ON COLUMN public.user_permissions.reason IS 'Motivo del override para trazabilidad';

-- 7. Vista auxiliar para consultas rápidas de overrides activos
CREATE OR REPLACE VIEW public.user_permissions_summary AS
SELECT 
  up.user_id,
  up.company_id,
  up.module,
  up.action,
  up.granted,
  up.reason,
  up.created_at,
  u.name AS user_name,
  u.email AS user_email,
  u.role_id AS base_role,
  gb.name AS granted_by_name
FROM public.user_permissions up
LEFT JOIN public.users u ON u.id = up.user_id
LEFT JOIN public.users gb ON gb.id = up.granted_by;
DO $$
BEGIN
  RAISE NOTICE '[RBAC_V1] Tabla user_permissions creada/verificada correctamente.';
  RAISE NOTICE '[RBAC_V1] RLS activado con políticas de acceso por empresa.';
  RAISE NOTICE '[RBAC_V1] Vista user_permissions_summary disponible.';
END $$;
