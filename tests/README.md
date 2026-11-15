# Infraestructura de Pruebas Automatizadas — INTHALY

Este directorio alberga la suite de pruebas automatizadas del ecosistema Inthaly, orientada a garantizar la integridad de las reglas de negocio, aislamiento multiempresa y la consistencia de tipos y contratos.

---

## 1. Estructura de Directorios

```
tests/
├── unit/                       # Pruebas unitarias de funciones puras y motores de cálculo
│   ├── isolation-security.test.js # Validación estricta de aislamiento multiempresa
│   └── tareo-engine.test.js       # Validación de redondeos y conversión horaria de asistencia
├── integration/                # Pruebas de integración y verificación arquitectónica
│   └── services-structure.test.js # Verificación de contratos y existencia de capas canónicas
├── mocks/                      # Mocks reusables (Supabase, Fetch, Cookies)
│   └── supabase.mock.js           # Query builder fluido mockeado para pruebas
└── README.md                   # Esta guía
```

---

## 2. Ejecución de Pruebas

Las pruebas utilizan el ejecutor nativo de Node.js (`node:test` y `node:assert`), eliminando dependencias externas pesadas y permitiendo ejecución instantánea en cualquier entorno:

```bash
# Ejecutar toda la suite de pruebas
npm test

# O ejecutar directamente con Node.js
node --test tests/**/*.test.js

# Ejecutar una prueba específica
node --test tests/unit/isolation-security.test.js
```

---

## 3. Convenciones para Nuevas Pruebas

1. **Ubicación**:
   - Funciones puras, utilitarios o algoritmos: colocar en `tests/unit/`.
   - Flujos entre servicios o verificación estructural: colocar en `tests/integration/`.
2. **Nomenclatura**: Nombrar los archivos siempre con sufijo `.test.js` o `.test.ts`.
3. **Aislamiento**: Ninguna prueba debe realizar mutaciones en bases de datos reales. Utilizar siempre los mocks provistos en `tests/mocks/`.
