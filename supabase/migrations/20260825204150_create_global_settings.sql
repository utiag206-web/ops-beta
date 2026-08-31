-- Create the global_settings table
CREATE TABLE IF NOT EXISTS public.global_settings (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    singleton_key int DEFAULT 1 NOT NULL UNIQUE CHECK (singleton_key = 1),
    
    -- Identidad del Ecosistema
    ecosystem_name text NOT NULL DEFAULT 'INTHALY OPS',
    ecosystem_logo text,
    ecosystem_favicon text,
    ecosystem_commercial_name text,
    ecosystem_description text,
    
    -- Preferencias Regionales
    default_language text NOT NULL DEFAULT 'es',
    default_timezone text NOT NULL DEFAULT 'America/Lima',
    default_currency text NOT NULL DEFAULT 'PEN',
    default_date_format text NOT NULL DEFAULT 'DD/MM/YYYY',
    default_number_format text NOT NULL DEFAULT 'es-PE',
    
    created_at timestamptz DEFAULT now() NOT NULL,
    updated_at timestamptz DEFAULT now() NOT NULL
);

-- Enable RLS
ALTER TABLE public.global_settings ENABLE ROW LEVEL SECURITY;

-- Create policy for SUPER_ADMIN to read and write
CREATE POLICY "Super Admins can manage global settings" 
    ON public.global_settings
    FOR ALL 
    TO authenticated
    USING (
        (SELECT role_id FROM public.users WHERE users.id = auth.uid()) = 'SUPER_ADMIN'
    )
    WITH CHECK (
        (SELECT role_id FROM public.users WHERE users.id = auth.uid()) = 'SUPER_ADMIN'
    );

-- Create a trigger to update 'updated_at'
CREATE OR REPLACE FUNCTION update_global_settings_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_global_settings_timestamp
BEFORE UPDATE ON public.global_settings
FOR EACH ROW
EXECUTE FUNCTION update_global_settings_updated_at();

-- Insert initial default row if not exists
INSERT INTO public.global_settings (singleton_key) VALUES (1) ON CONFLICT DO NOTHING;
