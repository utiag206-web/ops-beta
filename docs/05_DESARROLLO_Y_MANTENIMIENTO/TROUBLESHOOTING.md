# 🔧 Guía de Solución de Problemas y Diagnóstico (Troubleshooting) — INTHALY

> **Estado del Documento:** Aprobado y Oficial  
> **Clasificación:** Diagnóstico de Errores e Ingeniería de Soporte Técnico  
> **Última Auditoría:** 15 de Noviembre de 2026

---

## 1. Errores Comunes de Red y Modo Offline

### 1.1. `ChunkLoadError: Loading chunk failed`
- **Síntoma:** Al navegar entre módulos con señal intermitente o en modo avión, aparece una pantalla de error informando que no se pudo descargar un archivo `.js` de ruta.
- **Causa Raíz:** El navegador intentó descargar un chunk de JavaScript que no estaba en la caché del Service Worker durante un corte repentino de conectividad.
- **Solución Implementada:**  
  1. En `template.tsx` y en el Boundary de errores se incluye un interceptor de eventos de error de red que detecta `ChunkLoadError`.
  2. El sistema almacena una marca en `sessionStorage` y reintenta de forma transparente la descarga antes de mostrar el modal de contingencia.
  3. Si la desconexión persiste, se presenta el modal con el botón **"Recargar módulo"** y **"Ir al Inicio"**, evitando que la aplicación quede congelada en blanco.

### 1.2. Registros Atascados en la Cola Offline de IndexedDB
- **Síntoma:** El supervisor registró tareos en modo offline, pero al recuperar la señal, los datos no se reflejan de inmediato en el dashboard administrativo.
- **Diagnóstico:**
  1. Abrir las herramientas de desarrollador en el navegador (`F12`).
  2. Ir a la pestaña **Application** > **Storage** > **IndexedDB** > `inthaly_offline_db` > `offline_mutation_queue`.
  3. Verificar el estado de los registros (`status: 'pending'`, `'syncing'`, o `'failed'`).
- **Solución:**  
  - Si un registro falló por un error de validación del servidor (ej. un DNI duplicado ingresado en campo), el error se asienta en el campo `last_error`.
  - El botón **"Forzar Sincronización"** en la barra superior invoca `useOfflineSync.flushQueue()`, reintentando el envío de las mutaciones pendientes.

---

## 2. Problemas de Permisos y Sesión

### 2.1. Cambios de Rol o Permisos No se Reflejan de Inmediato
- **Síntoma:** El Administrador asignó un nuevo permiso a un supervisor en la base de datos, pero el usuario sigue recibiendo "Acceso Denegado".
- **Causa Raíz:** La función `getUserSession()` mantiene una caché en memoria en el servidor Node.js (`sessionMemoryCache`) con un TTL de **30 segundos** para optimizar el rendimiento.
- **Solución:**  
  - Esperar 30 segundos a que la caché expire automáticamente.
  - Alternativamente, solicitar al usuario que presione **"Cerrar Sesión"** e inicie sesión nuevamente; la acción de logout vacía instantáneamente la memoria mediante `clearUserSessionCache()`.

### 2.2. Error: "El Super Admin debe impersonar una empresa para esta acción"
- **Causa:** El usuario con rol `super_admin` intentó crear un trabajador o registrar una compra en Caja Chica sin seleccionar una empresa cliente.
- **Solución:** Por diseño de seguridad anti-contaminación de datos, el Super Admin no puede ejecutar transacciones operativas en el vacío. Debe dirigirse a `/super-admin/companies`, hacer clic en **"Gestionar Empresa"** para activar el modo de auditoría, y luego proceder.

---

## 3. Problemas de Rendimiento y Conexión a Base de Datos

### 3.1. Error: `remaining connection slots are reserved for non-replication superuser connections`
- **Causa Raíz:** Agotamiento del pool de conexiones directas a PostgreSQL debido a múltiples instancias serverless de Next.js abiertas simultáneamente.
- **Solución:**  
  1. Verificar que la variable `DATABASE_URL` apunte al puerto del pooler de conexiones **6543 (Transaction Mode)** y contenga el parámetro `?pgbouncer=true`.
  2. Nunca utilizar el puerto directo `5432` en variables de entorno de producción.

---

## 4. Módulo de Diagnóstico del Sistema (`/diag`)

InthalyOps incluye una ruta protegida exclusiva para administradores en `/diag` que ejecuta pruebas automáticas en tiempo real:
- Comprobación de latencia de red hacia Supabase.
- Estado de registro del Service Worker y almacenamiento en IndexedDB.
- Memoria disponible en el dispositivo móvil y estado de la batería.
- Reporte consolidado de errores recientes para facilitar el soporte remoto al campamento minero.
