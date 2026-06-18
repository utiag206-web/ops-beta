-- Agregar campos fecha_adquisicion y observaciones a la tabla assets
ALTER TABLE assets ADD COLUMN IF NOT EXISTS acquisition_date DATE;
ALTER TABLE assets ADD COLUMN IF NOT EXISTS observations TEXT;
