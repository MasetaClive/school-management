-- Remove the development/demo values introduced by the original seed migration.
UPDATE public.settings
SET value = '{"name":"","address":"","phone":""}'::jsonb
WHERE key = 'school_info'
  AND value = '{"name":"Antigravity Excellence Academy","address":"123 Solar Street, Sky City","phone":"+1 234 567 890"}'::jsonb;

UPDATE public.settings
SET value = '{"current_year":"","current_term":"Term 1"}'::jsonb
WHERE key = 'academic_config'
  AND value = '{"current_year":"2023-2024","current_term":"Term 1"}'::jsonb;
