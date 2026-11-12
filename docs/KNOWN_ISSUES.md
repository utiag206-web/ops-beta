# ⚠️ Limitaciones y Problemas Conocidos — InthalyOps

Este documento registra las consideraciones operativas, limitaciones técnicas actuales y áreas de mantenimiento programado en **InthalyOps**.

---

## 1. Alertas de Dependencias de Terceros (`xlsx`)

- **Estado:** Identificadas 21 advertencias en `npm audit` derivadas principalmente del paquete `xlsx` (SheetJS Community Edition v0.18.5) y utilidades de compilación asociadas.
- **Impacto:** Ninguna representa un vector de ataque directo en el entorno actual de producción, ya que la biblioteca se utiliza de forma controlada exclusivamente en Server Actions para procesar archivos subidos por administradores autenticados.
- **Acción Recomendada:** Programar la migración progresiva hacia `exceljs` o la versión comercial de SheetJS en la siguiente ventana de actualización mayor de dependencias.

---

## 2. Paginación en Colecciones Extensas

- **Módulos Afectados:** `/workers`, `/inventory/products`, `/tareo`.
- **Comportamiento Actual:** Actualmente las Server Actions descargan los registros activos completos aplicando ordenamiento y filtros en cliente.
- **Límite Operativo Recomendado:** Para organizaciones con más de **2,000 trabajadores activos** o catálogos de más de **5,000 SKUs**, se debe incorporar paginación basada en cursor (`keyset pagination`) con `.range(from, to)` en Supabase para evitar transferencias de red pesadas en dispositivos móviles.

---

## 3. Alcance del Funcionamiento Offline

- **Operaciones Offline Soportadas:**  
  Marcas de asistencia, registro de tareo diario, checklists de maquinaria, consumos de combustible, órdenes de trabajo de mecánica y recepción de mineral en balanza.
- **Operaciones que Requieren Conexión Estricta:**  
  Generación de reportes consolidados en `/reports/export-center`, importación masiva de archivos Excel, impersonación de empresas por el Super Admin y cambio de contraseñas. Estos módulos bloquean la interacción offline con una advertencia explicativa.

---

## 4. Diferencias entre Plataformas Móviles (Android WebAPK vs. iOS Safari)

- **Android (Chrome / WebAPK):**  
  Genera una aplicación empaquetada nativa con splash screen del sistema operativo, respetando `background_color: '#06122e'` e ícono centrado. El arranque es 100% nativo.
- **iOS (Apple Safari):**  
  Apple no soporta WebAPK. La instalación mediante *"Agregar a pantalla de inicio"* utiliza `apple-touch-icon.png` y la transición de arranque es gestionada por WebKit con la pantalla de inicio estática de iOS.

---

## 5. Retención de Caché en Memoria (`sessionMemoryCache`)

- La sesión de usuario en el servidor tiene un TTL de **30 segundos**. Si un administrador modifica los permisos o roles de un usuario en la base de datos, el cambio tardará un máximo de 30 segundos en reflejarse en la navegación del usuario activo, salvo que el usuario cierre sesión (`logout`), lo cual purga la memoria de forma instantánea.

