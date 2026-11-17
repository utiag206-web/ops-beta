# ARQUITECTURA DE INFRAESTRUCTURA PROPIA: ECOSISTEMA INTHALY
## Plataforma Tecnológica Autogestionada, Soberana y Multi-Producto

---

### 1. PRINCIPIO ARQUITECTÓNICO FUNDAMENTAL

El ecosistema Inthaly adopta una estrategia de **infraestructura autogestionada (Self-Hosted)** con el objetivo de eliminar la dependencia cautiva de proveedores SaaS para sus bases de datos y servicios centrales.

```mermaid
flowchart TD
    subgraph Internet ["Tráfico Externo Seguro (HTTPS)"]
        CLIENT_ID["auth.inthaly.com\n(Inthaly ID)"]
        CLIENT_COM["comunidad.inthaly.com\n(Comunidad)"]
        CLIENT_ADM["admin.inthaly.com\n(Consola Global)"]
    end

    subgraph HostServer ["Servidor VPS Dedicado (Linux Ubuntu 24.04 LTS)"]
        subgraph ReverseProxy ["Proxy Inverso & TLS Automático"]
            CADDY["Caddy Server (Puertos 80 / 443)\n- Let's Encrypt TLS\n- Compresión zstd/gzip\n- Encabezados de Seguridad"]
        end

        subgraph AppRuntime ["Capa de Aplicación (Node.js)"]
            NEXT_APP["Inthaly Application Suite (Next.js 15)\n- /id/* (Identidad Soberana)\n- /comunidad/* (Red Profesional)\n- /super-admin/* (Torre de Control)"]
        end

        subgraph InthalyDocker ["Red Interna Aislada Docker (inthaly_internal)"]
            PGBOUNCER["PgBouncer Pooler\n(Puerto interno 6432)\n- Modo Transacción\n- Max 500 conexiones"]
            
            REDIS["Redis 7 (Caché & Sesiones)\n- Rate Limiting\n- Blacklist de Tokens"]

            POSTGRES[("PostgreSQL 16 Motor Dedicado\n(Puerto interno 5432 - Sin exposición pública)\n- Configuración: postgresql.conf\n- SCRAM-SHA-256")]

            BACKUP["Contenedor de Respaldos\n- Cron cada 6 horas\n- Checksum SHA-256\n- Retención 30 días"]
        end

        subgraph PersistentVolumes ["Almacenamiento Persistente Fuera de Git"]
            VOL_PG[("inthaly_pg_data_vol\n(/var/lib/postgresql/data)")]
            VOL_BK[("inthaly_backup_data_vol\n(/backups)")]
            VOL_RD[("inthaly_redis_data_vol\n(/data)")]
        end
    end

    subgraph ExternalProducts ["Bases de Datos Conservadas Intactas"]
        SUPABASE_OPS[("InthalyOps (ERP Contratistas)\n- Base Supabase Actual\n- Intacta e Inalterada")]
        MYSQL_ACA[("Inthaly Academy (LMS)\n- MySQL Laravel Actual\n- app.inthaly.com")]
    end

    CLIENT_ID --> CADDY
    CLIENT_COM --> CADDY
    CLIENT_ADM --> CADDY

    CADDY --> NEXT_APP
    NEXT_APP --> REDIS
    NEXT_APP -->|INTHALY_ID_DATABASE_URL| PGBOUNCER
    NEXT_APP -->|INTHALY_COMMUNITY_DATABASE_URL| PGBOUNCER
    NEXT_APP -.->|Operaciones ERP Multiempresa| SUPABASE_OPS

    PGBOUNCER --> POSTGRES
    POSTGRES --> VOL_PG
    REDIS --> VOL_RD
    BACKUP --> POSTGRES
    BACKUP --> VOL_BK
```

---

### 2. SEPARACIÓN DE BASES DE DATOS POR PRODUCTO

Para garantizar que un incidente operativo en un producto no comprometa la identidad ni otros servicios, se configuran dos bases de datos independientes en el motor PostgreSQL:

| Base de Datos | Responsabilidad Funcional | Usuario Dedicado | Permisos |
| :--- | :--- | :--- | :--- |
| **`inthaly_id`** | Identidades globales, credenciales Scrypt, sesiones activas, tokens de recuperación, clientes OIDC y bitácora de seguridad. | `inthaly_id_user` | Control total sobre esquema `inthaly_id`. Acceso denegado a cualquier otra base de datos. |
| **`inthaly_community`**| Perfiles de profesionales de campo, historial técnico de empleo, estudios, foros de discusión, muros, reacciones, comentarios y mensajería peer-to-peer. | `inthaly_community_user` | Control total sobre esquema `inthaly_community`. Cero acceso a credenciales de `inthaly_id`. |
| **InthalyOps** | Nóminas, tareo de contratistas, horas extras y portal de trabajadores DNI+PIN. | N/A (Conserva Supabase) | **Intacto e inalterado en su infraestructura actual.** |
| **Inthaly Academy**| Cursos, lecciones interactivas y certificados SOMA. | N/A (Conserva MySQL) | **Intacto e inalterado en su servidor actual (`app.inthaly.com`).** |

---

### 3. SEGURIDAD DE RED Y AISLAMIENTO DE PUERTOS

1. **Sin Exposición Pública de Bases de Datos:**  
   El puerto `5432` de PostgreSQL y el puerto `6379` de Redis **NO están expuestos a Internet**. En el archivo `docker-compose.yml`, están vinculados exclusivamente a `127.0.0.1` y conectados a la red puente privada `inthaly_internal`.
2. **Cifrado en Tránsito (TLS 1.3):**  
   Caddy gestiona la emisión y renovación automática de certificados SSL/TLS emitidos por Let's Encrypt para todos los subdominios de Inthaly.
3. **Autenticación Criptográfica Robusta:**  
   PostgreSQL opera exclusivamente con `scram-sha-256`, rechazando contraseñas en texto claro o MD5.
4. **Firewall a Nivel de Sistema Operativo (UFW):**  
   Solo se permiten conexiones entrantes a los puertos `22` (SSH con Fail2Ban), `80` (HTTP) y `443` (HTTPS).
