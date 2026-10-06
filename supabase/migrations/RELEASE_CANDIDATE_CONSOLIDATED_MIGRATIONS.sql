-- ==============================================================================
-- INTHALY OPS — CONSOLIDATED MIGRATIONS (RELEASE CANDIDATE PRE-DEPLOY)
-- Orden verificado y validado: 1 -> 2 -> 3 -> 4 -> 5
-- Totalmente idempotente: CREATE TABLE IF NOT EXISTS, ADD COLUMN IF NOT EXISTS
-- Sin sentencias destructivas: 0 DROPs de tablas, 0 TRUNCATEs, 0 DELETEs
-- ==============================================================================

BEGIN;


-- ==============================================================================
-- PASO 1/5: MIGRACIÓN 20260920_company_operating_profiles.sql
-- ==============================================================================

-- ================================================================
-- INTHALY OPS — MIGRACIÓN FASE 4: PERSISTENCIA DEL PERFIL OPERATIVO
-- Tabla satélite 1:1 de empresas para almacenar el contexto operativo,
-- industria, arquetipo, capacidades y terminología personalizada.
-- Fecha: 2026-09-20
-- ================================================================

-- 1. Crear tabla satélite company_operating_profiles
CREATE TABLE IF NOT EXISTS public.company_operating_profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
    industry_code TEXT NOT NULL,
    archetype_code TEXT NOT NULL,
    is_legacy_mode BOOLEAN NOT NULL DEFAULT false,
    custom_capabilities JSONB NOT NULL DEFAULT '{}'::jsonb,
    custom_terminology JSONB NOT NULL DEFAULT '{}'::jsonb,
    operational_context JSONB NOT NULL DEFAULT '{}'::jsonb,
    metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT uq_company_operating_profiles_company UNIQUE (company_id)
);

-- 2. Índice para búsquedas directas O(1) por company_id
CREATE INDEX IF NOT EXISTS idx_company_operating_profiles_company 
ON public.company_operating_profiles(company_id);

-- 3. Habilitar Row Level Security (RLS)
ALTER TABLE public.company_operating_profiles ENABLE ROW LEVEL SECURITY;

-- 4. Limpieza preventiva de políticas
DROP POLICY IF EXISTS "Multi-company isolation" ON public.company_operating_profiles;

-- 5. Política de aislamiento multi-empresa
-- Cada tenant solo puede acceder a su propio perfil operativo.
-- El Super Admin tiene acceso total a todos los perfiles.
CREATE POLICY "Multi-company isolation" ON public.company_operating_profiles FOR ALL
USING (
    company_id = (auth.jwt()->>'company_id')::uuid
    OR (auth.jwt()->>'role')::text = 'super_admin'
    OR (auth.jwt()->>'role_id')::text = 'super_admin'
)
WITH CHECK (
    company_id = (auth.jwt()->>'company_id')::uuid
    OR (auth.jwt()->>'role')::text = 'super_admin'
    OR (auth.jwt()->>'role_id')::text = 'super_admin'
);

-- 6. Trigger para actualización automática de updated_at
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_company_operating_profiles_updated_at ON public.company_operating_profiles;
CREATE TRIGGER trg_company_operating_profiles_updated_at
BEFORE UPDATE ON public.company_operating_profiles
FOR EACH ROW
EXECUTE FUNCTION public.handle_updated_at();

