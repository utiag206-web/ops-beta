# ==============================================================================
# DOCKERFILE INDEPENDIENTE: INTHALY GLOBAL
# ==============================================================================
FROM node:20-alpine AS builder

WORKDIR /app

# Copiar configuración de dependencias de INTHALY GLOBAL
COPY apps/inthaly-global/package.json ./
RUN npm install

# Copiar código fuente
COPY apps/inthaly-global ./

# Compilación independiente de producción
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
RUN npm run build

# Stage de Producción Ultraligero
FROM node:20-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3001
ENV NEXT_TELEMETRY_DISABLED=1

RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nextjs

COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs

EXPOSE 3001

CMD ["node", "server.js"]
