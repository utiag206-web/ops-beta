-- Función RPC transaccional para registrar transferencias de caja chica de manera atómica
CREATE OR REPLACE FUNCTION register_petty_cash_transfer(
  p_company_id UUID,
  p_responsible_id UUID,
  p_source_area TEXT,
  p_dest_area TEXT,
  p_amount NUMERIC,
  p_reason TEXT,
  p_payment_method TEXT,
  p_operation_number TEXT,
  p_date DATE,
  p_voucher_url TEXT
) RETURNS VOID AS $$
BEGIN
  -- 1. Insertar el egreso en la caja origen
  INSERT INTO petty_cash_transactions (
    company_id,
    responsible_id,
    area,
    amount,
    type,
    category,
    reason,
    payment_method,
    operation_number,
    date,
    voucher_url
  ) VALUES (
    p_company_id,
    p_responsible_id,
    p_source_area,
    p_amount,
    'egreso',
    'transferencia',
    p_reason,
    p_payment_method,
    p_operation_number,
    p_date,
    p_voucher_url
  );

  -- 2. Insertar el ingreso en la caja destino
  INSERT INTO petty_cash_transactions (
    company_id,
    responsible_id,
    area,
    amount,
    type,
    category,
    reason,
    payment_method,
    operation_number,
    date,
    voucher_url
  ) VALUES (
    p_company_id,
    p_responsible_id,
    p_dest_area,
    p_amount,
    'ingreso',
    'transferencia',
    p_reason,
    p_payment_method,
    p_operation_number,
    p_date,
    p_voucher_url
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
