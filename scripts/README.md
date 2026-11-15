# Catálogo de Scripts y Mantenimiento — INTHALY

Este documento detalla el propósito, prerequisitos y modo de ejecución de los scripts presentes en el repositorio.

---

## 1. Scripts Operativos Activos (`scripts/`)

| Script | Propósito | Entorno | Comando de Ejecución |
| :--- | :--- | :--- | :--- |
| `smoke-test.js` | Chequeo rápido de salud del repositorio, archivos canónicos y pruebas unitarias. | Local / CI | `node scripts/smoke-test.js` |
| `apply_surgical_fix.mjs` | Utilidad auxiliar para transformaciones atómicas seguras en código. | Local | `node scripts/apply_surgical_fix.mjs` |

---

## 2. Scripts de Migración y Mantenimiento Histórico (`maintenance/scripts/`)

La carpeta `maintenance/scripts/` contiene scripts SQL y utilidades de Node utilizadas para auditorías y migraciones de esquemas en Supabase a lo largo del ciclo de vida del proyecto:

> [!WARNING]
> Los scripts en `maintenance/scripts/` son históricos o de uso restringido para administradores de base de datos. No deben ejecutarse en entornos de producción sin una revisión previa de dependencias e impacto en políticas RLS.

### Inventario de Scripts Relevantes:
- `build_deploy_banahosting.ps1`: Script PowerShell para compilar el empaquetado de producción standalone.
- `check_schema.js` / `verify_tables.js`: Diagnóstico de integridad de tablas y columnas en Supabase.
- `exec_sql.js` / `run_migration.js`: Ejecutores de scripts SQL sobre la conexión Supabase.
- Archivos `.sql`: Migraciones históricas de RLS (`fix_workers_rls.sql`, `update_attendance_rls.sql`, etc.), índices de optimización y creación de esquemas.

---

## 3. Pruebas Automatizadas

Para ejecutar las pruebas del repositorio, ver la guía en [tests/README.md](file:///d:/Sistema%20de%20gesti%C3%B3n%20de%20trabajadores/tests/README.md).
El comando estándar es:
```bash
npm test
```
