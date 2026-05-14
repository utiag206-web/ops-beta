-- Fase 1 SOMA: Infraestructura para Capacitaciones y Charlas

-- 1. Tablas de Capacitaciones
CREATE TABLE IF NOT EXISTS soma_trainings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID REFERENCES companies(id),
    title TEXT NOT NULL,
    description TEXT,
    trainer TEXT,
    date DATE NOT NULL,
    expiry_date DATE,
    certificate_url TEXT,
    created_at TIMESTAMPTZ DEFAULT now(),
    created_by UUID REFERENCES users(id)
);

CREATE TABLE IF NOT EXISTS soma_training_participants (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    training_id UUID REFERENCES soma_trainings(id) ON DELETE CASCADE,
    worker_id UUID REFERENCES workers(id),
    status TEXT DEFAULT 'completado', -- completado, pendiente, reprobado
    grade TEXT,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 2. Tablas de Charlas de 5 Minutos
CREATE TABLE IF NOT EXISTS soma_talks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID REFERENCES companies(id),
    topic TEXT NOT NULL,
    leader_id UUID REFERENCES users(id),
    date DATE DEFAULT CURRENT_DATE,
    location TEXT,
    photo_url TEXT,
    created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS soma_talk_participants (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    talk_id UUID REFERENCES soma_talks(id) ON DELETE CASCADE,
    worker_id UUID REFERENCES workers(id)
);

-- 3. Crear el bucket de almacenamiento para SOMA
INSERT INTO storage.buckets (id, name, public)
VALUES ('soma', 'soma', true)
ON CONFLICT (id) DO NOTHING;

-- 4. RLS para SOMA
ALTER TABLE soma_trainings ENABLE ROW LEVEL SECURITY;
ALTER TABLE soma_training_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE soma_talks ENABLE ROW LEVEL SECURITY;
ALTER TABLE soma_talk_participants ENABLE ROW LEVEL SECURITY;

-- Políticas simplificadas por compañía
CREATE POLICY "SOMA access by company" ON soma_trainings FOR ALL
USING (company_id IN (SELECT company_id FROM users WHERE id = auth.uid()));

CREATE POLICY "SOMA participants access by company" ON soma_training_participants FOR ALL
USING (training_id IN (SELECT id FROM soma_trainings));

CREATE POLICY "SOMA talks access by company" ON soma_talks FOR ALL
USING (company_id IN (SELECT company_id FROM users WHERE id = auth.uid()));

CREATE POLICY "SOMA talk participants access by company" ON soma_talk_participants FOR ALL
USING (talk_id IN (SELECT id FROM soma_talks));

-- Políticas de Storage para SOMA (Corregido: Usar sintaxis estándar de políticas)
DO $$ 
BEGIN
    DROP POLICY IF EXISTS "Lectura pública SOMA" ON storage.objects;
    DROP POLICY IF EXISTS "Subida autenticada SOMA" ON storage.objects;
END $$;

CREATE POLICY "Lectura pública SOMA"
ON storage.objects FOR SELECT
USING (bucket_id = 'soma');

CREATE POLICY "Subida autenticada SOMA"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'soma');
