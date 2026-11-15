# 📜 Registro Histórico de Decisiones de Arquitectura (ADR Log) — INTHALY

> **Estado del Documento:** Aprobado y Oficial  
> **Clasificación:** Registro Histórico de Decisiones Técnicas (Architectural Decision Records)  
> **Última Auditoría:** 15 de Noviembre de 2026

---

## 1. Formato de los Registros ADR

Cada decisión arquitectónica crítica adoptada por el equipo de ingeniería se formaliza en este registro bajo el estándar:
- **Título y Código:** Identificador único y descripción concisa.
- **Estado:** `APROBADO` | `EN REVISIÓN` | `DEPRECADO`.
- **Contexto:** El problema operativo o técnico que motivó la decisión.
- **Decisión:** La solución arquitectónica elegida y sus fundamentos.
- **Consecuencias:** Beneficios obtenidos y compromisos asumidos (*trade-offs*).

---

## 2. Registro Maestro de Decisiones (ADR-001 al ADR-010)

### ADR-001: Adopción de Monolito Modular en Lugar de Microservicios Prematuros
- **Estado:** `APROBADO`
- **Contexto:** Equipos de consultoría propusieron dividir INTHALY desde el día 1 en 8 microservicios independientes (Auth, Workers, Tareo, Inventory, etc.) con bases de datos separadas y orquestador Kubernetes.
- **Decisión:** Se aprobó construir un **Monolito Modular** unificado sobre Next.js 15 App Router y PostgreSQL. Los dominios están estrictamente separados en carpetas y esquemas, pero comparten el mismo entorno de compilación y despliegue.
- **Consecuencias:** Máxima velocidad de iteración con equipo de ingeniería ágil, cero sobrecosto en orquestación distribuida y transacciones ACID nativas. Se posterga la partición en microservicios hasta que el volumen de transacciones de un módulo específico lo justifique.

---

### ADR-002: Cero Atadura al Proveedor (Zero Vendor Lock-in) en PostgreSQL
- **Estado:** `APROBADO`
- **Contexto:** La plataforma corre actualmente sobre Supabase BaaS. Existía el riesgo de acoplarse a características cerradas o extensiones propietarias que impidieran migrar a un servidor propio.
- **Decisión:** Todo el código SQL, triggers, funciones y tipos de datos deben ceñirse estrictamente al estándar **ANSI SQL / PostgreSQL 15+ puro**.
- **Consecuencias:** Garantía absoluta de portabilidad. Un volcado `pg_dump` puede restaurarse en AWS RDS, Google Cloud SQL o un servidor Linux on-premise en cualquier momento.

---

### ADR-003: Modelo de Identidad Personal Universal Soberana
- **Estado:** `APROBADO`
- **Contexto:** En ERPs convencionales, las cuentas pertenecen a la empresa. Si el trabajador es despedido o cambia de contratista, pierde su historial de horas, cursos y reputación.
- **Decisión:** Se aprobó el principio de **Identidad Soberana**: cada persona tiene una única cuenta matriz en el ecosistema (`identity_accounts`), completamente independiente de las empresas contratistas. La pertenencia a una empresa es una relación temporal basada en consentimiento mutuo.
- **Consecuencias:** El trabajador conserva de por vida sus certificaciones y récord laboral; se requiere un diseño riguroso de privacidad para evitar que un empleador espíe la actividad comunitaria o la búsqueda de empleo de su personal.

---

### ADR-004: Arquitectura Offline-First con Service Worker e IndexedDB
- **Estado:** `APROBADO`
- **Contexto:** Las operaciones mineras y obras de construcción operan en socavones y campamentos andinos donde no existe señal celular durante horas o días.
- **Decisión:** Se implementó una arquitectura **Offline-First nativa**. La App Shell se almacena en caché vía Service Worker (`public/sw.js`), las transacciones de tareo y asistencia se guardan localmente en IndexedDB (`idb`) y un hook en segundo plano (`useOfflineSync`) sincroniza automáticamente la cola al recuperar conexión.
- **Consecuencias:** Cero parálisis operativa en campo; mayor complejidad en el frontend para gestionar la resolución de conflictos y reintentos automáticos.

---

