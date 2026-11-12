# 🗄️ Guía de Base de Datos y Esquema — InthalyOps

InthalyOps utiliza **PostgreSQL** alojado en **Supabase**. La base de datos está gestionada mediante 34 migraciones versionadas y organizadas para garantizar aislamiento multiempresa estricto mediante **Row Level Security (RLS)**.

---

## 1. Principios de Diseño del Esquema

1. **Aislamiento Multiempresa por Diseño:**  
   Toda tabla operativa contiene una columna `company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE RESTRICT`. La restricción `ON DELETE RESTRICT` impide que el borrado accidental de una empresa elimine registros históricos contables o legales.
2. **Identificadores UUIDv4:**  
   Todas las claves primarias utilizan `id UUID PRIMARY KEY DEFAULT gen_random_uuid()`, permitiendo que el motor offline genere identificadores temporales únicos sin colisiones.
3. **Auditoría Estándar:**  
   Las tablas incluyen `created_at TIMESTAMPTZ NOT NULL DEFAULT now()`, `updated_at TIMESTAMPTZ NOT NULL DEFAULT now()` y `created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL`.
4. **Trigger de Actualización Temporal:**  
   Disparan automáticamente la actualización de `updated_at` antes de cada `UPDATE`.

---

## 2. Mapa de Tablas Maestras por Dominio

### A. Ecosistema Multiempresa y Control de Acceso
```sql
public.companies                -- Registro maestro de empresas cliente (RUC, logo, industria, estatus)
public.users                    -- Perfiles de usuario vinculados a auth.users de Supabase
public.user_roles               -- Asignación de roles por usuario y por empresa (N:M)
public.user_permissions         -- Overrides granulares V1 de permisos por usuario, empresa y módulo
public.company_operating_profiles-- Capacidades activadas por empresa según su industria
public.global_settings          -- Configuración singleton del ecosistema (SuperAdmin)
```

### B. Personal y Recursos Humanos
```sql
public.workers                  -- Ficha maestra de trabajadores (DNI único, cargo, datos bancarios)
public.attendance               -- Marcas diarias de asistencia y geolocalización
public.operational_tareo        -- Registro diario de horas trabajadas y tareo por actividad
public.worker_movements         -- Historial de asignaciones, traslados y cambios de campamento
public.bonuses                  -- Registro y aprobación de bonos extraordinarios
public.transport_payments       -- Pagos y viáticos de movilidad de personal
public.worker_payments          -- Liquidaciones y registros salariales periódicos
```

### C. Área de Mecánica y Maquinaria Pesada
```sql
public.mechanics_maintenance    -- Órdenes de trabajo preventivo, correctivo y predictivo
public.mechanics_fuel           -- Despachos de combustible, horómetros y cálculo de ratio
public.mechanics_checklists     -- Inspecciones pre-uso con respuestas estructuradas en JSONB
public.mechanics_tools          -- Inventario, calibración y custodia de herramientas
```

### D. Operaciones Industriales y Minería
```sql
public.plant_mineral_batches    -- Lotes de recepción de mineral, pesajes y leyes estimadas
public.plant_mineral_evidences  -- Fotografías y documentos probatorios de pesaje y tolva
public.mining_production        -- Avances de extracción, galerías y frentes de trabajo
```

### E. Inventario y Logística
```sql
public.products                 -- Catálogo de productos, insumos, repuestos y EPPs
public.warehouses               -- Almacenes y depósitos físicos por sede
public.inventory_stock          -- Stock consolidado por producto y por almacén
public.inventory_movements      -- Kardex oficial de entradas, salidas, transferencias y mermas
```

### F. Administración, Finanzas y Seguridad
```sql
public.assets                   -- Control patrimonial de activos fijos y maquinaria
public.requirements             -- Solicitudes y requerimientos de compra y reposición
public.petty_cash_transactions  -- Movimientos de caja chica (ingresos, egresos y rendiciones)
public.incidencias              -- Registro de novedades, accidentes e incidencias operativas
public.export_audit_logs        -- Auditoría de descargas y exportaciones de información confidencial
```

---

## 3. Patrón Estándar de Políticas RLS (Row Level Security)

Toda tabla operativa aplica el patrón de aislamiento estricto en tres condiciones:
1. Pertenencia a la empresa vía JWT (`auth.jwt()->>'company_id'`).
2. Pertenencia validada contra la tabla `user_roles`.
3. Excepción administrativa para `super_admin` con impersonación activa.

```sql
CREATE POLICY "nombre_tabla_isolation"
  ON public.nombre_tabla
  FOR ALL
  TO authenticated
  USING (
    company_id = (auth.jwt()->>'company_id')::uuid
    OR EXISTS (
      SELECT 1 FROM public.user_roles ur
      WHERE ur.user_id = auth.uid()
        AND ur.company_id = nombre_tabla.company_id
    )
    OR EXISTS (
      SELECT 1 FROM public.user_roles ur
      WHERE ur.user_id = auth.uid()
        AND ur.role_id IN ('super_admin', 'superadmin')
    )
  )
  WITH CHECK (
    company_id = (auth.jwt()->>'company_id')::uuid
    OR EXISTS (
      SELECT 1 FROM public.user_roles ur
      WHERE ur.user_id = auth.uid()
        AND ur.company_id = nombre_tabla.company_id
    )
    OR EXISTS (
      SELECT 1 FROM public.user_roles ur
      WHERE ur.user_id = auth.uid()
        AND ur.role_id IN ('super_admin', 'superadmin')
    )
  );
```

---

## 4. Registro Histórico de Migraciones (34 Archivos)

Las migraciones se encuentran en `supabase/migrations/` ordenadas cronológicamente por prefijo `YYYYMMDD`:
- `20240404_inventory_total_rebuild.sql`: Esquema base de inventario, stock y kardex.
- `20260410_rbac_system.sql`: Sistema de roles y permisos.
- `20260413_petty_cash_fixes.sql` a `20260416_final_audit_normalization.sql`: Caja chica, SOMA y Cocina.
- `20260502_hardened_multi_company_rls.sql`: Blindaje multiempresa estricto.
- `20260504_super_admin_role.sql`: Rol SuperAdmin e infraestructura corporativa.
- `20260825204150_create_global_settings.sql`: Ajustes globales y singleton.
- `20260920_company_operating_profiles.sql`: Perfiles operativos y capacidades por industria.
- `20260925_rbac_granular_v1_core.sql`: Overrides individuales en `user_permissions`.
- `20260926_mecanica_persistence_core.sql`: 4 tablas maestras del área de mecánica.
- `20260927_planta_mineral_core.sql` y `20260930_planta_evidences.sql`: Módulo de planta y evidencias fotográficas.
- `RELEASE_CANDIDATE_CONSOLIDATED_MIGRATIONS.sql`: Migración consolidada de versión de producción.

