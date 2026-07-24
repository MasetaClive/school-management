-- A homeroom assignment is the active class-teacher assignment.
-- The two partial indexes enforce one active teacher per class and one active
-- class assignment per teacher within an academic year, including concurrent writes.
CREATE UNIQUE INDEX IF NOT EXISTS class_teachers_one_active_teacher_per_class_year
  ON public.class_teachers (class_id, academic_year)
  WHERE is_homeroom = TRUE;

CREATE UNIQUE INDEX IF NOT EXISTS class_teachers_one_active_class_per_teacher_year
  ON public.class_teachers (teacher_id, academic_year)
  WHERE is_homeroom = TRUE;
