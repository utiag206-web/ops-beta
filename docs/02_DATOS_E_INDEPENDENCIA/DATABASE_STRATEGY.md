# 🛡️ Estrategia de Base de Datos y Gobernanza de Migraciones — INTHALY

> **Estado del Documento:** Aprobado y Oficial  
> **Clasificación:** Normas de Ingeniería de Base de Datos  
> **Última Auditoría:** 15 de Noviembre de 2026

---

## 1. Filosofía: Estándar Abierto PostgreSQL sin Lock-in

La base de datos es el activo de información más crítico y valioso de INTHALY y de sus empresas clientes. Por ello, la estrategia técnica de base de datos se rige por un principio innegociable: **Cero Atadura al Proveedor (Zero Vendor Lock-in)**.

Aunque actualmente el motor de base de datos corre sobre la infraestructura gestionada de **Supabase**, todo el código SQL, tablas, funciones almacenadas, vistas, triggers e índices están diseñados estrictamente sobre el estándar **ANSI SQL / PostgreSQL 15+ puro**.

### Garantías de Portabilidad del Esquema:
1. **Sin Extensiones Propietarias Opacas:** No se utilizan extensiones cerradas o privativas que impidan restaurar un volcado de base de datos (`pg_dump`) en cualquier servidor PostgreSQL estándar (como AWS RDS, Google Cloud SQL, Azure Database o una máquina Linux Debian/Ubuntu on-premise).
2. **Uso de Tipos de Datos Estándar:** Claves primarias `UUID`, fechas `TIMESTAMPTZ`, valores numéricos `NUMERIC(14,2)` y payloads semiestructurados `JSONB` nativos.
3. **Lógica de Negocio Replicable:** Los triggers y funciones PL/pgSQL utilizan sintaxis ANSI estándar sin dependencias de variables mágicas de entorno.

---

## 2. Gobernanza y Ciclo de Vida de Migraciones

Toda alteración a la base de datos debe ser versionada, trazable y reproducible. Las migraciones residen en el directorio `supabase/migrations/` y deben respetar las siguientes directrices:

### 2.1. Convención de Nomenclatura
Los archivos de migración se nombran con prefijo cronológico inmutable:
```text
YYYYMMDDHHMMSS_descripcion_corta_en_snake_case.sql
Ejemplo: 20260925_rbac_granular_v1_core.sql
```

### 2.2. Reglas Obligatorias para Nuevas Migraciones
1. **Idempotencia Obligatoria:** Todo script DDL debe poder ejecutarse múltiples veces sin lanzar errores destructivos:
   - `CREATE TABLE IF NOT EXISTS public.nombre_tabla (...)`
   - `CREATE INDEX IF NOT EXISTS idx_nombre (...)`
   - `ALTER TABLE public.tabla ADD COLUMN IF NOT EXISTS columna tipo;`
   - `DROP POLICY IF EXISTS "nombre_politica" ON public.tabla;`
2. **Prohibición de Alteraciones Destructivas en Caliente:**  
   Nunca ejecutar `DROP TABLE`, `DROP COLUMN` o `ALTER COLUMN ... TYPE` en migraciones de producción sin un plan previo de migración en dos pasos (*expand-and-contract pattern*).
3. **Habilitación de RLS en el Mismo Script:**  
   Toda creación de tabla que maneje datos de empresa debe finalizar con:
   ```sql
   ALTER TABLE public.nueva_tabla ENABLE ROW LEVEL SECURITY;
   ```
4. **Trigger de Actualización de Timestamp:**  
   Asociar siempre el trigger automático de actualización de `updated_at`:
   ```sql
   CREATE TRIGGER update_nueva_tabla_modtime
   BEFORE UPDATE ON public.nueva_tabla
   FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
   ```

---

## 3. Política de Eliminación: Soft Delete vs. Hard Delete

En un entorno industrial y minero con obligaciones legales ante SUNAFIL, OSINERGMIN y SUNAT, la eliminación accidental de un registro puede acarrear multas severas o contingencias penales.

| Tipo de Registro | Política de Eliminación | Mecanismo de Implementación |
| :--- | :--- | :--- |
| **Trabajadores y Nómina** | **Soft Delete Estricto** | Columna `status = 'inactive'` o `deleted_at TIMESTAMPTZ`. Nunca `DELETE` físico. |
| **Kardex e Inventarios** | **Inmutabilidad Absoluta** | Prohibido tanto `DELETE` como `UPDATE`. Cualquier corrección de stock se realiza mediante un nuevo movimiento de ajuste positivo o negativo. |
| **Transacciones de Caja Chica** | **Anulación Contable** | Estado `status = 'annulled'` con motivo de anulación registrado en auditoría. |
| **Órdenes de Mantenimiento** | **Cancelación de Estado** | Estado `status = 'cancelled'`. Se conserva el historial para cálculo de MTBF. |
| **Registros Temporales / Caché** | **Hard Delete Permitido** | Borrado físico en tablas de sesiones efímeras (`session_cache`, `idempotency_records` expirados). |

---

## 4. Estrategia de Concurrencia y Pool de Conexiones

Dada la naturaleza de aplicaciones serverless en Next.js (Vercel) donde cada invocación de Server Action o Route Handler puede abrir una conexión independiente a la base de datos:

1. **Gestor de Conexiones (Supavisor / PgBouncer):**  
   - Se utiliza un pooler en modo **Transaction Mode** (Puerto 6543) para peticiones de corta duración (lecturas y escrituras transaccionales).
   - Se reserva el modo **Session Mode** (Puerto 5432 directo) exclusivamente para migraciones DDL o escuchas persistentes (LISTEN / NOTIFY).
2. **Límites de Tiempo de Consulta (Statement Timeout):**  
   Para evitar que una consulta pesada o un reporte analítico bloquee el pool:
   - Servidor web estándar: `statement_timeout = '15s'`.
   - Reportes ejecutivos o exportaciones masivas: enrutados a funciones en segundo plano con límite extendido.
