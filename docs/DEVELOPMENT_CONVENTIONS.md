# 📐 Convenciones de Desarrollo y Buenas Prácticas — InthalyOps

Este documento establece las directrices de arquitectura de código, convenciones de nombres, diseño de interfaz y buenas prácticas que deben seguirse al añadir nuevos módulos, componentes o Server Actions a **InthalyOps**.

---

## 1. Estructura Estándar al Crear un Nuevo Módulo

Todo nuevo módulo operativo dentro de `src/app/(main)/` debe seguir la siguiente estructura canónica:

```
src/app/(main)/nuevo-modulo/
├── page.tsx            # Server Component principal: resuelve sesión y datos iniciales
├── actions.ts          # Server Actions protegidas con 'use server'
├── loading.tsx          # (Opcional) Esqueleto Suspense para streaming
└── components/         # Componentes visuales exclusivos del módulo
    ├── modulo-client.tsx
    └── nuevo-registro-modal.tsx
```

---

## 2. Convenciones para Server Actions (`actions.ts`)

1. **Directiva Obligatoria:** Primera línea del archivo debe ser `'use server'`.
2. **Validación de Sesión y Tenant:**
   ```typescript
   'use server'
   
   import { createAdminClient } from '@/lib/supabase/server'
   import { getUserSession, getStrictCompanyId, applyIsolation } from '@/lib/auth'
   import { revalidatePath } from 'next/cache'
   
   export async function saveRecord(payload: RecordInput) {
     const { extendedUser } = await getUserSession()
     if (!extendedUser) throw new Error('No autenticado')
     
     // 1. Obtención inviolable de la empresa activa
     const companyId = await getStrictCompanyId()
     
     // 2. Validación de rol / permiso
     const userRole = extendedUser.role_id?.toLowerCase()
     if (!['admin', 'operaciones', 'super_admin'].includes(userRole)) {
       return { success: false, error: 'Permisos insuficientes' }
     }
     
     // 3. Ejecución segura con Supabase
     const supabase = await createAdminClient()
     const { data, error } = await supabase
       .from('tabla_destino')
       .insert({
         ...payload,
         company_id: companyId,
         created_by: extendedUser.id
       })
       .select()
       .single()
       
     if (error) {
       console.error('[NUEVO_MODULO] Error guardando registro:', error)
       return { success: false, error: error.message }
     }
     
     revalidatePath('/nuevo-modulo')
     return { success: true, data }
   }
   ```
3. **Manejo de Errores con Redirección:** Si capturas excepciones en bloques `try/catch`, verifica siempre:
   ```typescript
   if (error.digest?.startsWith('NEXT_REDIRECT')) throw error
   ```
   (Next.js utiliza excepciones internas para gestionar redirecciones en Server Components).

---

## 3. Convenciones de UI y Sistema de Movimiento

1. **Tokens de Animación de InthalyOps:**
   - No instales librerías de animación externas. Utiliza las clases estándar de [src/app/globals.css](file:///d:/Sistema%20de%20gestión%20de%20trabajadores/src/app/globals.css).
   - `.nth-page-enter`: Aplicado automáticamente por `template.tsx`.
   - `.nth-card-enter`: Úsalo en tarjetas de estadísticas y widgets de resumen.
   - `.nth-header-enter`: Para títulos y barras de herramientas superiores.
   - `nth-heavy-content`: Para tablas de datos, hojas de cálculo o listados de más de 50 filas (desactiva animaciones para mantener 60fps).
2. **Botones y Controles Táctiles:**
   - Aplica `button:active:not(:disabled)` de forma automática o la clase `.nth-btn-press` para respuesta háptica inmediata en pantallas táctiles (`scale(0.985)` en 70ms).
3. **Notificaciones y Toasts:**
   - Usa `sonner` exclusivamente:
     ```typescript
     import { toast } from 'sonner'
     toast.success('Operación guardada con éxito')
     toast.error('Error al procesar la solicitud')
     ```
4. **Ergonomía de Formularios y Mayúsculas:**
   - El componente `UppercaseEnforcer` transforma automáticamente el texto de campos `input` y `textarea` a mayúsculas comerciales (estándar en minería y logística).
   - Si un campo requiere respetar mayúsculas/minúsculas estrictas (como contraseñas, URLs o correos electrónicos), añade la clase CSS `keep-case`.

---

## 4. Tipado Estricto de TypeScript

- Prohibido el uso indiscriminado de `any` en interfaces públicas y Server Actions.
- Define interfaces explícitas para las filas de base de datos en archivos de tipos o al inicio del módulo.
- Ejecuta `npx tsc --noEmit` de forma continua durante el desarrollo.