### ADR-005: Pre-compresión de Evidencias Fotográficas en el Dispositivo Móvil
- **Estado:** `APROBADO`
- **Contexto:** Los celulares modernos capturan fotos de 5 a 12 MB. Subir estas imágenes por redes 3G lentas de campamento colapsaba el ancho de banda y consumía rápidamente la cuota de almacenamiento.
- **Decisión:** Se implementó compresión obligatoria en el cliente (*Canvas API*) antes de la subida, convirtiendo las imágenes a formato WebP al 80% de calidad con dimensiones máximas de $1600 \times 1200$ píxeles.
- **Consecuencias:** Reducción del peso de las evidencias en más del **85%** (< 400 KB por foto) sin pérdida perceptible de nitidez en tickets de balanza; cargas casi instantáneas en redes lentas.

---

### ADR-006: Motor de Recomendación Heurístico Determinista (No-IA de Caja Negra)
- **Estado:** `APROBADO`
- **Contexto:** En procesos de selección minera y fletes de mineral, el uso de redes neuronales o algoritmos opacos de IA genera desconfianza y posibles sesgos inexplicables en auditorías.
- **Decisión:** Se aprobó un modelo **Heurístico Ponderado Basado en Reglas** con 5 factores comprobables (certificaciones 30%, cercanía geográfica 25%, horas de tareo 20%, régimen de turno 15%, récord SOMA 10%).
- **Consecuencias:** Recomendaciones 100% transparentes, explicables y auditables legalmente; no requiere infraestructura costosa de entrenamiento de modelos LLM.

---

### ADR-007: Blindaje Multiempresa Inviolable mediante `getStrictCompanyId()`
- **Estado:** `APROBADO`
- **Contexto:** Ataques tipo IDOR / BOLA donde atacantes manipulan parámetros en peticiones HTTP para acceder a datos de otros clientes.
- **Decisión:** Ninguna Server Action o consulta acepta `company_id` desde el cliente. El identificador de empresa se extrae obligatoriamente en el servidor Node.js mediante `getStrictCompanyId()` a partir de la sesión validada criptográficamente.
- **Consecuencias:** Mitigación total de vulnerabilidades IDOR entre tenants; requiere disciplina estricta en el equipo de desarrollo para no saltarse la función en nuevas mutaciones.

---

### ADR-008: Independencia Tecnológica de Inthaly Academy (LMS Laravel 12)
- **Estado:** `APROBADO`
- **Contexto:** La Academia Inthaly existe y funciona exitosamente sobre Laravel 12 y MySQL en `app.inthaly.com`. Surgió la duda de si se debía reescribir todo en Next.js o forzar la unión de bases de datos.
- **Decisión:** Se aprobó mantener la Academia como un **microservicio satélite independiente** comunicándose con InthalyOps exclusivamente mediante **Single Sign-On (SSO) por JWT y Webhooks firmados con HMAC**.
- **Consecuencias:** Cero desperdicio de código ya probado; preservación de las capacidades avanzadas de Laravel para gestión educativa; arquitectura limpia desacoplada.

---

### ADR-009: Desacoplamiento Progresivo de Datos mediante Capa Canónica de Servicios (`src/services/`)
- **Estado:** `APROBADO`
- **Contexto:** Las Server Actions acumulaban consultas directas a Supabase mezcladas con revalidación de caché, extracción de formularios y lógica de presentación, generando duplicación de consultas SQL y dificultando pruebas automatizadas.
- **Decisión:** Se creó la capa canónica `src/services/` (`workers.service.ts`, `tareo.service.ts`, `inventory.service.ts`), la cual encapsula las consultas y mutaciones de datos recibiendo el cliente y parámetros contextuales. Las Server Actions delegan en esta capa sin alterar contratos del frontend. Se descartó introducir ORMs pesados (Prisma, Drizzle) en esta etapa para preservar rendimiento y estabilidad.
- **Consecuencias:** Consultas reusables en acciones de servidor, rutas API o tests; reducción drástica de duplicación de código; transición suave hacia una independencia progresiva de base de datos.

---

### ADR-010: Normalización de Contratos Tipados y Suite de Pruebas Nativa con `node:test`
- **Estado:** `APROBADO`
- **Contexto:** La coexistencia de tipos inline duplicados provocaba inconsistencias de tipado estricto. Asimismo, el proyecto carecía de una suite de pruebas ejecutable sin instalar dependencias de terceros no autorizadas.
- **Decisión:** Se crearon las capas canónicas `src/types/` y `src/hooks/` eliminando definiciones locales duplicadas. Para pruebas automatizadas, se adoptó el test runner nativo de Node.js (`node:test` y `node:assert`) integrado bajo `npm test`.
- **Consecuencias:** Tipado unificado de cliente y servidor con cero advertencias; suite de pruebas que ejecuta en < 250ms con cero dependencias externas añadidas al `node_modules`.
