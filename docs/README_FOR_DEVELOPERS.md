# 🛠️ Guía de Incorporación para Desarrolladores — InthalyOps

Bienvenido al equipo de ingeniería de **InthalyOps**. Esta guía proporciona los pasos técnicos necesarios para configurar tu entorno local, entender la estructura del repositorio y ejecutar el flujo de desarrollo sin fricciones.

---

## 1. Requisitos del Sistema

- **Node.js:** Versión `20.x` o superior (LTS recomendada).
- **Gestor de paquetes:** `npm` (v10+).
- **Sistema Operativo:** Windows, macOS o Linux.
- **Acceso a Supabase:** Instancia de Supabase con URL pública, Anon Key y Service Role Key configuradas.

---

## 2. Configuración Inicial del Entorno

### Paso 1: Clonar e instalar dependencias
```bash
git clone <URL_DEL_REPOSITORIO>
cd "Sistema de gestión de trabajadores"
npm install
```

### Paso 2: Variables de Entorno
Copia el archivo de ejemplo `.env.example` hacia `.env.local`:
```bash
cp .env.example .env.local
```

Configura los siguientes valores dentro de `.env.local`:
```env
# URL base de tu instancia de Supabase
NEXT_PUBLIC_SUPABASE_URL=https://tu-proyecto.supabase.co

# Clave pública anónima (usada en cliente y browser con RLS)
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOi...

# Clave de servicio administrativo (EXCLUSIVA DE NODE.JS EN SERVIDOR — NUNCA EXPONER AL CLIENTE)
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOi...

# URL canónica de la aplicación
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

> [!CAUTION]
> `SUPABASE_SERVICE_ROLE_KEY` bypassa todas las políticas de Row Level Security (RLS). Debe permanecer estrictamente en el entorno del servidor y jamás ser importada en componentes con directiva `'use client'`.

---

## 3. Comandos de Desarrollo y Compilación

| Comando | Descripción |
| :--- | :--- |
| `npm run dev` | Inicia el servidor de desarrollo en `http://localhost:3000` con Turbopack/JIT. |
| `npx tsc --noEmit` | Ejecuta la verificación estricta de tipos de TypeScript sin generar código. |
| `npm run build` | Genera la compilación optimizada de producción (`standalone`). |
| `npm run start` | Arranca el servidor de producción compilado. |
| `npm run lint` | Ejecuta ESLint sobre el código fuente. |

---

## 4. Estructura de Directorios Clave

```
├── public/                 # Recursos estáticos, íconos WebAPK y Service Worker (sw.js)
├── src/
│   ├── app/                # Next.js 15 App Router
│   │   ├── (auth)/         # Rutas de autenticación pública (login, register, reset)
│   │   ├── (main)/         # Dashboard empresarial protegido (layout.tsx, template.tsx)
│   │   │   ├── dashboard/  # Métricas principales
│   │   │   ├── workers/    # Gestión de personal
│   │   │   ├── operaciones/# Módulos operativos (campo, planta, producción, maderas)
│   │   │   ├── mecanica/   # Módulo de mantenimiento y vehículos
│   │   │   ├── inventory/  # Control de stock, productos y kardex
│   │   │   └── super-admin/# Centro corporativo multiempresa
│   │   ├── w/              # Portal ligero para trabajadores (/w/[companySlug])
│   │   └── layout.tsx      # RootLayout global
│   ├── components/         # Componentes React (layout, auth, dashboard, workers, ui)
│   └── lib/                # Utilidades centrales
│       ├── auth.ts         # getUserSession(), caché de sesión en memoria
│       ├── permissions.ts  # Matriz de permisos RBAC
│       ├── offline-sync.ts # Persistencia IndexedDB y sincronización
│       └── supabase/       # Clientes cliente, servidor y middleware
├── supabase/
│   └── migrations/         # 34 migraciones SQL de base de datos
└── docs/                   # Suite completa de documentación técnica
```

---

## 5. Reglas de Oro para Desarrolladores

1. **Aislamiento Multiempresa Obligatorio:**  
   Toda Server Action o consulta que modifique datos DEBE utilizar `getStrictCompanyId()` y `applyIsolation()`. Ninguna consulta debe asumir que el usuario pertenece a una única empresa global.
2. **Sin Fugas al Cliente:**  
   Jamás uses `createAdminClient()` dentro de componentes con `'use client'`. Los componentes cliente deben llamar a Server Actions seguras en archivos `actions.ts`.
3. **Persistencia Híbrida:**  
   Si creas un nuevo formulario operativo, evalúa si debe operar sin internet. De ser así, registra su handler en `src/lib/sync-handlers.ts` y persístelo en `InthalyDB`.
4. **Verificación Previa a Commit:**  
   Siempre ejecuta `npx tsc --noEmit` y `npm run build` localmente antes de enviar código a revisión.

