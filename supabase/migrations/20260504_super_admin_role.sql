-- 1. Insertar el nuevo rol SUPER_ADMIN
INSERT INTO public.roles (id, name, description)
VALUES ('super_admin', 'Super Administrador', 'Control global de todas las empresas e infraestructura del sistema')
ON CONFLICT (id) DO NOTHING;

-- 2. Asegurar que las tablas soporten company_id NULL para SUPER_ADMIN (opcional, si se quiere guardar registros globales)
-- Por ahora la mayoría de tablas tienen company_id NOT NULL. 
-- El Super Admin operará sobre datos de empresas existentes.

-- 3. Crear una vista para que el Super Admin pueda ver el uso del sistema (opcional)
CREATE OR REPLACE VIEW public.system_usage_summary AS
SELECT 
    c.id as company_id,
    c.name as company_name,
    (SELECT count(*) FROM public.users u WHERE u.company_id = c.id) as user_count,
    (SELECT count(*) FROM public.workers w WHERE w.company_id = c.id) as worker_count,
    (SELECT count(*) FROM public.inventory_movements im WHERE im.company_id = c.id) as movement_count
FROM public.companies c;
