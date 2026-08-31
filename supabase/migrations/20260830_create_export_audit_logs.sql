-- ================================================================
-- MIGRACIÓN: TABLA DE AUDITORÍA Y TRAZABILIDAD DE EXPORTACIONES
-- OBJETIVO: Registro estricto multi-tenant de cada descarga efectuada
-- ================================================================

CREATE TABLE IF NOT EXISTS public.export_audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  user_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
  user_name TEXT,
  report_id TEXT NOT NULL,
  report_title TEXT NOT NULL,
  category TEXT NOT NULL,
  format VARCHAR(10) NOT NULL DEFAULT 'excel',
  filters_applied JSONB DEFAULT '{}'::jsonb,
  records_count INTEGER DEFAULT 0,
  status VARCHAR(20) DEFAULT 'success',
  created_at TIMESTAMPTZ DEFAULT now()
);

-- RLS Estricto
ALTER TABLE public.export_audit_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Multi-company isolation" ON public.export_audit_logs;

CREATE POLICY "Multi-company isolation" ON public.export_audit_logs FOR ALL
USING (company_id = (auth.jwt()->>'company_id')::uuid)
WITH CHECK (company_id = (auth.jwt()->>'company_id')::uuid);

CREATE INDEX IF NOT EXISTS idx_export_audit_company_created ON public.export_audit_logs(company_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_export_audit_report ON public.export_audit_logs(report_id);

NOTIFY pgrst, 'reload schema';
