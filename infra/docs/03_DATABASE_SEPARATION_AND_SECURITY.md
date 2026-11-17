# ESTRATEGIA DE SEPARACIÓN Y SEGURIDAD DE BASES DE DATOS
## Aislamiento Funcional, Gestión de Credenciales y Mitigación de Riesgos

---

### 1. SEPARACIÓN LÓGICA VS. AISLAMIENTO FÍSICO

En la fase inicial de lanzamiento autogestionado:
- Se implementan **dos bases de datos completamente separadas** (`inthaly_id` e `inthaly_community`) ejecutándose sobre un mismo motor PostgreSQL 16.
- **Diferencia Crítica:** No se trata de esquemas dentro de una misma base de datos, sino de **catálogos de bases de datos independientes** (`CREATE DATABASE inthaly_id; CREATE DATABASE inthaly_community;`).
  
#### Ventajas de la Separación Lógica Inicial:
1. **Eficiencia de Recursos:** Un solo servidor VPS (4GB RAM) optimiza el uso de CPU y memoria mediante un pool compartido administrado por PgBouncer.
2. **Cero Contaminación de Datos:** El usuario `inthaly_community_user` no posee permisos de conexión ni lectura sobre `inthaly_id`. Una inyección SQL en Comunidad jamás podrá leer contraseñas ni sesiones de Inthaly ID.
3. **Respaldos Atómicos Separados:** Los dumps `.dump` se generan de forma independiente para cada producto.

#### Camino Hacia el Aislamiento Físico (Escalamiento):
Cuando el volumen de usuarios comunitarios supere las 50,000 conexiones activas:
- La base de datos `inthaly_community` podrá trasladarse a su propio servidor VPS dedicado sin modificar una sola línea de código en la aplicación, simplemente actualizando la variable `INTHALY_COMMUNITY_DATABASE_URL` hacia la nueva IP.

---

### 2. MATRIZ DE USUARIOS Y PRIVILEGIOS DE BASE DE DATOS

| Usuario | Base de Datos Autorizada | Esquema | Permisos Concedidos | Restricciones de Seguridad |
| :--- | :--- | :--- | :--- | :--- |
| `inthaly_admin` | `postgres`, `all` | Todos | Superusuario de mantenimiento. | Solo conexiones locales desde `127.0.0.1` o Docker interno. Prohibido su uso en las cadenas de conexión de Next.js. |
| `inthaly_id_user` | `inthaly_id` | `inthaly_id` | `SELECT`, `INSERT`, `UPDATE`, `DELETE` en tablas de identidad. | Denegado acceso a `inthaly_community`, `postgres` o esquemas del sistema. |
| `inthaly_community_user`| `inthaly_community`| `inthaly_community`| `SELECT`, `INSERT`, `UPDATE`, `DELETE` en tablas sociales. | Denegado acceso a `inthaly_id`. |

---

### 3. MECANISMOS CRIPTOGRÁFICOS DE PROTECCIÓN DE DATOS EN REPOSO

1. **Almacenamiento Ciego de Refresh Tokens:**  
   La columna `refresh_token_hash` guarda exclusivamente el valor `SHA-256(refresh_token)`. Si la base de datos es sustraída en un ataque físico, ningún atacante puede utilizar los hashes para suplantar sesiones.
2. **Derivación Scrypt:**  
   Las contraseñas de identidades se derivan con salt aleatoria de 32 bytes y factor $N=16384$.
3. **Control Atómico de Tickets Delegados:**  
   La tabla `inthaly_id.delegated_tickets` registra el consumo inmediato (`is_consumed = true`) en la misma transacción donde se autoriza la sesión de moderador, impidiendo repeticiones o ataques de replay.
