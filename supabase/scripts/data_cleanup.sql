-- ================================================================
-- INTHALY OPS - SCRIPT DE LIMPIEZA PARA PRODUCCIÓN (V3 - FINAL)
-- ================================================================
-- Este script elimina registros de prueba, "demo", "test" y "borrar"
-- preservando la integridad de los datos reales de la empresa.
-- ADVERTENCIA: Ejecutar primero en ambiente de pruebas si es posible.

BEGIN;

-- 1. LIMPIEZA DE INCIDENCIAS (SOMA)
DELETE FROM incidencias 
WHERE description ILIKE '%prueba%' 
   OR description ILIKE '%demo%' 
   OR area_location ILIKE '%prueba%'
   OR description IS NULL 
   OR length(description) < 5;

-- 2. LIMPIEZA DE REQUERIMIENTOS
DELETE FROM requirements 
WHERE title ILIKE '%prueba%' 
   OR title ILIKE '%demo%'
   OR description ILIKE '%test%';

-- 3. LIMPIEZA DE MOVIMIENTOS DE INVENTARIO
DELETE FROM inventory_movements 
WHERE observation ILIKE '%prueba%' 
   OR observation ILIKE '%demo%'
   OR document_number ILIKE '%TEST%'
   OR (document_number = 'INICIAL' AND quantity = 0);

-- 4. LIMPIEZA DE PRODUCTOS
DELETE FROM products 
WHERE name ILIKE '%borrar%' 
   OR name ILIKE '%test%'
   OR name ILIKE '%producto de prueba%';

-- 5. LIMPIEZA DE CAJA CHICA (Usa 'reason' en lugar de 'description')
DELETE FROM petty_cash_transactions 
WHERE reason ILIKE '%prueba%' 
   OR reason ILIKE '%test%';

-- 6. LIMPIEZA DE TRABAJADORES (Usa 'name' en lugar de 'first_name/last_name')
DELETE FROM workers 
WHERE name ILIKE '%prueba%' 
   OR name ILIKE '%demo%'
   OR name ILIKE '%test%';

COMMIT;
