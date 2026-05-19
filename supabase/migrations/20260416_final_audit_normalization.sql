-- ================================================================
-- MIGRACIÓN DE NORMALIZACIÓN GLOBAL - INTHALY OPS
-- OBJETIVO: Resolver errores de tipo 'uuid = text' y asegurar integridad
-- ================================================================

-- 1. Función auxiliar para conversión segura de TEXT a UUID
-- Esto evita que falle la migración si hay datos basura
CREATE OR REPLACE FUNCTION public.safe_uuid(text_val TEXT)
RETURNS UUID AS $$
BEGIN
  RETURN text_val::UUID;
EXCEPTION WHEN OTHERS THEN
  RETURN NULL;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- 2. Normalización de tabla USERS (Columna ID ya es UUID por Auth, pero asegurar otros)
DO $$ 
BEGIN
    ALTER TABLE public.users ALTER COLUMN company_id TYPE UUID USING public.safe_uuid(company_id::text);
    ALTER TABLE public.users ALTER COLUMN worker_id TYPE UUID USING public.safe_uuid(worker_id::text);
EXCEPTION WHEN OTHERS THEN 
    RAISE NOTICE 'Error al normalizar campos en users: %', SQLERRM;
END $$;

-- 3. Normalización de tabla REQUIREMENTS
DO $$ 
BEGIN
    ALTER TABLE public.requirements ALTER COLUMN company_id TYPE UUID USING public.safe_uuid(company_id::text);
    ALTER TABLE public.requirements ALTER COLUMN created_by TYPE UUID USING public.safe_uuid(created_by::text);
    ALTER TABLE public.requirements ALTER COLUMN product_id TYPE UUID USING public.safe_uuid(product_id::text);
EXCEPTION WHEN OTHERS THEN 
    RAISE NOTICE 'Error al normalizar campos en requirements: %', SQLERRM;
END $$;

-- 4. Normalización de tabla INCIDENCIAS
DO $$ 
BEGIN
    ALTER TABLE public.incidencias ALTER COLUMN company_id TYPE UUID USING public.safe_uuid(company_id::text);
    ALTER TABLE public.incidencias ALTER COLUMN reported_by TYPE UUID USING public.safe_uuid(reported_by::text);
EXCEPTION WHEN OTHERS THEN 
    RAISE NOTICE 'Error al normalizar campos en incidencias: %', SQLERRM;
END $$;

-- 5. Normalización de tabla INVENTORY_MOVEMENTS (Núcleo crítico)
DO $$ 
BEGIN
    ALTER TABLE public.inventory_movements ALTER COLUMN company_id TYPE UUID USING public.safe_uuid(company_id::text);
    ALTER TABLE public.inventory_movements ALTER COLUMN product_id TYPE UUID USING public.safe_uuid(product_id::text);
    ALTER TABLE public.inventory_movements ALTER COLUMN warehouse_id TYPE UUID USING public.safe_uuid(warehouse_id::text);
    ALTER TABLE public.inventory_movements ALTER COLUMN user_id TYPE UUID USING public.safe_uuid(user_id::text);
    ALTER TABLE public.inventory_movements ALTER COLUMN created_by TYPE UUID USING public.safe_uuid(created_by::text);
    ALTER TABLE public.inventory_movements ALTER COLUMN movement_type_id TYPE UUID USING public.safe_uuid(movement_type_id::text);
EXCEPTION WHEN OTHERS THEN 
    RAISE NOTICE 'Error al normalizar campos en inventory_movements: %', SQLERRM;
END $$;

-- 6. Normalización de tabla INVENTORY_STOCK
DO $$ 
BEGIN
    -- Asegurar que la PK compuesta e índices funcionen con UUID
    ALTER TABLE public.inventory_stock ALTER COLUMN product_id TYPE UUID USING public.safe_uuid(product_id::text);
    ALTER TABLE public.inventory_stock ALTER COLUMN warehouse_id TYPE UUID USING public.safe_uuid(warehouse_id::text);
    ALTER TABLE public.inventory_stock ALTER COLUMN company_id TYPE UUID USING public.safe_uuid(company_id::text);
EXCEPTION WHEN OTHERS THEN 
    RAISE NOTICE 'Error al normalizar campos en inventory_stock: %', SQLERRM;
END $$;

-- 7. Normalización de tabla ATTENDANCE
DO $$ 
BEGIN
    ALTER TABLE public.attendance ALTER COLUMN company_id TYPE UUID USING public.safe_uuid(company_id::text);
    ALTER TABLE public.attendance ALTER COLUMN worker_id TYPE UUID USING public.safe_uuid(worker_id::text);
EXCEPTION WHEN OTHERS THEN 
    RAISE NOTICE 'Error al normalizar campos en attendance: %', SQLERRM;
END $$;

-- 8. Normalización de tabla BONUSES / WORKER_BONUSES
-- (Se aplica a ambos nombres de tabla preventivamente segun variaciones vistas)
DO $$ 
BEGIN
    IF EXISTS (SELECT FROM pg_tables WHERE tablename = 'bonuses') THEN
        ALTER TABLE public.bonuses ALTER COLUMN company_id TYPE UUID USING public.safe_uuid(company_id::text);
        ALTER TABLE public.bonuses ALTER COLUMN worker_id TYPE UUID USING public.safe_uuid(worker_id::text);
    END IF;
    
    IF EXISTS (SELECT FROM pg_tables WHERE tablename = 'worker_bonuses') THEN
        ALTER TABLE public.worker_bonuses ALTER COLUMN company_id TYPE UUID USING public.safe_uuid(company_id::text);
        ALTER TABLE public.worker_bonuses ALTER COLUMN worker_id TYPE UUID USING public.safe_uuid(worker_id::text);
    END IF;
EXCEPTION WHEN OTHERS THEN 
    RAISE NOTICE 'Error al normalizar campos en bonuses: %', SQLERRM;
END $$;

-- 9. Normalización de tabla PPE_DELIVERIES
DO $$ 
BEGIN
    ALTER TABLE public.ppe_deliveries ALTER COLUMN company_id TYPE UUID USING public.safe_uuid(company_id::text);
    ALTER TABLE public.ppe_deliveries ALTER COLUMN worker_id TYPE UUID USING public.safe_uuid(worker_id::text);
EXCEPTION WHEN OTHERS THEN 
    RAISE NOTICE 'Error al normalizar campos en ppe_deliveries: %', SQLERRM;
END $$;

-- 10. Normalización de tabla PETTY_CASH_TRANSACTIONS
DO $$ 
BEGIN
    ALTER TABLE public.petty_cash_transactions ALTER COLUMN company_id TYPE UUID USING public.safe_uuid(company_id::text);
    ALTER TABLE public.petty_cash_transactions ALTER COLUMN user_id TYPE UUID USING public.safe_uuid(user_id::text);
EXCEPTION WHEN OTHERS THEN 
    RAISE NOTICE 'Error al normalizar campos en petty_cash_transactions: %', SQLERRM;
END $$;

-- 11. Limpieza de función auxiliar
-- DROP FUNCTION public.safe_uuid(TEXT);

-- ================================================================
-- FIN DE MIGRACIÓN DE NORMALIZACIÓN
-- ================================================================
