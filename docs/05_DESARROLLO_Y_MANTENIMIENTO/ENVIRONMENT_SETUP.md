# 🛠️ Configuración del Entorno de Desarrollo Local — INTHALY

> **Estado del Documento:** Aprobado y Oficial  
> **Clasificación:** Manual de Puesta en Marcha Técnica (Setup Guide)  
> **Última Auditoría:** 15 de Noviembre de 2026

---

## 1. Requisitos Previos del Sistema

Para levantar el entorno de desarrollo de INTHALY de forma óptima en Windows, macOS o Linux, se requiere:

- **Node.js:** Versión `20.10.0 LTS` o superior (se recomienda Node 20 o 22 LTS).
- **Gestor de Paquetes:** `npm` versión 10 o superior.
- **Git:** Versión 2.30 o superior instalada.
- **Terminal:** PowerShell en Windows, Bash o Zsh en macOS/Linux.
- **Opcional (Desarrollo Offline Local de Base de Datos):** Docker Desktop y Supabase CLI (`npm i -g supabase`).

---

## 2. Instalación Paso a Paso

### Paso 1: Clonar el Repositorio
```bash
git clone https://github.com/tu-organizacion/sistema-de-gestion-de-trabajadores.git
cd "sistema-de-gestion-de-trabajadores"
```

### Paso 2: Instalar Dependencias
```bash
npm install
```

### Paso 3: Configurar Variables de Entorno (`.env.local`)
Crea un archivo llamado `.env.local` en la raíz del proyecto a partir de la siguiente plantilla de configuración:

```env
# URL de la instancia de Supabase (Cloud o Local)
NEXT_PUBLIC_SUPABASE_URL=https://tu-proyecto.supabase.co

# Llave anónima pública para el navegador (protegida por RLS)
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# Llave maestra de servicio para Server Actions administrativas (NUNCA exponer al cliente)
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# URL base de la aplicación (para redirecciones de autenticación y enlaces)
NEXT_PUBLIC_APP_URL=http://localhost:3000

# Cadena de conexión directa a PostgreSQL (para scripts de migración o pooler)
DATABASE_URL=postgresql://postgres.tu-proyecto:tu-password@aws-0-us-east-1.pooler.supabase.com:6543/postgres?pgbouncer=true
```

### Paso 4: Levantar el Servidor de Desarrollo
```bash
npm run dev
```
La aplicación estará disponible inmediatamente en `http://localhost:3000`.

---

## 3. Comandos Principales de la Terminal

| Comando | Acción Ejecutada |
| :--- | :--- |
| `npm run dev` | Inicia el servidor de desarrollo de Next.js con Hot Reloading en el puerto 3000. |
| `npm run build` | Ejecuta la compilación de producción y genera la carpeta autónoma `.next/standalone`. |
| `npm run start` | Inicia el servidor compilado de producción localmente en el puerto 3000. |
| `npx tsc --noEmit` | Ejecuta la comprobación estricta de tipos de TypeScript sin generar archivos. |
| `npm run lint` | Ejecuta el análisis estático de código con ESLint. |

---

## 4. Desarrollo con Supabase Local (Opcional para Modo Offline Total)

Si el desarrollador desea trabajar sin conexión a internet durante viajes o en campamento:
1. Iniciar los contenedores locales de Supabase:
   ```bash
   npx supabase start
   ```
2. Aplicar todas las 34 migraciones del repositorio sobre la base local:
   ```bash
   npx supabase db reset
   ```
3. Actualizar `NEXT_PUBLIC_SUPABASE_URL=http://127.0.0.1:54321` en `.env.local`.
