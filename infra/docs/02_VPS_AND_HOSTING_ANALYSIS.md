# ANÁLISIS DE HOSPEDAJE: BANALINK / VPS Y REQUISITOS DE SERVIDOR
## Evaluación Técnica de Opciones de Despliegue para el Ecosistema Inthaly

---

### 1. EVALUACIÓN DEL HOSPEDAJE ACTUAL (BANALINK / BANAMEX / CPANEL)

El usuario ha informado que actualmente se dispone de una cuenta en **BanaHosting**, pero aún no se tiene acceso al cPanel ni se ha confirmado el tipo de plan contratado.

#### A. Limitaciones Técnicas de un Alojamiento Compartido (Shared cPanel):
Si el plan contratado en BanaHosting es un **Hosting Web Compartido (cPanel estándar)**:
- **Incompatibilidad con Docker:** Los planes compartidos de cPanel operan bajo jaulas de recursos (CloudLinux / LVE) que prohíben la ejecución del daemon de Docker y contenedores.
- **Versión de Base de Datos Restringida:** Los alojamientos cPanel compartidos normalmente ofrecen MySQL/MariaDB gestionado por el proveedor y, en raras ocasiones, versiones antiguas de PostgreSQL sin extensiones personalizadas (`pgcrypto`, `uuid-ossp`) ni acceso a `postgresql.conf` ni `pg_hba.conf`.
- **Procesos en Segundo Plano (Daemons):** Los servidores compartidos eliminan automáticamente los procesos de Node.js o PgBouncer que permanezcan en ejecución prolongada o consuman CPU intensiva (como las derivaciones de `Scrypt`).

#### B. Solución Técnica Requerida: BanaHosting Cloud VPS o Servidor VPS Linux Independiente
Para desplegar la infraestructura autogestionada preparada en `infra/`:
- Se requiere un **Servidor Virtual Privado (Cloud VPS)** con acceso **root** por SSH y sistema operativo **Ubuntu 22.04 LTS o Ubuntu 24.04 LTS**.
- Si el plan de BanaHosting es un VPS, servirá perfectamente. Si es un hosting web compartido, se deberá solicitar un *upgrade* hacia un Cloud VPS o contratar un VPS dedicado.

---

### 2. REQUISITOS DE HARDWARE DEL SERVIDOR VPS

| Recurso | Requisito Mínimo (Lanzamiento) | Requisito Recomendado (Escalamiento) | Justificación Técnica |
| :--- | :--- | :--- | :--- |
| **Cómputo (CPU)** | 2 vCPU (x86_64) | 4 vCPU | La derivación criptográfica de contraseñas con `Scrypt` (N=16384) y compresión TLS requiere capacidad de procesamiento concurrente. |
| **Memoria (RAM)** | 4 GB | 8 GB | PostgreSQL 16 (`shared_buffers = 512MB`), Redis 7, PgBouncer, Next.js Node runtime y margen para SWAP (2GB). |
| **Almacenamiento** | 50 GB NVMe SSD | 100 GB NVMe SSD | Bases de datos `inthaly_id`, `inthaly_community`, transacciones WAL y retención de 30 días de respaldos automáticos `.dump`. |
| **Sistema Operativo** | Ubuntu 22.04 / 24.04 LTS | Ubuntu 24.04 LTS | Compatibilidad nativa con Docker Engine oficial, `systemd`, `ufw` y `fail2ban`. |
| **Red** | 1 Gbps / Tráfico no medido | 1 Gbps dedicado | Conectividad fluida entre Vercel/clientes y el servidor de base de datos. |

---

### 3. CONFIGURACIÓN DE DNS Y SUBDOMINIOS PREVISTOS

Cuando se disponga de la IP pública estática del VPS, se deberán configurar los siguientes registros de tipo `A` en el panel de DNS de Inthaly:

| Subdominio | Tipo de Registro | Destino | Propósito |
| :--- | :---: | :--- | :--- |
| `auth.inthaly.com` | A | IP_PUBLICA_VPS | Portal soberano de Inthaly ID y endpoints OIDC. |
| `comunidad.inthaly.com` | A | IP_PUBLICA_VPS o Vercel CNAME | Red social profesional Comunidad Inthaly. |
| `admin.inthaly.com` | A | IP_PUBLICA_VPS o Vercel CNAME | Consola Global del Ecosistema. |
| `sistemaops.inthaly.com` | CNAME / A | Destino actual de InthalyOps | ERP de contratistas mineros (**Intacto**). |
| `app.inthaly.com` | A | Servidor actual de Academia | Plataforma LMS Laravel 12 (**Intacto**). |

---

### 4. ESTIMACIÓN DE COSTOS DE INFRAESTRUCTURA AUTOGESTIONADA

- **BanaHosting Cloud VPS (2 vCPU, 4GB RAM, 60GB NVMe):** ~$15.00 a $22.00 USD/mes.
- **Alternativas de respaldo reconocidas (Hetzner Cloud, DigitalOcean, Linode):** ~$12.00 a $24.00 USD/mes.
- **Ahorro frente a SaaS administrados (Supabase Pro + Auth0 + Redis Cloud):** Más de $75.00 USD/mes de ahorro recurrente, con soberanía y control absoluto de los datos.
