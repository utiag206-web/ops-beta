-- ================================================================
-- RECONSTRUCCIÓN TOTAL DEL MOTOR DE INVENTARIO
-- ================================================================

-- 1. Índice Único Obligatorio (Evita duplicidad de stock por almacén)
CREATE UNIQUE INDEX IF NOT EXISTS idx_stock_product_warehouse_company
ON inventory_stock (product_id, warehouse_id, company_id);

-- 2. Función para Movimientos (Suma/Resta de stock)
CREATE OR REPLACE FUNCTION upsert_inventory_stock(
  p_product_id UUID,
  p_warehouse_id UUID,
  p_company_id UUID,
  p_quantity NUMERIC
) RETURNS VOID AS $$
BEGIN
  INSERT INTO inventory_stock (product_id, warehouse_id, company_id, quantity, updated_at)
  VALUES (p_product_id, p_warehouse_id, p_company_id, p_quantity, NOW())
  ON CONFLICT (product_id, warehouse_id, company_id)
  DO UPDATE SET 
    quantity = inventory_stock.quantity + EXCLUDED.quantity,
    updated_at = EXCLUDED.updated_at;
END;
$$ LANGUAGE plpgsql;

-- 3. Función para Ajuste Manual (Establece valor absoluto)
CREATE OR REPLACE FUNCTION set_inventory_stock(
  p_product_id UUID,
  p_warehouse_id UUID,
  p_company_id UUID,
  p_quantity NUMERIC
) RETURNS VOID AS $$
BEGIN
  INSERT INTO inventory_stock (product_id, warehouse_id, company_id, quantity, updated_at)
  VALUES (p_product_id, p_warehouse_id, p_company_id, p_quantity, NOW())
  ON CONFLICT (product_id, warehouse_id, company_id)
  DO UPDATE SET 
    quantity = EXCLUDED.quantity,
    updated_at = EXCLUDED.updated_at;
END;
$$ LANGUAGE plpgsql;

-- 4. Función Atómica para Transferencias (Doble movimiento + validación)
CREATE OR REPLACE FUNCTION transfer_inventory(
  p_product_id UUID,
  p_company_id UUID,
  p_source_warehouse_id UUID,
  p_target_warehouse_id UUID,
  p_quantity NUMERIC,
  p_document_number TEXT,
  p_user_id UUID,
  p_movement_type_id UUID,
  p_observation TEXT
) RETURNS VOID AS $$
DECLARE
  current_stock NUMERIC;
BEGIN
  -- Asegurar que exista el registro en origen (con 0 si no existe)
  INSERT INTO inventory_stock (product_id, warehouse_id, company_id, quantity, updated_at)
  VALUES (p_product_id, p_source_warehouse_id, p_company_id, 0, NOW())
  ON CONFLICT (product_id, warehouse_id, company_id) DO NOTHING;

  -- Validar stock real en el almacén origen
  SELECT quantity INTO current_stock
  FROM inventory_stock
  WHERE product_id = p_product_id
    AND warehouse_id = p_source_warehouse_id
    AND company_id = p_company_id;

  IF current_stock < p_quantity THEN
    RAISE EXCEPTION 'Stock insuficiente en el almacén origen (Disponible: %, Requerido: %)', current_stock, p_quantity;
  END IF;

  -- 1. Insertar Movimiento de Salida (Origen)
  INSERT INTO inventory_movements (
    product_id, warehouse_id, company_id, user_id, created_by,
    movement_type_id, quantity, type, document_type, document_number, observation, created_at
  )
  VALUES (
    p_product_id, p_source_warehouse_id, p_company_id, p_user_id, p_user_id,
    p_movement_type_id, p_quantity, 'salida', 'TRS', p_document_number, p_observation, NOW()
  );

  -- 2. Insertar Movimiento de Ingreso (Destino)
  INSERT INTO inventory_movements (
    product_id, warehouse_id, company_id, user_id, created_by,
    movement_type_id, quantity, type, document_type, document_number, observation, created_at
  )
  VALUES (
    p_product_id, p_target_warehouse_id, p_company_id, p_user_id, p_user_id,
    p_movement_type_id, p_quantity, 'ingreso', 'TRS', p_document_number, p_observation, NOW()
  );

  -- 3. Actualizar stocks (Atómico)
  PERFORM upsert_inventory_stock(p_product_id, p_source_warehouse_id, p_company_id, -p_quantity);
  PERFORM upsert_inventory_stock(p_product_id, p_target_warehouse_id, p_company_id, p_quantity);
END;
$$ LANGUAGE plpgsql;
