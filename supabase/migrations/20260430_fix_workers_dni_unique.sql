-- Migración para corregir restricción de DNI único global en trabajadores
-- Objetivo: Permitir que el mismo DNI exista en diferentes empresas (compañías)
-- Autor: Antigravity

BEGIN;

-- 1. Eliminar la restricción de DNI único global si existe
ALTER TABLE public.workers DROP CONSTRAINT IF EXISTS workers_dni_key;

-- 2. Crear la nueva restricción UNIQUE combinada (company_id, dni)
ALTER TABLE public.workers ADD CONSTRAINT workers_dni_company_id_key UNIQUE (company_id, dni);

-- 3. Corregir mapeo de roles para usuarios antiguos (Blindaje de Asociación)
-- Esto asegura que usuarios con 'Administrador' en la columna antigua 'role' reciban 'admin' en 'role_id'
UPDATE public.users 
SET role_id = 'admin' 
WHERE role_id IS NULL AND (LOWER(role) = 'administrador' OR LOWER(role) = 'admin');

UPDATE public.users 
SET role_id = 'operaciones' 
WHERE role_id IS NULL AND (LOWER(role) = 'operaciones' OR LOWER(role) = 'operación' OR LOWER(role) = 'operacion');

UPDATE public.users 
SET role_id = 'almacen' 
WHERE role_id IS NULL AND (LOWER(role) = 'almacén' OR LOWER(role) = 'almacen' OR LOWER(role) = 'logistica' OR LOWER(role) = 'logística');

COMMIT;
