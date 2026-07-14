-- Seed data for development
-- Optional: Run after migrations

-- Create sample admin user (run after auth user created)
-- INSERT INTO public.users (id, role, email, full_name) VALUES
--   ('YOUR-AUTH-USER-UUID', 'admin', 'admin@school.com', 'Admin User');
-- INSERT INTO public.admins (id, email) VALUES
--   ('YOUR-AUTH-USER-UUID', 'admin@school.com');

-- Sample subjects
INSERT INTO public.subjects (name, code) VALUES
  ('Mathematics', 'MATH'),
  ('English', 'ENG'),
  ('Science', 'SCI'),
  ('Social Studies', 'SST'),
  ('Computer Science', 'CS')
ON CONFLICT (name) DO NOTHING;

-- Sample class
INSERT INTO public.classes (name, grade_level, academic_year) VALUES
  ('Class 10-A', 10, '2024-2025'),
  ('Class 10-B', 10, '2024-2025'),
  ('Class 9-A', 9, '2024-2025')
ON CONFLICT DO NOTHING;
