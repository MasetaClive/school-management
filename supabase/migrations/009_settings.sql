-- Phase 3.4: System Settings

CREATE TABLE public.settings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  key TEXT UNIQUE NOT NULL,
  value JSONB NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Initial Settings
INSERT INTO public.settings (key, value) VALUES 
('school_info', '{"name": "Antigravity Excellence Academy", "address": "123 Solar Street, Sky City", "phone": "+1 234 567 890"}'),
('academic_config', '{"current_year": "2023-2024", "current_term": "Term 1"}');

-- RLS POLICIES
ALTER TABLE public.settings ENABLE ROW LEVEL SECURITY;

-- Admins can do everything
CREATE POLICY "settings_admin_all" ON public.settings FOR ALL USING (public.get_user_role() = 'admin');

-- Everyone can read settings
CREATE POLICY "settings_read_all" ON public.settings FOR SELECT USING (true);
