# 👨‍💻 Manual de Incorporación para Desarrolladores (Developer Onboarding) — INTHALY

> **Estado del Documento:** Aprobado y Oficial  
> **Clasificación:** Guía de Inducción Técnica para Nuevos Ingenieros  
> **Última Actualización:** 15 de Noviembre de 2026

---

## 1. Bienvenido al Equipo de Ingeniería de INTHALY

¡Bienvenido a bordo! INTHALY no es un software empresarial genérico: es una plataforma misionera de alta resiliencia diseñada para gobernar operaciones mineras, flotas pesadas y cuadrillas de trabajadores en las condiciones geográficas y de conectividad más extremas de América Latina.

Este documento te guiará paso a paso durante tu **primer día (Day 1)** para configurar tu entorno, comprender la arquitectura y enviar tu primer cambio exitoso.

---

## 2. Ruta de Lectura Obligatoria del Día 1

Antes de tocar una sola línea de código, tómate las primeras 3 horas para leer en orden los siguientes documentos de la documentación maestra:

1. [docs/00_FUNDAMENTOS/PROJECT_CHARTER.md](file:///d:/Sistema%20de%20gestión%20de%20trabajadores/docs/00_FUNDAMENTOS/PROJECT_CHARTER.md) — Para entender qué es INTHALY y para quién construimos.
2. [docs/01_ARQUITECTURA_MAESTRA/MASTER_ARCHITECTURE.md](file:///d:/Sistema%20de%20gestión%20de%20trabajadores/docs/01_ARQUITECTURA_MAESTRA/MASTER_ARCHITECTURE.md) — El mapa completo del monolito modular y sus 7 pilares.
3. [docs/01_ARQUITECTURA_MAESTRA/MULTITENANCY.md](file:///d:/Sistema%20de%20gestión%20de%20trabajadores/docs/01_ARQUITECTURA_MAESTRA/MULTITENANCY.md) — **Lectura crítica**: el principio Anti-IDOR con `getStrictCompanyId()`.
4. [docs/05_DESARROLLO_Y_MANTENIMIENTO/CODING_STANDARDS.md](file:///d:/Sistema%20de%20gestión%20de%20trabajadores/docs/05_DESARROLLO_Y_MANTENIMIENTO/CODING_STANDARDS.md) — Reglas de TypeScript, Server Actions y tokens de movimiento.

---

## 3. Configuración Express del Entorno Local (En 15 Minutos)

Sigue estos 4 comandos en tu terminal (PowerShell o Bash):

```bash
# 1. Clona el repositorio
git clone <URL_DEL_REPOSITORIO>
cd "Sistema de gestión de trabajadores"

# 2. Instala las dependencias exactas
npm install

# 3. Solicita a tu Líder Técnico las credenciales de desarrollo y crea .env.local
cp .env.example .env.local

# 4. Inicia el servidor de desarrollo
npm run dev
```
Abre tu navegador en `http://localhost:3000`. Deberías ver la pantalla de acceso corporativo de INTHALY.

---

## 4. Las Tres Reglas de Oro del Desarrollador en INTHALY

1. **Nunca aceptes `company_id` desde el cliente:**  
   Si escribes una Server Action o mutación, invoca siempre `const companyId = await getStrictCompanyId()`. Nunca tomes `formData.get('company_id')`.
2. **Cero tolerancia a errores de tipos:**  
   Antes de hacer commit, ejecuta `npx tsc --noEmit`. Si hay un solo error de TypeScript, el pipeline de integración rechazará tu código.
3. **Respeta el motor Offline:**  
   Si modificas la vista de Tareo o Asistencia, recuerda que el operario puede estar en el fondo de una mina sin internet. No asumas que `window.fetch` siempre responderá inmediatamente; utiliza las utilidades de IndexedDB y el hook `useOfflineSync`.

---

## 5. Tu Primer Pull Request (Guía de Entrega)

1. Crea tu rama a partir de la rama activa de desarrollo:
   ```bash
   git checkout -b feat/mi-primera-mejora
   ```
2. Realiza tus cambios respetando los estándares de código.
3. Verifica que todo compile limpiamente:
   ```bash
   npx tsc --noEmit
   npm run build
   ```
4. Haz tu commit utilizando Conventional Commits:
   ```bash
   git commit -m "feat(tareo): agregar validacion de horario nocturno"
   ```
5. Abre el Pull Request en GitHub y solicita la revisión de tu Líder Técnico.
