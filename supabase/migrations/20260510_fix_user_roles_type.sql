-- MIGRACIÓN DE ESTABILIZACIÓN: Alineación de tipos en RBAC
-- Objetivo: Asegurar que user_roles.role_id coincida con roles.id (TEXT)

DO $$ 
BEGIN
    -- 1. Cambiar el tipo de la columna role_id a TEXT
    -- Usamos USING para convertir UUID a TEXT de forma segura
    ALTER TABLE public.user_roles ALTER COLUMN role_id TYPE TEXT USING role_id::text;
    
    -- 2. Asegurar que la Foreign Key apunte a roles(id)
    ALTER TABLE public.user_roles DROP CONSTRAINT IF EXISTS user_roles_role_id_fkey;
    ALTER TABLE public.user_roles ADD CONSTRAINT user_roles_role_id_fkey FOREIGN KEY (role_id) REFERENCES public.roles(id);

    RAISE NOTICE 'user_roles.role_id convertida a TEXT con éxito.';
EXCEPTION WHEN OTHERS THEN 
    RAISE NOTICE 'Error al estabilizar user_roles: %', SQLERRM;
END $$;
