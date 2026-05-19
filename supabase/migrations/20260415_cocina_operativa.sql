-- 1. Eliminar la restricción actual para permitir la migración de datos
ALTER TABLE requirements DROP CONSTRAINT IF EXISTS requirements_status_check;

-- 2. Migrar estados antiguos a los nuevos
UPDATE requirements SET status = 'atendido' WHERE status = 'completado';
UPDATE requirements SET status = 'aprobado' WHERE status = 'en_proceso';

-- 3. Aplicar la nueva restricción con los estados actualizados
ALTER TABLE requirements ADD CONSTRAINT requirements_status_check CHECK (status IN ('pendiente', 'aprobado', 'atendido', 'rechazado'));

-- 2. Sistema de Caja Chica Profesional (V2)
-- Agregar columnas necesarias a petty_cash_transactions
ALTER TABLE petty_cash_transactions ADD COLUMN IF NOT EXISTS type TEXT CHECK (type IN ('ingreso', 'egreso')) DEFAULT 'egreso';
ALTER TABLE petty_cash_transactions ADD COLUMN IF NOT EXISTS category TEXT;
ALTER TABLE petty_cash_transactions ADD COLUMN IF NOT EXISTS operation_number TEXT;
ALTER TABLE petty_cash_transactions ADD COLUMN IF NOT EXISTS responsible_id UUID REFERENCES users(id);

-- Migrar fondos iniciales existentes de petty_cash_funds a transacciones tipo ingreso
INSERT INTO petty_cash_transactions (company_id, area, date, reason, amount, payment_method, type, category)
SELECT 
    company_id, 
    area, 
    (year || '-' || LPAD(month::text, 2, '0') || '-01')::DATE as date,
    'Apertura de caja / Fondo Inicial' as reason,
    initial_amount as amount,
    'efectivo' as payment_method,
    'ingreso' as type,
    'fondo_inicial' as category
FROM petty_cash_funds
ON CONFLICT DO NOTHING;

-- Asegurar que las transacciones anteriores sean marcadas como egresos y tengan categoría 'otros'
UPDATE petty_cash_transactions SET type = 'egreso', category = 'otros' WHERE type IS NULL;

-- 3. Asegurar existencia de almacén Cocina
INSERT INTO warehouses (company_id, name, code)
SELECT id, 'Cocina', 'COC' FROM companies
ON CONFLICT (company_id, name) DO NOTHING;

-- 4. Seguridad (RLS) - Se mantienen las mismas políticas de acceso por compañía
ALTER TABLE petty_cash_funds ENABLE ROW LEVEL SECURITY;
ALTER TABLE petty_cash_transactions ENABLE ROW LEVEL SECURITY;

-- Políticas para petty_cash_funds
DROP POLICY IF EXISTS "Enable all access for company users" ON petty_cash_funds;
CREATE POLICY "Enable all access for company users" ON petty_cash_funds
FOR ALL USING (
    company_id IN (SELECT company_id FROM users WHERE id = auth.uid())
) WITH CHECK (
    company_id IN (SELECT company_id FROM users WHERE id = auth.uid())
);

-- Políticas para petty_cash_transactions
DROP POLICY IF EXISTS "Enable all access for company users" ON petty_cash_transactions;
CREATE POLICY "Enable all access for company users" ON petty_cash_transactions
FOR ALL USING (
    company_id IN (SELECT company_id FROM users WHERE id = auth.uid())
) WITH CHECK (
    company_id IN (SELECT company_id FROM users WHERE id = auth.uid())
);
