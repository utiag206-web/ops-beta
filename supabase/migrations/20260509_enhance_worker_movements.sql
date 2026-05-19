-- Migration to enhance worker_movements table
ALTER TABLE worker_movements ADD COLUMN IF NOT EXISTS camp_name TEXT;
ALTER TABLE worker_movements ADD COLUMN IF NOT EXISTS observations TEXT;

-- Index for better performance
CREATE INDEX IF NOT EXISTS idx_worker_movements_company_id ON worker_movements(company_id);
