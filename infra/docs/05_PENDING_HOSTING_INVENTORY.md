# INVENTARIO DE TAREAS PENDIENTES QUE REQUIEREN ACCESO AL HOSTING
## Delimitación Estricta: Lo que está Preparado vs. Lo que Requiere Acceso Físico

---

### 1. ESTADO ACTUAL DE PREPARACIÓN

- **Código y Scripts de Infraestructura:** 100% preparados, versionados y organizados en la carpeta `infra/`.
- **Docker Compose, Configuraciones de PostgreSQL, Caddy y Respaldos:** 100% completados.
- **Esquemas DDL de Bases de Datos Separadas (`inthaly_id`, `inthaly_community`):** 100% diseñados.
- **Entorno Local de AntiGravity:** No cuenta con Docker ni PostgreSQL instalados en este host Windows; por directriz de seguridad, **no se simulan ejecuciones en servidores remotos sin autorización**.

---

### 2. INVENTARIO DE TAREAS QUE REQUIEREN ACCESO EXTERNO

| # | Tarea Pendiente | Requisito Previo | Responsable / Acción Requerida |
| :---: | :--- | :--- | :--- |
| **01** | **Verificación del Plan BanaHosting** | Acceso al panel de clientes de BanaHosting. | Verificar si el servicio contratado es un Cloud VPS (KVM) o Hosting Compartido cPanel. Si es hosting compartido, solicitar cambio a Cloud VPS. |
| **02** | **Aprovisionamiento del Servidor VPS** | Activación del Cloud VPS con Ubuntu 22.04 / 24.04 LTS. | Obtener IP pública estática y credenciales SSH de acceso root. |
| **03** | **Configuración de Registros DNS** | Acceso al panel de administración de DNS del dominio `inthaly.com`. | Crear registros tipo `A` apuntando `auth.inthaly.com` hacia la IP del VPS. |
| **04** | **Ejecución del Script de Provisión** | Acceso SSH al VPS. | Ejecutar `setup-vps.sh` en el servidor para instalar Docker, configurar UFW y directorios. |
| **05** | **Despliegue de Contenedores y DDL** | Archivos copiados a `/opt/inthaly/infra`. | Configurar `.env` con contraseñas de producción y ejecutar `docker compose up -d`. |
| **06** | **Configuración de Correo Transaccional** | Cuenta en proveedor SMTP o API (Resend, SendGrid, Mailgun). | Obtener credenciales de envío para habilitar la entrega real de correos de verificación y recuperación de contraseña. |
| **07** | **Validación de Certificados TLS** | Propagación de DNS completada. | Comprobar que Caddy emite certificados válidos Let's Encrypt para `auth.inthaly.com`. |

---

### 3. DECLARACIÓN DE NO INTERVENCIÓN NO AUTORIZADA

En estricto cumplimiento de las restricciones:
> *"No contratar servicios externos, no aprovisionar servidores ni realizar compras. No ejecutar cambios en producción. No afirmar que la base de datos definitiva está creada, desplegada o disponible si todavía no se ha instalado y probado en el servidor autorizado."*

La infraestructura queda lista en código y scripts, pendiente exclusivamente de los pasos de aprovisionamiento descritos arriba.
