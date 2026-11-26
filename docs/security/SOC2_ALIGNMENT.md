# MATRIZ DE ALINEACIÓN CON SOC 2 (TRUST SERVICES CRITERIA)

> **Plataforma:** InthalyOps  
> **Criterios Evaluados:** Seguridad (Security), Confidencialidad (Confidentiality), Integridad del Procesamiento (Processing Integrity)  
> **Objetivo:** Preparación técnica para futuras atestaciones SOC 2 Tipo I y Tipo II.

---

## 1. CRITERIOS COMUNES (SECURITY - CC6.0 A CC8.0)

### CC6.1 - Control de Accesos Lógicos
- **Requisito:** La entidad restringe el acceso lógico a la infraestructura, software y datos a usuarios autorizados.
- **Implementación en InthalyOps:** Autenticación obligatoria en todas las rutas protegidas del App Router. Guardias en Server Actions para validar sesión activa y correspondencia de `company_id`.

### CC6.2 - Registro y Revocación de Usuarios
- **Requisito:** Se establecen credenciales para nuevos usuarios y se revoca el acceso oportunamente.
- **Implementación en InthalyOps:** Función `createUser` con validación de roles; protección para evitar que una empresa quede sin administrador activo; baja lógica en `workers` y usuarios.

### CC6.3 - Principio de Mínimo Privilegio (Least Privilege)
- **Requisito:** Los privilegios se asignan en base a la necesidad del rol de negocio y se previene la escalación no autorizada.
- **Implementación en InthalyOps:** Bloqueo explícito en `users/actions.ts` que prohíbe que un administrador local cree o ascienda usuarios al rol global `super_admin`.

### CC6.6 - Defensas Perimetrales y Protección contra Amenazas Lógicas
- **Requisito:** Se implementan mecanismos para prevenir manipulaciones maliciosas o intrusiones.
- **Implementación en InthalyOps:**
  - Content Security Policy (CSP) en `next.config.ts`.
  - Rate limiting contra ataques de fuerza bruta en portal de trabajadores (`worker-auth.ts`).
  - Lista blanca estricta de extensiones y validación de tipos MIME en subida de archivos (`storage.ts`).

### CC6.7 - Transmisión y Almacenamiento Seguro de Datos
- **Requisito:** Los datos sensibles se protegen durante la transmisión y almacenamiento.
- **Implementación en InthalyOps:**
  - Cifrado en tránsito forzado vía HTTPS/TLS 1.3 con HSTS.
  - Firma HMAC-SHA256 con protección contra ataques de temporización (`timingSafeEqual`) en sesiones de trabajadores.
  - Claves de servicio alojadas exclusivamente en variables de entorno del servidor (`SUPABASE_SERVICE_ROLE_KEY`).

---

## 2. MONITOREO Y OPERACIONES (CC7.0)

### CC7.1 - Detección de Vulnerabilidades y Anomalías
- **Implementación en InthalyOps:** Registro de alertas de seguridad (`[SECURITY_ALERT]`) en consola y auditoría ante detección de fuerza bruta o intento de manipulación de tokens HMAC.

### CC7.2 - Respuesta a Incidentes
- **Implementación en InthalyOps:** Runbooks definidos en `SECURITY_OPERATIONS_GUIDE.md` con roles, tiempos de contención y procedimientos de rotación de claves.

---

## 3. INTEGRIDAD DEL PROCESAMIENTO (PROCESSING INTEGRITY - PI1.0)
- **PI1.1:** Las validaciones de esquema y comprobaciones a nivel de servidor aseguran que los tareos, kardex y movimientos no puedan ser alterados por clientes maliciosos.
