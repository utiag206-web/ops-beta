-- Migración para añadir clave única de (company_id, code) en warehouses
-- Esto habilita el correcto funcionamiento del bootstrapCompany dynamic onboarding upsert.

ALTER TABLE public.warehouses 
ADD CONSTRAINT warehouses_company_id_code_key UNIQUE (company_id, code);
