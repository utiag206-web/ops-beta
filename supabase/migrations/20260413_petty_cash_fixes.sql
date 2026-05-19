-- 1. Crear el bucket de almacenamiento para Caja Chica (Público para lectura)
INSERT INTO storage.buckets (id, name, public)
VALUES ('petty-cash', 'petty-cash', true)
ON CONFLICT (id) DO NOTHING;

-- 2. Corregir el dato actual de S/30.00 de condimentos
-- Se cambia de 'egreso' a 'ingreso' y se asigna la categoría de 'fondo_inicial'
-- para que el saldo de la caja sea positivo (+S/30.00)
UPDATE petty_cash_transactions 
SET type = 'ingreso', 
    category = 'fondo_inicial',
    reason = 'Apertura de Caja / Fondo Inicial (condimentos, ajo, pimienta, comino)'
WHERE reason ILIKE '%condimentos%' AND amount = 30 AND type = 'egreso';

-- Política de acceso para el nuevo bucket (Lectura pública)
-- Primero eliminamos si existe para evitar duplicados en la migración
DO $$ 
BEGIN
    DROP POLICY IF EXISTS "Acceso público de lectura para petty-cash" ON storage.objects;
    DROP POLICY IF EXISTS "Subida autenticada para petty-cash" ON storage.objects;
END $$;

CREATE POLICY "Acceso público de lectura para petty-cash"
ON storage.objects FOR SELECT
USING (bucket_id = 'petty-cash');

CREATE POLICY "Subida autenticada para petty-cash"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'petty-cash');
