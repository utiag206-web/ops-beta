# 🏛️ Integración con Facturación y Guías Electrónicas (SUNAT Perú) — INTHALY

> **Estado del Documento:** Aprobado y Oficial  
> **Clasificación:** Integración Tributaria y Fiscal (UBL 2.1 / GRE)  
> **Última Auditoría de Artefactos:** 15 de Noviembre de 2026 (Auditoría de colección Postman Kodevo y Demo HTML)

---

## 1. Alcance de la Integración Tributaria

En el sector minero y de transporte en el Perú, el traslado de mineral y la compra de suministros están estrictamente regulados por la **SUNAT (Superintendencia Nacional de Aduanas y de Administración Tributaria)**. La movilización de mineral sin Guía de Remisión Electrónica (GRE) válida conlleva la incautación inmediata del cargamento y del vehículo por la Policía Nacional.

Esta integración dota a INTHALY de dos capacidades fundamentales:
1. **Emisión y Validación de Comprobantes de Pago Electrónicos (CPE):** Facturas (`01`), Boletas (`03`) y Notas de Crédito (`07`) para sustento de Caja Chica y cobro de suscripciones.
2. **Emisión de Guías de Remisión Electrónica (GRE):** GRE Remitente (`09`) y GRE Transportista (`31`) para despacho de mineral desde mina hacia puerto/planta y transporte de maquinaria pesada.

```mermaid
flowchart TD
    subgraph InthalyOps["InthalyOps / Inthaly Transport"]
        DispatchModule["Despacho de Volquete con Mineral (/operaciones)"]
        PettyCash["Rendición de Gastos de Caja Chica (/caja-chica)"]
    end

    subgraph SUNATAdapter["Adaptador de Integración Tributaria (API UBL 2.1)"]
        PayloadBuilder["Constructor de Payload JSON Estándar"]
        SignerService["Servicio de Firma Digital (Certificado .PFX)"]
        XMLGenerator["Generador de XML UBL 2.1 y Código QR"]
        CDRValidator["Validador de Constancia de Recepción (CDR)"]
    end

    subgraph SUNATCloud["Servidores de SUNAT / OSE"]
        SUNAT_GRE_API["API Oficial de Guías de Remisión (SUNAT)"]
        SUNAT_CPE_API["Servidor de Recepción de Facturas"]
    end

    DispatchModule --> PayloadBuilder
    PettyCash --> PayloadBuilder
    PayloadBuilder --> SignerService --> XMLGenerator
    XMLGenerator -->|"Envío HTTPS Asíncrono"| SUNAT_GRE_API & SUNAT_CPE_API
    SUNAT_GRE_API & SUNAT_CPE_API -->>|"Retorna CDR (Aceptado código 0) + QR"| CDRValidator
    CDRValidator --> DispatchModule
```

---

## 2. Auditoría Técnica de Artefactos Disponibles

En el entorno de desarrollo se han auditado los siguientes componentes de integración de referencia:
- **Colección Postman Oficial:** `D:\3. API FACTURACION SUNAT PERU EMPRESAS Y DESARROLLADORES - KODEVO.postman_collection.json`
- **Demostrador HTML/JS:** `D:\DEMO-SUNAT-HTML-main.zip`
- **Host de Pruebas y Producción:** `sunat.kodevo.es/api/v1`

### Endpoints Clave Auditados en la Colección:
1. **Onboarding de Empresa Contratista (`POST /api/v1/companies`):**  
   Permite cargar el RUC de la empresa, Razón Social, Usuario SOL, Clave SOL y el archivo del Certificado Digital en formato PKCS#12 (`.pfx`) con su respectiva contraseña.
2. **Emisión de Factura / Boleta (`POST /api/v1/invoices`):**  
   Envío del payload JSON estructurado con datos del cliente, ítems gravados con IGV (18%), detracciones de ley y montos en letras.
3. **Emisión de Guía de Remisión Remitente (`POST /api/v1/despatches`):**  
   Envío de datos del traslado: motivo de traslado (`01` Venta, `04` Traslado entre establecimientos, `14` Venta sujeta a confirmación del comprador), modalidad de transporte (Público/Privado), peso bruto total (KGM), datos del chofer (DNI, Licencia) y placa del vehículo.
4. **Consulta de Estado y Descarga de Archivos (`GET /api/v1/documents/{id}`):**  
   Descarga del XML firmado, la representación impresa en PDF y el archivo comprimido CDR (`R-*.zip`).

---

## 3. Formato Canónico del Payload para Guía de Remisión (Mineral)

```json
{
  "tipo_documento": "09",
  "serie": "T001",
  "numero": 1042,
  "fecha_emision": "2026-11-15",
  "hora_emision": "14:30:00",
  "motivo_traslado": "01",
  "modalidad_transporte": "02",
  "peso_bruto_total": 32500.00,
  "unidad_peso": "KGM",
  "numero_bultos": 1,
  "datos_envio": {
    "punto_partida": {
      "ubigeo": "040101",
      "direccion": "Campamento Minero Cerro Rico, Sector B"
    },
    "punto_llegada": {
      "ubigeo": "040112",
      "direccion": "Planta de Beneficio El Cóndor, Km 48"
    }
  },
  "datos_transportista": {
    "tipo_documento": "6",
    "numero_documento": "20608912341",
    "razon_social": "TRANSPORTES PESADOS DEL SUR S.A.C."
  },
  "vehiculo_principal": {
    "placa": "V8C-941"
  },
  "conductor_principal": {
    "tipo_documento": "1",
    "numero_documento": "45892147",
    "licencia": "Q45892147"
  },
  "items": [
    {
      "codigo": "MIN-ORO-01",
      "descripcion": "MINERAL AURIFERO POLIMETALICO EN BRUTO",
      "cantidad": 32.50,
      "unidad_medida": "TNE"
    }
  ]
}
```

---

## 4. Estado de Implementación en el Repositorio

- **Especificación y Contratos de Datos:** `[IMPLEMENTADO]` (Documentado y auditado).
- **Adaptador de Conexión en InthalyOps:** `[PENDIENTE]` (Planificado para activarse en la Fase 3 con Inthaly Transport).
- **Almacenamiento de Certificados Digitales:** Se custodiarán en variables de entorno cifradas por empresa, nunca accesibles en texto plano.
