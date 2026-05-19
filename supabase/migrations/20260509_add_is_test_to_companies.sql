-- Migration to add is_test flag to companies table
ALTER TABLE companies ADD COLUMN is_test BOOLEAN DEFAULT false;

-- Mark historical test companies if any (optional, but good for cleanliness)
-- UPDATE companies SET is_test = true WHERE name ILIKE '%test%' OR name ILIKE '%prueba%';
