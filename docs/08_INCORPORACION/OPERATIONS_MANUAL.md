# 🛠️ Manual de Operaciones y Mantenimiento de Sistemas (Runbook) — INTHALY

> **Estado del Documento:** Aprobado y Oficial  
> **Clasificación:** Procedimientos Operativos Estándar para Sysadmins y SRE  
> **Última Actualización:** 15 de Noviembre de 2026

---

## 1. Rutinas Diarias de Monitoreo y Verificación

El ingeniero de operaciones o DevOps de turno debe verificar diariamente a primera hora de la mañana:

1. **Estado de Salud de la Base de Datos:**  
   - Ingresar a la consola de Supabase y revisar métricas de CPU, uso de memoria RAM y número de conexiones activas en el pooler (PgBouncer/Supavisor).
   - Verificar que el almacenamiento en disco se encuentre por debajo del **75% de ocupación**.
2. **Registro de Errores en Producción:**  
   - Inspeccionar los logs de Server Actions en Vercel filtrando por código HTTP `500` o excepciones no controladas.
   - Acceder a `/diag` para revisar el reporte de salud general del sistema.
3. **Monitoreo de Sincronización Offline:**  
   - Verificar que no existan picos anómalos de errores de sincronización reportados por los clientes móviles.

---

## 2. Mantenimiento Preventivo Periódico de Base de Datos

Para evitar degradación de rendimiento a largo plazo:

### 2.1. Mantenimiento Mensual de Estadísticas e Índices (PostgreSQL)
Ejecutar durante la ventana de bajo tráfico (Domingos a las 02:00 AM UTC-5):
```sql
-- Actualizar estadísticas del planificador de consultas
VACUUM ANALYZE public.operational_tareo;
VACUUM ANALYZE public.attendance;
VACUUM ANALYZE public.inventory_movements;

-- Reindexar índices de alta concurrencia si presentan fragmentación
REINDEX TABLE CONCURRENTLY public.operational_tareo;
```

### 2.2. Purga de Registros Efímeros Expirados
```sql
-- Eliminar registros de idempotencia mayores a 30 días
DELETE FROM public.idempotency_records WHERE created_at < (NOW() - INTERVAL '30 days');
```

---

## 3. Protocolo de Ventanas de Mantenimiento Programado

Cuando sea imprescindible realizar una actualización mayor de esquema o reinicio de servicios:

1. **Notificación Anticipada:**  
   Enviar aviso a los administradores de las empresas cliente con al menos **48 horas de anticipación**.
2. **Horario Autorizado:**  
   Las ventanas de mantenimiento deben programarse exclusivamente entre las **01:00 AM y las 04:00 AM (UTC-5)**, intervalo donde no ocurren relevos de guardia en mina.
3. **Página de Mantenimiento en Cloudflare:**  
   Activar la regla de transformación en Cloudflare para responder con la página corporativa de mantenimiento temporal:  
   *"InthalyOps se encuentra en mantenimiento programado. Sus registros de campo continuarán guardándose de forma segura en modo offline en su dispositivo móvil."*
4. **Pruebas Post-Despliegue (Smoke Tests):**  
   Antes de reanudar el tráfico público, el equipo debe verificar inicio de sesión, marcación de asistencia de prueba y lectura de kardex.
