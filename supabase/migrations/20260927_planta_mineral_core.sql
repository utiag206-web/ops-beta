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

NOTIFY pgrst, 'reload schema';
