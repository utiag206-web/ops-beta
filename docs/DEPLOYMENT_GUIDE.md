# 🚀 Guía de Despliegue y Puesta en Producción — InthalyOps

Este documento detalla el procedimiento para compilar, empaquetar y desplegar **InthalyOps** en servidores de producción o contenedores Docker utilizando la exportación `standalone` de Next.js 15.

---

## 1. Configuración de Compilación (`next.config.ts`)

InthalyOps está optimizado para generar un bundle autónomo mínimo con todas las dependencias de Node.js empaquetadas:

```typescript
const nextConfig: NextConfig = {
  output: 'standalone',
  outputFileTracingRoot: path.join(__dirname),
  eslint: {
    ignoreDuringBuilds: true,
  },
  images: {
    unoptimized: true,
  },
  experimental: {
    optimizePackageImports: ['lucide-react', 'date-fns'],
    serverActions: {
      bodySizeLimit: "10mb",
    },
  },
  // Cabeceras HTTP de seguridad
  async headers() { ... }
}
```

---

## 2. Flujo de Build de Producción

### Paso 1: Verificación de Tipos Estricta
```bash
npx tsc --noEmit
```
Debe finalizar con código de salida `0` y sin errores.

### Paso 2: Compilación de Producción
```bash
npm run build
```
Next.js genera:
1. `.next/standalone`: Servidor Node.js ligero con solo las dependencias requeridas.
2. `.next/static`: Archivos JavaScript y CSS públicos versionados por hash.
3. `public/`: Recursos estáticos corporativos y Service Worker (`sw.js`).

---

## 3. Estructura de Despliegue

Para desplegar en el servidor de destino (Docker o VPS Linux/Windows), se deben trasladar los siguientes directorios:

```
deploy_prod/
├── .next/
│   ├── standalone/       # Servidor compilado
│   └── static/           # Debe copiarse dentro de .next/standalone/.next/static
├── public/               # Debe copiarse dentro de .next/standalone/public
├── .env.production       # Variables de producción (o inyectadas por variables de entorno del host)
└── server.js             # Punto de entrada
```

Comando de arranque en servidor:
```bash
node server.js
# O directamente:
node .next/standalone/server.js
```

El servidor escuchará por defecto en el puerto `3000` (configurable con la variable `PORT=3000 HOSTNAME=0.0.0.0`).

---

## 4. Checklist de Seguridad Pre-Despliegue

- [ ] **Sin credenciales fijas:** Verificar con `git status` que ningún script local (`audit.mjs`, `seed_ops.mjs`) con claves de servicio quede rastreado.
- [ ] **Aislamiento de la clave Service Role:** Confirmar que `SUPABASE_SERVICE_ROLE_KEY` no se encuentre presente en ningún chunk del cliente (`grep -rn "SUPABASE_SERVICE_ROLE_KEY" .next/static/`).
- [ ] **Cabeceras HTTP Activas:** Validar que la respuesta incluya `X-Content-Type-Options: nosniff`, `X-Frame-Options: SAMEORIGIN` y `Referrer-Policy: strict-origin-when-cross-origin`.
- [ ] **Versión de Service Worker:** En [public/sw.js](file:///d:/Sistema%20de%20gestión%20de%20trabajadores/public/sw.js), verificar que `CACHE_VERSION` coincida con la versión del despliegue en `package.json` (`v1.3.4`).

