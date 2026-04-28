# Next.js Production Boilerplate

Arquitectura base lista para producción y despliegue en Vercel.

## Características
- **Next.js 15+ (App Router)**: Aprovechando las últimas características de React Server Components.
- **TypeScript**: Tipado estricto para mayor seguridad en el desarrollo.
- **Estructura Escalable**: Organización clara de carpetas (`/components`, `/lib`, `/hooks`, `/types`).
- **Optimizado para Vercel**: Configuración de `middleware.ts` y `next.config.ts` lista.
- **Tailwind CSS 4**: Estilizado moderno con utilidades de combinación de clases (`cn`).

## Estructura de Carpetas
```text
src/
├── app/            # Rutas, Layouts y Server Components
├── components/     # UI Components (Atomic Design)
│   ├── common/     # Botones, Inputs, Modales genéricos
│   └── layout/     # Header, Footer, Sidebar
├── hooks/          # React Hooks personalizados
├── lib/            # Clientes API (Supabase, Prisma, etc.) y Utils
├── types/          # Interfaces y tipos globales
└── middleware.ts   # Seguridad y Redirecciones
```

## Configuración de Producción
- **Standalone Output**: Habilitado en `next.config.ts` para despliegues eficientes.
- **Security Headers**: Configuradas en el middleware.
- **React Strict Mode**: Habilitado por defecto.

## Cómo empezar
1. Instalar dependencias: `npm install`
2. Iniciar servidor de desarrollo: `npm run dev`
3. Generar build de producción: `npm run build`
