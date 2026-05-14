-- Asegurar que reported_by sea UUID y tenga FK a users
-- Inthaly OPS: Estabilización de Módulo SOMA/Incidencias

DO $$ 
BEGIN
    -- 1. Asegurar que reported_by tenga el tipo correcto
    ALTER TABLE public.incidencias ALTER COLUMN reported_by TYPE UUID USING reported_by::uuid;
EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'reported_by already UUID or conversion not possible';
END $$;

-- 2. Añadir FK explícita
ALTER TABLE public.incidencias 
DROP CONSTRAINT IF EXISTS incidencias_reported_by_fkey;

ALTER TABLE public.incidencias
ADD CONSTRAINT incidencias_reported_by_fkey 
FOREIGN KEY (reported_by) REFERENCES public.users(id) ON DELETE SET NULL;

-- 3. Asegurar columnas de la FASE 2 SOMA
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='incidencias' AND column_name='incident_category') THEN
        ALTER TABLE public.incidencias ADD COLUMN incident_category TEXT DEFAULT 'personal';
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='incidencias' AND column_name='corrective_actions') THEN
        ALTER TABLE public.incidencias ADD COLUMN corrective_actions TEXT;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='incidencias' AND column_name='photo_urls') THEN
        ALTER TABLE public.incidencias ADD COLUMN photo_urls JSONB DEFAULT '[]'::jsonb;
    END IF;
END $$;

-- 4. RLS Harden
ALTER TABLE public.incidencias ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view incidents of their company" ON public.incidencias;
CREATE POLICY "Users can view incidents of their company" ON public.incidencias
    FOR SELECT USING (company_id = (SELECT company_id FROM public.users WHERE id = auth.uid()));

DROP POLICY IF EXISTS "Users can report incidents" ON public.incidencias;
CREATE POLICY "Users can report incidents" ON public.incidencias
    FOR INSERT WITH CHECK (company_id = (SELECT company_id FROM public.users WHERE id = auth.uid()));
