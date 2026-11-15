# 🧭 Guía de la Base de Código y Arquitectura de Archivos — INTHALY

> **Estado del Documento:** Aprobado y Oficial  
> **Clasificación:** Guía de Estructura de Proyecto para Desarrolladores  
> **Última Auditoría:** 15 de Noviembre de 2026

---

## 1. Topología de Directorios del Repositorio

El proyecto sigue una estructura limpia bajo el patrón Next.js 15 App Router:

```text
D:\Sistema de gestión de trabajadores\
├── docs/                        # Centro de Documentación Maestra (9 secciones oficiales)
├── public/                      # Recursos estáticos públicos, iconos PWA y Service Worker
│   ├── manifest.json            # Manifiesto de PWA para instalación móvil (WebAPK)
│   ├── sw.js                    # Service Worker compilado con soporte offline
│   └── icons/                   # Iconos vectoriales y PNG para Android e iOS
├── src/                         # Código fuente de la aplicación
│   ├── app/                     # Rutas del App Router de Next.js
│   │   ├── (auth)/              # Rutas de autenticación pública (login, reset-password)
│   │   ├── (main)/              # Módulos operativos protegidos (Dashboard Layout)
│   │   │   ├── dashboard/       # Tablero principal con KPIs ejecutivos
│   │   │   ├── workers/         # Directorio de personal y cuadrillas
│   │   │   ├── tareo/           # Tareo diario operativo y horas hombre
│   │   │   ├── attendance/      # Asistencia y marcas georreferenciadas
│   │   │   ├── mecanica/        # Taller, mantenimiento, combustible y checklists
│   │   │   ├── inventory/       # Almacén, kardex y stock
│   │   │   ├── soma/            # Seguridad, salud ocupacional y charlas 5 min
│   │   │   ├── ppe/             # Control y dotación de EPPs
│   │   │   ├── operaciones/     # Recepción de mineral y planta de beneficio
│   │   │   ├── caja-chica/      # Tesorería, gastos y rendiciones
│   │   │   ├── super-admin/     # Panel corporativo e impersonación
│   │   │   └── ...              # Otros submódulos (camp, bonuses, transport)
│   │   ├── w/[companySlug]/     # Portal móvil ligero para trabajadores (DNI login)
│   │   ├── offline/             # Página de contingencia cuando no hay conexión
│   │   ├── globals.css          # Estilos globales y Motion Design Tokens
│   │   └── layout.tsx           # Root Layout con fuentes y proveedores globales
│   ├── components/              # Componentes de interfaz de usuario
│   │   ├── layout/              # Sidebar, Header corporativo, Breadcrumbs
│   │   ├── ui/                  # Botones, modales, tablas, badges y dropdowns
│   │   ├── notifications/       # Campana de avisos y paneles en tiempo real
│   │   └── UppercaseEnforcer.tsx# Sanitizador automático a mayúsculas
│   ├── hooks/                   # Custom Hooks de React
│   │   ├── useOfflineSync.ts    # Orquestador del bucle de sincronización offline
│   │   └── usePushNotifications.ts # Gestor de suscripciones Web Push
│   └── lib/                     # Núcleo de utilidades y librerías del sistema
│       ├── auth.ts              # getUserSession, getStrictCompanyId, impersonación
│       ├── rbac/                # Tipos de roles, matriz de permisos y overrides V1
│       ├── supabase/            # Clientes SSR, Server y Middleware
│       └── offline/             # Instancia de IndexedDB y gestor de colas
├── supabase/
│   └── migrations/              # 34 migraciones SQL versionadas cronológicamente
├── next.config.ts               # Configuración de compilación standalone y PWA
├── package.json                 # Versión 1.4.1 y árbol de dependencias
└── tsconfig.json                # Configuración de TypeScript con alias @/*
```

---

## 2. Convenciones Arquitectónicas en Rutas

### 2.1. Server Components por Defecto (`page.tsx`)
- Todos los archivos `page.tsx` dentro de `src/app/(main)/` son **Server Components**.
- Se ejecutan en el servidor Node.js en tiempo de renderizado (SSR).
- Tienen acceso directo y seguro a `getUserSession()`, variables de entorno secretas y llamadas a base de datos sin exponer secretos al navegador.

### 2.2. Server Actions Protegidas (`actions.ts`)
- Las mutaciones de datos no se implementan como APIs REST públicas vulnerables, sino como **Server Actions** fuertemente tipadas en `actions.ts`.
- Encabezado obligatorio: `'use server'`.
- Resuelven obligatoriamente `getStrictCompanyId()` antes de ejecutar cualquier consulta.
- Notifican revalidación de caché mediante `revalidatePath('/modulo')`.

### 2.3. Client Components Aislados (`'use client'`)
- Solo se marcan como componentes de cliente aquellos elementos que requieren estado interactivo (`useState`, `useEffect`), manejadores de eventos del DOM (`onClick`, `onChange`), o acceso a APIs del navegador (`window.indexedDB`, `navigator.geolocation`).
- Se ubican preferentemente en subcarpetas `components/` dentro del módulo correspondiente para mantener `page.tsx` ligero y optimizado para streaming.
