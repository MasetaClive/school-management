-- Prevent identical homework assignments and enforce teaching/scheduling integrity.
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM public.homework AS homework
    WHERE NOT EXISTS (
      SELECT 1 FROM public.subject_assignments AS assignment
      WHERE assignment.class_id = homework.class_id
        AND assignment.subject_id = homework.subject_id
        AND assignment.teacher_id = homework.teacher_id
        AND assignment.academic_year = homework.academic_year
    )
    OR NOT EXISTS (
      SELECT 1 FROM public.timetable_entries AS timetable
      WHERE timetable.class_id = homework.class_id
        AND timetable.subject_id = homework.subject_id
        AND timetable.teacher_id = homework.teacher_id
        AND timetable.academic_year = homework.academic_year
    )
    OR NOT EXISTS (
      SELECT 1 FROM public.academic_years AS year
      WHERE year.year = homework.academic_year
    )
  ) THEN
    RAISE EXCEPTION 'Resolve homework records without matching assignments, timetable entries, or academic years before applying this migration';
  END IF;
END;
$$;

CREATE UNIQUE INDEX IF NOT EXISTS homework_unique_assignment_key
  ON public.homework (class_id, subject_id, teacher_id, lower(title), due_date, academic_year);

CREATE OR REPLACE FUNCTION public.validate_homework_relationships()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM public.subject_assignments
    WHERE class_id = NEW.class_id AND subject_id = NEW.subject_id
      AND teacher_id = NEW.teacher_id AND academic_year = NEW.academic_year
  ) THEN
    RAISE EXCEPTION 'Homework requires a matching subject assignment';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM public.timetable_entries
    WHERE class_id = NEW.class_id AND subject_id = NEW.subject_id
      AND teacher_id = NEW.teacher_id AND academic_year = NEW.academic_year
  ) THEN
    RAISE EXCEPTION 'Homework requires a matching timetable entry';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM public.academic_years
    WHERE year = NEW.academic_year AND is_closed = FALSE
      AND (start_date IS NULL OR NEW.due_date >= start_date)
      AND (end_date IS NULL OR NEW.due_date <= end_date + INTERVAL '1 day')
  ) THEN
    RAISE EXCEPTION 'Homework due date must fall in an open academic year';
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS validate_homework_relationships ON public.homework;
CREATE TRIGGER validate_homework_relationships
  BEFORE INSERT OR UPDATE OF class_id, subject_id, teacher_id, due_date, academic_year
  ON public.homework
  FOR EACH ROW EXECUTE FUNCTION public.validate_homework_relationships();
