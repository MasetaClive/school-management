-- Fix Transport Routes Table
-- Add missing columns for capacity and fee

ALTER TABLE public.transport_routes 
ADD COLUMN IF NOT EXISTS capacity INTEGER DEFAULT 40,
ADD COLUMN IF NOT EXISTS fee NUMERIC(10,2) DEFAULT 0;

-- Refresh RLS for safety (already handled in 002 but good to be sure)
ALTER TABLE public.transport_routes ENABLE ROW LEVEL SECURITY;

-- Ensure admin has full access
DROP POLICY IF EXISTS "admin_transport_all" ON public.transport_routes;
CREATE POLICY "admin_transport_all" ON public.transport_routes
FOR ALL USING (public.get_user_role() = 'admin');
