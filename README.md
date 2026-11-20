# ECOSISTEMA TECNOLÓGICO INTHALY
> **Centro Único de Desarrollo y Operación del Ecosistema Inthaly**  
> Repositorio Monorepo Multi-Aplicación Soberano.

Bienvenido al espacio central de desarrollo del **Ecosistema Inthaly**. Aquí residen de manera organizada e independiente todas las aplicaciones, servicios, infraestructura y documentación del ecosistema.

---

## 1. Mapa de Aplicaciones y Productos

| Aplicación | Carpeta Física | Puerto | URL Local | Descripción |
| :--- | :--- | :---: | :--- | :--- |
| **InthalyOps** | `apps/inthaly-ops` | **3000** | [http://localhost:3000](http://localhost:3000) | Sistema de gestión empresarial, tareo minero, operaciones de campo, RLS y portal de trabajadores. |
| **INTHALY GLOBAL** | `apps/global-admin` | **3001** | [http://localhost:3001/login](http://localhost:3001/login) | Consola Administrativa Central y Centro de Control de todo el ecosistema. |
| **Inthaly ID** | `apps/inthaly-id` *(en extracción)* | **3002** | [http://localhost:3002](http://localhost:3002) | Identidad centralizada, sesiones criptográficas y servidor OIDC RFC 8414 / RFC 7636. |
| **Comunidad Inthaly** | `apps/community` *(en extracción)* | **3003** | [http://localhost:3003](http://localhost:3003) | Red profesional, foros técnicos especializados y grupos de la industria. |
| **Inthaly Academia** | `D:\INTHALY\extracted` | **8000** | [http://localhost:8000](http://localhost:8000) | Plataforma de formación y cursos LMS (Laravel 12 / MySQL independiente). |

---

## 2. Estructura del Proyecto

```text
D:\ecosistema inthaly\
│
├── apps/
│   ├── inthaly-ops/             <- Sistema de gestión empresarial (Puerto 3000)
│   ├── global-admin/            <- Consola Global y Centro de Control (Puerto 3001)
│   ├── inthaly-id/              <- Servidor de identidad y OIDC (Puerto 3002)
│   └── community/               <- Red profesional y foros (Puerto 3003)
│
├── packages/
│   ├── shared-ui/               <- Tokens corporativos, paleta de colores y componentes
│   ├── shared-types/            <- Contratos TypeScript compartidos entre aplicaciones
│   └── shared-config/           <- Mapa canónico de puertos y configuraciones comunes
│
├── infra/                       <- Despliegue Docker, PostgreSQL soberano, MinIO S3 y backups
├── docs/                        <- Documentación técnica clasificada por producto
└── tests/                       <- 75 pruebas automatizadas de integridad y seguridad
```

---

## 3. Guía Práctica de Ejecución Local

### Opción A: Comandos por Terminal

#### 1. Iniciar InthalyOps (Puerto 3000)
```powershell
cd "D:\ecosistema inthaly\apps\inthaly-ops"
npm run dev
```
*Disponible en:* `http://localhost:3000`

#### 2. Iniciar INTHALY GLOBAL (Puerto 3001)
En una segunda terminal:
```powershell
cd "D:\ecosistema inthaly\apps\global-admin"
npm run dev
```
*Disponible en:* `http://localhost:3001/login`  
*(Ingresa con tu correo de Super Admin: `inthalyops@gmail.com`)*

---

### Opción B: Comandos Centralizados desde la Raíz
Desde la carpeta raíz `D:\ecosistema inthaly`:
- Iniciar InthalyOps: `npm run dev:ops`
- Iniciar INTHALY GLOBAL: `npm run dev:admin`
- Ejecutar pruebas automáticas: `npm test`

---

## 4. Documentación Centralizada

Toda la documentación técnica se encuentra organizada en la carpeta `docs/`:
- **Arquitectura General:** [`docs/architecture/`](docs/architecture/)
- **Consola Global:** [`docs/inthaly-global/`](docs/inthaly-global/)
- **Inthaly ID:** [`docs/inthaly-id/`](docs/inthaly-id/)
- **InthalyOps:** [`docs/inthaly-ops/`](docs/inthaly-ops/)
- **Comunidad Inthaly:** [`docs/community/`](docs/community/)
- **Infraestructura y Recuperación:** [`infra/docs/`](infra/docs/)
- **Índice Completo de Documentación:** [`docs/README.md`](docs/README.md)