-- 7. Seed / Backfill Idempotente para Empresas Existentes
-- Regla de Oro:
--  - Si la empresa tiene industria reconocida, se asigna su industry_code y archetype_code.
--  - Si la empresa tiene industria null, vacía o 'Otro Sector', se marca is_legacy_mode = true
--    para preservar el 100% de las funcionalidades preexistentes sin asumir minería.
INSERT INTO public.company_operating_profiles (
    company_id,
    industry_code,
    archetype_code,
    is_legacy_mode,
    custom_capabilities,
    custom_terminology,
    operational_context,
    metadata
)
SELECT 
    c.id AS company_id,
    CASE 
        WHEN c.industry ILIKE '%miner%' THEN 'MINERIA_METALURGIA'
        WHEN c.industry ILIKE '%construc%' THEN 'CONSTRUCCION_INFRAESTRUCTURA'
        WHEN c.industry ILIKE '%transport%' THEN 'TRANSPORTE_LOGISTICA'
        WHEN c.industry ILIKE '%agro%' THEN 'AGROINDUSTRIA_ALIMENTOS'
        WHEN c.industry ILIKE '%servici%' THEN 'SERVICIOS_CONTRATISTAS'
        WHEN c.industry ILIKE '%manufactur%' THEN 'MANUFACTURA_INDUSTRIA'
        WHEN c.industry ILIKE '%segurid%' THEN 'SEGURIDAD_VIGILANCIA'
        ELSE 'OTRO_SECTOR'
    END AS industry_code,
    CASE 
        WHEN c.industry ILIKE '%miner%' THEN 'MINERIA_METALURGIA'
        WHEN c.industry ILIKE '%construc%' THEN 'CONSTRUCCION_INFRAESTRUCTURA'
        WHEN c.industry ILIKE '%transport%' THEN 'TRANSPORTE_LOGISTICA'
        WHEN c.industry ILIKE '%agro%' THEN 'AGROINDUSTRIA_ALIMENTOS'
        WHEN c.industry ILIKE '%servici%' THEN 'SERVICIOS_CONTRATISTAS'
        WHEN c.industry ILIKE '%manufactur%' THEN 'MANUFACTURA_INDUSTRIA'
        WHEN c.industry ILIKE '%segurid%' THEN 'SEGURIDAD_VIGILANCIA'
        ELSE 'OTRO_SECTOR'
    END AS archetype_code,
    CASE 
        WHEN c.industry IS NULL OR trim(c.industry) = '' OR c.industry ILIKE '%otro%' THEN true
        ELSE false
    END AS is_legacy_mode,
    '{}'::jsonb,
    '{}'::jsonb,
    '{}'::jsonb,
    jsonb_build_object('migration', 'phase_4_backfill', 'original_industry', c.industry)
FROM public.companies c
ON CONFLICT (company_id) DO NOTHING;

-- ================================================================
-- FIN DE MIGRACIÓN
-- ================================================================

-- ==============================================================================
-- PASO 2/5: MIGRACIÓN 20260925_rbac_granular_v1_core.sql
-- ==============================================================================

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

-- ==============================================================================
-- PASO 3/5: MIGRACIÓN 20260926_mecanica_persistence_core.sql
-- ==============================================================================

-- ================================================================
-- INTHALY OPS — MECÁNICA: FASE 1 — INFRAESTRUCTURA DE PERSISTENCIA REAL
-- Migración: 20260926_mecanica_persistence_core.sql
-- 
-- Tablas maestras creadas:
--   1. public.mechanics_maintenance (Mantenimiento preventivo, correctivo y predictivo)
--   2. public.mechanics_fuel (Control de abastecimiento y rendimiento de combustible)
--   3. public.mechanics_checklists (Inspecciones diarias pre-operacionales)
--   4. public.mechanics_tools (Inventario, asignación y estado de herramientas de taller)
--
-- Principios de diseño:
--   - Multiempresa estricto: company_id NOT NULL con ON DELETE RESTRICT (preserva historial)
--   - equipment_asset_id opcional con ON DELETE SET NULL (desacoplado de activos contables)
--   - Vinculaciones a trabajadores opcionales con ON DELETE SET NULL
--   - RLS habilitado y reforzado con user_roles y JWT
--   - Índices compuestos optimizados para consultas operativas
--   - Preparado para futura sincronización offline (UUIDs en cliente)
-- ================================================================

