# ⚡ InthalyOps — Sistema Operativo Empresarial Multiempresa

> **Versión Estable:** `v1.4.0` (Congelada y en Producción)  
> **Plataforma Integral de Gestión y Operaciones para Minería, Agricultura, Forestal, Logística y Mantenimiento.**  
> Arquitectura moderna con **Next.js 15 (App Router)**, **React 19**, **Supabase (PostgreSQL + RLS)** y motor híbrido **Offline-First**.

---

## 🚀 Resumen del Proyecto

**InthalyOps** es una plataforma SaaS empresarial diseñada para operar de forma resiliente en entornos de alta exigencia (faenas mineras en altura, campamentos remotos, fundos agrícolas y centros logísticos). 

Permite coordinar personal, tareo diario, maquinarias pesadas, recepción de mineral, inventarios críticos, caja chica y seguridad industrial (SOMA), funcionando tanto con conexión permanente como en **modo 100% desconectado (offline)** con sincronización automática al restablecerse internet.

---

## 📚 Hub de Documentación Técnica

Toda la arquitectura, decisiones de diseño, convenciones y guías de desarrollo están documentadas en el directorio [`docs/`](./docs/):

| Documento | Enlace | Propósito |
| :--- | :--- | :--- |
| **Guía para Desarrolladores** | [README_FOR_DEVELOPERS.md](./docs/README_FOR_DEVELOPERS.md) | Onboarding rápido, variables de entorno, comandos de compilación y flujo de trabajo local. |
| **Arquitectura del Proyecto** | [PROJECT_ARCHITECTURE.md](./docs/PROJECT_ARCHITECTURE.md) | Flujo de ejecución Next.js 15, capas de servidor/cliente, App Shell y diagramas mermaid. |
| **Índice de Módulos y Rutas** | [PROJECT_INDEX.md](./docs/PROJECT_INDEX.md) | Mapeo detallado de las 44+ rutas, Server Actions y componentes clave. |
| **Guía de Base de Datos** | [DATABASE_GUIDE.md](./docs/DATABASE_GUIDE.md) | Esquema PostgreSQL en Supabase, tablas maestras, RLS y las 34 migraciones. |
| **Autenticación y Permisos** | [AUTH_AND_PERMISSIONS.md](./docs/AUTH_AND_PERMISSIONS.md) | Autenticación SSR con cookies, matriz de roles y sistema RBAC Granular V1. |
| **Seguridad Multiempresa** | [MULTITENANT_SECURITY.md](./docs/MULTITENANT_SECURITY.md) | Aislamiento lógico por `company_id`, protección anti-IDOR/BOLA e impersonación. |
| **Guía Online / Offline** | [ONLINE_OFFLINE_GUIDE.md](./docs/ONLINE_OFFLINE_GUIDE.md) | Persistencia con IndexedDB (`idb`), Service Worker (`sw.js`) y cola `sync_queue`. |
| **Guía de Despliegue** | [DEPLOYMENT_GUIDE.md](./docs/DEPLOYMENT_GUIDE.md) | Compilación `standalone`, Docker, variables de producción y checklist pre-deploy. |
| **Convenciones de Código** | [DEVELOPMENT_CONVENTIONS.md](./docs/DEVELOPMENT_CONVENTIONS.md) | Directrices para Server Actions, tipado TypeScript y Sistema de Movimiento. |
| **Problemas Conocidos** | [KNOWN_ISSUES.md](./docs/KNOWN_ISSUES.md) | Consideraciones de librerías (`xlsx`), paginación y límites operativos. |
| **Registro de Cambios** | [CHANGELOG.md](./docs/CHANGELOG.md) | Historial detallado de versiones y mejoras implementadas. |

---

## 🛠️ Stack Tecnológico Principal

- **Framework Web:** [Next.js 15.5](https://nextjs.org/) (App Router, Server Actions, Standalone Build).
- **Biblioteca de UI:** [React 19.2](https://react.dev/).
- **Lenguaje:** [TypeScript 5](https://www.typescriptlang.org/) (Verificación estricta sin errores).
- **Estilos & Diseño:** [Tailwind CSS v4](https://tailwindcss.com/) + Sistema de Movimiento Empresarial en GPU.
- **Base de Datos & Auth:** [Supabase](https://supabase.com/) (PostgreSQL 15, Auth SSR con cookies seguras y RLS reforzado).
- **PWA & Offline:** `@ducanh2912/next-pwa`, Service Worker personalizado (`public/sw.js`) e IndexedDB (`idb`).
- **Iconografía:** [Lucide React](https://lucide.dev/).
- **Notificaciones:** [Sonner](https://sonner.emilkowal.ski/).

---

## ⚡ Comandos Rápidos

```bash
# Instalar dependencias
npm install

# Iniciar servidor local de desarrollo
npm run dev

# Verificación estricta de TypeScript (0 errores)
npx tsc --noEmit

# Compilación optimizada para producción
npm run build

# Arrancar servidor de producción local
npm run start
```

---

## 🛡️ Principios de Protección del Ecosistema

- **Aislamiento Multiempresa Estricto:** Toda acción valida la empresa en servidor con `getStrictCompanyId()`.
- **Cero Fugas de Secretos:** La clave `SUPABASE_SERVICE_ROLE_KEY` jamás llega al navegador del cliente.
- **Sin Migraciones DDL sin Autorización:** La estructura de base de datos permanece protegida y versionada en `supabase/migrations/`.
- **Continuidad Operativa:** El modo offline y el motor de sincronización se preservan en cada versión.

---

*InthalyOps © 2026 — Operaciones que impulsan tu gente y tu negocio.*
