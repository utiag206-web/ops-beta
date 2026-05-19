-- Fase 2 SOMA: Incidentes Avanzados y STOP/HSEC

-- 1. Evolución de la tabla de Incidencias
ALTER TABLE incidencias RENAME COLUMN equipment_name TO area_location;

ALTER TABLE incidencias 
ADD COLUMN IF NOT EXISTS event_date DATE DEFAULT CURRENT_DATE,
ADD COLUMN IF NOT EXISTS corrective_actions TEXT,
ADD COLUMN IF NOT EXISTS incident_category TEXT, -- personal, ambiental, material
ADD COLUMN IF NOT EXISTS photo_urls JSONB DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS closed_at TIMESTAMPTZ;

-- 2. Nueva tabla para STOP / HSEC (Observaciones Preventivas)
CREATE TABLE IF NOT EXISTS soma_hsec_stop (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID REFERENCES companies(id),
    observer_id UUID REFERENCES users(id),
    type TEXT NOT NULL, -- acto_inseguro, condicion_insegura
    category TEXT, -- EPP, Herramientas, Orden y Limpieza, Posición de personas, etc.
    area_location TEXT,
    description TEXT NOT NULL,
    photo_url TEXT,
    status TEXT DEFAULT 'abierta', -- abierta, cerrada
    closed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 3. Tabla de Notificaciones/Alertas Inmediatas
CREATE TABLE IF NOT EXISTS soma_alerts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID REFERENCES companies(id),
    type TEXT, -- stop_condicion, incidente_critico
    message TEXT,
    is_read BOOLEAN DEFAULT false,
    reference_id UUID, -- ID del reporte relacionado
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 4. RLS para nuevas tablas
ALTER TABLE soma_hsec_stop ENABLE ROW LEVEL SECURITY;
ALTER TABLE soma_alerts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "STOP access by company" ON soma_hsec_stop FOR ALL
USING (company_id IN (SELECT company_id FROM users WHERE id = auth.uid()));

CREATE POLICY "Alerts access by company" ON soma_alerts FOR ALL
USING (company_id IN (SELECT company_id FROM users WHERE id = auth.uid()));

-- Trigger para alertas automáticas en Condición Insegura
CREATE OR REPLACE FUNCTION fn_trigger_soma_alert()
RETURNS TRIGGER AS $$
BEGIN
    IF (NEW.type = 'condicion_insegura') THEN
        INSERT INTO soma_alerts (company_id, type, message, reference_id)
        VALUES (NEW.company_id, 'stop_condicion', 'Nueva Condición Insegura reportada en: ' || NEW.area_location, NEW.id);
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS tr_soma_stop_alert ON soma_hsec_stop;
CREATE TRIGGER tr_soma_stop_alert
AFTER INSERT ON soma_hsec_stop
FOR EACH ROW EXECUTE FUNCTION fn_trigger_soma_alert();
