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

NOTIFY pgrst, 'reload schema';
