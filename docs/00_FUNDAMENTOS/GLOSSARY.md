# 📖 Glosario Terminológico Oficial — INTHALY

> **Estado del Documento:** `VIGENTE / ESTÁNDAR`  
> **Alcance:** Términos de Negocio, Operaciones Mineras e Industriales, y Arquitectura de Software.

---

## 1. Términos de Negocio y Ecosistema

* **Ecosistema Inthaly:** Conjunto integrado de soluciones digitales (Ops, Comunidad, Transporte, Empleos, Academia, Marketplace) orientadas a la industria productiva.
* **InthalyOps:** Módulo de software especializado en la gestión de cuadrillas, producción en campo, maquinaria, inventario y seguridad industrial.
* **Identidad Universal:** Concepto arquitectónico en el cual una persona física posee una única cuenta de acceso inmutable en Inthaly, independiente de las empresas empleadoras con las que colabore.
* **Empresa Inquilina (Tenant):** Persona jurídica o consorcio minero/agrícola que contrata InthalyOps para administrar sus operaciones. Posee un identificador único obligatorio (`company_id`).
* **Super Admin:** Usuario corporativo global con privilegios para aprovisionar empresas, auditar la plataforma, configurar parámetros del ecosistema e impersonar cuentas de soporte.
* **Impersonación (Impersonate):** Capacidad autorizada y auditada por la cual un Super Admin asume temporalmente la vista de una empresa cliente para resolver incidencias sin conocer su contraseña.

---

## 2. Términos Operativos e Industriales (Minería y Campo)

* **Tareo:** Proceso diario de registro, validación y cómputo de las labores, turnos y jornadas ejecutadas por cada trabajador en campo (horas normales, sobretiempos, faltas, descansos médicos, domingos laborados).
* **Bocamina:** Punto de entrada físico a una labor subterránea donde se realizan marcaciones de personal y control de extracción.
* **Planta de Beneficio:** Instalación industrial donde se recibe el mineral bruto de mina para someterlo a chancado, molienda, flotación o lixiviación a fin de concentrar los metales valiosos.
* **Lote de Mineral:** Cargamento identificado de mineral transportado desde la mina hasta la planta de beneficio, con pesaje bruto/tara y análisis de ley.
* **Ley de Cabeza:** Concentración estimada o ensayada de metal valioso (ej. gramos de oro por tonelada métrica `g/t Au` o porcentaje de cobre `% Cu`) presente en el mineral bruto al ingresar a la planta.
* **Checklist Pre-Uso:** Formulario obligatorio de inspección diaria de seguridad y operatividad que un operario debe completar antes de encender una maquinaria pesada (compresora, dumper, scooptram, volquete, generador).
* **Horómetro:** Dispositivo contador que registra las horas de funcionamiento efectivo de un motor o equipo mecánico para determinar los ciclos de mantenimiento preventivo (ej. cambio de aceite cada 250h).
* **SOMA / HSEC:** Área encargada de Seguridad, Salud Ocupacional, Medio Ambiente y Relaciones Comunitarias (Safety, Occupational Health, Environment, Community).
* **Charla de 5 Minutos:** Inducción diaria breve de seguridad realizada en campo antes de iniciar el turno laboral.

---

## 3. Términos Técnicos y de Arquitectura de Software

* **Offline-First:** Filosofía de diseño de software donde la aplicación está concebida para funcionar plenamente en ausencia total de conexión a internet, almacenando los datos en la base de datos local del navegador (IndexedDB) y sincronizándolos de forma transparente al detectar red.
* **PWA (Progressive Web App):** Aplicación web que utiliza Service Workers y Web App Manifest para comportarse de forma idéntica a una aplicación nativa instalable, con soporte offline, icono en pantalla de inicio y aceleración de hardware.
* **Service Worker (`sw.js`):** Script que se ejecuta en segundo plano en el navegador del cliente, actuando como un proxy de red programable para interceptar solicitudes, gestionar cachés (`CacheStorage API`) y asegurar resiliencia en desconexión.
* **RSC (React Server Components):** Paradigma de renderizado en servidor de React 19 / Next.js 15 donde los componentes se procesan en Node.js y se transmiten al cliente como un stream de datos sin inflar el bundle de JavaScript.
* **RLS (Row Level Security):** Mecanismo de seguridad a nivel de motor de PostgreSQL que restringe qué filas de una tabla pueden ser leídas o modificadas por un usuario específico según sus políticas de seguridad (`company_id = auth.company_id()`).
* **BOLA / IDOR:** Vulnerabilidades de control de acceso a nivel de objeto (Broken Object Level Authorization / Insecure Direct Object References). Inthaly las mitiga mediante el helper `applyIsolation` en Server Actions y políticas RLS obligatorias.
* **Sync Queue (`sync_queue`):** Tabla transaccional en IndexedDB del navegador donde se encolan las operaciones realizadas sin internet (creación de tareo, checklist pre-uso, pesaje de mineral) con UUID generado en cliente para su despacho atómico en reconexión.
* **Deep Precache:** Técnica implementada en el Service Worker de Inthaly para analizar documentos HTML y precargar proactivamente todos los paquetes JavaScript y estilos CSS asociados, erradicando los errores de carga dinámica (`ChunkLoadError`).
