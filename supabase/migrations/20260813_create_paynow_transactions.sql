-- Migration: Create paynow_transactions (idempotent)
CREATE TABLE IF NOT EXISTS public.paynow_transactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  student_fee_id UUID REFERENCES public.student_fees(id) ON DELETE CASCADE,
  amount NUMERIC(10,2) NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending', -- 'pending', 'success', 'failed', 'cancelled'
  paynow_reference TEXT,
  reference_number TEXT NOT NULL UNIQUE,
  payment_method TEXT,
  authemail TEXT,
  poll_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE IF EXISTS public.paynow_transactions ENABLE ROW LEVEL SECURITY;

-- Policies: Admin full access, authenticated users can select (parents will be restricted by student_fees policies)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policy WHERE polname = 'paynow_transactions_admin') THEN
    CREATE POLICY paynow_transactions_admin ON public.paynow_transactions FOR ALL USING (public.get_user_role() = 'admin');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policy WHERE polname = 'paynow_transactions_select') THEN
    CREATE POLICY paynow_transactions_select ON public.paynow_transactions FOR SELECT TO authenticated USING (true);
  END IF;
END$$;
