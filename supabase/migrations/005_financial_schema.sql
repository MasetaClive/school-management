-- Phase 2: Financial Management Schema
-- Tables for Student Fees and Staff Payroll

-- ==================== FEE TYPES ====================
CREATE TABLE public.fee_types (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL UNIQUE, -- e.g., 'Tuition', 'Transport', 'Lab'
  description TEXT,
  amount NUMERIC(10,2) NOT NULL DEFAULT 0,
  academic_year TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ==================== STUDENT FEES (Assigned Fees) ====================
CREATE TABLE public.student_fees (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  student_id UUID REFERENCES public.students(id) ON DELETE CASCADE,
  fee_type_id UUID REFERENCES public.fee_types(id) ON DELETE CASCADE,
  total_amount NUMERIC(10,2) NOT NULL,
  paid_amount NUMERIC(10,2) NOT NULL DEFAULT 0,
  due_date DATE,
  status TEXT DEFAULT 'unpaid', -- 'unpaid', 'partial', 'paid'
  academic_year TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(student_id, fee_type_id, academic_year)
);

-- ==================== FEE PAYMENTS (Transactions) ====================
CREATE TABLE public.fee_payments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  student_fee_id UUID REFERENCES public.student_fees(id) ON DELETE CASCADE,
  amount_paid NUMERIC(10,2) NOT NULL,
  payment_date DATE DEFAULT CURRENT_DATE,
  payment_method TEXT, -- 'cash', 'bank_transfer', 'card'
  reference_number TEXT,
  recorded_by UUID REFERENCES public.users(id),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ==================== STAFF SALARY CONFIG ====================
CREATE TABLE public.staff_salaries (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  teacher_id UUID REFERENCES public.teachers(id) ON DELETE CASCADE,
  base_salary NUMERIC(12,2) NOT NULL DEFAULT 0,
  allowances NUMERIC(12,2) DEFAULT 0,
  deductions NUMERIC(12,2) DEFAULT 0,
  currency TEXT DEFAULT 'USD',
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(teacher_id)
);

-- ==================== PAYROLL RECORDS ====================
CREATE TABLE public.payroll_records (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  teacher_id UUID REFERENCES public.teachers(id) ON DELETE CASCADE,
  month INTEGER NOT NULL CHECK (month BETWEEN 1 AND 12),
  year INTEGER NOT NULL,
  base_amount NUMERIC(12,2) NOT NULL,
  total_allowances NUMERIC(12,2) DEFAULT 0,
  total_deductions NUMERIC(12,2) DEFAULT 0,
  net_amount NUMERIC(12,2) NOT NULL,
  payment_date DATE,
  status TEXT DEFAULT 'draft', -- 'draft', 'processed', 'paid'
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(teacher_id, month, year)
);

-- ==================== RLS POLICIES FOR FINANCE ====================
ALTER TABLE public.fee_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.student_fees ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.fee_payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.staff_salaries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payroll_records ENABLE ROW LEVEL SECURITY;

-- Admins full access, Parents read own children's fees
CREATE POLICY "fee_types_admin" ON public.fee_types FOR ALL USING (public.get_user_role() = 'admin');
CREATE POLICY "fee_types_select" ON public.fee_types FOR SELECT TO authenticated USING (true);

CREATE POLICY "student_fees_admin" ON public.student_fees FOR ALL USING (public.get_user_role() = 'admin');
CREATE POLICY "student_fees_parent" ON public.student_fees FOR SELECT 
  USING (student_id = ANY(public.get_parent_student_ids()));

CREATE POLICY "fee_payments_admin" ON public.fee_payments FOR ALL USING (public.get_user_role() = 'admin');

CREATE POLICY "staff_salaries_admin" ON public.staff_salaries FOR ALL USING (public.get_user_role() = 'admin');
CREATE POLICY "staff_salaries_own" ON public.staff_salaries FOR SELECT 
  USING (teacher_id IN (SELECT id FROM public.teachers WHERE user_id = auth.uid()));

CREATE POLICY "payroll_records_admin" ON public.payroll_records FOR ALL USING (public.get_user_role() = 'admin');
CREATE POLICY "payroll_records_own" ON public.payroll_records FOR SELECT 
  USING (teacher_id IN (SELECT id FROM public.teachers WHERE user_id = auth.uid()));
