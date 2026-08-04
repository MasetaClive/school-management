-- Restrict homework to its teacher and the students enrolled in its class.
-- API checks complement these policies; policies also prevent direct browser access.
DROP POLICY IF EXISTS "homework_select" ON public.homework;
DROP POLICY IF EXISTS "homework_insert" ON public.homework;
DROP POLICY IF EXISTS "homework_update" ON public.homework;
DROP POLICY IF EXISTS "homework_delete" ON public.homework;

CREATE POLICY "homework_select" ON public.homework FOR SELECT TO authenticated
USING (
  public.get_user_role() = 'admin'
  OR (public.get_user_role() = 'teacher' AND EXISTS (
    SELECT 1 FROM public.teachers WHERE teachers.id = homework.teacher_id AND teachers.user_id = auth.uid()
  ))
  OR (public.get_user_role() = 'student' AND EXISTS (
    SELECT 1 FROM public.students WHERE students.class_id = homework.class_id AND students.user_id = auth.uid()
  ))
);

CREATE POLICY "homework_insert" ON public.homework FOR INSERT TO authenticated
WITH CHECK (
  public.get_user_role() = 'admin'
  OR (public.get_user_role() = 'teacher' AND EXISTS (
    SELECT 1 FROM public.teachers WHERE teachers.id = homework.teacher_id AND teachers.user_id = auth.uid()
  ))
);

CREATE POLICY "homework_update" ON public.homework FOR UPDATE TO authenticated
USING (
  public.get_user_role() = 'admin'
  OR (public.get_user_role() = 'teacher' AND EXISTS (
    SELECT 1 FROM public.teachers WHERE teachers.id = homework.teacher_id AND teachers.user_id = auth.uid()
  ))
)
WITH CHECK (
  public.get_user_role() = 'admin'
  OR (public.get_user_role() = 'teacher' AND EXISTS (
    SELECT 1 FROM public.teachers WHERE teachers.id = homework.teacher_id AND teachers.user_id = auth.uid()
  ))
);

CREATE POLICY "homework_delete" ON public.homework FOR DELETE TO authenticated
USING (
  public.get_user_role() = 'admin'
  OR (public.get_user_role() = 'teacher' AND EXISTS (
    SELECT 1 FROM public.teachers WHERE teachers.id = homework.teacher_id AND teachers.user_id = auth.uid()
  ))
);

-- A dedicated public bucket makes teacher device uploads downloadable by students.
INSERT INTO storage.buckets (id, name, public)
VALUES ('homework-attachments', 'homework-attachments', TRUE)
ON CONFLICT (id) DO UPDATE SET public = TRUE;

DROP POLICY IF EXISTS "homework_attachments_teacher_upload" ON storage.objects;
DROP POLICY IF EXISTS "homework_attachments_teacher_delete" ON storage.objects;

CREATE POLICY "homework_attachments_teacher_upload" ON storage.objects FOR INSERT TO authenticated
WITH CHECK (
  bucket_id = 'homework-attachments'
  AND public.get_user_role() = 'teacher'
  AND owner_id = auth.uid()
);

CREATE POLICY "homework_attachments_teacher_delete" ON storage.objects FOR DELETE TO authenticated
USING (
  bucket_id = 'homework-attachments'
  AND public.get_user_role() = 'teacher'
  AND owner_id = auth.uid()
);
