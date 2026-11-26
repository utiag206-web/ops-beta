# RECOMENDACIONES DE SEGURIDAD Y METAS DE RENDIMIENTO DE CISA (CPGs)

> **Plataforma:** InthalyOps  
> **Referencia:** CISA Cross-Sector Cybersecurity Performance Goals (CPGs v1.0.1) & Guías "Secure by Design" (CISA / FBI / NSA)

---

## 1. METAS DE RENDIMIENTO EN CIBERSEGURIDAD (CPGs APLICABLES)

### CPG 1.A: Eliminación de Credenciales por Defecto
- **Recomendación CISA:** Las aplicaciones nunca deben utilizar contraseñas o pines compartidos predeterminados.
- **Estado en InthalyOps:** Cumplido. La plataforma exige establecimiento individual de credenciales. No existen contraseñas maestras "hardcoded".

### CPG 1.E: Separación de Cuentas de Usuario y Administrador
- **Recomendación CISA:** Los administradores deben utilizar cuentas separadas para tareas ordinarias y privilegiadas, evitando privilegios globales excesivos.
- **Estado en InthalyOps:** Cumplido. Se reforzó la frontera entre el rol `admin` de tenant y el rol global `super_admin`.

### CPG 2.E: Sanitización y Protección de Registros
- **Recomendación CISA:** Asegurar que los logs de auditoría contengan evidencia forense útil sin convertirse en un vector de fuga de credenciales.
- **Estado en InthalyOps:** Cumplido. La implementación en `src/lib/audit.ts` enmascara automáticamente claves, pines y tokens bajo el identificador `[REDACTED_SECURITY]`.

### CPG 2.H: Cifrado en Tránsito y Reposo
- **Recomendación CISA:** Todos los datos en tránsito deben utilizar protocolos criptográficos modernos sin versiones obsoletas de SSL/TLS.
- **Estado en InthalyOps:** Cumplido. Configuración de TLS 1.3/1.2 y HSTS en cabeceras de respuesta.

### CPG 3.A: Principios de "Secure-by-Design" y "Secure-by-Default"
- **Recomendación CISA:** La seguridad debe ser una propiedad intrínseca del software y no una configuración añadida por el usuario final.
- **Estado en InthalyOps:** Cumplido.
  - La cookie de sesión de trabajador está firmada con HMAC de forma transparente y predeterminada.
  - La subida de archivos bloquea por defecto cualquier formato que no figure explícitamente en la lista blanca permitida.
  - El borrado de documentos verifica por defecto el prefijo del tenant.
