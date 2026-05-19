-- ================================================================
-- MIGRACIÓN DE REFORZAMIENTO DE AISLAMIENTO MULTI-EMPRESA (RLS)
-- OBJETIVO: Garantizar que NINGÚN dato se cruce entre empresas a nivel DB
-- FECHA: 2026-05-02
-- ================================================================

-- 1. Habilitar RLS en todas las tablas críticas
ALTER TABLE public.workers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.warehouses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inventory_stock ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inventory_movements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.movement_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.petty_cash_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transport_payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.suppliers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.purchase_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.purchase_order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.worker_financial ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.worker_personal ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.worker_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.worker_children ENABLE ROW LEVEL SECURITY;

-- 2. Función auxiliar para obtener el company_id del JWT de forma segura
CREATE OR REPLACE FUNCTION auth.get_company_id()
RETURNS UUID AS $$
  SELECT (auth.jwt()->>'company_id')::UUID;
$$ LANGUAGE sql STABLE;

-- 3. Limpieza de políticas antiguas para evitar conflictos
DO $$ 
DECLARE 
    t TEXT;
BEGIN
    FOR t IN 
        SELECT tablename 
        FROM pg_tables 
        WHERE schemaname = 'public' 
        AND tablename IN (
            'workers', 'warehouses', 'products', 'inventory_stock', 
            'inventory_movements', 'movement_types', 'petty_cash_transactions', 
            'transport_payments', 'suppliers', 'purchase_orders', 
            'purchase_order_items', 'worker_financial', 'worker_personal', 
            'worker_documents', 'worker_children'
        )
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS "Enable all access for company users" ON public.%I', t);
        EXECUTE format('DROP POLICY IF EXISTS "Acceso por compañía" ON public.%I', t);
        EXECUTE format('DROP POLICY IF EXISTS "Multi-company isolation" ON public.%I', t);
    END LOOP;
END $$;

-- 4. Creación de políticas estandarizadas de alto rendimiento
-- Usamos (auth.jwt()->>'company_id')::uuid para evitar subconsultas lentas a la tabla users

-- Workers
CREATE POLICY "Multi-company isolation" ON public.workers FOR ALL
USING (company_id = auth.get_company_id())
WITH CHECK (company_id = auth.get_company_id());

-- Warehouses
CREATE POLICY "Multi-company isolation" ON public.warehouses FOR ALL
USING (company_id = auth.get_company_id())
WITH CHECK (company_id = auth.get_company_id());

-- Products
CREATE POLICY "Multi-company isolation" ON public.products FOR ALL
USING (company_id = auth.get_company_id())
WITH CHECK (company_id = auth.get_company_id());

-- Inventory Stock
CREATE POLICY "Multi-company isolation" ON public.inventory_stock FOR ALL
USING (company_id = auth.get_company_id())
WITH CHECK (company_id = auth.get_company_id());

-- Inventory Movements
CREATE POLICY "Multi-company isolation" ON public.inventory_movements FOR ALL
USING (company_id = auth.get_company_id())
WITH CHECK (company_id = auth.get_company_id());

-- Movement Types
CREATE POLICY "Multi-company isolation" ON public.movement_types FOR ALL
USING (company_id = auth.get_company_id())
WITH CHECK (company_id = auth.get_company_id());

-- Petty Cash
CREATE POLICY "Multi-company isolation" ON public.petty_cash_transactions FOR ALL
USING (company_id = auth.get_company_id())
WITH CHECK (company_id = auth.get_company_id());

-- Transport Payments
CREATE POLICY "Multi-company isolation" ON public.transport_payments FOR ALL
USING (company_id = auth.get_company_id())
WITH CHECK (company_id = auth.get_company_id());

-- Suppliers
CREATE POLICY "Multi-company isolation" ON public.suppliers FOR ALL
USING (company_id = auth.get_company_id())
WITH CHECK (company_id = auth.get_company_id());

-- Purchase Orders
CREATE POLICY "Multi-company isolation" ON public.purchase_orders FOR ALL
USING (company_id = auth.get_company_id())
WITH CHECK (company_id = auth.get_company_id());

-- Purchase Order Items
CREATE POLICY "Multi-company isolation" ON public.purchase_order_items FOR ALL
USING (company_id = auth.get_company_id())
WITH CHECK (company_id = auth.get_company_id());

-- Worker Financial
CREATE POLICY "Multi-company isolation" ON public.worker_financial FOR ALL
USING (company_id = auth.get_company_id())
WITH CHECK (company_id = auth.get_company_id());

-- Worker Personal
CREATE POLICY "Multi-company isolation" ON public.worker_personal FOR ALL
USING (company_id = auth.get_company_id())
WITH CHECK (company_id = auth.get_company_id());

-- Worker Documents
CREATE POLICY "Multi-company isolation" ON public.worker_documents FOR ALL
USING (company_id = auth.get_company_id())
WITH CHECK (company_id = auth.get_company_id());

-- Worker Children
CREATE POLICY "Multi-company isolation" ON public.worker_children FOR ALL
USING (company_id = auth.get_company_id())
WITH CHECK (company_id = auth.get_company_id());

-- ================================================================
-- FIN DE MIGRACIÓN
-- ================================================================
