# PERMISOS Y GOBERNANZA DEL SUPER ADMINISTRADOR GLOBAL
## Matriz RBAC, Salvaguardas Administrativas y Acceso Delegado Multi-Producto

---

### 1. MODELO DE ROLES DEL ECOSISTEMA

El ecosistema Inthaly implementa un modelo jerárquico y federado de roles:

```text
┌──────────────────────────────────────────────────────────┐
│              GLOBAL SUPER ADMINISTRATOR                  │
│       (Control del Ecosistema en /super-admin)          │
└────────────┬──────────────┬──────────────┬───────────────┘
             │              │              │
    ┌────────▼──────┐ ┌─────▼──────┐ ┌─────▼───────┐
    │  INTHALY ID   │ │ COMUNIDAD  │ │ INTHALY OPS │ (Inthaly Academy)
    │ Identity Admin│ │ Moderador  │ │Tenant Admin │ Satélite Admin
    └───────────────┘ └────────────┘ └─────────────┘
```

---

### 2. MATRIZ DE AUTORIZACIONES (RBAC MATRIX)

| Facultad / Acción | Global Super Admin | InthalyOps Tenant Admin | Moderador Comunidad | Administrador Academia |
| :--- | :---: | :---: | :---: | :---: |
| **Acceso a Consola Global (`/super-admin`)** | **SÍ** | NO | NO | NO |
| **Bloquear Identidad Inthaly ID** | **SÍ** | NO | NO | NO |
| **Revocar Sesiones Remotas Globales** | **SÍ** | NO | NO | NO |
| **Registrar Clientes OIDC del Ecosistema** | **SÍ** | NO | NO | NO |
| **Generar Tickets de Acceso Delegado** | **SÍ** | NO | NO | NO |
| **Moderar / Ocultar Publicaciones de Red** | **SÍ** (Delegado) | NO | **SÍ** (En su foro) | NO |
| **Administrar Trabajadores de su Empresa** | Solo lectura | **SÍ** (Aislado RLS) | NO | NO |
| **Configurar Turnos y Tareo de Empresa** | NO | **SÍ** (Su empresa) | NO | NO |
| **Emitir Certificaciones en Academia** | NO | NO | NO | **SÍ** |

---

### 3. ACCESO ADMINISTRATIVO DELEGADO (AUDITABLE ONE-TIME TICKETS)

El Global Super Admin no necesita conocer las credenciales de ningún usuario ni almacenar contraseñas maestras. Cuando necesita intervenir en un producto secundario (ej. moderar un foro de discusión en Comunidad o auditar un curso en Academia), se ejecuta el protocolo de delegación temporal:

1. **Generación Criptográfica:**
   El Super Admin solicita un ticket de delegación:
   ```typescript
   generateDelegatedTicketAction(target_product: 'community' | 'academy')
   ```
2. **Estructura del Ticket:**
   - Token JWT con algoritmo HMAC-SHA256.
   - Reclamaciones:
     - `iss`: `inthaly-id`
     - `sub`: ID del Super Admin
     - `aud`: `target_product`
     - `role`: `delegated_admin`
     - `exp`: Tiempo estricto de 120 segundos.
     - `jti`: Identificador de un solo uso registrado en `inthaly_id.delegated_tickets`.
3. **Auditoría Inmutable:**
   Cada emisión de ticket delegado genera un registro en `inthaly_id.security_logs` con la dirección IP del Super Admin, hora exacta y motivo de la intervención.
4. **Consumo y Vencimiento:**
   Una vez que el usuario ingresa al producto destino con el parámetro `?admin_ticket=...`, el token es validado y marcado como consumido en la base de datos para prevenir reutilizaciones.

---

### 4. REGLAS DE AISLAMIENTO MULTIEMPRESA EN INTHALY OPS

- **Autonomía Operativa:** Los administradores de empresa (`tenant_admin`) en InthalyOps solo pueden ver y operar datos pertenecientes a su propio `company_id`.
- **Inmunidad Comunitaria:** El hecho de que un trabajador pertenezca a la empresa del Tenant Admin no le otorga a este último acceso a las publicaciones privadas, chats comunitarios ni foros cerrados de dicho trabajador.
- **Acceso Super Admin:** El Super Admin puede visualizar la lista general de empresas para soporte técnico y facturación, pero el aislamiento Row-Level Security (RLS) protege la información sensible de tareos y nóminas de cada contratista minero.
