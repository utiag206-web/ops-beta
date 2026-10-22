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
