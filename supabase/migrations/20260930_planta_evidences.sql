-- Add evidences JSONB to plant_mineral_batches and plant_mineral_samples

ALTER TABLE public.plant_mineral_batches 
ADD COLUMN IF NOT EXISTS evidences JSONB DEFAULT '[]'::jsonb;

ALTER TABLE public.plant_mineral_samples 
ADD COLUMN IF NOT EXISTS evidences JSONB DEFAULT '[]'::jsonb;
