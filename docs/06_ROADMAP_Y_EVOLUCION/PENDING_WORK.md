# ⏳ Tareas Pendientes y Decisiones de Negocio por Aprobar — INTHALY

> **Estado del Documento:** Aprobado y Oficial  
> **Clasificación:** Backlog de Decisiones Pendientes de Validación por el Propietario  
> **Última Auditoría:** 15 de Noviembre de 2026

---

## 1. Principio de Veracidad en el Backlog

Para cumplir con la directiva fundamental de la Misión de Documentación:
> **No se debe codificar ni asumir decisiones arquitectónicas mayores hasta que cuenten con la aprobación expresa del Propietario del Proyecto (Product Owner).**

Este documento recopila las decisiones técnicas y de negocio que están pendientes de definición antes de iniciar los desarrollos de las Fases 2, 3 y 4.

---

## 2. Inventario de Decisiones Pendientes de Aprobación

### 2.1. Protocolo de Federación SSO con Academia Inthaly (Fase 2)
- **Alternativa A (Recomendada):** Token de intercambio firmado con JWT y secreto compartido (`/api/v1/sso/exchange`). Menor complejidad de implementación en Laravel y Next.js.
- **Alternativa B:** Servidor OAuth 2.0 con flujo Authorization Code + PKCE utilizando Laravel Passport. Estándar enterprise, pero mayor sobrecarga de mantenimiento.
- **Acción Requerida:** Aprobación del Product Owner sobre la alternativa preferida.

### 2.2. Modalidad de Emisión de Facturación Electrónica SUNAT (Fase 3)
- **Alternativa A:** Utilizar la API REST existente de Kodevo (`sunat.kodevo.es`) auditada en las colecciones Postman, contratando un plan corporativo de emisión.
- **Alternativa B:** Desplegar un microservicio propio de firma digital UBL 2.1 con certificado `.pfx` interno y envío directo a los servidores de SUNAT.
- **Acción Requerida:** Definición de la estructura de costos y selección del proveedor de certificación digital.

### 2.3. Selección de Servidor Telemático para Inthaly Transport (Fase 3)
- **Alternativa A (Open Source):** Instancia autogestionada de **Traccar Server** (Java / MySQL) en VPS independiente, recibiendo paquetes TCP/UDP de dispositivos GPS Teltonika/Coban.
- **Alternativa B (Comercial):** Integración mediante Webhooks con la API de **Wialon / Samsara**.
- **Acción Requerida:** Definición del tipo de hardware GPS instalado actualmente en los camiones de los clientes piloto.

### 2.4. Calendario de Migración de la Dependencia `xlsx`
- **Situación:** Se identificaron advertencias de auditoría en la librería de Excel.
- **Acción Requerida:** Agendar en el sprint de la Fase 2 la sustitución por `exceljs`.

### 2.5. Implementación de Paginación por Cursor en Personal e Inventario
- **Situación:** Para bases de datos que superen los 2,000 trabajadores o 5,000 SKUs, la descarga completa en memoria del cliente aumentará la latencia.
- **Acción Requerida:** Validar con operaciones si algún cliente actual supera este volumen para priorizar el cambio.
