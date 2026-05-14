-- ================================================================
-- CORRECCIÓN DE POLÍTICAS RLS PARA TABLAS DE BONOS Y PASAJES
-- ERROR: 'operator does not exist: uuid = text'
-- ================================================================

-- El error ocurre porque en la migración de normalización (16 de abril)
-- convertimos 'company_id' y 'worker_id' de TEXT a UUID, pero las políticas RLS 
-- seguían comparando el nuevo UUID con el valor de auth.jwt()->>'company_id', 
-- que se devuelve como texto (TEXT).

DO $$ 
BEGIN

    -- -------------------------------------------------------------
    -- 1. CORREGIR POLÍTICAS EN LA TABLA 'bonuses'
    -- -------------------------------------------------------------
    IF EXISTS (SELECT FROM pg_tables WHERE tablename = 'bonuses') THEN
        
        -- Eliminar políticas antiguas (probablemente creadas manualmente en Supabase)
        DROP POLICY IF EXISTS "Enable all access for users of same company" ON public.bonuses;
        DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON public.bonuses;
        DROP POLICY IF EXISTS "Enable read access for all users" ON public.bonuses;
        -- Borrar políticas con el nombre estándar que usamos en otras tablas
        DROP POLICY IF EXISTS "Enable all access for company users" ON public.bonuses;
        DROP POLICY IF EXISTS "Bonuses access by company" ON public.bonuses;

        -- Crear política correcta forzando el CAST (::uuid)
        CREATE POLICY "Enable all access for company users" 
        ON public.bonuses FOR ALL 
        USING (company_id = (auth.jwt()->>'company_id')::uuid)
        WITH CHECK (company_id = (auth.jwt()->>'company_id')::uuid);
    
    END IF;

    -- -------------------------------------------------------------
    -- 2. CORREGIR POLÍTICAS EN LA TABLA 'transport_payments'
    -- -------------------------------------------------------------
    IF EXISTS (SELECT FROM pg_tables WHERE tablename = 'transport_payments') THEN
        
        -- Eliminar políticas antiguas
        DROP POLICY IF EXISTS "Enable all access for users of same company" ON public.transport_payments;
        DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON public.transport_payments;
        DROP POLICY IF EXISTS "Enable read access for all users" ON public.transport_payments;
        DROP POLICY IF EXISTS "Enable all access for company users" ON public.transport_payments;
        DROP POLICY IF EXISTS "Transport payments access by company" ON public.transport_payments;

        -- Crear política correcta forzando el CAST (::uuid)
        CREATE POLICY "Enable all access for company users" 
        ON public.transport_payments FOR ALL 
        USING (company_id = (auth.jwt()->>'company_id')::uuid)
        WITH CHECK (company_id = (auth.jwt()->>'company_id')::uuid);

    END IF;

    -- -------------------------------------------------------------
    -- 3. CORREGIR POLÍTICAS EN LA TABLA 'worker_bonuses' (si existe)
    -- -------------------------------------------------------------
    IF EXISTS (SELECT FROM pg_tables WHERE tablename = 'worker_bonuses') THEN
        
        -- Eliminar políticas antiguas
        DROP POLICY IF EXISTS "Enable all access for users of same company" ON public.worker_bonuses;
        DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON public.worker_bonuses;
        DROP POLICY IF EXISTS "Enable read access for all users" ON public.worker_bonuses;
        DROP POLICY IF EXISTS "Enable all access for company users" ON public.worker_bonuses;

        -- Crear política correcta forzando el CAST (::uuid)
        CREATE POLICY "Enable all access for company users" 
        ON public.worker_bonuses FOR ALL 
        USING (company_id = (auth.jwt()->>'company_id')::uuid)
        WITH CHECK (company_id = (auth.jwt()->>'company_id')::uuid);

    END IF;

END $$;
