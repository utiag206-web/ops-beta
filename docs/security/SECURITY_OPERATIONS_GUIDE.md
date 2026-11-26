# GUÍA DE OPERACIONES DE SEGURIDAD (SECURITY OPERATIONS RUNBOOK)

> **Plataforma:** InthalyOps  
> **Destinatarios:** Equipo de Operaciones, Soporte Técnico y Administradores de Seguridad

---

## 1. GESTIÓN DE INCIDENTES DE SEGURIDAD

### 1.1 Niveles de Severidad
- **Severidad 1 (Crítica):** Compromiso activo de confidencialidad o integridad de datos de múltiples empresas, acceso no autorizado a nivel `super_admin`. Tiempo de respuesta: < 15 minutos.
- **Severidad 2 (Alta):** Falla en el aislamiento multiempresa en un módulo específico o denegación de servicio sobre el portal de trabajadores. Tiempo de respuesta: < 1 hora.
- **Severidad 3 (Media):** Detección reiterada de intentos de fuerza bruta o escaneo de vulnerabilidades sin afectación de servicio. Tiempo de respuesta: < 4 horas.
- **Severidad 4 (Baja):** Consultas operativas de permisos o ajuste menor de configuración de cabeceras. Tiempo de respuesta: Siguiente día hábil.

### 1.2 Procedimiento de Detección y Contención
1. **Monitoreo de Alertas:** Filtrar logs del sistema en busca de etiquetas de severidad:
   - `[SECURITY_ALERT]`: Indica detección de bloqueo por fuerza bruta en portal de trabajadores.
   - `[SECURITY_WARNING]`: Indica token de sesión manipulado (Tampering) rechazado.
2. **Aislamiento:** En caso de cuenta sospechosa comprometida:
   - Ingresar a `/users` y cambiar el estado del usuario a "inactivo".
   - Si se trata de un trabajador, desvincular o cambiar el PIN en el perfil del trabajador.
3. **Rotación de Secreto de Sesión:**
   - Si se sospecha compromiso de la clave HMAC de sesiones de trabajadores, actualizar la variable de entorno `SUPABASE_SERVICE_ROLE_KEY` o reiniciar el servicio en la plataforma de despliegue para regenerar el salt por defecto.

---

## 2. PROCEDIMIENTO PERIÓDICO DE HIGIENE DE ACCESOS
1. **Revisión Mensual de Cuentas:** Auditar usuarios con roles `admin` y `super_admin` para revocar privilegios que ya no sean requeridos.
2. **Revisión de Almacenamiento:** Inspeccionar que no existan archivos huérfanos o con extensiones no estándar en los buckets de Supabase Storage.
3. **Revisión de Logs:** Verificar que la tabla `security_audit_logs` no registre anomalías recurrentes de acceso o borrado de información.
