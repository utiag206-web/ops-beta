-- Create worker_payments table
CREATE TABLE IF NOT EXISTS public.worker_payments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
    worker_id UUID NOT NULL REFERENCES public.workers(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    period TEXT NOT NULL, -- 'mensual' | 'quincenal'
    payment_type TEXT NOT NULL, -- 'salary' | 'advance' | 'liquidation' | 'extra'
    amount NUMERIC(10,2) NOT NULL,
    payment_method TEXT NOT NULL, -- 'efectivo' | 'transferencia' | 'yape' etc.
    observations TEXT,
    document_url TEXT, -- URL to storage attachment
    status TEXT NOT NULL DEFAULT 'paid', -- 'paid' | 'pending'
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.worker_payments ENABLE ROW LEVEL SECURITY;

-- Create policy for multi-tenant isolation
DROP POLICY IF EXISTS "Enable all access for company users" ON public.worker_payments;
CREATE POLICY "Enable all access for company users" 
ON public.worker_payments FOR ALL 
USING (company_id = (auth.jwt()->>'company_id')::uuid)
WITH CHECK (company_id = (auth.jwt()->>'company_id')::uuid);
