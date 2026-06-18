-- ================================================================
-- MIGRACIÓN: CREACIÓN DE TABLAS DE OPERACIONES (PRODUCCIÓN Y MADERAS)
-- OBJETIVO: Soportar la persistencia normalizada de hojas de cálculo industriales
-- E INTEGRACIÓN PREPARADA CON INVENTARIO/ALMACENES
-- ================================================================

-- 1. Crear tabla de Control de Producción
CREATE TABLE IF NOT EXISTS public.production_control (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  warehouse_id UUID REFERENCES public.warehouses(id) ON DELETE SET NULL, -- Almacén de consumo
  date DATE NOT NULL,
  workplace VARCHAR(100) NOT NULL, -- Labor
  shift VARCHAR(20) NOT NULL, -- Turno (Día, Noche)
  advance_meters VARCHAR(100), -- Metros avance port. (admite texto como "2.00m", "4 cortes")
  nails_qty INTEGER DEFAULT 0, -- Clavos/unid
  cambuchos INTEGER DEFAULT 0, -- Cambuchos
  chocolate_qty INTEGER DEFAULT 0, -- Chocolate/unid
  pita_meters VARCHAR(50), -- Pita/metros (admite texto como "9.0cm", "90 cm")
  shift_supervisor VARCHAR(100), -- Supervisor de turno
  dumper_mineral VARCHAR(50), -- Dumper de mineral (admite "1", "-", etc.)
  dumper_waste VARCHAR(50), -- Dumper de desmonte (admite "2", "1/2", "By medio", "5.5")
  observations TEXT, -- Observaciones
  created_at TIMESTAMPTZ DEFAULT now(),
  created_by UUID REFERENCES public.users(id) ON DELETE SET NULL
);

-- 2. Crear tabla de Control de Maderas
CREATE TABLE IF NOT EXISTS public.wood_control (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  warehouse_id UUID REFERENCES public.warehouses(id) ON DELETE SET NULL, -- Almacén de consumo
  date DATE NOT NULL,
  workplace VARCHAR(100) NOT NULL, -- Labor
  shift VARCHAR(20) NOT NULL, -- Turno (Día, Noche)
  boards_2in INTEGER DEFAULT 0, -- Tablas 2"
  rajas INTEGER DEFAULT 0, -- Rajas
  strut_8in INTEGER DEFAULT 0, -- Puntal 8"
  strut_6in INTEGER DEFAULT 0, -- Puntal 6"
  strut_4in INTEGER DEFAULT 0, -- Puntal 4"
  others TEXT, -- Otros (...)
  created_at TIMESTAMPTZ DEFAULT now(),
  created_by UUID REFERENCES public.users(id) ON DELETE SET NULL
);

-- 3. Crear tabla de trazabilidad M:N (Operaciones -> Movimientos de Inventario)
CREATE TABLE IF NOT EXISTS public.operations_inventory_link (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  source_type VARCHAR(50) NOT NULL, -- 'production' or 'wood'
  source_id UUID NOT NULL, -- ID de production_control o wood_control
  movement_id UUID NOT NULL REFERENCES public.inventory_movements(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 4. Habilitar RLS estricto multi-tenant
ALTER TABLE public.production_control ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wood_control ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.operations_inventory_link ENABLE ROW LEVEL SECURITY;

-- 5. Limpieza de políticas previas (por si acaso se re-ejecuta)
DROP POLICY IF EXISTS "Multi-company isolation" ON public.production_control;
DROP POLICY IF EXISTS "Multi-company isolation" ON public.wood_control;
DROP POLICY IF EXISTS "Multi-company isolation" ON public.operations_inventory_link;

-- 6. Crear políticas estandarizadas de aislamiento multi-tenant
CREATE POLICY "Multi-company isolation" ON public.production_control FOR ALL
USING (company_id = (auth.jwt()->>'company_id')::uuid)
WITH CHECK (company_id = (auth.jwt()->>'company_id')::uuid);

CREATE POLICY "Multi-company isolation" ON public.wood_control FOR ALL
USING (company_id = (auth.jwt()->>'company_id')::uuid)
WITH CHECK (company_id = (auth.jwt()->>'company_id')::uuid);

CREATE POLICY "Multi-company isolation" ON public.operations_inventory_link FOR ALL
USING (company_id = (auth.jwt()->>'company_id')::uuid)
WITH CHECK (company_id = (auth.jwt()->>'company_id')::uuid);

-- 7. Índices de rendimiento óptimo para búsquedas y trazabilidad
CREATE INDEX IF NOT EXISTS idx_production_control_company_date ON public.production_control(company_id, date);
CREATE INDEX IF NOT EXISTS idx_wood_control_company_date ON public.wood_control(company_id, date);
CREATE INDEX IF NOT EXISTS idx_ops_inv_link_source ON public.operations_inventory_link(source_type, source_id);

-- 8. Forzar recarga del schema cache en Supabase (requerido para PostgREST)
NOTIFY pgrst, 'reload schema';