-- ----------------------------------------------------------------
-- 1. TABLA: mechanics_maintenance
-- ----------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.mechanics_maintenance (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id           UUID NOT NULL REFERENCES public.companies(id) ON DELETE RESTRICT,
  equipment_asset_id    UUID REFERENCES public.assets(id) ON DELETE SET NULL,
  equipment_name        TEXT NOT NULL,
  equipment_code        TEXT NOT NULL,
  equipment_type        TEXT NOT NULL DEFAULT 'vehiculo',
  maintenance_type      TEXT NOT NULL DEFAULT 'preventivo' 
                        CHECK (maintenance_type IN ('preventivo', 'correctivo', 'predictivo')),
  description           TEXT NOT NULL,
  technician            TEXT NOT NULL,
  technician_worker_id  UUID REFERENCES public.workers(id) ON DELETE SET NULL,
  date                  DATE NOT NULL DEFAULT CURRENT_DATE,
  hours_or_km           NUMERIC NOT NULL DEFAULT 0 CHECK (hours_or_km >= 0),
  status                TEXT NOT NULL DEFAULT 'en_progreso' 
                        CHECK (status IN ('programado', 'en_progreso', 'completado', 'anulado', 'archivado')),
  cost                  NUMERIC NOT NULL DEFAULT 0 CHECK (cost >= 0),
  next_service          TEXT,
  observations          TEXT,
  created_by            UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at            TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at            TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ----------------------------------------------------------------
-- 2. TABLA: mechanics_fuel
-- ----------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.mechanics_fuel (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id           UUID NOT NULL REFERENCES public.companies(id) ON DELETE RESTRICT,
  equipment_asset_id    UUID REFERENCES public.assets(id) ON DELETE SET NULL,
  equipment_name        TEXT NOT NULL,
  equipment_code        TEXT NOT NULL,
  equipment_type        TEXT NOT NULL DEFAULT 'generador',
  date                  DATE NOT NULL DEFAULT CURRENT_DATE,
  gallons               NUMERIC NOT NULL DEFAULT 0 CHECK (gallons >= 0),
  initial_hours         NUMERIC NOT NULL DEFAULT 0 CHECK (initial_hours >= 0),
  final_hours           NUMERIC NOT NULL DEFAULT 0 CHECK (final_hours >= 0),
  hours_operated        NUMERIC NOT NULL DEFAULT 0 CHECK (hours_operated >= 0),
  ratio                 NUMERIC NOT NULL DEFAULT 0 CHECK (ratio >= 0),
  operator              TEXT NOT NULL,
  operator_worker_id    UUID REFERENCES public.workers(id) ON DELETE SET NULL,
  turn                  TEXT NOT NULL DEFAULT 'dia' CHECK (turn IN ('dia', 'noche')),
  status                TEXT NOT NULL DEFAULT 'activo' CHECK (status IN ('activo', 'anulado', 'archivado')),
  observation           TEXT,
  created_by            UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at            TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at            TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ----------------------------------------------------------------
-- 3. TABLA: mechanics_checklists
-- ----------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.mechanics_checklists (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id           UUID NOT NULL REFERENCES public.companies(id) ON DELETE RESTRICT,
  equipment_asset_id    UUID REFERENCES public.assets(id) ON DELETE SET NULL,
  equipment_name        TEXT NOT NULL,
  equipment_code        TEXT NOT NULL,
  equipment_type        TEXT NOT NULL DEFAULT 'vehiculo',
  inspector             TEXT NOT NULL,
  inspector_worker_id   UUID REFERENCES public.workers(id) ON DELETE SET NULL,
  date                  DATE NOT NULL DEFAULT CURRENT_DATE,
  turn                  TEXT NOT NULL DEFAULT 'dia' CHECK (turn IN ('dia', 'noche')),
  status                TEXT NOT NULL DEFAULT 'aprobado' 
                        CHECK (status IN ('aprobado', 'observado', 'rechazado', 'anulado')),
  checks                JSONB NOT NULL DEFAULT '[]'::jsonb,
  observations          TEXT,
  created_by            UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at            TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at            TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ----------------------------------------------------------------
-- 4. TABLA: mechanics_tools
-- ----------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.mechanics_tools (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id           UUID NOT NULL REFERENCES public.companies(id) ON DELETE RESTRICT,
  code                  TEXT NOT NULL,
  name                  TEXT NOT NULL,
  category              TEXT NOT NULL DEFAULT 'Manual',
  brand                 TEXT,
  condition             TEXT NOT NULL DEFAULT 'operativo' 
                        CHECK (condition IN ('operativo', 'en_reparacion', 'de_baja')),
  assigned_to           TEXT,
  assigned_worker_id    UUID REFERENCES public.workers(id) ON DELETE SET NULL,
  location              TEXT NOT NULL DEFAULT 'Taller',
  last_inspection_date  DATE,
  status                TEXT NOT NULL DEFAULT 'activo' 
                        CHECK (status IN ('activo', 'anulado', 'archivado', 'baja')),
  created_by            UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at            TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at            TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ----------------------------------------------------------------
-- 5. TRIGGER DE ACTUALIZACIÓN DE TIMESTAMPS
-- ----------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.update_mechanics_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_mechanics_maintenance_updated_at ON public.mechanics_maintenance;
CREATE TRIGGER trg_mechanics_maintenance_updated_at
  BEFORE UPDATE ON public.mechanics_maintenance
  FOR EACH ROW EXECUTE FUNCTION public.update_mechanics_timestamp();

DROP TRIGGER IF EXISTS trg_mechanics_fuel_updated_at ON public.mechanics_fuel;
CREATE TRIGGER trg_mechanics_fuel_updated_at
  BEFORE UPDATE ON public.mechanics_fuel
  FOR EACH ROW EXECUTE FUNCTION public.update_mechanics_timestamp();

DROP TRIGGER IF EXISTS trg_mechanics_checklists_updated_at ON public.mechanics_checklists;
CREATE TRIGGER trg_mechanics_checklists_updated_at
  BEFORE UPDATE ON public.mechanics_checklists
  FOR EACH ROW EXECUTE FUNCTION public.update_mechanics_timestamp();

DROP TRIGGER IF EXISTS trg_mechanics_tools_updated_at ON public.mechanics_tools;
CREATE TRIGGER trg_mechanics_tools_updated_at
  BEFORE UPDATE ON public.mechanics_tools
  FOR EACH ROW EXECUTE FUNCTION public.update_mechanics_timestamp();

-- ----------------------------------------------------------------
-- 6. ÍNDICES DE RENDIMIENTO Y CONSULTAS FRECUENTES
-- ----------------------------------------------------------------

-- Mantenimiento
CREATE INDEX IF NOT EXISTS idx_mechanics_maintenance_company_date 
  ON public.mechanics_maintenance (company_id, date DESC);

CREATE INDEX IF NOT EXISTS idx_mechanics_maintenance_type_status 
  ON public.mechanics_maintenance (company_id, equipment_type, status);

CREATE INDEX IF NOT EXISTS idx_mechanics_maintenance_asset 
  ON public.mechanics_maintenance (equipment_asset_id) 
  WHERE equipment_asset_id IS NOT NULL;

-- Combustible
CREATE INDEX IF NOT EXISTS idx_mechanics_fuel_company_date 
  ON public.mechanics_fuel (company_id, date DESC);

CREATE INDEX IF NOT EXISTS idx_mechanics_fuel_equipment_type 
  ON public.mechanics_fuel (company_id, equipment_type);

-- Checklists
CREATE INDEX IF NOT EXISTS idx_mechanics_checklists_company_date 
  ON public.mechanics_checklists (company_id, date DESC);

CREATE INDEX IF NOT EXISTS idx_mechanics_checklists_status 
  ON public.mechanics_checklists (company_id, status);

-- Herramientas
CREATE INDEX IF NOT EXISTS idx_mechanics_tools_company_code 
  ON public.mechanics_tools (company_id, code);

CREATE INDEX IF NOT EXISTS idx_mechanics_tools_condition 
  ON public.mechanics_tools (company_id, condition);

-- ----------------------------------------------------------------
-- 7. SEGURIDAD: ROW LEVEL SECURITY (RLS)
-- ----------------------------------------------------------------

ALTER TABLE public.mechanics_maintenance ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mechanics_fuel ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mechanics_checklists ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mechanics_tools ENABLE ROW LEVEL SECURITY;

-- Limpieza de políticas previas (idempotente)
DROP POLICY IF EXISTS "mechanics_maintenance_isolation" ON public.mechanics_maintenance;
DROP POLICY IF EXISTS "mechanics_fuel_isolation" ON public.mechanics_fuel;
DROP POLICY IF EXISTS "mechanics_checklists_isolation" ON public.mechanics_checklists;
DROP POLICY IF EXISTS "mechanics_tools_isolation" ON public.mechanics_tools;

-- Política de aislamiento para mechanics_maintenance
CREATE POLICY "mechanics_maintenance_isolation"
  ON public.mechanics_maintenance
  FOR ALL
  TO authenticated
  USING (
    company_id = (auth.jwt()->>'company_id')::uuid
    OR EXISTS (
      SELECT 1 FROM public.user_roles ur
      WHERE ur.user_id = auth.uid()
        AND ur.company_id = mechanics_maintenance.company_id
    )
    OR EXISTS (
      SELECT 1 FROM public.user_roles ur
      WHERE ur.user_id = auth.uid()
        AND ur.role_id IN ('super_admin', 'superadmin')
    )
  )
  WITH CHECK (
    company_id = (auth.jwt()->>'company_id')::uuid
    OR EXISTS (
      SELECT 1 FROM public.user_roles ur
      WHERE ur.user_id = auth.uid()
        AND ur.company_id = mechanics_maintenance.company_id
    )
    OR EXISTS (
      SELECT 1 FROM public.user_roles ur
      WHERE ur.user_id = auth.uid()
        AND ur.role_id IN ('super_admin', 'superadmin')
    )
  );

-- Política de aislamiento para mechanics_fuel
CREATE POLICY "mechanics_fuel_isolation"
  ON public.mechanics_fuel
  FOR ALL
  TO authenticated
  USING (
    company_id = (auth.jwt()->>'company_id')::uuid
    OR EXISTS (
      SELECT 1 FROM public.user_roles ur
      WHERE ur.user_id = auth.uid()
        AND ur.company_id = mechanics_fuel.company_id
    )
    OR EXISTS (
      SELECT 1 FROM public.user_roles ur
      WHERE ur.user_id = auth.uid()
        AND ur.role_id IN ('super_admin', 'superadmin')
    )
  )
  WITH CHECK (
    company_id = (auth.jwt()->>'company_id')::uuid
    OR EXISTS (
      SELECT 1 FROM public.user_roles ur
      WHERE ur.user_id = auth.uid()
        AND ur.company_id = mechanics_fuel.company_id
    )
    OR EXISTS (
      SELECT 1 FROM public.user_roles ur
      WHERE ur.user_id = auth.uid()
        AND ur.role_id IN ('super_admin', 'superadmin')
    )
  );

-- Política de aislamiento para mechanics_checklists
CREATE POLICY "mechanics_checklists_isolation"
  ON public.mechanics_checklists
  FOR ALL
  TO authenticated
  USING (
    company_id = (auth.jwt()->>'company_id')::uuid
    OR EXISTS (
      SELECT 1 FROM public.user_roles ur
      WHERE ur.user_id = auth.uid()
        AND ur.company_id = mechanics_checklists.company_id
    )
    OR EXISTS (
      SELECT 1 FROM public.user_roles ur
      WHERE ur.user_id = auth.uid()
        AND ur.role_id IN ('super_admin', 'superadmin')
    )
  )
  WITH CHECK (
    company_id = (auth.jwt()->>'company_id')::uuid
    OR EXISTS (
      SELECT 1 FROM public.user_roles ur
      WHERE ur.user_id = auth.uid()
        AND ur.company_id = mechanics_checklists.company_id
    )
    OR EXISTS (
      SELECT 1 FROM public.user_roles ur
      WHERE ur.user_id = auth.uid()
        AND ur.role_id IN ('super_admin', 'superadmin')
    )
  );

-- Política de aislamiento para mechanics_tools
CREATE POLICY "mechanics_tools_isolation"
  ON public.mechanics_tools
  FOR ALL
  TO authenticated
  USING (
    company_id = (auth.jwt()->>'company_id')::uuid
    OR EXISTS (
      SELECT 1 FROM public.user_roles ur
      WHERE ur.user_id = auth.uid()
        AND ur.company_id = mechanics_tools.company_id
    )
    OR EXISTS (
      SELECT 1 FROM public.user_roles ur
      WHERE ur.user_id = auth.uid()
        AND ur.role_id IN ('super_admin', 'superadmin')
    )
  )
  WITH CHECK (
    company_id = (auth.jwt()->>'company_id')::uuid
    OR EXISTS (
      SELECT 1 FROM public.user_roles ur
      WHERE ur.user_id = auth.uid()
        AND ur.company_id = mechanics_tools.company_id
    )
    OR EXISTS (
      SELECT 1 FROM public.user_roles ur
      WHERE ur.user_id = auth.uid()
        AND ur.role_id IN ('super_admin', 'superadmin')
    )
  );

-- ----------------------------------------------------------------
-- 8. COMENTARIOS DE DOCUMENTACIÓN
-- ----------------------------------------------------------------
COMMENT ON TABLE public.mechanics_maintenance IS 'Mecánica: Órdenes de mantenimiento preventivo, correctivo y predictivo de vehículos y maquinaria.';
COMMENT ON TABLE public.mechanics_fuel IS 'Mecánica: Registro de despachos y consumo de combustible por turno y horómetro.';
COMMENT ON TABLE public.mechanics_checklists IS 'Mecánica: Checklists e inspecciones pre-operacionales de equipos con respuestas en JSONB.';
COMMENT ON TABLE public.mechanics_tools IS 'Mecánica: Control de inventario, calibración y custodia de herramientas de taller.';

-- ----------------------------------------------------------------
-- 9. NOTIFICACIÓN Y RECARGA DE CACHE
-- ----------------------------------------------------------------
DO $$
BEGIN
  RAISE NOTICE '[MECANICA_V1] 4 tablas maestras creadas/verificadas.';
  RAISE NOTICE '[MECANICA_V1] Triggers de updated_at e índices aplicados.';
  RAISE NOTICE '[MECANICA_V1] Políticas RLS multiempresa configuradas.';
END $$;

-- ==============================================================================
-- PASO 4/5: MIGRACIÓN 20260927_planta_mineral_core.sql
-- ==============================================================================

-- ================================================================
-- INTHALY OPS — PLANTA Y MINERAL: FASE 1 — INFRAESTRUCTURA DE PERSISTENCIA REAL
-- Migración: 20260927_planta_mineral_core.sql
-- 
-- Tablas maestras creadas:
--   1. public.plant_mineral_batches (Traslado y Recepción en Planta)
--   2. public.plant_mineral_samples (Muestreo, Resultado Lab, Contramuestra, Ley Final)
--   3. public.plant_shift_checklists (Bitácora de Turno)
-- ================================================================

-- ----------------------------------------------------------------
-- 1. TABLA: plant_mineral_batches (Traslado + Planta)
-- ----------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.plant_mineral_batches (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id            UUID NOT NULL REFERENCES public.companies(id) ON DELETE RESTRICT,
  
  -- TRASLADO
  batch_code            TEXT NOT NULL,
  guide_number          TEXT,
  truck_plate           TEXT NOT NULL,
  vehicle_asset_id      UUID REFERENCES public.assets(id) ON DELETE SET NULL,
  driver_name           TEXT NOT NULL,
  driver_worker_id      UUID REFERENCES public.workers(id) ON DELETE SET NULL,
  origin_mine           TEXT NOT NULL,
  mineral_type          TEXT NOT NULL,
  gross_weight          NUMERIC NOT NULL DEFAULT 0,
  tare_weight           NUMERIC NOT NULL DEFAULT 0,
  net_weight            NUMERIC NOT NULL DEFAULT 0,
  reception_date        DATE NOT NULL DEFAULT CURRENT_DATE,
  reception_time        TIME NOT NULL,
  
  -- PLANTA
  moisture_pct          NUMERIC,
  quality_status        TEXT CHECK (quality_status IN ('optimo', 'regular', 'observado', 'rechazado')),
  quality_notes         TEXT,
  stockpile             TEXT,
  operator_name         TEXT,
  operator_worker_id    UUID REFERENCES public.workers(id) ON DELETE SET NULL,
  discharge_time        TIME,
  processing_start_time TIME,
  processing_end_time   TIME,

  stage                 TEXT NOT NULL DEFAULT 'ingresado' CHECK (stage IN ('ingresado', 'descargado', 'acopio', 'proceso', 'terminado', 'anulado')),
  
  created_by            UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at            TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at            TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ----------------------------------------------------------------
-- 2. TABLA: plant_mineral_samples (Muestreo + Laboratorio + Ley Final)
-- ----------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.plant_mineral_samples (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id            UUID NOT NULL REFERENCES public.companies(id) ON DELETE RESTRICT,
  batch_id              UUID NOT NULL REFERENCES public.plant_mineral_batches(id) ON DELETE CASCADE,
  
  -- MUESTREO
  sample_code           TEXT NOT NULL,
  sampling_date         DATE NOT NULL DEFAULT CURRENT_DATE,
  sampling_time         TIME NOT NULL,
  sampler_name          TEXT NOT NULL,
  sampler_worker_id     UUID REFERENCES public.workers(id) ON DELETE SET NULL,
  has_counter_sample    BOOLEAN NOT NULL DEFAULT false,
  counter_sample_code   TEXT,

  -- RESULTADO LAB & LEY FINAL
  lab_result_date       DATE,
  obtained_grade        NUMERIC,
  lab_notes             TEXT,
  counter_sample_result NUMERIC,
  final_agreed_grade    NUMERIC,
  
  status                TEXT NOT NULL DEFAULT 'tomada' CHECK (status IN ('tomada', 'enviada_laboratorio', 'resultado_recibido', 'ley_acordada', 'anulada')),

  created_by            UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at            TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at            TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ----------------------------------------------------------------
-- 3. TABLA: plant_shift_checklists (Bitácora)
-- ----------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.plant_shift_checklists (
  id                     UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id             UUID NOT NULL REFERENCES public.companies(id) ON DELETE RESTRICT,
  date                   DATE NOT NULL DEFAULT CURRENT_DATE,
  shift                  TEXT NOT NULL CHECK (shift IN ('dia', 'noche')),
  supervisor             TEXT NOT NULL,
  operator               TEXT NOT NULL,
  scale_checked          BOOLEAN DEFAULT false,
  hoppers_checked        BOOLEAN DEFAULT false,
  conveyor_belts_checked BOOLEAN DEFAULT false,
  crusher_checked        BOOLEAN DEFAULT false,
  ball_mill_checked      BOOLEAN DEFAULT false,
  tailings_dam_checked   BOOLEAN DEFAULT false,
  downtime_minutes       NUMERIC DEFAULT 0,
  downtime_reason        TEXT,
  notes                  TEXT,
  created_by             UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at             TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at             TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ----------------------------------------------------------------
-- 4. TRIGGER DE ACTUALIZACIÓN DE TIMESTAMPS
-- ----------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.update_plant_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_plant_mineral_batches_updated_at ON public.plant_mineral_batches;
CREATE TRIGGER trg_plant_mineral_batches_updated_at
  BEFORE UPDATE ON public.plant_mineral_batches
  FOR EACH ROW EXECUTE FUNCTION public.update_plant_timestamp();

DROP TRIGGER IF EXISTS trg_plant_mineral_samples_updated_at ON public.plant_mineral_samples;
CREATE TRIGGER trg_plant_mineral_samples_updated_at
  BEFORE UPDATE ON public.plant_mineral_samples
  FOR EACH ROW EXECUTE FUNCTION public.update_plant_timestamp();

DROP TRIGGER IF EXISTS trg_plant_shift_checklists_updated_at ON public.plant_shift_checklists;
CREATE TRIGGER trg_plant_shift_checklists_updated_at
  BEFORE UPDATE ON public.plant_shift_checklists
  FOR EACH ROW EXECUTE FUNCTION public.update_plant_timestamp();

-- ----------------------------------------------------------------
-- 5. SEGURIDAD: ROW LEVEL SECURITY (RLS)
-- ----------------------------------------------------------------

ALTER TABLE public.plant_mineral_batches ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.plant_mineral_samples ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.plant_shift_checklists ENABLE ROW LEVEL SECURITY;

-- Limpieza de políticas previas (idempotente)
DROP POLICY IF EXISTS "plant_mineral_batches_isolation" ON public.plant_mineral_batches;
DROP POLICY IF EXISTS "plant_mineral_samples_isolation" ON public.plant_mineral_samples;
DROP POLICY IF EXISTS "plant_shift_checklists_isolation" ON public.plant_shift_checklists;

-- Política mechanics
CREATE POLICY "plant_mineral_batches_isolation"
  ON public.plant_mineral_batches
  FOR ALL
  TO authenticated
  USING (
    company_id = (auth.jwt()->>'company_id')::uuid
    OR EXISTS (SELECT 1 FROM public.user_roles ur WHERE ur.user_id = auth.uid() AND ur.company_id = plant_mineral_batches.company_id)
    OR EXISTS (SELECT 1 FROM public.user_roles ur WHERE ur.user_id = auth.uid() AND ur.role_id IN ('super_admin', 'superadmin'))
  )
  WITH CHECK (
    company_id = (auth.jwt()->>'company_id')::uuid
    OR EXISTS (SELECT 1 FROM public.user_roles ur WHERE ur.user_id = auth.uid() AND ur.company_id = plant_mineral_batches.company_id)
    OR EXISTS (SELECT 1 FROM public.user_roles ur WHERE ur.user_id = auth.uid() AND ur.role_id IN ('super_admin', 'superadmin'))
  );

CREATE POLICY "plant_mineral_samples_isolation"
  ON public.plant_mineral_samples
  FOR ALL
  TO authenticated
  USING (
    company_id = (auth.jwt()->>'company_id')::uuid
    OR EXISTS (SELECT 1 FROM public.user_roles ur WHERE ur.user_id = auth.uid() AND ur.company_id = plant_mineral_samples.company_id)
    OR EXISTS (SELECT 1 FROM public.user_roles ur WHERE ur.user_id = auth.uid() AND ur.role_id IN ('super_admin', 'superadmin'))
  )
  WITH CHECK (
    company_id = (auth.jwt()->>'company_id')::uuid
    OR EXISTS (SELECT 1 FROM public.user_roles ur WHERE ur.user_id = auth.uid() AND ur.company_id = plant_mineral_samples.company_id)
    OR EXISTS (SELECT 1 FROM public.user_roles ur WHERE ur.user_id = auth.uid() AND ur.role_id IN ('super_admin', 'superadmin'))
  );

CREATE POLICY "plant_shift_checklists_isolation"
  ON public.plant_shift_checklists
  FOR ALL
  TO authenticated
  USING (
    company_id = (auth.jwt()->>'company_id')::uuid
    OR EXISTS (SELECT 1 FROM public.user_roles ur WHERE ur.user_id = auth.uid() AND ur.company_id = plant_shift_checklists.company_id)
    OR EXISTS (SELECT 1 FROM public.user_roles ur WHERE ur.user_id = auth.uid() AND ur.role_id IN ('super_admin', 'superadmin'))
  )
  WITH CHECK (
    company_id = (auth.jwt()->>'company_id')::uuid
    OR EXISTS (SELECT 1 FROM public.user_roles ur WHERE ur.user_id = auth.uid() AND ur.company_id = plant_shift_checklists.company_id)
    OR EXISTS (SELECT 1 FROM public.user_roles ur WHERE ur.user_id = auth.uid() AND ur.role_id IN ('super_admin', 'superadmin'))
  );

-- ==============================================================================
-- PASO 5/5: MIGRACIÓN 20260930_planta_evidences.sql
-- ==============================================================================

-- Add evidences JSONB to plant_mineral_batches and plant_mineral_samples

ALTER TABLE public.plant_mineral_batches 
ADD COLUMN IF NOT EXISTS evidences JSONB DEFAULT '[]'::jsonb;

ALTER TABLE public.plant_mineral_samples 
ADD COLUMN IF NOT EXISTS evidences JSONB DEFAULT '[]'::jsonb;

COMMIT;

NOTIFY pgrst, 'reload schema';
