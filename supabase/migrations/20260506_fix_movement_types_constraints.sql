-- ================================================================
-- FIX: RESTRICCIONES DE TIPOS DE MOVIMIENTO PARA UPSERT
-- ================================================================

-- 1. Asegurar que la tabla existe (por si acaso no se corrió la migración base)
CREATE TABLE IF NOT EXISTS public.movement_types (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID REFERENCES companies(id),
    name TEXT NOT NULL,
    code TEXT NOT NULL,
    effect TEXT NOT NULL, -- IN, OUT, BOTH, SET
    is_system BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 2. Añadir restricción única para permitir UPSERT por (company_id, code)
-- Esto es CRÍTICO para que la función seedMovementTypes funcione
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'movement_types_company_id_code_key'
    ) THEN
        ALTER TABLE public.movement_types ADD CONSTRAINT movement_types_company_id_code_key UNIQUE (company_id, code);
    END IF;
END $$;

-- 3. Habilitar RLS (Reinforce)
ALTER TABLE public.movement_types ENABLE ROW LEVEL SECURITY;

-- 4. Política de aislamiento (Reinforce)
DROP POLICY IF EXISTS "Multi-company isolation" ON public.movement_types;
CREATE POLICY "Multi-company isolation" ON public.movement_types FOR ALL
USING (company_id = auth.get_company_id())
WITH CHECK (company_id = auth.get_company_id());
