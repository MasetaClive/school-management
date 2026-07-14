-- Row Level Security (RLS) Policies
-- Run after 001_initial_schema.sql

ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admins ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.teachers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.parents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.students ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.classes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subjects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.student_attendance ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.teacher_attendance ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.announcements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.homework ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.exams ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.results ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.books ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.borrow_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transport_routes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transport_assignments ENABLE ROW LEVEL SECURITY;

-- Helper function to get current user role
CREATE OR REPLACE FUNCTION public.get_user_role()
RETURNS user_role AS $$
  SELECT role FROM public.users WHERE id = auth.uid()
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- Helper function to get student ids for parent
CREATE OR REPLACE FUNCTION public.get_parent_student_ids()
RETURNS UUID[] AS $$
  SELECT ARRAY_AGG(id) FROM public.students WHERE parent_id = (
    SELECT id FROM public.parents WHERE user_id = auth.uid()
  )
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- USERS: Admins full access, users can read own
CREATE POLICY "users_select_own" ON public.users FOR SELECT USING (id = auth.uid());
CREATE POLICY "admins_all_users" ON public.users FOR ALL USING (public.get_user_role() = 'admin');

-- ADMINS: Only admins
CREATE POLICY "admins_only" ON public.admins FOR ALL USING (auth.uid() IN (SELECT id FROM public.admins));

-- CLASSES, SUBJECTS: All authenticated can read
CREATE POLICY "classes_select" ON public.classes FOR SELECT TO authenticated USING (true);
CREATE POLICY "classes_admin" ON public.classes FOR ALL USING (public.get_user_role() = 'admin');

CREATE POLICY "subjects_select" ON public.subjects FOR SELECT TO authenticated USING (true);
CREATE POLICY "subjects_admin" ON public.subjects FOR ALL USING (public.get_user_role() = 'admin');

-- TEACHERS: All can read, admin/teacher write
CREATE POLICY "teachers_select" ON public.teachers FOR SELECT TO authenticated USING (true);
CREATE POLICY "teachers_admin" ON public.teachers FOR ALL USING (public.get_user_role() IN ('admin', 'teacher'));

-- PARENTS: Read own, admin full
CREATE POLICY "parents_select_own" ON public.parents FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "parents_admin" ON public.parents FOR ALL USING (public.get_user_role() = 'admin');

-- STUDENTS: Admin/teacher read, parent read own children
CREATE POLICY "students_select_admin_teacher" ON public.students FOR SELECT
  USING (public.get_user_role() IN ('admin', 'teacher'));
CREATE POLICY "students_select_parent" ON public.students FOR SELECT
  USING (id = ANY(public.get_parent_student_ids()));
CREATE POLICY "students_select_own" ON public.students FOR SELECT
  USING (user_id = auth.uid());
CREATE POLICY "students_admin" ON public.students FOR ALL USING (public.get_user_role() = 'admin');

-- ATTENDANCE: Teacher/admin write, parent read own children
CREATE POLICY "student_attendance_select" ON public.student_attendance FOR SELECT
  USING (
    public.get_user_role() IN ('admin', 'teacher') OR
    student_id = ANY(public.get_parent_student_ids()) OR
    student_id IN (SELECT id FROM public.students WHERE user_id = auth.uid())
  );
CREATE POLICY "student_attendance_insert" ON public.student_attendance FOR INSERT
  WITH CHECK (public.get_user_role() IN ('admin', 'teacher'));
CREATE POLICY "student_attendance_update" ON public.student_attendance FOR UPDATE
  USING (public.get_user_role() IN ('admin', 'teacher'));

CREATE POLICY "teacher_attendance_select" ON public.teacher_attendance FOR SELECT
  USING (public.get_user_role() IN ('admin', 'teacher'));
CREATE POLICY "teacher_attendance_admin" ON public.teacher_attendance FOR ALL
  USING (public.get_user_role() = 'admin');

-- MESSAGES: Own messages only
CREATE POLICY "messages_select_own" ON public.messages FOR SELECT
  USING (sender_id = auth.uid() OR recipient_id = auth.uid());
CREATE POLICY "messages_insert" ON public.messages FOR INSERT
  WITH CHECK (sender_id = auth.uid());
CREATE POLICY "messages_update_read" ON public.messages FOR UPDATE
  USING (recipient_id = auth.uid());

-- ANNOUNCEMENTS: All read published
CREATE POLICY "announcements_select" ON public.announcements FOR SELECT
  USING (is_published = true OR public.get_user_role() = 'admin');
CREATE POLICY "announcements_admin" ON public.announcements FOR ALL
  USING (public.get_user_role() = 'admin');

-- HOMEWORK, EXAMS, RESULTS: Teacher/admin write, students/parents read own
CREATE POLICY "homework_select" ON public.homework FOR SELECT TO authenticated USING (true);
CREATE POLICY "homework_insert" ON public.homework FOR INSERT
  WITH CHECK (public.get_user_role() IN ('admin', 'teacher'));

CREATE POLICY "exams_select" ON public.exams FOR SELECT TO authenticated USING (true);
CREATE POLICY "exams_admin" ON public.exams FOR ALL USING (public.get_user_role() IN ('admin', 'teacher'));

CREATE POLICY "results_select" ON public.results FOR SELECT
  USING (
    public.get_user_role() IN ('admin', 'teacher') OR
    student_id = ANY(public.get_parent_student_ids()) OR
    student_id IN (SELECT id FROM public.students WHERE user_id = auth.uid())
  );
CREATE POLICY "results_insert" ON public.results FOR INSERT
  WITH CHECK (public.get_user_role() IN ('admin', 'teacher'));

-- LIBRARY: All read, admin manage
CREATE POLICY "books_select" ON public.books FOR SELECT TO authenticated USING (true);
CREATE POLICY "books_admin" ON public.books FOR ALL USING (public.get_user_role() = 'admin');

CREATE POLICY "borrow_records_select" ON public.borrow_records FOR SELECT
  USING (
    public.get_user_role() IN ('admin', 'teacher') OR
    student_id = ANY(public.get_parent_student_ids()) OR
    student_id IN (SELECT id FROM public.students WHERE user_id = auth.uid())
  );
CREATE POLICY "borrow_records_admin" ON public.borrow_records FOR ALL
  USING (public.get_user_role() IN ('admin', 'teacher'));

-- TRANSPORT
CREATE POLICY "transport_select" ON public.transport_routes FOR SELECT TO authenticated USING (true);
CREATE POLICY "transport_admin" ON public.transport_routes FOR ALL USING (public.get_user_role() = 'admin');

CREATE POLICY "transport_assignments_select" ON public.transport_assignments FOR SELECT
  USING (
    public.get_user_role() IN ('admin', 'teacher') OR
    student_id = ANY(public.get_parent_student_ids())
  );
CREATE POLICY "transport_assignments_admin" ON public.transport_assignments FOR ALL
  USING (public.get_user_role() = 'admin');
