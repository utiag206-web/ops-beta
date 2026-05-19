-- 1. Limpiar referencias previas si existen
ALTER TABLE IF EXISTS public.users DROP CONSTRAINT IF EXISTS users_role_id_fkey;
DROP TABLE IF EXISTS public.roles CASCADE;

-- 2. Crear tabla de roles con ID de TEXTO (importante para el sistema)
CREATE TABLE public.roles (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT
);

-- 3. Poblar roles base con IDs de texto
INSERT INTO public.roles (id, name, description) VALUES
('admin', 'Administrador', 'Control total del sistema'),
('gerente', 'Gerente', 'Reportes globales y dashboards'),
('jefe_area', 'Jefe de Área', 'Gestión de requerimientos y aprobaciones de su área'),
('almacen', 'Almacén', 'Control total de inventario y despacho'),
('operaciones', 'Operaciones', 'Supervisión y tareo'),
('trabajador', 'Trabajador', 'Creación de requerimientos y consulta personal');

-- 4. Asegurar que users.role_id sea TEXT y tenga la FK correcta
ALTER TABLE public.users DROP COLUMN IF EXISTS role_id;
ALTER TABLE public.users ADD COLUMN role_id TEXT REFERENCES public.roles(id);
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS area TEXT;

-- 5. Migración inicial de roles antiguos a nuevos role_id
UPDATE public.users 
SET role_id = LOWER(role) 
WHERE role_id IS NULL AND role IS NOT NULL 
AND LOWER(role) IN (SELECT id FROM public.roles);

UPDATE public.users SET role_id = 'trabajador' WHERE role_id IS NULL;

-- 6. Actualizar requerimientos para soportar Áreas
ALTER TABLE public.requirements ADD COLUMN IF NOT EXISTS area TEXT;

UPDATE public.requirements r
SET area = u.area
FROM public.users u
WHERE r.created_by = u.id AND r.area IS NULL;
