# ÍNDICE MAESTRO DE DOCUMENTACIÓN TÉCNICA - ECOSISTEMA INTHALY

Este documento organiza y clasifica la totalidad de la documentación del ecosistema.

---

## 1. Arquitectura General y Decisiones de Ecosistema
Directorio: [`docs/architecture/`](./architecture/)

- `MASTER_ARCHITECTURE.md`: Visión sistémica del ecosistema, módulos y satélites.
- `SYSTEM_CONTEXT.md`: Diagramas C4 de contexto de usuarios, aplicaciones y servicios.
- `COMMUNICATION_ARCHITECTURE.md`: Contratos de red, APIs y topología de servicios.
- `INTEGRATIONS_ARCHITECTURE.md`: Reglas de interacción entre productos.
- `MULTITENANCY.md`: Modelo de aislamiento multiempresa y políticas de datos.
- `DATA_ARCHITECTURE.md`: Mapa de bases de datos independientes.
- `POSTGRESQL_CENTRAL_INFRASTRUCTURE.md`: Separación física de esquemas y usuarios.

---

## 2. INTHALY GLOBAL (Consola Administrativa)
Directorio: [`docs/inthaly-global/`](./inthaly-global/)

- `INTHALY_GLOBAL_CONSOLE_ARCHITECTURE.md`: Arquitectura de la consola soberana en puerto 3001.
- `INTHALY_GLOBAL_CONSOLE.md`: Especificación de módulos, vistas y Centro de Control.
- `INTHALY_GLOBAL_ADMIN_PERMISSIONS.md`: Matriz de permisos del Super Administrador.

---

## 3. Inthaly ID (Identidad y Seguridad)
Directorio: [`docs/inthaly-id/`](./inthaly-id/)

- `INTHALY_ID_ARCHITECTURE.md`: Arquitectura del servicio de identidad soberano.
- `IDENTITY_AND_ACCESS.md`: Ciclo de vida de credenciales, sesiones y tokens.
- `INTHALY_ID_SECURITY.md`: Criptografía Scrypt, prevención ATO y RFC 7636 PKCE.
- `INTHALY_ID_INTEGRATION_GUIDE.md`: Guía de consumo OIDC para aplicaciones del ecosistema.

---

## 4. InthalyOps (Gestión Empresarial y Minera)
Directorio: [`docs/inthaly-ops/`](./inthaly-ops/)

- `INTHALY_OPS.md`: Manual funcional del software operativo.
- `RLS_AND_DATA_ISOLATION.md`: Políticas de seguridad Row Level Security por empresa.
- `DATABASE_GUIDE.md`: Diccionario de tablas y modelos de Supabase.
- `ONLINE_OFFLINE_GUIDE.md`: Sincronización IndexedDB y PWA en campo.
- `MULTITENANT_SECURITY.md`: Reglas anti-fuga de datos entre empresas.

---

## 5. Comunidad Inthaly (Red Profesional)
Directorio: [`docs/community/`](./community/)

- `INTHALY_COMMUNITY.md`: Especificación de feed, foros técnicos y grupos.
- `COMMUNITY_AUTH_INTEGRATION.md`: Integración con Inthaly ID.
- `PRIVACY_AND_CONSENT.md`: Garantía ADR-014 anti-monitoreo patronal en la red técnica.

---

## 6. Infraestructura y Recuperación ante Desastres
Directorio: [`infra/docs/`](../infra/docs/)

- `01_INFRASTRUCTURE_ARCHITECTURE.md`: Contenedores Docker, redes y volúmenes.
- `03_DATABASE_SEPARATION_AND_SECURITY.md`: Configuración PostgreSQL y MinIO S3.
- `04_DISASTER_RECOVERY_AND_RUNBOOK.md`: Protocolos de respaldo y restauración criptográfica.
