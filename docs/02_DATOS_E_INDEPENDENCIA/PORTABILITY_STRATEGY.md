# 📦 Estrategia de Portabilidad y Contenerización — INTHALY

> **Estado del Documento:** Aprobado y Oficial  
> **Clasificación:** Guía Operativa de Migración y DevOps  
> **Última Auditoría:** 15 de Noviembre de 2026

---

## 1. Principio de Portabilidad Universal

La aplicación INTHALY no debe depender de ninguna plataforma específica de alojamiento como Vercel o Supabase para su ejecución en producción. El sistema está diseñado para poder empaquetarse en un contenedor **Docker Standalone OCI-compliant** y desplegarse en cualquier servidor con Linux, Kubernetes, AWS ECS, Google Cloud Run o infraestructura propia de un campamento minero.

```mermaid
flowchart LR
    subgraph SourceCode["Código Fuente INTHALY"]
        NextApp["Next.js 14+ App Router"]
        StaticAssets["public/ + .next/static"]
        NodeServer["Node.js Standalone Server"]
    end

    subgraph ContainerBuild["Construcción Multi-Stage Docker"]
        BuilderStage["Stage 1: Dependencies & Build (Node 20 Alpine)"]
        RunnerStage["Stage 2: Minimal Production Image (< 180MB)"]
    end

    subgraph DeploymentTargets["Destinos de Despliegue Portables"]
        Target1["Vercel (Producción Actual)"]
        Target2["VPS Linux (Ubuntu / Docker Compose)"]
        Target3["Cluster Kubernetes / OpenShift"]
        Target4["Servidor On-Premise en Unidad Minera"]
    end

    NextApp --> BuilderStage --> RunnerStage
    RunnerStage --> Target1 & Target2 & Target3 & Target4
```

---

## 2. Configuración Standalone en Next.js

En `next.config.mjs` se habilita la compilación autónoma que recopila únicamente los archivos estrictamente necesarios de `node_modules` para ejecutar el servidor Node.js:

```javascript
// next.config.mjs
/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  // ... otras configuraciones de imágenes y headers
};

export default nextConfig;
```

### Dockerfile Canónico de Producción Multi-Stage
```dockerfile
# STAGE 1: Dependencias
FROM node:20-alpine AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci

# STAGE 2: Compilación de la Aplicación
FROM node:20-alpine AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
ENV NEXT_TELEMETRY_DISABLED 1
ENV NODE_ENV production
RUN npm run build

# STAGE 3: Imagen de Ejecución Ultraligera
FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV production
ENV NEXT_TELEMETRY_DISABLED 1
ENV PORT 3000

# Usuario sin privilegios por seguridad
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs
EXPOSE 3000
CMD ["node", "server.js"]
```

---

## 3. Procedimiento Estándar de Volcado y Migración de Base de Datos

Para migrar la base de datos de PostgreSQL desde Supabase hacia cualquier otro proveedor gestionado o servidor propio:

### 3.1. Extracción de Volcado Lógico Completo (`pg_dump`)
```bash
# Exportar esquema completo, datos, roles y triggers en formato personalizado comprimido
pg_dump -h db.ejemplo.supabase.co -p 5432 -U postgres -d postgres \
  --format=custom \
  --no-owner \
  --no-privileges \
  --schema=public \
  --file=inthaly_backup_$(date +%Y%m%d_%H%M%S).dump
```

### 3.2. Restauración en Servidor de Destino (`pg_restore`)
```bash
# Restaurar sobre una base de datos limpia en PostgreSQL 15 o superior
pg_restore -h nuevo-host.internal -p 5432 -U postgres -d inthaly_prod \
  --clean \
  --if-exists \
  --no-owner \
  --no-privileges \
  inthaly_backup_20261115_120000.dump
```

---

## 4. Orquestación Standalone con Docker Compose

Para despliegues en servidores independientes (VPS o servidores de campamento minero), se puede ejecutar la plataforma completa con un archivo `docker-compose.yml`:

```yaml
version: '3.8'

services:
  web:
    image: inthaly-ops:latest
    build:
      context: .
      dockerfile: Dockerfile
    restart: always
    ports:
      - "3000:3000"
    environment:
      - DATABASE_URL=postgresql://postgres:${DB_PASSWORD}@postgres:5432/inthaly_db?sslmode=disable
      - NEXT_PUBLIC_SUPABASE_URL=http://postgres:8000
      - NEXT_PUBLIC_SUPABASE_ANON_KEY=${ANON_KEY}
      - SUPABASE_SERVICE_ROLE_KEY=${SERVICE_ROLE_KEY}
    depends_on:
      - postgres

  postgres:
    image: postgres:15-alpine
    restart: always
    environment:
      POSTGRES_DB: inthaly_db
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: ${DB_PASSWORD}
    volumes:
      - pgdata:/var/lib/postgresql/data
    ports:
      - "5432:5432"

volumes:
  pgdata:
```
