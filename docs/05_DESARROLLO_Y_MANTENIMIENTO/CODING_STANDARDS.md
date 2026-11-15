# 📐 Estándares de Programación y Guía de Estilo — INTHALY

> **Estado del Documento:** Aprobado y Oficial  
> **Clasificación:** Normas de Calidad de Código y Convenciones de Ingeniería  
> **Última Auditoría:** 15 de Noviembre de 2026

---

## 1. Convenciones Estrictas de TypeScript

1. **Prohibición del Tipo `any`:**  
   No se permite el uso de `any` bajo ninguna circunstancia. Si una estructura de datos es desconocida en tiempo de desarrollo, utilizar `unknown` acompañado de validación con guardas de tipo o esquemas Zod.
2. **Definición Explícita de Interfaces de Retorno:**  
   Toda función exportada debe tener tipificado explícitamente su valor de retorno.
3. **Nombres de Tipos e Interfaces:**  
   Utilizar `PascalCase` para nombres de interfaces, tipos y componentes React (ej. `WorkerProfile`, `TareoRecord`, `AttendanceModal`).
4. **Constantes y Enums:**  
   Utilizar `SCREAMING_SNAKE_CASE` para constantes globales y literales fijos (ej. `MAX_EVIDENCE_SIZE_BYTES`, `DEFAULT_PAGE_SIZE`).

---

## 2. Convenciones para Server Actions (`actions.ts`)

### 2.1. Contrato Estándar de Respuesta
Toda Server Action debe retornar un objeto con el contrato tipado:
```typescript
export interface ActionResponse<T = any> {
  success: boolean
  data?: T
  error?: string
  fieldErrors?: Record<string, string[]>
}
```

### 2.2. Manejo de Redirecciones en Bloques `try/catch`
Next.js utiliza excepciones internas del sistema para gestionar `redirect()`. Al capturar errores, siempre se debe propagar la excepción de redirección:
```typescript
try {
  // Lógica de servidor...
  redirect('/dashboard')
} catch (error: any) {
  // Re-lanzar si es una redirección interna de Next.js
  if (error?.digest?.startsWith('NEXT_REDIRECT')) {
    throw error
  }
  console.error('[ACTION_ERROR]:', error)
  return { success: false, error: error.message || 'Error interno del servidor' }
}
```

---

## 3. Sistema de Movimiento y Tokens CSS Nativos

Para mantener una experiencia visual fluida y profesional sin saturar la CPU de teléfonos de bajo costo con librerías pesadas, se utilizan exclusivamente las clases CSS de [src/app/globals.css](file:///d:/Sistema%20de%20gestión%20de%20trabajadores/src/app/globals.css):

| Clase CSS | Propósito y Comportamiento | Cuándo Utilizarla |
| :--- | :--- | :--- |
| `.nth-page-enter` | Animación suave de entrada de página (`opacity 0 -> 1`, `translateY 4px -> 0`). | Inyectada automáticamente por `template.tsx` en cambios de ruta. |
| `.nth-card-enter` | Cascada rítmica de tarjetas con `animation-delay` escalonado. | En widgets de métricas y tarjetas de resumen del dashboard. |
| `.nth-header-enter` | Entrada nítida de cabeceras y barras de herramientas. | En títulos de módulo y barras de filtros superiores. |
| `.nth-btn-press` | Micro-interacción táctil (`scale(0.985)` en 70ms con curva de rebote). | En botones de acción primaria y marcación de asistencia. |
| `nth-heavy-content` | **Desactiva animaciones y efectos pesados de GPU**. | **Obligatorio** en tablas de datos de más de 50 filas, hojas de cálculo y kardex extensos para mantener 60 FPS estables. |

---

## 4. Ergonomía de Formularios y Sanitización

1. **Conversión Automática a Mayúsculas (`UppercaseEnforcer`):**  
   En la industria minera y de transporte, los nombres de trabajadores, placas de vehículos y descripciones de repuestos deben registrarse en mayúsculas estandarizadas. El componente `UppercaseEnforcer` intercepta automáticamente los campos de texto.
2. **Exención de Mayúsculas (`keep-case`):**  
   Si un campo requiere respetar mayúsculas y minúsculas originales (como correos electrónicos, contraseñas o enlaces web), se debe añadir obligatoriamente la clase CSS:
   ```html
   <input type="email" className="keep-case ... " placeholder="correo@ejemplo.com" />
   ```
3. **Notificaciones al Usuario:**  
   Se utiliza exclusivamente `sonner` para mensajes flotantes:
   ```typescript
   import { toast } from 'sonner'
   toast.success('Trabajador registrado correctamente')
   toast.error('No se pudo conectar con el servidor')
   ```
