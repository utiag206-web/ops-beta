# 🔐 INTHALY OPS — INFORME DE VERIFICACIÓN FORENSE
## EXPOSICIÓN HISTÓRICA DE SERVICE ROLE KEY EN GIT Y REMOTOS

**Fecha de Auditoría:** 05 de octubre de 2026  
**Tipo de Evaluación:** Forense, Diagnóstico y Trazabilidad Git (Estrictamente de solo lectura)  
**Entorno Evaluado:** Local (`D:\Sistema de gestión de trabajadores`) y Remoto GitHub (`utiag206-web/ops-beta`)  
**Estado de Producción:** Congelada / Pre-Release Candidate  

---

## 📌 RESUMEN EJECUTIVO

| Parámetro | Resultado Forense |
| :--- | :--- |
| **Clasificación de Exposición** | **🟢 NO HAY EVIDENCIA DE EXPOSICIÓN REMOTA** |
| **¿Apareció en Git histórico local?** | **SÍ** (En commit `bf8e582`) |
| **¿Llegó al repositorio remoto (GitHub)?** | **NO** (0 objetos / 0 commits remotos) |
| **¿Se recomienda rotarla antes del deploy?** | **NO obligatoria por filtración remota** (Recomendada como higiene preventiva antes de hacer push del árbol histórico local) |
| **Commit local involucrado** | `bf8e582` (`bf8e582f466cefe7fb6db8c5c84553ac4122a1a1`) |
| **Archivos locales involucrados** | `audit.mjs`, `seed_ops.mjs` |
| **Remoto verificado** | `https://github.com/utiag206-web/ops-beta.git` |

---

## A. ESTADO ACTUAL DEL CÓDIGO Y CREDENCIALES

### 1. Identificación de la Credencial
* **Tipo de Clave:** Supabase Service Role Key (JWT secreto con bypass de Row Level Security).
* **Patrón / Fingerprint Seguro:** `sb_secret_...yvoL-r` (Longitud total: 41 caracteres).
* **Variable utilizada originalmente:** En `audit.mjs` y `seed_ops.mjs` se asignaba directamente como literal de cadena a `const supabaseKey`. En `audit.mjs` figuraba el comentario explícito: `// Using service role key for audit`.
* **Coincidencia con `.env.local`:** Coincide exactamente con la clave configurada localmente en la variable `SUPABASE_SERVICE_ROLE_KEY`.

### 2. Presencia Actual en el Código Fuente
* **Archivos operativos (`src/`, `components/`, `lib/`):** **LIMPIO**. Ningún archivo funcional o del frontend tiene la Service Role Key hardcodeada. Todas las referencias operativas en servidor consumen de forma segura `process.env.SUPABASE_SERVICE_ROLE_KEY`.
* **Estado de `audit.mjs` y `seed_ops.mjs`:** Eliminados físicamente del disco de trabajo. En Git aparecen como pendientes de confirmación de eliminación (`deleted: audit.mjs`, `deleted: seed_ops.mjs`).
* **Archivos residuales locales:** La clave solo persiste localmente en `.env.local` y en scripts internos de diagnóstico manual ubicados en `scratch/` y `tmp/`.

### 3. Estado de Exclusión en `.gitignore`
* `.gitignore` cuenta con reglas activas y funcionales:
  * `/audit.mjs` (Línea 53)
  * `/seed_ops.mjs` (Línea 54)
  * `/deploy_prod.zip` (Línea 55)
  * `.env*` (Línea 33)
  * `/scratch/` (Línea 44)
  * `/tmp/` (Línea 45)
  * `/next-prod-boilerplate/` (Línea 48)
* **Verificación:** Ejecución de `git check-ignore -v --no-index` confirma que cualquier intento futuro de crear estos archivos queda automáticamente bloqueado de ser rastreado por Git.

---

## B. HISTORIAL LOCAL DE GIT

### 1. Versionamiento Histórico Local
Se realizó un análisis completo del árbol de commits local con `git log --all --full-history`:

* **Commit Identificado:** `bf8e582f466cefe7fb6db8c5c84553ac4122a1a1` (hash corto: `bf8e582`)
* **Autor:** Antigravity AI `<antigravity@gemini.google.com>`
* **Fecha:** Viernes 29 de mayo de 2026, 21:33:26 -0500
* **Mensaje:** `release: freeze Baseline v1.0 stable core release`
* **Archivos incorporados en dicho commit:**
  * `audit.mjs` (+52 líneas)
  * `seed_ops.mjs` (+182 líneas)
