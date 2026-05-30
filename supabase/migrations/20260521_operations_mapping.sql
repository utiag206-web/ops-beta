-- ================================================================
-- MIGRACIÓN: INTEGRACIÓN OPERACIONES <-> INVENTARIO (FASE 1)
-- OBJETIVO: Mapeo dinámico y preparación de workflows
-- FECHA: 2026-05-21
-- ================================================================

-- 1. Soporte de Workflows Operativos
ALTER TABLE public.production_control ADD COLUMN IF NOT EXISTS status VARCHAR(20) DEFAULT 'draft';
ALTER TABLE public.wood_control ADD COLUMN IF NOT EXISTS status VARCHAR(20) DEFAULT 'draft';

-- 2. Crear tabla de configuración de Mapeo Dinámico
CREATE TABLE IF NOT EXISTS public.operations_product_mapping (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  operation_type VARCHAR(50) NOT NULL, -- 'production', 'wood'
  column_name VARCHAR(100) NOT NULL,   -- 'nails_qty', 'boards_2in', etc.
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  unit_ratio NUMERIC DEFAULT 1.0,      -- Factor de conversión (ej. 1 caja = 100 unidades)
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  created_by UUID REFERENCES public.users(id) ON DELETE SET NULL,
  UNIQUE(company_id, operation_type, column_name)
);

-- 3. RLS para operations_product_mapping
ALTER TABLE public.operations_product_mapping ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Multi-company isolation" ON public.operations_product_mapping;
CREATE POLICY "Multi-company isolation" ON public.operations_product_mapping FOR ALL
USING (company_id = (auth.jwt()->>'company_id')::uuid)
WITH CHECK (company_id = (auth.jwt()->>'company_id')::uuid);

CREATE INDEX IF NOT EXISTS idx_ops_prod_mapping_company ON public.operations_product_mapping(company_id, operation_type);

-- 4. Inyección del Tipo de Movimiento Operacional Simulado
-- a) Nos aseguramos de que la columna is_system exista
ALTER TABLE public.movement_types ADD COLUMN IF NOT EXISTS is_system BOOLEAN DEFAULT false;

-- b) Limpieza de duplicados legacy (Auditoría automática)
-- Conservamos el registro más antiguo y borramos copias duplicadas del mismo código para la misma empresa
WITH duplicates AS (
  SELECT id,
         ROW_NUMBER() OVER(PARTITION BY company_id, code ORDER BY created_at ASC) as row_num
  FROM public.movement_types
)
DELETE FROM public.movement_types
WHERE id IN (SELECT id FROM duplicates WHERE row_num > 1);

-- c) Crear Restricción UNIQUE de forma idempotente
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'movement_types_company_id_code_key'
    ) THEN
        ALTER TABLE public.movement_types ADD CONSTRAINT movement_types_company_id_code_key UNIQUE (company_id, code);
    END IF;
END $$;

-- d) Inyectar en TODAS las empresas existentes de forma limpia
DO $$ 
DECLARE
  comp RECORD;
BEGIN
  FOR comp IN SELECT id FROM public.companies LOOP
    INSERT INTO public.movement_types (
      company_id, name, code, effect, is_system
    )
    VALUES (
      comp.id, 
      'Consumo Operacional (Simulado)', 
      'OPS_OUT_SIM', 
      'OUT', 
      true
    )
    ON CONFLICT (company_id, code) DO NOTHING;
  END LOOP;
END $$;

-- 5. Recarga de Cache para Supabase/PostgREST
NOTIFY pgrst, 'reload schema';
