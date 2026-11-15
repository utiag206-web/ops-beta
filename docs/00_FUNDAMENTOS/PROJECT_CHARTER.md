# 📜 Acta de Constitución del Proyecto (Project Charter) — INTHALY

> **Estado del Documento:** `VIGENTE / OFICIAL`  
> **Fecha de Emisión:** 15 de Noviembre, 2026  
> **Organización Matriz:** INTHALY TECH GROUP  
> **Líder / Propietario del Proyecto:** Dirección General de Inthaly  
> **Repositorio Oficial:** `Sistema de gestión de trabajadores` (Next.js 15 PWA)  

---

## 1. Propósito y Justificación del Proyecto

**Inthaly** nace como una iniciativa tecnológica y empresarial de alto impacto orientada a digitalizar, articular e impulsar las operaciones de las industrias extractivas y productivas en América Latina, iniciando prioritariamente por el sector de la **Minería (pequeña, mediana y artesanal formalizada)** y con capacidad de expansión hacia los sectores **Agrícola, Forestal, Construcción, Manufactura, Transporte y Logística**.

Históricamente, estas industrias operan en entornos geográficos remotos (faenas sobre los 3,500 m.s.n.m., socavones sin cobertura de telecomunicaciones, valles agrícolas y selva alta), donde la conectividad a internet es intermitente o totalmente nula. La gestión operativa se ha realizado tradicionalmente mediante cuadernos físicos de papel, hojas de cálculo aisladas y comunicaciones informales por mensajería móvil, lo que genera:
- Pérdida crítica de información operativa y trazabilidad de leyes minerales o cosechas.
- Inconsistencias en el cálculo de horas trabajadas, tareos y sobretiempos.
- Fugas de inventario crítico y descontrol en abastecimiento de combustible o repuestos.
- Brechas severas en el cumplimiento de normas de Seguridad y Salud Ocupacional (SOMA / HSEC).
- Fragmentación entre la gestión operativa interna de las empresas y su interacción con transportistas, proveedores y comunidades locales.

**Inthaly** resuelve esta problemática fundando un **ecosistema digital integral híbrido (Online/Offline)** cuyo núcleo inicial es **InthalyOps**, complementado por servicios transversales de identidad universal, comunidad sectorial, logística de transporte, empleabilidad y comercio especializado.

---

## 2. Objetivos Estratégicos del Proyecto

| Dimensión | Objetivo Estratégico | Métrica de Éxito / Criterio de Aceptación |
| :--- | :--- | :--- |
| **Operativa** | Garantizar operatividad 100% continua en faenas sin internet. | Registro de tareo, producción, checklists mecánicos y recepción de mineral con persistencia local en IndexedDB y sincronización sin pérdida al recuperar señal. |
| **Arquitectónica** | Establecer un monolito modular desacoplado basado en estándares abiertos. | PWA construida sobre Next.js 15, PostgreSQL (Supabase) y Service Workers, garantizando portabilidad e independencia de proveedores. |
| **Seguridad Multiempresa** | Aislamiento estricto de datos entre empresas clientes (Multi-tenant). | Políticas Row Level Security (RLS) estrictas en PostgreSQL y validación en Server Actions contra vulnerabilidades BOLA/IDOR. |
| **Identidad** | Consolidar una identidad universal e independiente por persona. | Cuentas personales no subordinadas a una empresa empleadora, preservando historial laboral, certificaciones y perfiles comunitarios. |
| **Evolución** | Crear una plataforma mantenible y escalable sin deuda técnica oculta. | Documentación maestra exhaustiva, estándares de código uniformes y auditorías continuas. |

---

## 3. Alcance del Ecosistema Inthaly

```
                                  ECOSISTEMA INTHALY
                                         │
        ┌────────────────────────────────┼────────────────────────────────┐
        │                                │                                │
  [IMPLEMENTADO]                   [PLANIFICADO]                    [INTEGRACIÓN]
   InthalyOps                   Comunidad Inthaly                  Academia Inthaly
• Control de Personal         • Red profesional sectorial        • LMS y cursos técnicos
• Asistencia y Tareo          • Grupos y foros técnicos          • Certificaciones laborales
• Producción y Mina           • Mensajería comunitaria           • Portal web independiente
• Planta de Beneficio         • Reputación laboral                             │
• Mecánica y Maquinarias                 │                         [EVALUACIÓN]
• Almacén e Inventario         [PLANIFICADO]                      Facturación SUNAT
• Finanzas / Caja Chica         Transporte y Carga               • Emisión electrónica GRE
• Seguridad SOMA              • Flotas y rutas de mineral        • Boletas / Facturas UBL
• Super Admin Multiempresa    • Alquiler de maquinaria                         │
                                         │                         [PLANIFICADO]
                               [PLANIFICADO]                        Marketplace
                               Bolsa de Empleo                   • Repuestos y suministros
                              • Reclutamiento y vacantes         • Servicios industriales
```

---

## 4. Roles y Gobernanza del Proyecto

* **Propietario del Producto (Product Owner / Sponsor):** Define la visión estratégica del negocio, aprueba las fases del roadmap y autoriza despliegues en producción.
* **Líder Técnico y Arquitecto de Software:** Custodia la arquitectura modular, las políticas de seguridad multiempresa, los estándares de rendimiento y la documentación maestra.
* **Equipo de Desarrollo (Frontend / Fullstack):** Desarrolla módulos operativos, garantiza el funcionamiento Offline-First y respeta el sistema de diseño y movimiento.
* **Ingeniería de Base de Datos y Seguridad:** Supervisa las migraciones PostgreSQL, audita las políticas RLS y garantiza la integridad de los respaldos.

---

## 5. Supuestos y Restricciones Obligatorias

### Supuestos Clave:
1. Los dispositivos de campo de los supervisores y trabajadores son teléfonos inteligentes o tablets estándar (Android / iOS) con soporte moderno para navegadores web PWA y Cache Storage API.
2. La infraestructura de base de datos actual se sustenta en PostgreSQL bajo el ecosistema de Supabase, aprovechando su motor de autenticación y replicación en tiempo real.
3. El modelo de negocio prioriza la estabilidad operativa de InthalyOps antes de lanzar las etapas comunitarias y de marketplace.

### Restricciones Innegociables:
* **Prohibición de DDL no autorizado:** Ningún agente ni desarrollador puede alterar esquemas, tablas ni políticas RLS sin plan técnico y autorización explícita.
* **Aislamiento Multi-Tenant Estricto:** Bajo ninguna circunstancia un usuario de la Empresa A puede visualizar ni modificar registros de la Empresa B.
* **Preservación Offline:** Ninguna mejora o refactorización puede comprometer el funcionamiento desconectado de los módulos críticos.
* **Control de Producción:** Se prohíbe terminantemente ejecutar `git push` o modificaciones directas al entorno de producción sin previa validación con `git status`, suite de tipos (`tsc`) y compilación exitosa.