* **Contenido comprometido:** Ambos archivos contenían la clave real `sb_secret_...yvoL-r` en texto plano en la línea 4.

### 2. Ramas y Tags Locales que contienen el Commit `bf8e582`
* **Ramas locales:**
  * `fase-3-mejoras`
  * `master`
* **Tags locales:**
  * `v1.0-stable`
  * `v1.0.0`

---

## C. EXPOSICIÓN EN REPOSITORIO REMOTO

### 1. Clasificación Forense:
### 🟢 NO HAY EVIDENCIA DE EXPOSICIÓN REMOTA

### 2. Investigación de Remotos
1. **Configuración local actual:**
   * `git remote -v`: Sin remotos configurados (salida vacía).
   * `.git/config`: No posee sección `[remote]`.
   * `.git/refs/remotes/`: No existe el directorio de ramas remotas.
   * `.git/logs/`: Ningún registro de operaciones `push`, `pull`, `fetch` ni URLs remotas.

2. **Trazabilidad de Historial de PowerShell / Remotos Históricos:**
   * La inspección del historial de consola reveló un repositorio remoto asociado previamente: `https://github.com/utiag206-web/ops-beta.git`.
   * Se realizó una auditoría de solo lectura completa sobre los 90 commits y los 2,308 objetos de `utiag206-web/ops-beta.git`.

3. **Hallazgos en el Repositorio Remoto (`utiag206-web/ops-beta`):**
   * **¿Existe `audit.mjs` en el remoto?** **NO**. El comando `git log --all --full-history -- audit.mjs` arrojó 0 resultados.
   * **¿Existe `seed_ops.mjs` en el remoto?** **NO**. 0 resultados.
   * **¿Existe el commit `bf8e582` en el remoto?** **NO**. El objeto no existe en GitHub.
   * **¿Existe la clave `sb_secret_...yvoL-r` en algún blob o commit remoto?** **NO**. Búsqueda de entropía y patrones regex `sb_secret_` arrojó 0 coincidencias en toda la base de objetos remota.
   * **Explicación técnica del desacople:** El 29 de mayo de 2026, mientras que localmente se generó el commit `bf8e582` a las 21:33:26, al repositorio remoto se subió de forma separada el commit `b99dc1c` a las 22:25:32 por el usuario `utiag206-web`. Dicho commit remoto excluyó expresamente tanto `audit.mjs` como `seed_ops.mjs`.

---

## D. MATRIZ DE EVIDENCIA FORENSE

| Elemento | Evidencia Local | Evidencia Remota (`ops-beta`) |
| :--- | :--- | :--- |
| **Presencia de `audit.mjs`** | Presente en commit `bf8e582` (local) | Inexistente en todo el historial |
| **Presencia de `seed_ops.mjs`** | Presente en commit `bf8e582` (local) | Inexistente en todo el historial |
| **Presencia de Service Role Key** | Presente en commit `bf8e582` (local) | Inexistente en todos los blobs/commits |
| **Remoto configurado localmente** | Ninguno (`origin` no existe) | N/A |
| **Peligro de filtración pública previa** | **NULO**. No fue expuesto en la web ni en GitHub | N/A |

---

## E. CONCLUSIÓN Y RECOMENDACIONES PRE-DEPLOY

### 1. Conclusión
No existe ninguna fuga de datos ni exposición pública activa de la `Service Role Key` en repositorios remotos (GitHub / GitLab). La clave únicamente formó parte del árbol de commits del repositorio Git local en la máquina del desarrollador.

### 2. Recomendaciones de Seguridad

1. **Sobre la Rotación Inmediata de la Clave:**
   * **No es mandatoria por incidente de seguridad:** No habiendo salido de la máquina local, la credencial no ha sido comprometida externamente.
   * **Medida Preventiva Recomendada para el Futuro:** Si en algún momento se decide sincronizar (`git push`) el historial completo de la rama actual `fase-3-mejoras` o `master` a un repositorio remoto público o de terceros, el commit histórico `bf8e582` viajaría con ellos. Por tal motivo, se recomienda **rotar la Service Role Key en el panel de Supabase como medida de buena práctica preventiva antes de publicar el repositorio a un remoto compartido**, o bien purgar el commit histórico local si se requiere mantener la clave intacta.
2. **Para el Despliegue Actual (Vercel / Producción):**
   * El despliegue de producción únicamente requiere que las variables de entorno se configuren de forma segura en las variables de entorno del servidor (Vercel Settings) y nunca en el código empaquetado del cliente.
