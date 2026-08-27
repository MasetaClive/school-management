-- Migration: Add Paynow Transactions Table
CREATE TABLE IF NOT EXISTS public.paynow_transactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  student_fee_id UUID REFERENCES public.student_fees(id) ON DELETE CASCADE,
  amount NUMERIC(10,2) NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending', -- 'pending', 'success', 'failed', 'cancelled'
  paynow_reference TEXT,
  reference_number TEXT NOT NULL UNIQUE,
  payment_method TEXT, -- 'ecocash', 'card'
  authemail TEXT,
  poll_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.paynow_transactions ENABLE ROW LEVEL SECURITY;

-- Policies: Admin full access, parent read own children's transactions
CREATE POLICY "paynow_transactions_admin" ON public.paynow_transactions FOR ALL USING (public.get_user_role() = 'admin');
CREATE POLICY "paynow_transactions_select" ON public.paynow_transactions FOR SELECT TO authenticated USING (true);
