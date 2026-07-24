-- Enforce a single identical teacher, subject, class, and academic-year assignment.
ALTER TABLE public.subject_assignments
  DROP CONSTRAINT IF EXISTS subject_assignments_class_id_subject_id_academic_year_key;

ALTER TABLE public.subject_assignments
  ADD CONSTRAINT subject_assignments_teacher_subject_class_year_key
  UNIQUE (teacher_id, subject_id, class_id, academic_year);

-- Prevent deletion while academic work still depends on this teaching assignment.
CREATE OR REPLACE FUNCTION public.prevent_subject_assignment_delete_with_dependencies()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM public.timetable_entries
    WHERE class_id = OLD.class_id
      AND subject_id = OLD.subject_id
      AND teacher_id = OLD.teacher_id
      AND academic_year = OLD.academic_year
  ) OR EXISTS (
    SELECT 1 FROM public.homework
    WHERE class_id = OLD.class_id
      AND subject_id = OLD.subject_id
      AND teacher_id = OLD.teacher_id
      AND academic_year = OLD.academic_year
  ) OR EXISTS (
    SELECT 1 FROM public.exams
    WHERE class_id = OLD.class_id
      AND subject_id = OLD.subject_id
      AND academic_year = OLD.academic_year
  ) THEN
    RAISE EXCEPTION 'Cannot delete this subject assignment because dependent academic records exist';
  END IF;

  RETURN OLD;
END;
$$;

DROP TRIGGER IF EXISTS prevent_subject_assignment_delete_with_dependencies
  ON public.subject_assignments;

CREATE TRIGGER prevent_subject_assignment_delete_with_dependencies
  BEFORE DELETE ON public.subject_assignments
  FOR EACH ROW
  EXECUTE FUNCTION public.prevent_subject_assignment_delete_with_dependencies();
