-- 1. Agregar columna area a almacenes para blindaje de roles
ALTER TABLE warehouses ADD COLUMN IF NOT EXISTS area TEXT;

-- 2. Mapear almacenes de Cocina existentes
UPDATE warehouses 
SET area = 'COCINA' 
WHERE name ILIKE '%Cocina%' AND area IS NULL;

-- 3. Crear índice para performance
CREATE INDEX IF NOT EXISTS idx_warehouses_area ON warehouses(area);

-- 4. Inyectar almacén por defecto si no existe por algún motivo
INSERT INTO warehouses (company_id, name, code, area)
SELECT id, 'Cocina', 'COC', 'COCINA' FROM companies
ON CONFLICT (company_id, name) DO UPDATE SET area = 'COCINA';

-- 5. Recargar caché de esquema (Si estuviera en RPC, pero aquí es informativo)
-- NOTIFY pgrst, 'reload schema';
